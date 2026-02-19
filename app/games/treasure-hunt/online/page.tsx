"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GameShell from "@/app/components/common/GameShell";
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import SkeletonLoader from "@/app/components/common/SkeletonLoader";
import ErrorToast from "@/app/components/common/ErrorToast";
import DismissibleLeaverMessage from "@/app/games/treasure-hunt/online/DismissibleLeaverMessage";
import { db } from "@/lib/firebase-client";
import { doc, onSnapshot, updateDoc, Timestamp } from "firebase/firestore";
import { Room } from "../types/room";
import { GameState } from "../gameLogic";
import { useGameLibraryTranslations, translationEngine } from "@/app/translation-engine";
import { interpolate } from "@/app/lib/utils";

// Storage keys
const STORAGE_KEYS = {
  PLAYER_ID: "treasure-hunt-player-id",
  ROOM_CODE: "treasure-hunt-room-code",
  USERNAME: "treasure-hunt-username",
  TIMESTAMP: "treasure-hunt-timestamp",
};

// Session expiration time (1 hour)
const SESSION_EXPIRATION_MS = 60 * 60 * 1000;

// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL_MS = 30 * 1000;

function OnlineLobbyPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomFromUrl = searchParams?.get("room");
  const { texts } = useGameLibraryTranslations();

  const [view, setView] = useState<"landing" | "lobby" | "reconnecting">(
    "landing",
  );
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [playAgainLoading, setPlayAgainLoading] = useState(false);
  const [backToLobbyLoading, setBackToLobbyLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastError, setToastError] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const [optimisticTile, setOptimisticTile] = useState<number | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isUpdatingGridSize, setIsUpdatingGridSize] = useState(false);
  const [selectedMaxPlayers, setSelectedMaxPlayers] = useState(4); // Default 4
  const [stopGameLoading, setStopGameLoading] = useState(false);
  const [stopGameBanner, setStopGameBanner] = useState<string | null>(null);

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const bannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<string | null>(null);

  // Memoize current player info
  const currentPlayerInfo = useMemo(() => {
    if (!room || !playerId) return null;
    return room.players[playerId] || null;
  }, [room, playerId]);

  const currentPlayerNumber = currentPlayerInfo?.playerNumber;
  const isHost = room && playerId === room.hostId;
  const playerCount = room ? Object.keys(room.players).length : 0;
  const gridSize = room?.config?.gridSize || 3;
  const maxPlayers = room?.config.maxPlayers || 4;
  const canStartGame = isHost && playerCount >= 2;
  const isCurrentPlayer =
    room?.gameState && currentPlayerNumber
      ? room.gameState.currentPlayer === currentPlayerNumber
      : false;

  // Clear session storage
  const clearSession = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
    sessionStorage.removeItem(STORAGE_KEYS.ROOM_CODE);
    sessionStorage.removeItem(STORAGE_KEYS.USERNAME);
    sessionStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
  }, []);

  // Save session to sessionStorage
  const saveSession = useCallback(
    (newPlayerId: string, newRoomCode: string, newUsername: string) => {
      sessionStorage.setItem(STORAGE_KEYS.PLAYER_ID, newPlayerId);
      sessionStorage.setItem(STORAGE_KEYS.ROOM_CODE, newRoomCode);
      sessionStorage.setItem(STORAGE_KEYS.USERNAME, newUsername);
      sessionStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    },
    [],
  );

  // Handle leave room
  const handleLeaveRoom = useCallback(async () => {
    // Call API to remove player from room (if we have the necessary info)
    if (roomCode && playerId) {
      try {
        await fetch(`/api/rooms/${roomCode}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        });
        // Don't need to check response - we're leaving anyway
      } catch (err) {
        console.error("Failed to notify server of leave:", err);
        // Continue with local cleanup even if API call fails
      }
    }

    // Clean up local state
    clearSession();
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = null;
    }
    setPlayerId(null);
    setRoomCode("");
    setRoom(null);
    setView("landing");
    setUsername("");
    setJoinCodeInput("");
    setError("");
    setToastError("");
    setStopGameBanner(null); // Clear banner on leave
  }, [clearSession, roomCode, playerId]);

  // Handle back to TreasureHunt (mid-game leave)
  const handleBackToTreasureHunt = useCallback(async () => {
    // Call API to remove player from room during game
    if (roomCode && playerId) {
      try {
        await fetch(`/api/rooms/${roomCode}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        });
      } catch (err) {
        console.error("Failed to notify server of leave:", err);
      }
    }

    // Clean up local state
    clearSession();
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Navigate to treasure hunt page
    router.push("/games/treasure-hunt");
  }, [clearSession, roomCode, playerId, router]);

  // Update heartbeat
  const updateHeartbeat = useCallback(async () => {
    if (!db || !roomCode || !playerId) return;

    try {
      const roomRef = doc(db, "rooms", roomCode);
      await updateDoc(roomRef, {
        [`players.${playerId}.lastSeen`]: Timestamp.now(),
      });
    } catch (err) {
      console.error("Failed to update heartbeat:", err);
    }
  }, [roomCode, playerId]);

  // Check if player is disconnected (lastSeen > 1 minute ago)
  const isPlayerDisconnected = useCallback(
    (player: Room["players"][string]) => {
      if (!player.lastSeen) return false;
      const lastSeenMs = player.lastSeen.toMillis();
      const now = Date.now();
      return now - lastSeenMs > 60 * 1000; // 1 minute
    },
    [],
  );

  // Auto-reconnection and URL parameter handling
  useEffect(() => {
    const attemptReconnection = async () => {
      // Check URL parameter first
      if (roomFromUrl) {
        setJoinCodeInput(roomFromUrl.toUpperCase());
        return;
      }

      // Check sessionStorage for existing session
      const storedPlayerId = sessionStorage.getItem(STORAGE_KEYS.PLAYER_ID);
      const storedRoomCode = sessionStorage.getItem(STORAGE_KEYS.ROOM_CODE);
      const storedUsername = sessionStorage.getItem(STORAGE_KEYS.USERNAME);
      const storedTimestamp = sessionStorage.getItem(STORAGE_KEYS.TIMESTAMP);

      if (!storedPlayerId || !storedRoomCode || !storedUsername) return;

      // Check if session is expired
      const timestamp = parseInt(storedTimestamp || "0");
      if (Date.now() - timestamp > SESSION_EXPIRATION_MS) {
        clearSession();
        setToastError(texts.onlineSessionExpired);
        return;
      }

      // Try to reconnect
      setIsReconnecting(true);
      setView("reconnecting");

      try {
        // Verify room still exists
        const response = await fetch(`/api/rooms/${storedRoomCode}`);
        if (!response.ok) {
          throw new Error("Room no longer exists");
        }

        // Room exists, reconnect
        setPlayerId(storedPlayerId);
        setRoomCode(storedRoomCode);
        setUsername(storedUsername);
        setView("lobby");
      } catch {
        clearSession();
        setToastError(texts.onlineRoomExpired);
        setView("landing");
      } finally {
        setIsReconnecting(false);
      }
    };

    attemptReconnection();
  }, [roomFromUrl, clearSession]);

  // Set up real-time listener for room updates
  useEffect(() => {
    if (!db || !roomCode || view !== "lobby") return;

    const roomRef = doc(db, "rooms", roomCode);
    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Room;
          
          // Detect if game was stopped (transition from 'playing' to 'waiting')
          if (previousStatusRef.current === "playing" && data.status === "waiting" && !data.gameState) {
            // Clear any existing banner timeout
            if (bannerTimeoutRef.current) {
              clearTimeout(bannerTimeoutRef.current);
            }
            
            // Show banner for all players (not just host)
            setStopGameBanner(texts.onlineGameStoppedByHost);
            
            // Auto-dismiss after 10 seconds
            bannerTimeoutRef.current = setTimeout(() => {
              setStopGameBanner(null);
              bannerTimeoutRef.current = null;
            }, 10000);
          }
          
          previousStatusRef.current = data.status;
          setRoom(data);
        } else {
          // Room was deleted
          setToastError(texts.onlineRoomClosed);
          handleLeaveRoom();
        }
      },
      (err) => {
        console.error("Error listening to room updates:", err);
        setToastError(texts.onlineConnectionLost);
      },
    );

    return () => {
      unsubscribe();
      // Clean up banner timeout on unmount
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
        bannerTimeoutRef.current = null;
      }
    };
  }, [roomCode, view, handleLeaveRoom]);

  // Set up heartbeat
  useEffect(() => {
    if (!db || !roomCode || !playerId || view !== "lobby") return;

    // Initial heartbeat
    updateHeartbeat();

    // Set up interval
    heartbeatIntervalRef.current = setInterval(
      updateHeartbeat,
      HEARTBEAT_INTERVAL_MS,
    );

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [roomCode, playerId, view, updateHeartbeat]);

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setToastError(texts.onlineEnterUsernameError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          maxPlayers: selectedMaxPlayers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || texts.onlineCreateRoomError);
      }

      // Store in sessionStorage with timestamp
      saveSession(data.playerId, data.roomCode, username.trim());

      setPlayerId(data.playerId);
      setRoomCode(data.roomCode);
      setView("lobby");
    } catch (err) {
      setToastError(
        err instanceof Error
          ? err.message
          : texts.onlineCreateRoomError,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!username.trim()) {
      setToastError(texts.onlineEnterUsernameError);
      return;
    }

    if (!joinCodeInput.trim()) {
      setToastError(texts.onlineEnterRoomCodeError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: joinCodeInput.trim().toUpperCase(),
          username: username.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(texts.onlineRoomNotFound);
        } else if (response.status === 400 && data.error?.includes("full")) {
          throw new Error(texts.onlineRoomFull);
        }
        throw new Error(data.error || texts.onlineJoinRoomError);
      }

      // Store in sessionStorage with timestamp
      const roomCodeUpper = joinCodeInput.trim().toUpperCase();
      saveSession(data.playerId, roomCodeUpper, username.trim());

      setPlayerId(data.playerId);
      setRoomCode(roomCodeUpper);
      setView("lobby");
    } catch (err) {
      setToastError(
        err instanceof Error
          ? err.message
          : texts.onlineJoinRoomError,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setToastError(texts.onlineCopyCodeError);
    }
  };

  const handleCopyRoomLink = async () => {
    try {
      const url = `${window.location.origin}/games/treasure-hunt/online?room=${roomCode}`;

      // Try native share API on mobile
      if (
        navigator.share &&
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      ) {
        try {
          await navigator.share({
            title: texts.onlineShareTitle,
            text: interpolate(texts.onlineShareText, { code: roomCode }),
            url: url,
          });
          return;
        } catch (shareErr) {
          // Fall back to clipboard if share is cancelled
          if ((shareErr as Error).name !== "AbortError") {
            console.error("Share failed:", shareErr);
          }
        }
      }

      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      setCopyLinkSuccess(true);
      setTimeout(() => setCopyLinkSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setToastError(texts.onlineCopyLinkError);
    }
  };

  const handleStartGame = async () => {
    if (!playerId || !roomCode) return;

    setLoading(true);
    setError("");
    
    // Clear banner and timeout when starting new game
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = null;
    }
    setStopGameBanner(null);

    try {
      const response = await fetch(`/api/rooms/${roomCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || texts.onlineStartGameError);
      }

      // Room listener will pick up the status change
    } catch (err) {
      setToastError(
        err instanceof Error
          ? err.message
          : texts.onlineStartGameError,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGridSizeChange = async (newGridSize: number) => {
    if (!isHost || !roomCode || room?.status !== "waiting") return; // Safety check

    setIsUpdatingGridSize(true);

    try {
      const response = await fetch(`/api/rooms/${roomCode}/update-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gridSize: newGridSize }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || texts.onlineUpdateGridError);
      }

      // Success - real-time listener will update UI automatically
    } catch (err) {
      setToastError(
        err instanceof Error
          ? err.message
          : texts.onlineUpdateGridError,
      );
    } finally {
      setIsUpdatingGridSize(false);
    }
  };

  const handleTileClick = async (tilePosition: number) => {
    if (!playerId || !roomCode || !room?.gameState) return;

    // Check if it's this player's turn
    if (room.gameState.currentPlayer !== currentPlayerNumber) {
      setToastError(texts.onlineNotYourTurn);
      return;
    }

    // Check if tile is already uncovered
    if (room.gameState.tiles[tilePosition] !== "covered") {
      return;
    }

    // Prevent double-click
    if (loading || optimisticTile !== null) {
      return;
    }

    // Haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Optimistic update
    setOptimisticTile(tilePosition);
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/rooms/${roomCode}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, tilePosition }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Revert optimistic update
        setOptimisticTile(null);
        throw new Error(data.error || "Failed to make move");
      }

      // Room listener will pick up the game state change
      // Keep optimistic update until real update arrives
      setTimeout(() => setOptimisticTile(null), 1000);
    } catch (err) {
      setOptimisticTile(null);
      setToastError(
        err instanceof Error
          ? err.message
          : texts.onlineMoveError,
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAgain = async () => {
    if (!playerId || !roomCode) return;

    setPlayAgainLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/rooms/${roomCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || texts.onlineRestartGameError);
      }

      // Room listener will pick up the status change
    } catch (err) {
      setToastError(
        err instanceof Error
          ? err.message
          : texts.onlineRestartGameError,
      );
    } finally {
      setPlayAgainLoading(false);
    }
  };

  const handleBackToLobby = async () => {
    if (!roomCode || !playerId) return;

    setBackToLobbyLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/rooms/${roomCode}/back-to-lobby`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || texts.onlineReturnToLobbyError);
      }

      // Real-time listener will update UI automatically
      // (room.status changes to 'waiting', gameState becomes null)
    } catch (err) {
      setToastError(
        err instanceof Error
          ? err.message
          : texts.onlineReturnToLobbyError,
      );
    } finally {
      setBackToLobbyLoading(false);
    }
  };

  const handleStopGame = async () => {
    if (!roomCode || !playerId) return;

    // Show confirmation dialog
    const confirmed = window.confirm(texts.onlineStopGameConfirm);

    if (!confirmed) {
      // If canceled, do nothing
      return;
    }

    setStopGameLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/rooms/${roomCode}/stop-game`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || texts.onlineStopGameError);
      }

      // Clear any existing banner timeout
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }

      // Set local banner message for all players
      setStopGameBanner(texts.onlineGameStoppedByHost);

      // Auto-dismiss banner after 10 seconds
      bannerTimeoutRef.current = setTimeout(() => {
        setStopGameBanner(null);
        bannerTimeoutRef.current = null;
      }, 10000);

      // Real-time listener will update UI automatically
      // (room.status changes to 'waiting', gameState becomes null)
    } catch (err) {
      setToastError(
        err instanceof Error
          ? err.message
          : texts.onlineStopGameError,
      );
    } finally {
      setStopGameLoading(false);
    }
  };

  const getTileContent = (index: number, gameState: GameState) => {
    const tileState = gameState.tiles[index];

    // Show optimistic update
    if (optimisticTile === index && tileState === "covered") {
      return (
        <div className="relative">
          <div className="text-6xl opacity-30">🌳</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="sm" />
          </div>
        </div>
      );
    }

    if (tileState === "covered") {
      return <div className="text-5xl sm:text-6xl">🌳</div>;
    }

    if (tileState === "uncovered-treasure") {
      return <div className="text-5xl sm:text-6xl">💎</div>;
    }

    return <div className="text-5xl sm:text-6xl opacity-30">🕳️</div>;
  };

  const getTileClassName = (
    index: number,
    gameState: GameState,
    isCurrentPlayer: boolean,
  ) => {
    const tileState = gameState.tiles[index];
    const baseClasses =
      "aspect-square flex items-center justify-center rounded-lg transition-all min-h-[80px] sm:min-h-[100px] touch-manipulation";

    if (tileState === "covered") {
      const canClick =
        isCurrentPlayer &&
        !gameState.isGameOver &&
        !loading &&
        optimisticTile === null;
      return `${baseClasses} bg-green-100 border-4 border-green-400 ${
        canClick
          ? "hover:border-green-600 hover:bg-green-200 cursor-pointer active:scale-95"
          : "cursor-not-allowed opacity-60"
      }`;
    }

    if (tileState === "uncovered-treasure") {
      return `${baseClasses} bg-yellow-100 border-4 border-yellow-400`;
    }

    return `${baseClasses} bg-gray-100 border-4 border-gray-300`;
  };

  // Calculate game progress
  const gameProgress = useMemo(() => {
    if (!room?.gameState) return null;
    const uncovered = room.gameState.tiles.filter(
      (t) => t !== "covered",
    ).length;
    const total = room.gameState.tiles.length;
    return { uncovered, total };
  }, [room?.gameState]);

  // Reconnecting screen
  if (view === "reconnecting" || isReconnecting) {
    return (
      <GameShell
        title={texts.onlineTitleReconnecting}
        description={texts.onlineDescReconnecting}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner text={texts.onlineReconnectingLabel} size="lg" />
        </div>
      </GameShell>
    );
  }

  // Landing screen
  if (view === "landing") {
    return (
      <GameShell
        title={texts.onlineTitleLanding}
        description={texts.onlineDescLanding}
      >
        <div className="space-y-4 sm:space-y-6 max-w-lg mx-auto px-4">
          {/* Back Button */}
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.push("/games/treasure-hunt")}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Back to TreasureHunt"
            >
              <span className="text-xl">←</span>
              <span>{texts.onlineBackToTreasureHunt}</span>
            </button>
          </div>

          {/* Username Input */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <label
              className="block text-sm font-medium text-gray-900 mb-2"
              htmlFor="username-input"
            >
              {texts.onlineUsernameLabel}
            </label>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={texts.onlineUsernamePlaceholder}
              maxLength={20}
              className="w-full px-3 py-2 sm:py-3 text-base sm:text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-900"
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1">
              {username.length}/20 {texts.characterCountLabel}
            </p>
          </div>

          {/* Number of Players Selector */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {texts.onlineNumberOfPlayersLabel}
            </label>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[2, 3, 4, 5, 6].map((count) => (
                <button
                  key={count}
                  onClick={() => setSelectedMaxPlayers(count)}
                  className={`py-2 px-3 rounded-lg border-2 transition-colors font-semibold min-h-[44px] touch-manipulation ${
                    selectedMaxPlayers === count
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                  aria-label={`Select ${count} players`}
                  aria-pressed={selectedMaxPlayers === count}
                >
                  {count}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600">
              {interpolate(texts.onlineMaxPlayersInfo, {
                count: selectedMaxPlayers,
              })}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <span aria-label="Information">ℹ</span>{" "}
              {texts.onlinePlayerCountNote}
            </p>
          </div>

          {/* Create Room */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">
              {texts.onlineCreateRoomTitle}
            </h3>
            <button
              onClick={handleCreateRoom}
              disabled={loading || !username.trim()}
              className={`w-full py-3 sm:py-4 rounded-lg transition-colors font-semibold text-base sm:text-lg min-h-[44px] touch-manipulation ${
                loading || !username.trim()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
              }`}
              aria-label="Create a new game room"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  {texts.onlineCreatingLabel}
                </span>
              ) : (
                texts.onlineCreateRoomButton
              )}
            </button>
          </div>

          {/* Join Room */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">
              {texts.onlineJoinRoomTitle}
            </h3>
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder={texts.onlineRoomCodePlaceholder}
              maxLength={6}
              className="w-full px-3 py-2 sm:py-3 text-base sm:text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 uppercase placeholder-gray-400 text-gray-900"
              autoComplete="off"
              aria-label="Room code input"
            />
            <button
              onClick={handleJoinRoom}
              disabled={loading || !username.trim() || !joinCodeInput.trim()}
              className={`w-full py-3 sm:py-4 rounded-lg transition-colors font-semibold text-base sm:text-lg min-h-[44px] touch-manipulation ${
                loading || !username.trim() || !joinCodeInput.trim()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              }`}
              aria-label="Join game room"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  {texts.onlineJoiningLabel}
                </span>
              ) : (
                texts.onlineJoinRoomButton
              )}
            </button>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div className="flex-1">
                <p className="font-medium mb-1">{texts.onlineQuickTipsTitle}</p>
                <ul className="text-xs space-y-1 text-blue-800">
                  <li>• {texts.onlineQuickTip1}</li>
                  <li>• {texts.onlineQuickTip2}</li>
                  <li>• {texts.onlineQuickTip3}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        {/* Error Toast */}
        {toastError && (
          <ErrorToast
            message={toastError}
            onDismiss={() => setToastError("")}
          />
        )}
      </GameShell>
    );
  }

  // Lobby/Game screen
  const showGameBoard =
    room?.status === "playing" || room?.status === "finished";

  return (
    <GameShell
      title={
        showGameBoard
          ? texts.onlineTitleInProgress
          : texts.onlineTitleLobby
      }
      description={
        showGameBoard
          ? texts.onlineDescInProgress
          : texts.onlineDescLobby
      }
    >
      <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto px-4">
        {/* Room Code Display */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white text-center">
          <p className="text-xs sm:text-sm font-medium mb-2">
            {texts.onlineRoomCodeLabel}
          </p>
          <p className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider mb-3 sm:mb-4">
            {roomCode}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={handleCopyRoomCode}
              className="bg-white text-blue-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation"
              aria-label="Copy room code to clipboard"
            >
              {copySuccess ? texts.onlineCopiedLabel : texts.onlineCopyCodeButton}
            </button>
            <button
              onClick={handleCopyRoomLink}
              className="bg-white text-blue-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation"
              aria-label="Copy room link to share"
            >
              {copyLinkSuccess
                ? texts.onlineLinkCopiedLabel
                : texts.onlineShareLinkButton}
            </button>
          </div>
        </div>

        {/* Player List */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">
            {interpolate(texts.onlinePlayersHeading, {
              count: playerCount,
              max: maxPlayers,
            })}
          </h3>
          {!room ? (
            <SkeletonLoader type="player-list" />
          ) : (
            <div className="space-y-2">
              {Object.values(room.players)
                .sort((a, b) => a.playerNumber - b.playerNumber)
                .map((player) => {
                  const isPlayerTurn =
                    room.gameState &&
                    room.gameState.currentPlayer === player.playerNumber;
                  const isDisconnected = isPlayerDisconnected(player);
                  return (
                    <div
                      key={player.playerId || `player-${player.playerNumber}`}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        isPlayerTurn && showGameBoard
                          ? "bg-green-100 border-2 border-green-400 animate-pulse"
                          : isDisconnected
                            ? "bg-gray-100 opacity-60"
                            : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base text-gray-900">
                          {interpolate(texts.onlinePlayerLabel, {
                            number: player.playerNumber,
                          })}
                        </span>
                        <span className="text-sm sm:text-base text-gray-900">
                          {player.username}
                        </span>
                        {player.isHost && (
                          <span
                            className="text-yellow-500 text-base sm:text-lg"
                            title="Host"
                            aria-label="Host"
                          >
                            ⭐
                          </span>
                        )}
                        {isPlayerTurn && showGameBoard && (
                          <span className="text-green-600 text-xs sm:text-sm font-bold">
                            {texts.onlineTurnIndicator}
                          </span>
                        )}
                        {isDisconnected && (
                          <span
                            className="text-red-500 text-xs flex items-center gap-1"
                            title="Disconnected"
                          >
                            🔴 {texts.onlineDisconnectedLabel}
                          </span>
                        )}
                      </div>
                      {player.playerId === playerId && (
                        <span className="text-xs sm:text-sm text-gray-500">
                          {texts.onlineYouLabel}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Banner Message - Show when player left during game */}
        {!showGameBoard && (
          <DismissibleLeaverMessage
            message={room?.lastLeaverMessage}
            subtitle={texts.treasureLeaverGameResetMessage}
          />
        )}

        {/* Stop Game Banner - Show when host stopped the game */}
        {!showGameBoard && stopGameBanner && (
          <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4 text-center relative">
            <button
              onClick={() => {
                if (bannerTimeoutRef.current) {
                  clearTimeout(bannerTimeoutRef.current);
                  bannerTimeoutRef.current = null;
                }
                setStopGameBanner(null);
              }}
              className="absolute top-2 right-2 text-orange-700 hover:text-orange-900 hover:bg-orange-100 rounded-full p-1 transition-colors"
              aria-label="Dismiss message"
              title="Dismiss message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <p className="text-orange-800 font-semibold">
              🛑 {stopGameBanner}
            </p>
            <p className="text-orange-700 text-sm mt-1">
              {texts.onlineBackInLobby}
            </p>
          </div>
        )}

        {/* Grid Size Configuration - Only show in lobby before game starts */}
        {!showGameBoard && (
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-900">
                    {texts.treasureGridSizeLabel}:
                  </span>
                  <span className="text-gray-700">
                    {" "}
                    {gridSize}×{gridSize}
                  </span>
                  {isHost && (
                    <span className="text-xs text-gray-500 block">
                      {texts.onlineCanBeChanged}
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-gray-900">
                    {texts.treasurePlayersLabel}
                  </span>
                  <span className="text-gray-700">
                    {" "}
                    {playerCount}/{maxPlayers}
                  </span>
                  <span className="text-xs text-gray-500 block">
                    {texts.onlineSetAtCreation}
                  </span>
                </div>
              </div>
            </div>
            {isHost ? (
              <>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {texts.treasureGridSizeLabel}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map((size) => (
                    <button
                      key={size}
                      onClick={() => handleGridSizeChange(size)}
                      disabled={isUpdatingGridSize}
                      className={`py-2 px-4 rounded-lg border-2 transition-colors min-h-[44px] touch-manipulation ${
                        gridSize === size
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-gray-400 text-gray-700"
                      } ${
                        isUpdatingGridSize
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      aria-label={`Select ${size}×${size} grid`}
                      aria-pressed={gridSize === size}
                    >
                      {size}×{size}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-700 mt-2">
                  {interpolate(texts.onlineGridSizeInfo, {
                    size: gridSize,
                    tiles: gridSize * gridSize,
                    max: maxPlayers,
                  })}
                  {isUpdatingGridSize && (
                    <span className="ml-2 text-blue-600">
                      {texts.onlineUpdatingLabel}
                    </span>
                  )}
                </p>
              </>
            ) : (
              <div className="text-sm text-gray-700">
                {interpolate(texts.onlineGridSizeDisplay, {
                  size: gridSize,
                  tiles: gridSize * gridSize,
                })}
              </div>
            )}
          </div>
        )}

        {/* Game Board - Only show when playing or finished */}
        {showGameBoard && room?.gameState && (
          <>
            {/* Status Message */}
            <div className="bg-blue-50 rounded-lg p-4">
              {room.gameState.isGameOver && room.gameState.winner ? (
                <div className="text-center py-2">
                  <div className="text-4xl sm:text-5xl mb-2">🎉</div>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
                    {interpolate(texts.onlineWinnerMessage, {
                      name: room.gameState.playerNames[
                        room.gameState.winner - 1
                      ],
                    })}
                  </p>
                  {gameProgress && (
                    <p className="text-sm text-gray-600">
                      {interpolate(texts.onlineFoundAfterTiles, {
                        count: gameProgress.uncovered,
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {isCurrentPlayer && (
                    <div className="text-center py-2 mb-3 bg-green-100 border-2 border-green-400 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-green-700">
                        {texts.onlineYourTurnTitle}
                      </p>
                      <p className="text-sm text-green-600">
                        {texts.onlineClickTileHint}
                      </p>
                    </div>
                  )}
                  <div className="text-center py-2">
                    <p className="text-base sm:text-xl font-semibold text-gray-900">
                      {isCurrentPlayer
                        ? texts.onlineChooseTile
                        : interpolate(texts.onlineWaitingForPlayer, {
                            name: room.gameState.playerNames[
                              room.gameState.currentPlayer - 1
                            ],
                          })}
                    </p>
                    {gameProgress && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {interpolate(texts.onlineProgressLabel, {
                          uncovered: gameProgress.uncovered,
                          total: gameProgress.total,
                        })}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Game Grid */}
            {!room.gameState ? (
              <SkeletonLoader
                type="game-board"
                gridSize={room.config.gridSize}
              />
            ) : (
              <div
                className="grid gap-3 sm:gap-4 max-w-2xl mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${room.gameState.gridSize}, minmax(0, 1fr))`,
                }}
              >
                {room.gameState.tiles.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleTileClick(index)}
                    disabled={
                      !isCurrentPlayer ||
                      room.gameState!.tiles[index] !== "covered" ||
                      room.gameState!.isGameOver ||
                      loading ||
                      optimisticTile !== null
                    }
                    className={getTileClassName(
                      index,
                      room.gameState!,
                      isCurrentPlayer,
                    )}
                    aria-label={`Tile ${index + 1}`}
                  >
                    {getTileContent(index, room.gameState!)}
                  </button>
                ))}
              </div>
            )}

            {/* Stop Game Button - Only show to host during active play (not game over) */}
            {!room.gameState.isGameOver && isHost && (
              <div className="space-y-3">
                <button
                  onClick={handleStopGame}
                  disabled={stopGameLoading}
                  className="w-full py-3 sm:py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-base sm:text-lg min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  aria-label="Stop game and return all players to lobby"
                >
                  {stopGameLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      {texts.onlineStoppingLabel}
                    </span>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                        />
                      </svg>
                      {texts.onlineStopGameButton}
                    </>
                  )}
                </button>
                <p className="text-xs text-red-600 text-center">
                  {texts.onlineStopGameWarning}
                </p>
              </div>
            )}

            {/* Mid-Game "Back to TreasureHunt" Button - Only show during active play (not game over) */}
            {!room.gameState.isGameOver && (
              <div className="space-y-3">
                <button
                  onClick={handleBackToTreasureHunt}
                  className="w-full py-3 sm:py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-base sm:text-lg min-h-[44px] touch-manipulation flex items-center justify-center gap-2"
                  aria-label="Leave game and return to TreasureHunt"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  {texts.onlineBackToTreasureHunt}
                </button>
                <p className="text-xs text-gray-600 text-center">
                  {texts.onlineLeavingWarning}
                </p>
              </div>
            )}

            {/* Game Over Action Buttons */}
            {room.gameState.isGameOver && (
              <div className="space-y-3">
                {isHost ? (
                  <div key="host-actions" className="flex gap-3">
                    <button
                      key="play-again-btn"
                      onClick={handlePlayAgain}
                      disabled={playAgainLoading || backToLobbyLoading}
                      className="flex-1 py-3 sm:py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-base sm:text-lg min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Start a new game"
                    >
                      {playAgainLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          {texts.onlineStartingLabel}
                        </span>
                      ) : (
                        texts.actionPlayAgain
                      )}
                    </button>
                    <button
                      key="back-to-lobby-btn"
                      onClick={handleBackToLobby}
                      disabled={playAgainLoading || backToLobbyLoading}
                      className="flex-1 py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-base sm:text-lg min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Return to lobby"
                    >
                      {backToLobbyLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          {texts.onlineReturningLabel}
                        </span>
                      ) : (
                        texts.onlineBackToLobbyButton
                      )}
                    </button>
                  </div>
                ) : (
                  <div key="non-host-actions" className="space-y-2">
                    <button
                      key="back-to-lobby-btn"
                      disabled
                      className="w-full py-3 sm:py-4 bg-gray-400 text-white rounded-lg cursor-not-allowed font-semibold text-base sm:text-lg min-h-[44px] touch-manipulation opacity-50"
                      aria-label="Waiting for host to return to lobby"
                    >
                      {texts.onlineWaitingForHostLabel}
                    </button>
                    <p
                      key="waiting-text"
                      className="text-sm text-gray-600 text-center"
                    >
                      {texts.onlineOnlyHostCanReturn}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Waiting Screen Actions - Only show when not playing */}
        {!showGameBoard && (
          <div className="space-y-3">
            {isHost ? (
              <div key="host-lobby-actions">
                <button
                  key="start-game-btn"
                  onClick={handleStartGame}
                  disabled={!canStartGame || loading}
                  className={`w-full py-3 sm:py-4 rounded-lg transition-colors font-semibold text-base sm:text-lg min-h-[44px] touch-manipulation ${
                    canStartGame && !loading
                      ? "bg-green-600 text-white hover:bg-green-700 active:scale-95"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  aria-label={
                    canStartGame ? "Start the game" : "Waiting for players"
                  }
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      {texts.onlineStartingLabel}
                    </span>
                  ) : canStartGame ? (
                    texts.treasureStartGame
                  ) : (
                    texts.onlineWaitingForAtLeastTwoPlayers
                  )}
                </button>
                <button
                  key="leave-room-btn"
                  onClick={handleLeaveRoom}
                  className="w-full py-3 sm:py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-base sm:text-lg min-h-[44px] touch-manipulation"
                  aria-label="Leave the game room"
                >
                  {texts.onlineLeaveRoomButton}
                </button>
              </div>
            ) : (
              <div key="non-host-lobby-actions">
                <div
                  key="waiting-message"
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-700"
                >
                  <div className="animate-pulse">
                    {texts.onlineWaitingForHostToStart}
                  </div>
                </div>
                <button
                  key="leave-room-btn"
                  onClick={handleLeaveRoom}
                  className="w-full py-3 sm:py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-base sm:text-lg min-h-[44px] touch-manipulation"
                  aria-label="Leave the game room"
                >
                  {texts.onlineLeaveRoomButton}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}
      </div>

      {/* Error Toast */}
      {toastError && (
        <ErrorToast message={toastError} onDismiss={() => setToastError("")} />
      )}
    </GameShell>
  );
}

export default function OnlineLobbyPage() {
  const texts = translationEngine.getTranslations();
  return (
    <Suspense
      fallback={
        <GameShell
          title={texts.onlineTitleLoading}
          description={texts.onlineDescLoading}
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner text={texts.onlineLoadingLabel} size="lg" />
          </div>
        </GameShell>
      }
    >
      <OnlineLobbyPageContent />
    </Suspense>
  );
}
