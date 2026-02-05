import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
    const { gameId, name, score } = body;

    // Validate request body
    if (!gameId || typeof gameId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: gameId field is required and must be a string' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: name field is required and must be a string' },
        { status: 400 }
      );
    }

    if (typeof score !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request: score field is required and must be a number' },
        { status: 400 }
      );
    }

    // Save score to Firestore
    const scoresRef = db.collection('scoreboards').doc(gameId).collection('scores');
    await scoresRef.add({
      name,
      score,
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      { success: true, message: 'Score saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save score',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
