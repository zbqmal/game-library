import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase is initialized
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.' },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Validate request parameters
    if (!gameId) {
      return NextResponse.json(
        { error: 'Invalid request: gameId parameter is required' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid request: limit must be a positive number' },
        { status: 400 }
      );
    }

    // Get scores from Firestore
    const scoresRef = db.collection('scoreboards').doc(gameId).collection('scores');
    const snapshot = await scoresRef
      .orderBy('score', 'desc')
      .limit(limit)
      .get();

    const scores = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        name: data.name,
        score: data.score,
        timestamp: data.timestamp?._seconds ? data.timestamp._seconds * 1000 : Date.now(),
      };
    });

    return NextResponse.json(
      { scores },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch scores',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
