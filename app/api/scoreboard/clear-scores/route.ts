import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is initialized
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { gameId } = body;

    // Validate request body
    if (!gameId || typeof gameId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: gameId field is required and must be a string' },
        { status: 400 }
      );
    }

    // Delete all scores for this game
    const scoresRef = db.collection('scoreboards').doc(gameId).collection('scores');
    const snapshot = await scoresRef.get();
    
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json(
      { success: true, message: 'Scores cleared successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error clearing scores:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear scores',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
