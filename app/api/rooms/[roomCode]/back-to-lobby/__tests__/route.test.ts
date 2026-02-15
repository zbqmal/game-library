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

describe("POST /api/rooms/[roomCode]/back-to-lobby", () => {
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
      "http://localhost:3000/api/rooms/ABC123/back-to-lobby",
      {
        method: "POST",
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

  it("returns 404 when room does not exist", async () => {
    mockGet.mockResolvedValue({
      exists: false,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/NOTFOUND/back-to-lobby",
      {
        method: "POST",
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "NOTFOUND" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Room not found");
    expect(mockCollection).toHaveBeenCalledWith("rooms");
    expect(mockDoc).toHaveBeenCalledWith("NOTFOUND");
  });

  it("returns 400 when room status is not 'finished' or 'playing'", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: "ABC123",
        status: "waiting",
        hostId: "host-id",
        players: {
          "player1-id": { username: "Player1", playerNumber: 1 },
        },
      }),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/back-to-lobby",
      {
        method: "POST",
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Can only return to lobby from a game");
  });

  it("successfully returns to lobby from finished game", async () => {
    const roomData = {
      roomCode: "ABC123",
      status: "finished",
      hostId: "host-id",
      gameState: {
        tiles: ["uncovered-empty", "uncovered-treasure"],
        treasurePosition: 1,
        currentPlayer: 1,
        winner: 1,
        isGameOver: true,
        playerCount: 2,
        playerNames: ["Player1", "Player2"],
        gridSize: 3,
      },
      players: {
        "player1-id": { username: "Player1", playerNumber: 1 },
        "player2-id": { username: "Player2", playerNumber: 2 },
      },
      config: { gridSize: 3, maxPlayers: 4 },
    };

    const updatedRoomData = {
      ...roomData,
      status: "waiting",
      gameState: null,
    };

    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => roomData,
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => updatedRoomData,
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/back-to-lobby",
      {
        method: "POST",
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room.status).toBe("waiting");
    expect(data.room.gameState).toBeNull();

    expect(mockUpdate).toHaveBeenCalledWith({
      status: "waiting",
      gameState: null,
      lastActivity: expect.anything(),
    });
  });

  it("successfully returns to lobby from playing game", async () => {
    const roomData = {
      roomCode: "ABC123",
      status: "playing",
      hostId: "host-id",
      gameState: {
        tiles: ["covered", "covered", "covered", "covered"],
        treasurePosition: 2,
        currentPlayer: 1,
        winner: null,
        isGameOver: false,
        playerCount: 2,
        playerNames: ["Player1", "Player2"],
        gridSize: 2,
      },
      players: {
        "player1-id": { username: "Player1", playerNumber: 1 },
        "player2-id": { username: "Player2", playerNumber: 2 },
      },
      config: { gridSize: 2, maxPlayers: 4 },
    };

    const updatedRoomData = {
      ...roomData,
      status: "waiting",
      gameState: null,
    };

    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => roomData,
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => updatedRoomData,
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/back-to-lobby",
      {
        method: "POST",
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room.status).toBe("waiting");
    expect(data.room.gameState).toBeNull();
  });

  it("updates lastActivity timestamp when returning to lobby", async () => {
    const roomData = {
      roomCode: "ABC123",
      status: "finished",
      hostId: "host-id",
      gameState: { isGameOver: true },
      players: {
        "player1-id": { username: "Player1", playerNumber: 1 },
      },
      config: { gridSize: 3, maxPlayers: 4 },
    };

    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => roomData,
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          ...roomData,
          status: "waiting",
          gameState: null,
        }),
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/back-to-lobby",
      {
        method: "POST",
      },
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        lastActivity: expect.anything(),
      }),
    );
  });

  it("handles Firestore errors gracefully", async () => {
    mockGet.mockRejectedValue(new Error("Firestore error"));

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/back-to-lobby",
      {
        method: "POST",
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to return to lobby");
    expect(data.message).toBe("Firestore error");
  });

  it("handles unknown errors gracefully", async () => {
    mockGet.mockRejectedValue("Unknown error");

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/back-to-lobby",
      {
        method: "POST",
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to return to lobby");
    expect(data.message).toBe("Unknown error");
  });

  it("converts room code to uppercase", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: "ABC123",
        status: "finished",
        hostId: "host-id",
        players: {},
        config: { gridSize: 3, maxPlayers: 4 },
      }),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/abc123/back-to-lobby",
      {
        method: "POST",
      },
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: "abc123" }),
    });

    expect(mockDoc).toHaveBeenCalledWith("ABC123");
  });
});
