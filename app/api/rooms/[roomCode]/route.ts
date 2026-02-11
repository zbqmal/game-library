import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(
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

    // Validate room code
    if (!roomCode || typeof roomCode !== 'string') {
      return NextResponse.json(
        { error: 'Invalid room code' },
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

    return NextResponse.json(
      {
        room: roomData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch room',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
