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
    const body = await request.json();
    const { playerId } = body;

    // Validate request body
    if (!playerId || typeof playerId !== "string") {
      return NextResponse.json(
        {
          error:
            "Invalid request: playerId field is required and must be a string",
        },
        { status: 400 },
      );
    }

    // Get room document
    const roomRef = db.collection("rooms").doc(roomCode.toUpperCase());
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const roomData = roomDoc.data();

    // Check if player is in the room
    if (!roomData?.players?.[playerId]) {
      return NextResponse.json(
        { error: "Player not in room" },
        { status: 404 },
      );
    }

    const isHost = roomData.hostId === playerId;
    const playerCount = Object.keys(roomData.players || {}).length;

    // If host is leaving and there are other players, reassign host
    if (isHost && playerCount > 1) {
      // Find the next player to become host (first non-host player)
      const nextHost = Object.entries(roomData.players).find(
        ([id]) => id !== playerId,
      );

      if (nextHost) {
        const [nextHostId] = nextHost;

        // Remove player and reassign host
        await roomRef.update({
          [`players.${playerId}`]: FieldValue.delete(),
          hostId: nextHostId,
          [`players.${nextHostId}.isHost`]: true,
          lastActivity: FieldValue.serverTimestamp(),
        });
      }
    } else if (playerCount === 1) {
      // Last player leaving, delete the room
      await roomRef.delete();
      return NextResponse.json(
        {
          success: true,
          roomDeleted: true,
          message: "Room closed as last player left",
        },
        { status: 200 },
      );
    } else {
      // Non-host leaving, just remove player
      await roomRef.update({
        [`players.${playerId}`]: FieldValue.delete(),
        lastActivity: FieldValue.serverTimestamp(),
      });
    }

    // Fetch updated room data (if room wasn't deleted)
    const updatedRoomDoc = await roomRef.get();
    if (!updatedRoomDoc.exists) {
      return NextResponse.json(
        {
          success: true,
          roomDeleted: true,
          message: "Room closed",
        },
        { status: 200 },
      );
    }

    const updatedRoomData = updatedRoomDoc.data();

    return NextResponse.json(
      {
        success: true,
        roomDeleted: false,
        room: updatedRoomData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error leaving room:", error);
    return NextResponse.json(
      {
        error: "Failed to leave room",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
