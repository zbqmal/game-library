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

    // Check if current player count exceeds existing maxPlayers
    // (maxPlayers is set at room creation and never changes)
    const currentPlayerCount = Object.keys(room?.players || {}).length;
    const existingMaxPlayers = room?.config?.maxPlayers || 4;
    
    if (currentPlayerCount > existingMaxPlayers) {
      return NextResponse.json(
        {
          error: `Cannot change grid size. Current player count (${currentPlayerCount}) exceeds room capacity.`,
        },
        { status: 400 }
      );
    }

    // Update ONLY gridSize, keep maxPlayers unchanged
    await roomRef.update({
      'config.gridSize': gridSize,
      lastActivity: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, gridSize, maxPlayers: existingMaxPlayers });
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
