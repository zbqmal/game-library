import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { initializeGame } from '@/app/games/treasure-hunt/gameLogic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    // Check if Firebase is initialized
    if (!db) {
      return NextResponse.json(
        {
          error:
            'Firebase is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.',
        },
        { status: 503 }
      );
    }

    const { roomCode } = await params;
    const body = await request.json();
    const { playerId } = body;

    // Validate request body
    if (!playerId || typeof playerId !== 'string') {
      return NextResponse.json(
        {
          error:
            'Invalid request: playerId field is required and must be a string',
        },
        { status: 400 }
      );
    }

    // Get room document
    const roomRef = db.collection('rooms').doc(roomCode.toUpperCase());
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const roomData = roomDoc.data();

    // Check if player is the host
    if (roomData?.hostId !== playerId) {
      return NextResponse.json(
        { error: 'Only the host can start the game' },
        { status: 403 }
      );
    }

    // Check if room is in waiting status
    if (roomData?.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Game has already started or finished' },
        { status: 400 }
      );
    }

    // Check if there are at least 2 players
    const playerCount = Object.keys(roomData.players || {}).length;
    if (playerCount < 2) {
      return NextResponse.json(
        { error: 'At least 2 players are required to start the game' },
        { status: 400 }
      );
    }

    // Get player names in order of player number
    const players = Object.values(roomData.players || {}) as Array<{
      playerNumber: number;
      username: string;
    }>;
    const sortedPlayers = players.sort((a, b) => a.playerNumber - b.playerNumber);
    const playerNames = sortedPlayers.map((p) => p.username);

    // Initialize game state
    const gameState = initializeGame({
      playerCount,
      playerNames,
      gridSize: roomData.config?.gridSize || 3,
    });

    // Update room status to playing and set game state
    await roomRef.update({
      status: 'playing',
      gameState,
      lastActivity: FieldValue.serverTimestamp(),
    });

    // Fetch updated room data
    const updatedRoomDoc = await roomRef.get();
    const updatedRoomData = updatedRoomDoc.data();

    return NextResponse.json(
      {
        success: true,
        room: updatedRoomData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      {
        error: 'Failed to start game',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
