import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { uncoverTile, GameState } from '@/app/games/treasure-hunt/gameLogic';

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
    const { playerId, tilePosition } = body;

    // Validate request body
    if (!playerId || typeof playerId !== 'string') {
      return NextResponse.json(
        {
          error:
            'Invalid request: playerId field is required and must be a string',
        },
        { status: 400 }
      );
    }

    if (typeof tilePosition !== 'number' || tilePosition < 0) {
      return NextResponse.json(
        {
          error:
            'Invalid request: tilePosition field is required and must be a non-negative number',
        },
        { status: 400 }
      );
    }

    // Get room document
    const roomRef = db.collection('rooms').doc(roomCode.toUpperCase());
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const roomData = roomDoc.data();

    // Check if room is in playing status
    if (roomData?.status !== 'playing') {
      return NextResponse.json(
        { error: 'Game is not currently being played' },
        { status: 400 }
      );
    }

    // Check if player exists in the room
    const player = roomData.players?.[playerId];
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found in room' },
        { status: 404 }
      );
    }

    const gameState = roomData.gameState as GameState;

    // Check if game is already over
    if (gameState.isGameOver) {
      return NextResponse.json(
        { error: 'Game is already over' },
        { status: 400 }
      );
    }

    // Check if it's the player's turn
    if (gameState.currentPlayer !== player.playerNumber) {
      return NextResponse.json(
        { error: 'It is not your turn' },
        { status: 403 }
      );
    }

    // Validate tile position
    if (tilePosition >= gameState.tiles.length) {
      return NextResponse.json(
        { error: 'Invalid tile position' },
        { status: 400 }
      );
    }

    // Check if tile is already uncovered
    if (gameState.tiles[tilePosition] !== 'covered') {
      return NextResponse.json(
        { error: 'Tile is already uncovered' },
        { status: 400 }
      );
    }

    // Process the move using gameLogic
    const newGameState = uncoverTile(gameState, tilePosition);

    // Update room's gameState and lastActivity
    const updateData: Record<string, unknown> = {
      gameState: newGameState,
      lastActivity: FieldValue.serverTimestamp(),
    };

    // If game is over, update status
    if (newGameState.isGameOver) {
      updateData.status = 'finished';
    }

    await roomRef.update(updateData);

    // Fetch updated room data
    const updatedRoomDoc = await roomRef.get();
    const updatedRoomData = updatedRoomDoc.data();

    return NextResponse.json(
      {
        success: true,
        gameState: newGameState,
        room: updatedRoomData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing move:', error);
    return NextResponse.json(
      {
        error: 'Failed to process move',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
