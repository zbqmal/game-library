import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

interface PlayerData {
  playerId: string;
  username: string;
  playerNumber: number;
  isHost: boolean;
}

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
    const { roomCode, username } = body;

    // Validate request body
    if (!roomCode || typeof roomCode !== 'string') {
      return NextResponse.json(
        {
          error:
            'Invalid request: roomCode field is required and must be a string',
        },
        { status: 400 }
      );
    }

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

    // Get room document
    const roomRef = db.collection('rooms').doc(roomCode.toUpperCase());
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const roomData = roomDoc.data();

    // Check if room is in waiting status
    if (roomData?.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Room is not accepting new players' },
        { status: 400 }
      );
    }

    // Check if room is full
    const currentPlayerCount = Object.keys(roomData.players || {}).length;
    const maxPlayers = roomData.config?.maxPlayers || 4;

    if (currentPlayerCount >= maxPlayers) {
      return NextResponse.json(
        { error: 'Room is full' },
        { status: 400 }
      );
    }

    // Generate temporary player ID
    const playerId = crypto.randomUUID();

    // Assign next available player number
    // Note: This uses Math.max to find the highest existing player number and adds 1.
    // For Phase 1, this is sufficient since players don't leave during gameplay.
    // Future phases should track the highest player number separately if player removal is needed.
    const playerNumbers = (Object.values(roomData.players || {}) as PlayerData[]).map(
      (p) => p.playerNumber
    );
    const nextPlayerNumber = Math.max(0, ...playerNumbers) + 1;

    // Add player to room
    await roomRef.update({
      [`players.${playerId}`]: {
        playerId,
        username: username.trim(),
        playerNumber: nextPlayerNumber,
        joinedAt: FieldValue.serverTimestamp(),
        isHost: false,
      },
      lastActivity: FieldValue.serverTimestamp(),
    });

    // Fetch updated room data
    const updatedRoomDoc = await roomRef.get();
    const updatedRoomData = updatedRoomDoc.data();

    return NextResponse.json(
      {
        success: true,
        playerId,
        room: {
          roomCode: updatedRoomData?.roomCode,
          status: updatedRoomData?.status,
          config: updatedRoomData?.config,
          players: updatedRoomData?.players,
          hostId: updatedRoomData?.hostId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      {
        error: 'Failed to join room',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
