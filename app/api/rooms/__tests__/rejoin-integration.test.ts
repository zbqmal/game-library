/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { POST as joinPost } from "../join/route";
import { POST as leavePost } from "../[roomCode]/leave/route";
import { POST as startPost } from "../[roomCode]/start/route";
import { db } from "@/lib/firebase-admin";

// Mock firebase-admin
jest.mock("@/lib/firebase-admin", () => ({
  db: {
    collection: jest.fn(),
  },
}));

// Mock gameLogic
jest.mock("@/app/games/treasure-hunt/gameLogic", () => ({
  initializeGame: jest.fn(() => ({
    tiles: new Array(9).fill("covered"),
    treasurePosition: 4,
    currentPlayer: 1,
    winner: null,
    isGameOver: false,
    playerCount: 2,
    playerNames: ["Alice", "Bob"],
    gridSize: 3,
  })),
}));

describe("Player Re-join Integration Tests", () => {
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

  it("scenario: player leaves and rejoins with same username, retains playerNumber", async () => {
    const now = Date.now();
    const twoMinutesAgo = { toMillis: () => now - 2 * 60 * 1000 };

    // Step 1: Alice joins room (playerNumber 2)
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: "waiting",
          roomCode: "ABC123",
          hostId: "host-id",
          players: {
            "host-id": { playerNumber: 1, username: "Host" },
          },
          config: { maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: "waiting",
          roomCode: "ABC123",
          hostId: "host-id",
          players: {
            "host-id": { playerNumber: 1, username: "Host" },
            "alice-id-1": { playerNumber: 2, username: "Alice" },
          },
          config: { maxPlayers: 4 },
        }),
      });

    const joinRequest1 = new NextRequest(
      "http://localhost:3000/api/rooms/join",
      {
        method: "POST",
        body: JSON.stringify({ roomCode: "ABC123", username: "Alice" }),
      },
    );

    const joinResponse1 = await joinPost(joinRequest1);
    expect(joinResponse1.status).toBe(200);
    const joinData1 = await joinResponse1.json();
    expect(joinData1.playerId).toBeDefined();

    // Verify Alice got playerNumber 2
    const updateCall1 = mockUpdate.mock.calls[0][0];
    const aliceKey1 = Object.keys(updateCall1).find((k) =>
      k.startsWith("players."),
    );
    expect(updateCall1[aliceKey1!].playerNumber).toBe(2);

    // Step 2: Alice leaves
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "host-id",
          status: "waiting",
          players: {
            "host-id": { playerNumber: 1, username: "Host", isHost: true },
            [joinData1.playerId]: {
              playerNumber: 2,
              username: "Alice",
              isHost: false,
            },
          },
          formerPlayers: [],
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "host-id",
          status: "waiting",
          players: {
            "host-id": { playerNumber: 1, username: "Host", isHost: true },
          },
          formerPlayers: [
            { username: "Alice", playerNumber: 2, leftAt: twoMinutesAgo },
          ],
        }),
      });

    const leaveRequest = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/leave",
      {
        method: "POST",
        body: JSON.stringify({ playerId: joinData1.playerId }),
      },
    );

    const leaveResponse = await leavePost(leaveRequest, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    expect(leaveResponse.status).toBe(200);

    // Verify Alice was added to formerPlayers
    const leaveUpdateCall = mockUpdate.mock.calls[1][0];
    expect(leaveUpdateCall.formerPlayers).toBeDefined();
    expect(leaveUpdateCall.formerPlayers.length).toBe(1);
    expect(leaveUpdateCall.formerPlayers[0].username).toBe("Alice");
    expect(leaveUpdateCall.formerPlayers[0].playerNumber).toBe(2);

    // Step 3: Alice rejoins
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: "waiting",
          roomCode: "ABC123",
          hostId: "host-id",
          players: {
            "host-id": { playerNumber: 1, username: "Host" },
          },
          formerPlayers: [
            { username: "Alice", playerNumber: 2, leftAt: twoMinutesAgo },
          ],
          config: { maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: "waiting",
          roomCode: "ABC123",
          hostId: "host-id",
          players: {
            "host-id": { playerNumber: 1, username: "Host" },
          },
          config: { maxPlayers: 4 },
        }),
      });

    const joinRequest2 = new NextRequest(
      "http://localhost:3000/api/rooms/join",
      {
        method: "POST",
        body: JSON.stringify({ roomCode: "ABC123", username: "Alice" }),
      },
    );

    const joinResponse2 = await joinPost(joinRequest2);
    expect(joinResponse2.status).toBe(200);
    const joinData2 = await joinResponse2.json();
    expect(joinData2.playerId).toBeDefined();
    expect(joinData2.playerId).not.toBe(joinData1.playerId); // New playerId

    // Verify Alice got the same playerNumber (2)
    const updateCall2 = mockUpdate.mock.calls[2][0];
    const aliceKey2 = Object.keys(updateCall2).find((k) =>
      k.startsWith("players."),
    );
    expect(updateCall2[aliceKey2!].playerNumber).toBe(2); // Reused playerNumber!

    // Verify Alice was removed from formerPlayers
    expect(updateCall2.formerPlayers).toBeDefined();
    expect(updateCall2.formerPlayers.length).toBe(0);
  });

  it("scenario: host leaves, rejoins as non-host, new host can start game", async () => {
    const now = Date.now();
    const twoMinutesAgo = { toMillis: () => now - 2 * 60 * 1000 };

    // Step 1: Original host (Alice) leaves
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "alice-id",
          status: "waiting",
          players: {
            "alice-id": {
              playerNumber: 1,
              username: "Alice",
              isHost: true,
            },
            "bob-id": { playerNumber: 2, username: "Bob", isHost: false },
          },
          formerPlayers: [],
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "bob-id", // Bob is now host
          status: "waiting",
          players: {
            "bob-id": { playerNumber: 2, username: "Bob", isHost: true },
          },
          formerPlayers: [
            { username: "Alice", playerNumber: 1, leftAt: twoMinutesAgo },
          ],
        }),
      });

    const leaveRequest = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/leave",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "alice-id" }),
      },
    );

    const leaveResponse = await leavePost(leaveRequest, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    expect(leaveResponse.status).toBe(200);

    // Verify host was transferred to Bob
    const leaveUpdateCall = mockUpdate.mock.calls[0][0];
    expect(leaveUpdateCall.hostId).toBe("bob-id");
    expect(leaveUpdateCall["players.bob-id.isHost"]).toBe(true);

    // Step 2: Alice rejoins as non-host
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: "waiting",
          roomCode: "ABC123",
          hostId: "bob-id",
          players: {
            "bob-id": { playerNumber: 2, username: "Bob", isHost: true },
          },
          formerPlayers: [
            { username: "Alice", playerNumber: 1, leftAt: twoMinutesAgo },
          ],
          config: { maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: "waiting",
          roomCode: "ABC123",
          hostId: "bob-id",
          players: {
            "bob-id": { playerNumber: 2, username: "Bob", isHost: true },
          },
          config: { maxPlayers: 4 },
        }),
      });

    const joinRequest = new NextRequest(
      "http://localhost:3000/api/rooms/join",
      {
        method: "POST",
        body: JSON.stringify({ roomCode: "ABC123", username: "Alice" }),
      },
    );

    const joinResponse = await joinPost(joinRequest);
    expect(joinResponse.status).toBe(200);
    const joinData = await joinResponse.json();

    // Verify Alice rejoined with playerNumber 1 but is NOT host
    const joinUpdateCall = mockUpdate.mock.calls[1][0];
    const aliceKey = Object.keys(joinUpdateCall).find((k) =>
      k.startsWith("players."),
    );
    expect(joinUpdateCall[aliceKey!].playerNumber).toBe(1);
    expect(joinUpdateCall[aliceKey!].isHost).toBe(false); // Not host!

    // Step 3: Bob (current host) starts the game
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "bob-id",
          status: "waiting",
          players: {
            "alice-id-new": { playerNumber: 1, username: "Alice" },
            "bob-id": { playerNumber: 2, username: "Bob" },
          },
          config: { gridSize: 3, maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "bob-id",
          status: "playing",
          gameState: {
            tiles: new Array(9).fill("covered"),
            treasurePosition: 4,
            currentPlayer: 1,
            winner: null,
            isGameOver: false,
            playerCount: 2,
            playerNames: ["Alice", "Bob"],
            gridSize: 3,
          },
          players: {
            "alice-id-new": { playerNumber: 1, username: "Alice" },
            "bob-id": { playerNumber: 2, username: "Bob" },
          },
          config: { gridSize: 3, maxPlayers: 4 },
        }),
      });

    const startRequest = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/start",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "bob-id" }),
      },
    );

    const startResponse = await startPost(startRequest, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });
    expect(startResponse.status).toBe(200);
    const startData = await startResponse.json();

    // Verify game started with correct player order
    expect(startData.room.status).toBe("playing");
    expect(startData.room.gameState.playerNames).toEqual(["Alice", "Bob"]);
    expect(startData.room.gameState.currentPlayer).toBe(1); // Alice's turn
  });

  it("scenario: multiple players leave and rejoin, turn order preserved", async () => {
    const now = Date.now();
    const twoMinutesAgo = { toMillis: () => now - 2 * 60 * 1000 };

    // Initial state: Host, Alice (2), Bob (3), Charlie (4)
    // Alice and Bob leave, then rejoin - should get same playerNumbers

    // Step 1: Alice (playerNumber 2) leaves
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "host-id",
          status: "waiting",
          players: {
            "host-id": { playerNumber: 1, username: "Host", isHost: true },
            "alice-id": {
              playerNumber: 2,
              username: "Alice",
              isHost: false,
            },
            "bob-id": { playerNumber: 3, username: "Bob", isHost: false },
            "charlie-id": {
              playerNumber: 4,
              username: "Charlie",
              isHost: false,
            },
          },
          formerPlayers: [],
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "host-id",
          status: "waiting",
          players: {
            "host-id": { playerNumber: 1, username: "Host", isHost: true },
            "bob-id": { playerNumber: 3, username: "Bob", isHost: false },
            "charlie-id": {
              playerNumber: 4,
              username: "Charlie",
              isHost: false,
            },
          },
          formerPlayers: [
            { username: "Alice", playerNumber: 2, leftAt: twoMinutesAgo },
          ],
        }),
      });

    const leaveRequest1 = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/leave",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "alice-id" }),
      },
    );

    await leavePost(leaveRequest1, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });

    // Step 2: Bob (playerNumber 3) leaves
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "host-id",
          status: "waiting",
          players: {
            "host-id": { playerNumber: 1, username: "Host", isHost: true },
            "bob-id": { playerNumber: 3, username: "Bob", isHost: false },
            "charlie-id": {
              playerNumber: 4,
              username: "Charlie",
              isHost: false,
            },
          },
          formerPlayers: [
            { username: "Alice", playerNumber: 2, leftAt: twoMinutesAgo },
          ],
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: "ABC123",
          hostId: "host-id",
          status: "waiting",
          players: {
            "host-id": { playerNumber: 1, username: "Host", isHost: true },
            "charlie-id": {
              playerNumber: 4,
              username: "Charlie",
              isHost: false,
            },
          },
          formerPlayers: [
            { username: "Alice", playerNumber: 2, leftAt: twoMinutesAgo },
            { username: "Bob", playerNumber: 3, leftAt: twoMinutesAgo },
          ],
        }),
      });

    const leaveRequest2 = new NextRequest(
      "http://localhost:3000/api/rooms/ABC123/leave",
      {
        method: "POST",
        body: JSON.stringify({ playerId: "bob-id" }),
      },
    );

    await leavePost(leaveRequest2, {
      params: Promise.resolve({ roomCode: "ABC123" }),
    });

    // Step 3: Alice rejoins (should get playerNumber 2)
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: "waiting",
          roomCode: "ABC123",
          hostId: "host-id",
          players: {
            "host-id": { playerNumber: 1, username: "Host" },
            "charlie-id": { playerNumber: 4, username: "Charlie" },
          },
          formerPlayers: [
            { username: "Alice", playerNumber: 2, leftAt: twoMinutesAgo },
            { username: "Bob", playerNumber: 3, leftAt: twoMinutesAgo },
          ],
          config: { maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: "waiting",
          roomCode: "ABC123",
          hostId: "host-id",
          players: {
            "host-id": { playerNumber: 1, username: "Host" },
            "charlie-id": { playerNumber: 4, username: "Charlie" },
          },
          config: { maxPlayers: 4 },
        }),
      });

    const joinRequest1 = new NextRequest(
      "http://localhost:3000/api/rooms/join",
      {
        method: "POST",
        body: JSON.stringify({ roomCode: "ABC123", username: "Alice" }),
      },
    );

    const joinResponse1 = await joinPost(joinRequest1);
    expect(joinResponse1.status).toBe(200);

    // Verify Alice got playerNumber 2
    const aliceJoinCall = mockUpdate.mock.calls[2][0];
    const aliceKey = Object.keys(aliceJoinCall).find((k) =>
      k.startsWith("players."),
    );
    expect(aliceJoinCall[aliceKey!].playerNumber).toBe(2);

    // Step 4: Bob rejoins (should get playerNumber 3)
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: "waiting",
          roomCode: "ABC123",
          hostId: "host-id",
          players: {
            "host-id": { playerNumber: 1, username: "Host" },
            "alice-id-new": { playerNumber: 2, username: "Alice" },
            "charlie-id": { playerNumber: 4, username: "Charlie" },
          },
          formerPlayers: [
            { username: "Bob", playerNumber: 3, leftAt: twoMinutesAgo },
          ],
          config: { maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: "waiting",
          roomCode: "ABC123",
          hostId: "host-id",
          players: {
            "host-id": { playerNumber: 1, username: "Host" },
            "alice-id-new": { playerNumber: 2, username: "Alice" },
            "charlie-id": { playerNumber: 4, username: "Charlie" },
          },
          config: { maxPlayers: 4 },
        }),
      });

    const joinRequest2 = new NextRequest(
      "http://localhost:3000/api/rooms/join",
      {
        method: "POST",
        body: JSON.stringify({ roomCode: "ABC123", username: "Bob" }),
      },
    );

    const joinResponse2 = await joinPost(joinRequest2);
    expect(joinResponse2.status).toBe(200);

    // Verify Bob got playerNumber 3
    const bobJoinCall = mockUpdate.mock.calls[3][0];
    const bobKey = Object.keys(bobJoinCall).find((k) =>
      k.startsWith("players."),
    );
    expect(bobJoinCall[bobKey!].playerNumber).toBe(3);

    // Verify final turn order: Host (1), Alice (2), Bob (3), Charlie (4)
    // This would be handled correctly by the start route which sorts by playerNumber
  });
});
