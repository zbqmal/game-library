/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { db } from '@/lib/firebase-admin';

// Mock firebase-admin
jest.mock('@/lib/firebase-admin', () => ({
  db: {
    collection: jest.fn(),
  },
}));

describe('POST /api/rooms/join', () => {
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

  it('returns 503 when Firebase is not configured', async () => {
    const originalDb = db as any;
    (require('@/lib/firebase-admin') as any).db = null;

    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: 'ABC123', username: 'Player2' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain('Firebase is not configured');

    (require('@/lib/firebase-admin') as any).db = originalDb;
  });

  it('returns 400 when roomCode is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ username: 'Player2' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('roomCode field is required');
  });

  it('returns 400 when username is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: 'ABC123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('username field is required');
  });

  it('returns 404 when room does not exist', async () => {
    mockGet.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });

    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: 'ABC123', username: 'Player2' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Room not found');
  });

  it('returns 400 when room is not in waiting status', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'playing',
        players: { 'player1-id': { playerNumber: 1 } },
        config: { maxPlayers: 4 },
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: 'ABC123', username: 'Player2' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Room is not accepting new players');
  });

  it('returns 400 when room is full', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'waiting',
        players: {
          'player1-id': { playerNumber: 1 },
          'player2-id': { playerNumber: 2 },
        },
        config: { maxPlayers: 2 },
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: 'ABC123', username: 'Player3' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Room is full');
  });

  it('successfully joins a room', async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: 'waiting',
          roomCode: 'ABC123',
          hostId: 'player1-id',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
          },
          config: { maxPlayers: 4, gridSize: 3 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'waiting',
          config: { maxPlayers: 4, gridSize: 3 },
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
          },
          hostId: 'player1-id',
        }),
      });

    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: 'ABC123', username: 'Player2' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.playerId).toBeDefined();
    expect(data.room).toBeDefined();
    expect(mockUpdate).toHaveBeenCalled();

    const updateCall = mockUpdate.mock.calls[0][0];
    const playerKey = Object.keys(updateCall).find((k) => k.startsWith('players.'));
    expect(updateCall[playerKey!].username).toBe('Player2');
    expect(updateCall[playerKey!].playerNumber).toBe(2);
    expect(updateCall[playerKey!].isHost).toBe(false);
    expect(updateCall.lastActivity).toBeDefined();
  });

  it('assigns correct player number', async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: 'waiting',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          config: { maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: 'waiting',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          config: { maxPlayers: 4 },
        }),
      });

    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: 'ABC123', username: 'Player3' }),
    });

    await POST(request);

    const updateCall = mockUpdate.mock.calls[0][0];
    const playerKey = Object.keys(updateCall).find((k) => k.startsWith('players.'));
    expect(updateCall[playerKey!].playerNumber).toBe(3);
  });

  it('prevents duplicate usernames in the same room', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'waiting',
        players: {
          'player1-id': { playerNumber: 1, username: 'Alice' },
        },
        config: { maxPlayers: 4 },
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: 'ABC123', username: 'Alice' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('A player with this username is already in the room');
  });

  it('allows rejoining with same username after leaving (reuses playerNumber)', async () => {
    const now = Date.now();
    const fiveMinutesAgo = { toMillis: () => now - 5 * 60 * 1000 };

    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: 'waiting',
          players: {
            'player2-id': { playerNumber: 2, username: 'Bob' },
          },
          formerPlayers: [
            { username: 'Alice', playerNumber: 1, leftAt: fiveMinutesAgo },
          ],
          config: { maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: 'waiting',
          players: {
            'player2-id': { playerNumber: 2, username: 'Bob' },
          },
          config: { maxPlayers: 4 },
        }),
      });

    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: 'ABC123', username: 'Alice' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();

    const updateCall = mockUpdate.mock.calls[0][0];
    const playerKey = Object.keys(updateCall).find((k) => k.startsWith('players.'));
    expect(updateCall[playerKey!].username).toBe('Alice');
    expect(updateCall[playerKey!].playerNumber).toBe(1); // Reused playerNumber
    
    // Check that formerPlayers was updated (Alice removed since rejoining)
    expect(updateCall.formerPlayers).toBeDefined();
    expect(updateCall.formerPlayers.length).toBe(0);
  });

  it('assigns new playerNumber if former player history expired (>10 minutes)', async () => {
    const now = Date.now();
    const elevenMinutesAgo = { toMillis: () => now - 11 * 60 * 1000 };

    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: 'waiting',
          players: {
            'player2-id': { playerNumber: 2, username: 'Bob' },
          },
          formerPlayers: [
            { username: 'Alice', playerNumber: 1, leftAt: elevenMinutesAgo },
          ],
          config: { maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: 'waiting',
          players: {
            'player2-id': { playerNumber: 2, username: 'Bob' },
          },
          config: { maxPlayers: 4 },
        }),
      });

    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: 'ABC123', username: 'Alice' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();

    const updateCall = mockUpdate.mock.calls[0][0];
    const playerKey = Object.keys(updateCall).find((k) => k.startsWith('players.'));
    expect(updateCall[playerKey!].username).toBe('Alice');
    expect(updateCall[playerKey!].playerNumber).toBe(3); // New playerNumber (max 2 + 1)
    
    // Check that expired former player was cleaned up
    expect(updateCall.formerPlayers).toBeDefined();
    expect(updateCall.formerPlayers.length).toBe(0);
  });

  it('cleans up expired former players on join', async () => {
    const now = Date.now();
    const fiveMinutesAgo = { toMillis: () => now - 5 * 60 * 1000 };
    const elevenMinutesAgo = { toMillis: () => now - 11 * 60 * 1000 };

    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: 'waiting',
          players: {
            'player1-id': { playerNumber: 1, username: 'Alice' },
          },
          formerPlayers: [
            { username: 'Bob', playerNumber: 2, leftAt: fiveMinutesAgo },
            { username: 'Charlie', playerNumber: 3, leftAt: elevenMinutesAgo },
          ],
          config: { maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: 'waiting',
          players: {
            'player1-id': { playerNumber: 1, username: 'Alice' },
          },
          config: { maxPlayers: 4 },
        }),
      });

    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: 'ABC123', username: 'Dave' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();

    const updateCall = mockUpdate.mock.calls[0][0];
    
    // Check that only valid former player (Bob) remains
    expect(updateCall.formerPlayers).toBeDefined();
    expect(updateCall.formerPlayers.length).toBe(1);
    expect(updateCall.formerPlayers[0].username).toBe('Bob');
  });

  it('handles case-insensitive username matching for rejoining', async () => {
    const now = Date.now();
    const fiveMinutesAgo = { toMillis: () => now - 5 * 60 * 1000 };

    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: 'waiting',
          players: {
            'player2-id': { playerNumber: 2, username: 'Bob' },
          },
          formerPlayers: [
            { username: 'Alice', playerNumber: 1, leftAt: fiveMinutesAgo },
          ],
          config: { maxPlayers: 4 },
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          status: 'waiting',
          players: {
            'player2-id': { playerNumber: 2, username: 'Bob' },
          },
          config: { maxPlayers: 4 },
        }),
      });

    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: 'ABC123', username: 'ALICE' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();

    const updateCall = mockUpdate.mock.calls[0][0];
    const playerKey = Object.keys(updateCall).find((k) => k.startsWith('players.'));
    expect(updateCall[playerKey!].playerNumber).toBe(1); // Reused playerNumber
  });

  it('handles errors gracefully', async () => {
    mockGet.mockRejectedValue(new Error('Firestore error'));

    const request = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode: 'ABC123', username: 'Player2' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to join room');
    expect(data.message).toBe('Firestore error');
  });
});
