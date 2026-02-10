"use client";

import { useState, useEffect, useCallback } from "react";
import GameShell from "@/app/components/common/GameShell";
import { db } from "@/lib/firebase-client";
import { doc, onSnapshot } from "firebase/firestore";
import { Room } from "../types/room";

export default function OnlineLobbyPage() {
  const [view, setView] = useState<"landing" | "lobby">("landing");
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");

  // Define handleLeaveRoom early so it can be used in useEffect
  const handleLeaveRoom = useCallback(() => {
    localStorage.removeItem("treasure-hunt-player-id");
    localStorage.removeItem("treasure-hunt-room-code");
    setPlayerId(null);
    setRoomCode("");
    setRoom(null);
    setView("landing");
    setUsername("");
    setJoinCodeInput("");
  }, []);

  // Load playerId from localStorage on mount
  useEffect(() => {
    const storedPlayerId = localStorage.getItem("treasure-hunt-player-id");
    const storedRoomCode = localStorage.getItem("treasure-hunt-room-code");
    
    if (storedPlayerId && storedRoomCode) {
      setPlayerId(storedPlayerId);
      setRoomCode(storedRoomCode);
      setView("lobby");
    }
  }, []);

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
          setError("Room no longer exists");
          handleLeaveRoom();
        }
      },
      (err) => {
        console.error("Error listening to room updates:", err);
        setError("Failed to sync with room");
      }
    );

    return () => unsubscribe();
  }, [roomCode, view, handleLeaveRoom]);

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setError("Please enter your username");
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
          gridSize: 3,
          maxPlayers: 4,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create room");
      }

      // Store in localStorage
      localStorage.setItem("treasure-hunt-player-id", data.playerId);
      localStorage.setItem("treasure-hunt-room-code", data.roomCode);

      setPlayerId(data.playerId);
      setRoomCode(data.roomCode);
      setView("lobby");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }

    if (!joinCodeInput.trim()) {
      setError("Please enter a room code");
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
        throw new Error(data.error || "Failed to join room");
      }

      // Store in localStorage
      localStorage.setItem("treasure-hunt-player-id", data.playerId);
      localStorage.setItem(
        "treasure-hunt-room-code",
        joinCodeInput.trim().toUpperCase()
      );

      setPlayerId(data.playerId);
      setRoomCode(joinCodeInput.trim().toUpperCase());
      setView("lobby");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    // Could add a toast notification here
  };

  const handleStartGame = () => {
    // To be implemented in Phase 2
    alert("Game start functionality will be implemented in Phase 2");
  };

  const isHost = room && playerId === room.hostId;
  const playerCount = room ? Object.keys(room.players).length : 0;
  const maxPlayers = room?.config.maxPlayers || 4;
  const canStartGame = isHost && playerCount >= 2;

  // Landing screen
  if (view === "landing") {
    return (
      <GameShell
        title="Treasure Hunt - Online Multiplayer"
        description="Create or join a room to play with friends online"
      >
        <div className="space-y-6 max-w-lg mx-auto">
          {/* Username Input */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {username.length}/20 characters
            </p>
          </div>

          {/* Create Room */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Create New Room</h3>
            <button
              onClick={handleCreateRoom}
              disabled={loading || !username.trim()}
              className={`w-full py-3 rounded-lg transition-colors font-semibold text-lg ${
                loading || !username.trim()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {loading ? "Creating..." : "Create Room"}
            </button>
          </div>

          {/* Join Room */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Join Existing Room</h3>
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) =>
                setJoinCodeInput(e.target.value.toUpperCase())
              }
              placeholder="Enter 6-character room code"
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 uppercase"
            />
            <button
              onClick={handleJoinRoom}
              disabled={loading || !username.trim() || !joinCodeInput.trim()}
              className={`w-full py-3 rounded-lg transition-colors font-semibold text-lg ${
                loading || !username.trim() || !joinCodeInput.trim()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? "Joining..." : "Join Room"}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </GameShell>
    );
  }

  // Lobby screen
  return (
    <GameShell
      title="Treasure Hunt - Room Lobby"
      description="Waiting for players to join"
    >
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Room Code Display */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white text-center">
          <p className="text-sm font-medium mb-2">Room Code</p>
          <p className="text-5xl font-bold tracking-wider mb-4">{roomCode}</p>
          <button
            onClick={handleCopyRoomCode}
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            📋 Copy Room Code
          </button>
        </div>

        {/* Player Count */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
          <p className="text-lg font-semibold">
            {playerCount}/{maxPlayers} Players
          </p>
        </div>

        {/* Player List */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Players</h3>
          <div className="space-y-2">
            {room &&
              Object.values(room.players)
                .sort((a, b) => a.playerNumber - b.playerNumber)
                .map((player) => (
                  <div
                    key={player.playerId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        Player {player.playerNumber}:
                      </span>
                      <span>{player.username}</span>
                      {player.isHost && (
                        <span className="text-yellow-500 text-lg">⭐</span>
                      )}
                    </div>
                    {player.playerId === playerId && (
                      <span className="text-sm text-gray-500">(You)</span>
                    )}
                  </div>
                ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={!canStartGame}
              className={`w-full py-3 rounded-lg transition-colors font-semibold text-lg ${
                canStartGame
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {canStartGame
                ? "Start Game"
                : "Waiting for at least 2 players..."}
            </button>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-700">
              Waiting for host to start the game...
            </div>
          )}

          <button
            onClick={handleLeaveRoom}
            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Leave Room
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    </GameShell>
  );
}
