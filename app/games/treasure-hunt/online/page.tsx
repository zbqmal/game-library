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
import { db } from "@/lib/firebase-client";
import { doc, onSnapshot, updateDoc, Timestamp } from "firebase/firestore";
import { Room } from "../types/room";
import { GameState } from "../gameLogic";

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

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    setPlayerId(null);
    setRoomCode("");
    setRoom(null);
    setView("landing");
    setUsername("");
    setJoinCodeInput("");
    setError("");
    setToastError("");
  }, [clearSession, roomCode, playerId]);

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
        setToastError(
          "Your session has expired. Please create or join a new room.",
        );
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
      } catch (err) {
        clearSession();
        setToastError("This room has expired or no longer exists.");
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
          setRoom(data);
        } else {
          // Room was deleted
          setToastError("This room has been closed or expired.");
          handleLeaveRoom();
        }
      },
      (err) => {
        console.error("Error listening to room updates:", err);
        setToastError("Lost connection to game server. Please refresh.");
      },
    );

    return () => unsubscribe();
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
      setToastError("Please enter your username");
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
        throw new Error(data.error || "Failed to create room");
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
          : "Failed to create room. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!username.trim()) {
      setToastError("Please enter your username");
      return;
    }

    if (!joinCodeInput.trim()) {
      setToastError("Please enter a room code");
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
          throw new Error(
            "Room not found. Please check the code and try again.",
          );
        } else if (response.status === 400 && data.error?.includes("full")) {
          throw new Error("This room is full. Please try a different room.");
        }
        throw new Error(data.error || "Failed to join room");
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
          : "Failed to join room. Please try again.",
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
      setToastError("Failed to copy room code");
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
            title: "Join my Treasure Hunt game!",
            text: `Join my game with room code: ${roomCode}`,
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
      setToastError("Failed to copy room link");
    }
  };

  const handleStartGame = async () => {
    if (!playerId || !roomCode) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/rooms/${roomCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start game");
      }

      // Room listener will pick up the status change
    } catch (err) {
      setToastError(
        err instanceof Error
          ? err.message
          : "Failed to start game. Please try again.",
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
        throw new Error(errorData.error || "Failed to update grid size");
      }

      // Success - real-time listener will update UI automatically
    } catch (err) {
      setToastError(
        err instanceof Error
          ? err.message
          : "Failed to update grid size. Please try again.",
      );
    } finally {
      setIsUpdatingGridSize(false);
    }
  };

  const handleTileClick = async (tilePosition: number) => {
    if (!playerId || !roomCode || !room?.gameState) return;

    // Check if it's this player's turn
    if (room.gameState.currentPlayer !== currentPlayerNumber) {
      setToastError("It's not your turn!");
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
          : "That move couldn't be completed. Please try again.",
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
        throw new Error(data.error || "Failed to restart game");
      }

      // Room listener will pick up the status change
    } catch (err) {
      setToastError(
        err instanceof Error
          ? err.message
          : "Failed to restart game. Please try again.",
      );
    } finally {
      setPlayAgainLoading(false);
    }
  };

  const handleBackToLobby = async () => {
    if (!roomCode) return;

    setBackToLobbyLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/rooms/${roomCode}/back-to-lobby`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to return to lobby");
      }

      // Real-time listener will update UI automatically
      // (room.status changes to 'waiting', gameState becomes null)
    } catch (err) {
      setToastError(
        err instanceof Error
          ? err.message
          : "Failed to return to lobby. Please try again.",
      );
    } finally {
      setBackToLobbyLoading(false);
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
        title="Treasure Hunt - Reconnecting"
        description="Please wait while we reconnect you to your game"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner text="Reconnecting..." size="lg" />
        </div>
      </GameShell>
    );
  }

  // Landing screen
  if (view === "landing") {
    return (
      <GameShell
        title="Treasure Hunt - Online Multiplayer"
        description="Create or join a room to play with friends online"
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
              <span>Back to TreasureHunt</span>
            </button>
          </div>

          {/* Username Input */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <label
              className="block text-sm font-medium text-gray-900 mb-2"
              htmlFor="username-input"
            >
              Your Username
            </label>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-3 py-2 sm:py-3 text-base sm:text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-900"
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1">
              {username.length}/20 characters
            </p>
          </div>

          {/* Number of Players Selector */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Number of Players
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
              Maximum {selectedMaxPlayers} players can join this room
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <span aria-label="Information">ℹ</span> The number of players cannot be changed after the room is created.
              The grid size can be adjusted in the lobby.
            </p>
          </div>

          {/* Create Room */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">
              Create New Room
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
                  Creating...
                </span>
              ) : (
                "Create Room"
              )}
            </button>
          </div>

          {/* Join Room */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">
              Join Existing Room
            </h3>
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter 6-character room code"
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
                  Joining...
                </span>
              ) : (
                "Join Room"
              )}
            </button>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div className="flex-1">
                <p className="font-medium mb-1">Quick Tips:</p>
                <ul className="text-xs space-y-1 text-blue-800">
                  <li>• Rooms expire after 1 hour of inactivity</li>
                  <li>• You can share room links with friends</li>
                  <li>• Your session is automatically saved</li>
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
          ? "Treasure Hunt - Game In Progress"
          : "Treasure Hunt - Room Lobby"
      }
      description={
        showGameBoard
          ? "Find the hidden treasure!"
          : "Waiting for players to join"
      }
    >
      <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto px-4">
        {/* Room Code Display */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white text-center">
          <p className="text-xs sm:text-sm font-medium mb-2">Room Code</p>
          <p className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider mb-3 sm:mb-4">
            {roomCode}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={handleCopyRoomCode}
              className="bg-white text-blue-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation"
              aria-label="Copy room code to clipboard"
            >
              {copySuccess ? "✓ Copied!" : "📋 Copy Code"}
            </button>
            <button
              onClick={handleCopyRoomLink}
              className="bg-white text-blue-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation"
              aria-label="Copy room link to share"
            >
              {copyLinkSuccess ? "✓ Link Copied!" : "🔗 Share Link"}
            </button>
          </div>
        </div>

        {/* Player List */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">
            Players ({playerCount}/{maxPlayers})
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
                          Player {player.playerNumber}:
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
                            (Turn)
                          </span>
                        )}
                        {isDisconnected && (
                          <span
                            className="text-red-500 text-xs flex items-center gap-1"
                            title="Disconnected"
                          >
                            🔴 Disconnected
                          </span>
                        )}
                      </div>
                      {player.playerId === playerId && (
                        <span className="text-xs sm:text-sm text-gray-500">
                          (You)
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Grid Size Configuration - Only show in lobby before game starts */}
        {!showGameBoard && (
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-900">Grid Size:</span>
                  <span className="text-gray-700"> {gridSize}×{gridSize}</span>
                  {isHost && <span className="text-xs text-gray-500 block">Can be changed</span>}
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Players:</span>
                  <span className="text-gray-700"> {playerCount}/{maxPlayers}</span>
                  <span className="text-xs text-gray-500 block">Set at creation</span>
                </div>
              </div>
            </div>
            {isHost ? (
              <>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Grid Size
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
                  {gridSize}×{gridSize} grid = {gridSize * gridSize} tiles (max{" "}
                  {maxPlayers} players)
                  {isUpdatingGridSize && (
                    <span className="ml-2 text-blue-600">Updating...</span>
                  )}
                </p>
              </>
            ) : (
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Grid Size:</span> {gridSize}×
                {gridSize} ({gridSize * gridSize} tiles)
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
                    {room.gameState.playerNames[room.gameState.winner - 1]}{" "}
                    wins!
                  </p>
                  {gameProgress && (
                    <p className="text-sm text-gray-600">
                      Found after {gameProgress.uncovered} tiles uncovered
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {isCurrentPlayer && (
                    <div className="text-center py-2 mb-3 bg-green-100 border-2 border-green-400 rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold text-green-700">
                        🎯 Your Turn!
                      </p>
                      <p className="text-sm text-green-600">
                        Click a tile to uncover it
                      </p>
                    </div>
                  )}
                  <div className="text-center py-2">
                    <p className="text-base sm:text-xl font-semibold text-gray-900">
                      {isCurrentPlayer
                        ? "Choose a tile"
                        : `Waiting for ${
                            room.gameState.playerNames[
                              room.gameState.currentPlayer - 1
                            ]
                          }...`}
                    </p>
                    {gameProgress && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Progress: {gameProgress.uncovered}/{gameProgress.total}{" "}
                        tiles
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
                          Starting...
                        </span>
                      ) : (
                        "Play Again"
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
                          Returning...
                        </span>
                      ) : (
                        "Back to Lobby"
                      )}
                    </button>
                  </div>
                ) : (
                  <div key="non-host-actions">
                    <button
                      key="back-to-lobby-btn"
                      onClick={handleBackToLobby}
                      disabled={backToLobbyLoading}
                      className="w-full py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-base sm:text-lg min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Return to lobby"
                    >
                      {backToLobbyLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          Returning...
                        </span>
                      ) : (
                        "Back to Lobby"
                      )}
                    </button>
                    <p
                      key="waiting-text"
                      className="text-sm text-gray-600 text-center"
                    >
                      Waiting for host...
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
                      Starting...
                    </span>
                  ) : canStartGame ? (
                    "Start Game"
                  ) : (
                    "Waiting for at least 2 players..."
                  )}
                </button>
                <button
                  key="leave-room-btn"
                  onClick={handleLeaveRoom}
                  className="w-full py-3 sm:py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-base sm:text-lg min-h-[44px] touch-manipulation"
                  aria-label="Leave the game room"
                >
                  Leave Room
                </button>
              </div>
            ) : (
              <div key="non-host-lobby-actions">
                <div
                  key="waiting-message"
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-700"
                >
                  <div className="animate-pulse">
                    Waiting for host to start the game...
                  </div>
                </div>
                <button
                  key="leave-room-btn"
                  onClick={handleLeaveRoom}
                  className="w-full py-3 sm:py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-base sm:text-lg min-h-[44px] touch-manipulation"
                  aria-label="Leave the game room"
                >
                  Leave Room
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
  return (
    <Suspense
      fallback={
        <GameShell
          title="Treasure Hunt - Loading"
          description="Loading multiplayer game..."
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner text="Loading..." size="lg" />
          </div>
        </GameShell>
      }
    >
      <OnlineLobbyPageContent />
    </Suspense>
  );
}
