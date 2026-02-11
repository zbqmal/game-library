/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { db } from '@/lib/firebase-admin';
import { uncoverTile } from '@/app/games/treasure-hunt/gameLogic';

// Mock firebase-admin
jest.mock('@/lib/firebase-admin', () => ({
  db: {
    collection: jest.fn(),
  },
}));

// Mock gameLogic
jest.mock('@/app/games/treasure-hunt/gameLogic', () => ({
  uncoverTile: jest.fn(),
}));

describe('POST /api/rooms/[roomCode]/move', () => {
  let mockUpdate: jest.Mock;
  let mockGet: jest.Mock;
  let mockDoc: jest.Mock;
  let mockCollection: jest.Mock;

  const mockGameState = {
    tiles: new Array(9).fill('covered'),
    treasurePosition: 4,
    currentPlayer: 1,
    winner: null,
    isGameOver: false,
    playerCount: 2,
    playerNames: ['Player1', 'Player2'],
    gridSize: 3,
  };

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

    // Mock uncoverTile to return a valid game state
    (uncoverTile as jest.Mock).mockReturnValue({
      ...mockGameState,
      tiles: ['uncovered-empty', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered'],
      currentPlayer: 2,
    });
  });

  it('returns 503 when Firebase is not configured', async () => {
    const originalDb = db as any;
    (require('@/lib/firebase-admin') as any).db = null;

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
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

  it('returns 400 when playerId is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('playerId field is required');
  });

  it('returns 400 when playerId is not a string', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 123, tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('playerId field is required and must be a string');
  });

  it('returns 400 when tilePosition is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id' }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('tilePosition field is required');
  });

  it('returns 400 when tilePosition is not a number', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 'invalid' }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('tilePosition field is required and must be a non-negative number');
  });

  it('returns 400 when tilePosition is negative', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: -1 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('tilePosition field is required and must be a non-negative number');
  });

  it('returns 404 when room not found', async () => {
    mockGet.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Room not found');
  });

  it('returns 400 when room status is not playing', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: 'ABC123',
        status: 'waiting',
        players: {
          'player1-id': { playerNumber: 1, username: 'Player1' },
          'player2-id': { playerNumber: 2, username: 'Player2' },
        },
        gameState: mockGameState,
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Game is not currently being played');
  });

  it('returns 404 when player not found in room', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: 'ABC123',
        status: 'playing',
        players: {
          'player1-id': { playerNumber: 1, username: 'Player1' },
          'player2-id': { playerNumber: 2, username: 'Player2' },
        },
        gameState: mockGameState,
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player3-id', tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Player not found in room');
  });

  it('returns 400 when game is already over', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: 'ABC123',
        status: 'playing',
        players: {
          'player1-id': { playerNumber: 1, username: 'Player1' },
          'player2-id': { playerNumber: 2, username: 'Player2' },
        },
        gameState: {
          ...mockGameState,
          isGameOver: true,
          winner: 1,
        },
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Game is already over');
  });

  it('returns 403 when it is not player turn', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: 'ABC123',
        status: 'playing',
        players: {
          'player1-id': { playerNumber: 1, username: 'Player1' },
          'player2-id': { playerNumber: 2, username: 'Player2' },
        },
        gameState: {
          ...mockGameState,
          currentPlayer: 2, // It's player 2's turn
        },
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('It is not your turn');
  });

  it('returns 400 when tile position exceeds grid size', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: 'ABC123',
        status: 'playing',
        players: {
          'player1-id': { playerNumber: 1, username: 'Player1' },
          'player2-id': { playerNumber: 2, username: 'Player2' },
        },
        gameState: mockGameState,
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 9 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid tile position');
  });

  it('returns 400 when tile is already uncovered', async () => {
    const gameStateWithUncovered = {
      ...mockGameState,
      tiles: ['uncovered-empty', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered'],
    };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: 'ABC123',
        status: 'playing',
        players: {
          'player1-id': { playerNumber: 1, username: 'Player1' },
          'player2-id': { playerNumber: 2, username: 'Player2' },
        },
        gameState: gameStateWithUncovered,
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Tile is already uncovered');
  });

  it('returns 400 when tile is uncovered-treasure', async () => {
    const gameStateWithTreasure = {
      ...mockGameState,
      tiles: ['uncovered-treasure', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered'],
    };

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: 'ABC123',
        status: 'playing',
        players: {
          'player1-id': { playerNumber: 1, username: 'Player1' },
          'player2-id': { playerNumber: 2, username: 'Player2' },
        },
        gameState: gameStateWithTreasure,
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Tile is already uncovered');
  });

  it('successfully processes valid move', async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'playing',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          gameState: mockGameState,
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'playing',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          gameState: {
            ...mockGameState,
            tiles: ['uncovered-empty', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered'],
            currentPlayer: 2,
          },
        }),
      });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.gameState).toBeDefined();
    expect(data.room).toBeDefined();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('updates game state correctly and calls uncoverTile', async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'playing',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          gameState: mockGameState,
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'playing',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          gameState: {
            ...mockGameState,
            tiles: ['uncovered-empty', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered'],
            currentPlayer: 2,
          },
        }),
      });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 3 }),
      }
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });

    expect(uncoverTile).toHaveBeenCalledWith(mockGameState, 3);
  });

  it('updates room status to finished when game is over', async () => {
    // This test verifies that when uncoverTile returns a game state with isGameOver=true,
    // the room status is updated to 'finished'
    
    const currentGameState = {
      ...mockGameState,
      tiles: ['covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered'],
    };

    const gameOverState = {
      ...currentGameState,
      isGameOver: true,
      winner: 1,
      currentPlayer: 2,
      tiles: ['uncovered-treasure', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered'],
    };

    (uncoverTile as jest.Mock).mockReturnValue(gameOverState);

    // Reset mocks to avoid interference from previous tests
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
    (uncoverTile as jest.Mock).mockReturnValue(gameOverState);

    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'playing',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          gameState: currentGameState,
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'finished',
          gameState: gameOverState,
        }),
      });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });

    // Find the update call that includes status: 'finished'
    const calls = mockUpdate.mock.calls;
    const finishedCall = calls.find((call) => call[0].status === 'finished');
    expect(finishedCall).toBeDefined();
    expect(finishedCall[0].status).toBe('finished');
  });

  it('does not update status to finished when game is not over', async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'playing',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          gameState: mockGameState,
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'playing',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          gameState: {
            ...mockGameState,
            tiles: ['uncovered-empty', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered'],
            currentPlayer: 2,
          },
        }),
      });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.status).toBeUndefined();
  });

  it('always updates lastActivity timestamp', async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'playing',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          gameState: mockGameState,
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'playing',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          gameState: {
            ...mockGameState,
            tiles: ['uncovered-empty', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered'],
            currentPlayer: 2,
          },
        }),
      });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.lastActivity).toBeDefined();
  });

  it('handles errors gracefully', async () => {
    mockGet.mockRejectedValue(new Error('Firestore error'));

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process move');
    expect(data.message).toBe('Firestore error');
  });

  it('handles unknown errors gracefully', async () => {
    mockGet.mockRejectedValue('Unknown error');

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process move');
    expect(data.message).toBe('Unknown error');
  });

  it('converts room code to uppercase', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        roomCode: 'ABC123',
        status: 'playing',
        players: {
          'player1-id': { playerNumber: 1, username: 'Player1' },
          'player2-id': { playerNumber: 2, username: 'Player2' },
        },
        gameState: mockGameState,
      }),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/abc123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    await POST(request, {
      params: Promise.resolve({ roomCode: 'abc123' }),
    });

    expect(mockDoc).toHaveBeenCalledWith('ABC123');
  });

  it('returns updated room data after move', async () => {
    const expectedRoomData = {
      roomCode: 'ABC123',
      status: 'playing',
      players: {
        'player1-id': { playerNumber: 1, username: 'Player1' },
        'player2-id': { playerNumber: 2, username: 'Player2' },
      },
      gameState: {
        ...mockGameState,
        tiles: ['uncovered-empty', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered'],
        currentPlayer: 2,
      },
    };

    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'playing',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          gameState: mockGameState,
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => expectedRoomData,
      });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(data.room).toEqual(expectedRoomData);
  });

  it('returns new game state in response', async () => {
    const newGameState = {
      ...mockGameState,
      tiles: ['uncovered-empty', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered', 'covered'],
      currentPlayer: 2,
    };

    (uncoverTile as jest.Mock).mockReturnValue(newGameState);

    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'playing',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          gameState: mockGameState,
        }),
      })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({
          roomCode: 'ABC123',
          status: 'playing',
          players: {
            'player1-id': { playerNumber: 1, username: 'Player1' },
            'player2-id': { playerNumber: 2, username: 'Player2' },
          },
          gameState: newGameState,
        }),
      });

    const request = new NextRequest(
      'http://localhost:3000/api/rooms/ABC123/move',
      {
        method: 'POST',
        body: JSON.stringify({ playerId: 'player1-id', tilePosition: 0 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ roomCode: 'ABC123' }),
    });
    const data = await response.json();

    expect(data.gameState).toEqual(newGameState);
  });

  it('allows different tile positions', async () => {
    const validPositions = [0, 2, 4, 5, 7, 8];

    for (const position of validPositions) {
      mockGet
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            roomCode: 'ABC123',
            status: 'playing',
            players: {
              'player1-id': { playerNumber: 1, username: 'Player1' },
              'player2-id': { playerNumber: 2, username: 'Player2' },
            },
            gameState: mockGameState,
          }),
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            roomCode: 'ABC123',
            status: 'playing',
            players: {
              'player1-id': { playerNumber: 1, username: 'Player1' },
              'player2-id': { playerNumber: 2, username: 'Player2' },
            },
            gameState: {
              ...mockGameState,
              currentPlayer: 2,
            },
          }),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/rooms/ABC123/move',
        {
          method: 'POST',
          body: JSON.stringify({ playerId: 'player1-id', tilePosition: position }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ roomCode: 'ABC123' }),
      });

      expect(response.status).toBe(200);
      expect(uncoverTile).toHaveBeenCalledWith(mockGameState, position);
    }
  });
});
