import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { validateGridSize } from '@/app/games/treasure-hunt/gameLogic';

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
    const { gridSize } = body;

    // Validate gridSize type and value
    if (typeof gridSize !== 'number' || !validateGridSize(gridSize)) {
      return NextResponse.json(
        { error: 'Grid size must be between 3 and 6' },
        { status: 400 }
      );
    }

    // Get room from Firestore
    const roomRef = db.collection('rooms').doc(roomCode.toUpperCase());
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const room = roomDoc.data();

    // Only allow updates if game hasn't started
    if (room?.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Cannot change grid size after game has started' },
        { status: 403 }
      );
    }

    // Calculate new maxPlayers based on new grid size
    const maxPlayers = Math.min(6, Math.floor((gridSize * gridSize) / 2));

    // Check if current player count exceeds new maxPlayers
    const currentPlayerCount = Object.keys(room?.players || {}).length;
    if (currentPlayerCount > maxPlayers) {
      return NextResponse.json(
        {
          error: `Cannot set grid size to ${gridSize}x${gridSize}. Too many players (${currentPlayerCount}/${maxPlayers})`,
        },
        { status: 400 }
      );
    }

    // Update room config
    await roomRef.update({
      'config.gridSize': gridSize,
      'config.maxPlayers': maxPlayers,
      lastActivity: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, gridSize, maxPlayers });
  } catch (error) {
    console.error('Error updating room config:', error);
    return NextResponse.json(
      {
        error: 'Failed to update room config',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
