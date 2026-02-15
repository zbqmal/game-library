/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { POST } from "../route";
import { db } from "@/lib/firebase-admin";
import { initializeGame } from "@/app/games/treasure-hunt/gameLogic";

// Mock firebase-admin
jest.mock("@/lib/firebase-admin", () => ({
  db: {
    collection: jest.fn(),
  },
}));

// Mock gameLogic
jest.mock("@/app/games/treasure-hunt/gameLogic", () => ({
  initializeGame: jest.fn(),
}));

describe("POST /api/rooms/[roomCode]/start", () => {
  let mockUpdate: jest.Mock;
  let mockGet: jest.Mock;
  let mockDoc: jest.Mock;
  let mockCollection: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUpdate = jest.fn().mockResolvedValue(undefined);
    mockGet = jest.fn();
    mockDoc = jest.fn(() => ({
      get: mockGet,
      update: mockUpdate,
    }));
    mockCollection = jest.fn(() => ({
      doc: mockDoc,
    }));

    (db as any).collection = mockCollection;

    // Mock initializeGame to return a valid game state
    (initializeGame as jest.Mock).mockReturnValue({
      tiles: new Array(9).fill("covered"),
      treasurePosition: 4,
      currentPlayer: 1,
      winner: null,
      isGameOver: false,
      playerCount: 2,
      playerNames: ["Player1", "Player2"],
      gridSize: 3,
    });
  });

  it("returns 503 when Firebase is not configured", async () => {
    const originalDb = db as any;
    (require("@/lib/firebase-admin") as any).db = null;

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain("Firebase is not configured");

    (require("@/lib/firebase-admin") as any).db = originalDb;
  });

  it("returns 400 when playerId is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("playerId field is required");
  });

  it("returns 400 when playerId is not a string", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: 123 }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain(
      "playerId field is required and must be a string",
    );
  });

  it("returns 404 when room not found", async () => {
    mockGet.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Room not found");
  });

  it("returns 403 when non-host tries to start", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: "ABC123",
        hostId: "player1-id",
        status: "waiting",
        players: {
          "player1-id": { playerNumber: 1, username: "Player1" },
          "player2-id": { playerNumber: 2, username: "Player2" },
        },
        config: { gridSize: 3, maxPlayers: 4 },
      }),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player2-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Only the host can start the game");
  });

  it("returns 400 when room status is playing", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: "ABC123",
        hostId: "player1-id",
        status: "playing",
        players: {
          "player1-id": { playerNumber: 1, username: "Player1" },
          "player2-id": { playerNumber: 2, username: "Player2" },
        },
        config: { gridSize: 3, maxPlayers: 4 },
      }),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Game is currently in progress");
  });

  it("allows restarting game when status is finished", async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "finished",
          players: {
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { gridSize: 3, maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "playing",
          gameState: {
            tiles: new Array(9).fill("covered"),
            treasurePosition: 4,
            currentPlayer: 1,
            winner: null,
            isGameOver: false,
            playerCount: 2,
            playerNames: ["Player1", "Player2"],
            gridSize: 3,
          },
          players: {
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { gridSize: 3, maxPlayers: 4 },
        }),
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room).toBeDefined();
    expect(data.room.status).toBe("playing");
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("returns 400 when less than 2 players", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: "ABC123",
        hostId: "player1-id",
        status: "waiting",
        players: {
          "player1-id": { playerNumber: 1, username: "Player1" },
        },
        config: { gridSize: 3, maxPlayers: 4 },
      }),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "At least 2 players are required to start the game",
    );
  });

  it("successfully starts game with valid data", async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "waiting",
          players: {
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { gridSize: 3, maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "playing",
          gameState: {
            tiles: new Array(9).fill("covered"),
            treasurePosition: 4,
            currentPlayer: 1,
            winner: null,
            isGameOver: false,
            playerCount: 2,
            playerNames: ["Player1", "Player2"],
            gridSize: 3,
          },
          players: {
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { gridSize: 3, maxPlayers: 4 },
        }),
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room).toBeDefined();
    expect(data.room.status).toBe("playing");
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("initializes game state correctly and calls initializeGame", async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "waiting",
          players: {
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { gridSize: 4, maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "playing",
          gameState: {
            tiles: new Array(16).fill("covered"),
            treasurePosition: 8,
            currentPlayer: 1,
            winner: null,
            isGameOver: false,
            playerCount: 2,
            playerNames: ["Player1", "Player2"],
            gridSize: 4,
          },
          players: {
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { gridSize: 4, maxPlayers: 4 },
        }),
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });

    expect(initializeGame).toHaveBeenCalledWith({
      playerCount: 2,
      playerNames: ["Player1", "Player2"],
      gridSize: 4,
    });
  });

  it("updates room status to playing", async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "waiting",
          players: {
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { gridSize: 3, maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "playing",
          gameState: {
            tiles: new Array(9).fill("covered"),
            treasurePosition: 4,
            currentPlayer: 1,
            winner: null,
            isGameOver: false,
            playerCount: 2,
            playerNames: ["Player1", "Player2"],
            gridSize: 3,
          },
          players: {
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { gridSize: 3, maxPlayers: 4 },
        }),
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.status).toBe("playing");
    expect(updateCall.gameState).toBeDefined();
    expect(updateCall.lastActivity).toBeDefined();
  });

  it("passes players in correct order to initializeGame", async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "waiting",
          players: {
            "player3-id": { playerNumber: 3, username: "Player3" },
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { gridSize: 3, maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "playing",
          gameState: {
            tiles: new Array(9).fill("covered"),
            treasurePosition: 4,
            currentPlayer: 1,
            winner: null,
            isGameOver: false,
            playerCount: 3,
            playerNames: ["Player1", "Player2", "Player3"],
            gridSize: 3,
          },
          players: {
            "player3-id": { playerNumber: 3, username: "Player3" },
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { gridSize: 3, maxPlayers: 4 },
        }),
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });

    expect(initializeGame).toHaveBeenCalledWith({
      playerCount: 3,
      playerNames: ["Player1", "Player2", "Player3"],
      gridSize: 3,
    });
  });

  it("starts game with 6x6 grid and creates 36 tiles", async () => {
    // Mock initializeGame to return a 6x6 grid state
    (initializeGame as jest.Mock).mockReturnValueOnce({
      tiles: new Array(36).fill("covered"),
      treasurePosition: 20,
      currentPlayer: 1,
      winner: null,
      isGameOver: false,
      playerCount: 2,
      playerNames: ["Player1", "Player2"],
      gridSize: 6,
    });

    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "waiting",
          players: {
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { gridSize: 6, maxPlayers: 6 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "playing",
          gameState: {
            tiles: new Array(36).fill("covered"),
            treasurePosition: 20,
            currentPlayer: 1,
            winner: null,
            isGameOver: false,
            playerCount: 2,
            playerNames: ["Player1", "Player2"],
            gridSize: 6,
          },
          players: {
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { gridSize: 6, maxPlayers: 6 },
        }),
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(initializeGame).toHaveBeenCalledWith({
      playerCount: 2,
      playerNames: ["Player1", "Player2"],
      gridSize: 6,
    });
    expect(data.room.gameState.tiles.length).toBe(36);
    expect(data.room.gameState.gridSize).toBe(6);
  });

  it("defaults to gridSize 3 when config.gridSize is not set", async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "waiting",
          players: {
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { maxPlayers: 4 }, // No gridSize
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "playing",
          gameState: {
            tiles: new Array(9).fill("covered"),
            treasurePosition: 4,
            currentPlayer: 1,
            winner: null,
            isGameOver: false,
            playerCount: 2,
            playerNames: ["Player1", "Player2"],
            gridSize: 3,
          },
          players: {
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { maxPlayers: 4 },
        }),
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });

    expect(initializeGame).toHaveBeenCalledWith({
      playerCount: 2,
      playerNames: ["Player1", "Player2"],
      gridSize: 3, // Should default to 3
    });
  });

  it("handles errors gracefully", async () => {
    mockGet.mockRejectedValue(new Error("Firestore error"));

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to start game");
    expect(data.message).toBe("Firestore error");
  });

  it("handles unknown errors gracefully", async () => {
    mockGet.mockRejectedValue("Unknown error");

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to start game");
    expect(data.message).toBe("Unknown error");
  });

  it("converts room code to uppercase", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: "ABC123",
        hostId: "player1-id",
        status: "waiting",
        players: {
          "player1-id": { playerNumber: 1, username: "Player1" },
          "player2-id": { playerNumber: 2, username: "Player2" },
        },
        config: { gridSize: 3, maxPlayers: 4 },
      }),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/abc123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: "abc123" }),
    });

    expect(mockDoc).toHaveBeenCalledWith("ABC123");
  });

  it("returns updated room data after starting game", async () => {
    const expectedRoomData = {
      roomCode: "ABC123",
      hostId: "player1-id",
      status: "playing",
      gameState: {
        tiles: new Array(9).fill("covered"),
        treasurePosition: 4,
        currentPlayer: 1,
        winner: null,
        isGameOver: false,
        playerCount: 2,
        playerNames: ["Player1", "Player2"],
        gridSize: 3,
      },
      players: {
        "player1-id": { playerNumber: 1, username: "Player1" },
        "player2-id": { playerNumber: 2, username: "Player2" },
      },
      config: { gridSize: 3, maxPlayers: 4 },
    };

    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "waiting",
          players: {
            "player1-id": { playerNumber: 1, username: "Player1" },
            "player2-id": { playerNumber: 2, username: "Player2" },
          },
          config: { gridSize: 3, maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => expectedRoomData,
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(data.room).toEqual(expectedRoomData);
  });
});
