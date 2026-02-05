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
    const page = searchParams.get('page');

    // Validate request parameters
    if (!page || typeof page !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: page parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Sanitize page name to match what we use in tracking
    const sanitizedPage = page.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Get visit count from Firestore
    const analyticsRef = db.collection('analytics').doc('pageVisits');
    const doc = await analyticsRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { page: sanitizedPage, visits: 0 },
        { status: 200 }
      );
    }

    const data = doc.data();
    const visits = data?.[sanitizedPage] || 0;

    return NextResponse.json(
      { page: sanitizedPage, visits },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch visits',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
