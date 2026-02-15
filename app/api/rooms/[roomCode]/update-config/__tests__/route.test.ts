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

describe('POST /api/rooms/[roomCode]/update-config', () => {
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

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: 4 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain('Firebase is not configured');

    (require('@/lib/firebase-admin') as any).db = originalDb;
  });

  it('returns 400 when gridSize is invalid (too small)', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: 2 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Grid size must be between 3 and 6');
  });

  it('returns 400 when gridSize is invalid (too large)', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: 7 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Grid size must be between 3 and 6');
  });

  it('returns 400 when gridSize is invalid (negative)', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: -1 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Grid size must be between 3 and 6');
  });

  it('returns 400 when gridSize is invalid (null)', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: null }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Grid size must be between 3 and 6');
  });

  it('returns 400 when gridSize is invalid (string)', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: 'abc' }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Grid size must be between 3 and 6');
  });

  it('returns 404 when room does not exist', async () => {
    mockGet.mockResolvedValue({ exists: false });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/NOTFOUND/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: 4 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'NOTFOUND' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('Room not found');
  });

  it('returns 403 when game has already started', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'playing',
        players: {
          player1: { username: 'Player 1' },
          player2: { username: 'Player 2' },
        },
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: 4 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Cannot change grid size after game has started');
  });

  it('returns 400 when too many players for new grid size', async () => {
    // 5 players in room, trying to set 3x3 (max 4 players)
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'waiting',
        players: {
          player1: { username: 'Player 1' },
          player2: { username: 'Player 2' },
          player3: { username: 'Player 3' },
          player4: { username: 'Player 4' },
          player5: { username: 'Player 5' },
        },
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: 3 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Too many players');
    expect(data.error).toContain('5/4');
  });

  it('successfully updates grid size from 3 to 4', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'waiting',
        players: {
          player1: { username: 'Player 1' },
          player2: { username: 'Player 2' },
        },
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: 4 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.gridSize).toBe(4);
    expect(data.maxPlayers).toBe(6); // 4x4 = 16 tiles / 2 = 8, but capped at 6
    expect(mockUpdate).toHaveBeenCalledWith({
      'config.gridSize': 4,
      'config.maxPlayers': 6,
      lastActivity: expect.anything(),
    });
  });

  it('successfully updates grid size from 4 to 6', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'waiting',
        players: {
          player1: { username: 'Player 1' },
          player2: { username: 'Player 2' },
          player3: { username: 'Player 3' },
        },
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: 6 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.gridSize).toBe(6);
    expect(data.maxPlayers).toBe(6); // 6x6 = 36 tiles / 2 = 18, but capped at 6
  });

  it('calculates correct maxPlayers for 3x3 grid', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'waiting',
        players: {
          player1: { username: 'Player 1' },
        },
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: 3 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.maxPlayers).toBe(4); // 3x3 = 9 tiles / 2 = 4
  });

  it('calculates correct maxPlayers for 5x5 grid', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'waiting',
        players: {
          player1: { username: 'Player 1' },
          player2: { username: 'Player 2' },
        },
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: 5 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.maxPlayers).toBe(6); // 5x5 = 25 tiles / 2 = 12, but capped at 6
  });

  it('updates lastActivity timestamp', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'waiting',
        players: {
          player1: { username: 'Player 1' },
        },
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: 4 }),
      }
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        lastActivity: expect.anything(),
      })
    );
  });

  it('handles errors gracefully', async () => {
    mockGet.mockRejectedValue(new Error('Firestore error'));

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/update-config',
      {
        method: 'POST',
        body: JSON.stringify({ gridSize: 4 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to update room config');
  });
});
