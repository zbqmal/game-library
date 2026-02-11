import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

/**
 * Room Cleanup API Route
 * 
 * This endpoint deletes inactive rooms from Firestore based on lastActivity timestamp.
 * 
 * Cleanup Rules:
 * - Delete rooms where lastActivity > 1 hour ago AND status !== 'playing'
 * - OR where lastActivity > 2 hours ago (even if playing)
 * 
 * Usage:
 * - Call this endpoint manually: GET /api/rooms/cleanup
 * - Or set up Vercel Cron Jobs (see README.md for setup instructions)
 * 
 * Vercel Cron Setup (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/rooms/cleanup",
 *     "schedule": "0 * * * *"  // Runs every hour
 *   }]
 * }
 */
export async function GET() {
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

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;

    const roomsRef = db.collection('rooms');
    const roomsSnapshot = await roomsRef.get();

    const roomsToDelete: string[] = [];
    const deletionReasons: Record<string, string> = {};

    roomsSnapshot.forEach((doc) => {
      const roomData = doc.data();
      const lastActivity = roomData.lastActivity?.toMillis();

      if (!lastActivity) {
        // If no lastActivity, check createdAt
        const createdAt = roomData.createdAt?.toMillis();
        if (createdAt && createdAt < oneHourAgo) {
          roomsToDelete.push(doc.id);
          deletionReasons[doc.id] = 'No lastActivity and createdAt > 1 hour ago';
        }
        return;
      }

      // Delete non-playing rooms after 1 hour of inactivity
      if (roomData.status !== 'playing' && lastActivity < oneHourAgo) {
        roomsToDelete.push(doc.id);
        deletionReasons[doc.id] = `Status: ${roomData.status}, inactive for > 1 hour`;
      }
      // Delete all rooms after 2 hours of inactivity
      else if (lastActivity < twoHoursAgo) {
        roomsToDelete.push(doc.id);
        deletionReasons[doc.id] = `Status: ${roomData.status}, inactive for > 2 hours`;
      }
    });

    // Delete rooms in batch
    const batch = db.batch();
    roomsToDelete.forEach((roomCode) => {
      batch.delete(roomsRef.doc(roomCode));
    });

    if (roomsToDelete.length > 0) {
      await batch.commit();
    }

    return NextResponse.json(
      {
        success: true,
        deletedCount: roomsToDelete.length,
        deletedRooms: roomsToDelete,
        deletionReasons,
        message: `Cleaned up ${roomsToDelete.length} inactive room(s)`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cleaning up rooms:', error);
    return NextResponse.json(
      {
        error: 'Failed to clean up rooms',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
