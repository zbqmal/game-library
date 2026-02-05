import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sanitizePageName } from '@/app/lib/utils';

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
    const { page } = body;

    // Validate request body
    if (!page || typeof page !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: page field is required and must be a string' },
        { status: 400 }
      );
    }

    // Sanitize page name to ensure it's a valid field name
    const sanitizedPage = sanitizePageName(page);

    // Update visit count in Firestore
    const analyticsRef = db.collection('analytics').doc('pageVisits');
    
    await analyticsRef.set(
      {
        [sanitizedPage]: FieldValue.increment(1),
        lastUpdated: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json(
      { success: true, message: 'Visit tracked successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error tracking visit:', error);
    return NextResponse.json(
      { 
        error: 'Failed to track visit',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
