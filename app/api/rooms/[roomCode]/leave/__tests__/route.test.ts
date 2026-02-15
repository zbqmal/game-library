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

describe("POST /api/rooms/[roomCode]/leave", () => {
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockGet: jest.Mock;
  let mockDoc: jest.Mock;
  let mockCollection: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUpdate = jest.fn().mockResolvedValue(undefined);
    mockDelete = jest.fn().mockResolvedValue(undefined);
    mockGet = jest.fn();
    mockDoc = jest.fn(() => ({
      get: mockGet,
      update: mockUpdate,
      delete: mockDelete,
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
      "http://localhost:3000/api/rooms/ABC123/leave",
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
      "http://localhost:3000/api/rooms/ABC123/leave",
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
      "http://localhost:3000/api/rooms/ABC123/leave",
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
      "http://localhost:3000/api/rooms/ABC123/leave",
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

  it("returns 404 when player not in room", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: "ABC123",
        hostId: "player1-id",
        status: "waiting",
        players: {
          "player1-id": { playerNumber: 1, username: "Player1", isHost: true },
        },
      }),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/leave",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player2-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Player not in room");
  });

  it("deletes room when last player leaves", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: "ABC123",
        hostId: "player1-id",
        status: "waiting",
        players: {
          "player1-id": { playerNumber: 1, username: "Player1", isHost: true },
        },
      }),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/leave",
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
    expect(data.roomDeleted).toBe(true);
    expect(data.message).toContain("last player left");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("removes non-host player successfully", async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "waiting",
          players: {
            "player1-id": {
              playerNumber: 1,
              username: "Player1",
              isHost: true,
            },
            "player2-id": {
              playerNumber: 2,
              username: "Player2",
              isHost: false,
            },
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
            "player1-id": {
              playerNumber: 1,
              username: "Player1",
              isHost: true,
            },
          },
        }),
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/leave",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player2-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.roomDeleted).toBe(false);
    expect(data.room).toBeDefined();
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("reassigns host when host leaves with other players present", async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "waiting",
          players: {
            "player1-id": {
              playerNumber: 1,
              username: "Player1",
              isHost: true,
            },
            "player2-id": {
              playerNumber: 2,
              username: "Player2",
              isHost: false,
            },
            "player3-id": {
              playerNumber: 3,
              username: "Player3",
              isHost: false,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player2-id",
          status: "waiting",
          players: {
            "player2-id": {
              playerNumber: 2,
              username: "Player2",
              isHost: true,
            },
            "player3-id": {
              playerNumber: 3,
              username: "Player3",
              isHost: false,
            },
          },
        }),
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/leave",
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
    expect(data.roomDeleted).toBe(false);
    expect(data.room).toBeDefined();
    expect(data.room.hostId).toBe("player2-id");
    expect(mockUpdate).toHaveBeenCalled();

    // Verify the update call includes host reassignment
    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall["players.player1-id"]).toBeDefined();
    expect(updateCall.hostId).toBe("player2-id");
    expect(updateCall["players.player2-id.isHost"]).toBe(true);
  });

  it("handles room deletion edge case when room no longer exists after update", async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "waiting",
          players: {
            "player1-id": {
              playerNumber: 1,
              username: "Player1",
              isHost: true,
            },
            "player2-id": {
              playerNumber: 2,
              username: "Player2",
              isHost: false,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        exists: false,
        data: () => undefined,
      });

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/leave",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player2-id" }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.roomDeleted).toBe(true);
    expect(data.message).toBe("Room closed");
  });

  it("handles errors gracefully", async () => {
    mockGet.mockRejectedValue(new Error("Firestore error"));

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/leave",
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
    expect(data.error).toBe("Failed to leave room");
    expect(data.message).toBe("Firestore error");
  });

  it("handles unknown errors gracefully", async () => {
    mockGet.mockRejectedValue("Unknown error");

    const request = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/leave",
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
    expect(data.error).toBe("Failed to leave room");
    expect(data.message).toBe("Unknown error");
  });

  it("handles multiple players leaving sequentially", async () => {
    // First player leaves
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "player1-id",
          status: "waiting",
          players: {
            "player1-id": {
              playerNumber: 1,
              username: "Player1",
              isHost: true,
            },
            "player2-id": {
              playerNumber: 2,
              username: "Player2",
              isHost: false,
            },
            "player3-id": {
              playerNumber: 3,
              username: "Player3",
              isHost: false,
            },
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
            "player1-id": {
              playerNumber: 1,
              username: "Player1",
              isHost: true,
            },
            "player2-id": {
              playerNumber: 2,
              username: "Player2",
              isHost: false,
            },
          },
        }),
      });

    const request1 = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/leave",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "player3-id" }),
      },
    );

    const response1 = await POST(request1, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    const data1 = await response1.json();

    expect(response1.status).toBe(200);
    expect(data1.success).toBe(true);
    expect(data1.roomDeleted).toBe(false);
  });
});
