import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  try {
    // Check if Firebase is initialized
    if (!db) {
      return NextResponse.json(
        {
          error:
            "Firebase is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.",
        },
        { status: 503 },
      );
    }

    const { roomCode } = await params;

    // Get room document
    const roomRef = db.collection("rooms").doc(roomCode.toUpperCase());
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const roomData = roomDoc.data();

    // Allow returning to lobby from 'finished' or 'playing' status
    if (roomData?.status !== "finished" && roomData?.status !== "playing") {
      return NextResponse.json(
        { error: "Can only return to lobby from a game" },
        { status: 400 },
      );
    }

    // Reset room to waiting state
    await roomRef.update({
      status: "waiting",
      gameState: null,
      lastActivity: FieldValue.serverTimestamp(),
    });

    // Fetch updated room data
    const updatedRoomDoc = await roomRef.get();
    const updatedRoomData = updatedRoomDoc.data();

    return NextResponse.json(
      {
        success: true,
        room: updatedRoomData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error returning to lobby:", error);
    return NextResponse.json(
      {
        error: "Failed to return to lobby",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
