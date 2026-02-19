/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { POST } from "../route";
import { db } from "@/lib/firebase-admin";

// Mock firebase-admin
jest.mock("@/lib/firebase-admin", () => ({
  db: {
    collection: jest.fn(),
  },
}));

describe("POST /api/rooms/[roomCode]/stop-game", () => {
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
  });

  it("returns 503 when Firebase is not configured", async () => {
    const originalDb = db as any;
    (require("@/lib/firebase-admin") as any).db = null;

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/stop-game",
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
      "http://localhost:3000/api/rooms/ABC123/stop-game",
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
      "http://localhost:3000/api/rooms/ABC123/stop-game",
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
      "http://localhost:3000/api/rooms/ABC123/stop-game",
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

  it("returns 403 when non-host tries to stop game", async () => {
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
      }),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/stop-game",
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
    expect(data.error).toBe("Only the host can stop the game");
  });

  it("returns 400 when room status is waiting", async () => {
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
        gameState: null,
      }),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/stop-game",
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
    expect(data.error).toBe("Can only stop an active game");
  });

  it("returns 400 when room status is finished", async () => {
    mockGet.mockResolvedValue({
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
        gameState: {
          tiles: new Array(9).fill("uncovered-empty"),
          treasurePosition: 4,
          currentPlayer: 1,
          winner: 1,
          isGameOver: true,
          playerCount: 2,
          playerNames: ["Player1", "Player2"],
          gridSize: 3,
        },
      }),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/stop-game",
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
    expect(data.error).toBe("Can only stop an active game");
  });

  it("successfully stops game with valid data", async () => {
    mockGet
      .mockResolvedValueOnce({
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
        }),
      })
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
          gameState: null,
        }),
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/stop-game",
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
    expect(data.room.status).toBe("waiting");
    expect(data.room.gameState).toBeNull();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("updates room status to waiting and clears gameState", async () => {
    mockGet
      .mockResolvedValueOnce({
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
        }),
      })
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
          gameState: null,
        }),
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/stop-game",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player1-id" }),
      },
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.status).toBe("waiting");
    expect(updateCall.gameState).toBeNull();
    expect(updateCall.lastActivity).toBeDefined();
  });

  it("handles errors gracefully", async () => {
    mockGet.mockRejectedValue(new Error("Firestore error"));

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/stop-game",
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
    expect(data.error).toBe("Failed to stop game");
    expect(data.message).toBe("Firestore error");
  });

  it("handles unknown errors gracefully", async () => {
    mockGet.mockRejectedValue("Unknown error");

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/stop-game",
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
    expect(data.error).toBe("Failed to stop game");
    expect(data.message).toBe("Unknown error");
  });

  it("converts room code to uppercase", async () => {
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
      }),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/abc123/stop-game",
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

  it("returns updated room data after stopping game", async () => {
    const expectedRoomData = {
      roomCode: "ABC123",
      hostId: "player1-id",
      status: "waiting",
      players: {
        "player1-id": { playerNumber: 1, username: "Player1" },
        "player2-id": { playerNumber: 2, username: "Player2" },
      },
      config: { gridSize: 3, maxPlayers: 4 },
      gameState: null,
    };

    mockGet
      .mockResolvedValueOnce({
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
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => expectedRoomData,
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/stop-game",
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
