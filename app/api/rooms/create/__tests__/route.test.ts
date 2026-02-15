/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { db } from '@/lib/firebase-admin';
import { generateUniqueRoomCode } from '@/lib/roomCodeGenerator';

// Mock firebase-admin
jest.mock('@/lib/firebase-admin', () => ({
  db: {
    collection: jest.fn(),
  },
}));

// Mock roomCodeGenerator
jest.mock('@/lib/roomCodeGenerator', () => ({
  generateUniqueRoomCode: jest.fn(),
}));

describe('POST /api/rooms/create', () => {
  let mockSet: jest.Mock;
  let mockDoc: jest.Mock;
  let mockCollection: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSet = jest.fn().mockResolvedValue(undefined);
    mockDoc = jest.fn(() => ({
      set: mockSet,
    }));
    mockCollection = jest.fn(() => ({
      doc: mockDoc,
    }));

    (db as any).collection = mockCollection;
    (generateUniqueRoomCode as jest.Mock).mockResolvedValue('ABC123');
  });

  it('returns 503 when Firebase is not configured', async () => {
    const originalDb = db as any;
    (require('@/lib/firebase-admin') as any).db = null;

    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain('Firebase is not configured');

    (require('@/lib/firebase-admin') as any).db = originalDb;
  });

  it('returns 400 when username is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('username field is required');
  });

  it('returns 400 when username is not a string', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 123 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('username field is required and must be a string');
  });

  it('returns 400 when username is empty', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: '   ' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Username must be between 1 and 20 characters');
  });

  it('returns 400 when username is too long', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 'a'.repeat(21) }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Username must be between 1 and 20 characters');
  });

  it('returns 400 when gridSize is invalid (too small)', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser', gridSize: 2 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Grid size must be between 3 and 6');
  });

  it('returns 400 when gridSize is invalid (too large)', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser', gridSize: 7 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Grid size must be between 3 and 6');
  });

  it('returns 400 when gridSize is invalid (negative)', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser', gridSize: -1 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Grid size must be between 3 and 6');
  });

  it('returns 400 when gridSize is invalid (string)', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser', gridSize: 'abc' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Grid size must be between 3 and 6');
  });

  it('successfully creates a room with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({
        username: 'TestUser',
        gridSize: 3,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.roomCode).toBe('ABC123');
    expect(data.playerId).toBeDefined();
    expect(mockSet).toHaveBeenCalled();

    const roomData = mockSet.mock.calls[0][0];
    expect(roomData.roomCode).toBe('ABC123');
    expect(roomData.hostId).toBeDefined();
    expect(roomData.gameId).toBe('treasure-hunt');
    expect(roomData.status).toBe('waiting');
    expect(roomData.config.gridSize).toBe(3);
    expect(roomData.config.maxPlayers).toBe(4);
    expect(roomData.players).toBeDefined();
    expect(roomData.lastActivity).toBeDefined();
  });

  it('creates room with default gridSize 3 when not provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);

    const roomData = mockSet.mock.calls[0][0];
    expect(roomData.config.gridSize).toBe(3);
    expect(roomData.config.maxPlayers).toBe(4);
  });

  it('creates room with gridSize 4 and calculates correct maxPlayers', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser', gridSize: 4 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);

    const roomData = mockSet.mock.calls[0][0];
    expect(roomData.config.gridSize).toBe(4);
    expect(roomData.config.maxPlayers).toBe(6); // min(6, floor(16/2)) = 6
  });

  it('creates room with gridSize 5 and calculates correct maxPlayers', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser', gridSize: 5 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);

    const roomData = mockSet.mock.calls[0][0];
    expect(roomData.config.gridSize).toBe(5);
    expect(roomData.config.maxPlayers).toBe(6); // min(6, floor(25/2)) = 6 (capped at 6)
  });

  it('creates room with gridSize 6 and calculates correct maxPlayers', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser', gridSize: 6 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);

    const roomData = mockSet.mock.calls[0][0];
    expect(roomData.config.gridSize).toBe(6);
    expect(roomData.config.maxPlayers).toBe(6); // min(6, floor(36/2)) = 6 (capped at 6)
  });

  it('creates room with host player correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);

    const roomData = mockSet.mock.calls[0][0];
    const hostPlayer = Object.values(roomData.players)[0] as any;

    expect(hostPlayer.username).toBe('TestUser');
    expect(hostPlayer.playerNumber).toBe(1);
    expect(hostPlayer.isHost).toBe(true);
  });

  it('generates unique room code', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser' }),
    });

    await POST(request);

    expect(generateUniqueRoomCode).toHaveBeenCalled();
  });

  it('handles errors gracefully', async () => {
    mockSet.mockRejectedValue(new Error('Firestore error'));

    const request = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ username: 'TestUser' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create room');
    expect(data.message).toBe('Firestore error');
  });
});
