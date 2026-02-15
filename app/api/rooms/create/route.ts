import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { generateUniqueRoomCode } from '@/lib/roomCodeGenerator';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { username } = body;

    // Validate request body
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        {
          error:
            'Invalid request: username field is required and must be a string',
        },
        { status: 400 }
      );
    }

    if (username.trim().length === 0 || username.length > 20) {
      return NextResponse.json(
        { error: 'Username must be between 1 and 20 characters' },
        { status: 400 }
      );
    }

    // Use default gridSize and maxPlayers
    // Grid size can be changed in lobby before game starts
    const gridSize = 3;
    const maxPlayers = 4;

    // Generate unique room code
    const roomCode = await generateUniqueRoomCode();

    // Generate temporary player ID for the host
    const playerId = crypto.randomUUID();

    // Create room document
    const roomData = {
      roomCode,
      hostId: playerId,
      gameId: 'treasure-hunt',
      status: 'waiting',
      createdAt: FieldValue.serverTimestamp(),
      lastActivity: FieldValue.serverTimestamp(),
      config: {
        gridSize,
        maxPlayers,
      },
      gameState: null,
      players: {
        [playerId]: {
          playerId,
          username: username.trim(),
          playerNumber: 1,
          joinedAt: FieldValue.serverTimestamp(),
          isHost: true,
        },
      },
    };

    await db.collection('rooms').doc(roomCode).set(roomData);

    return NextResponse.json(
      {
        roomCode,
        playerId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      {
        error: 'Failed to create room',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
