import { db } from './firebase-admin';

// Characters to use for room codes (exclude confusing chars like O/0, I/1)
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;

/**
 * Generate a random 6-character room code
 * Uses characters that are easy to distinguish: excludes O, 0, I, 1
 */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[randomIndex];
  }
  return code;
}

/**
 * Check if a room code is available (not already in use)
 * @param code The room code to check
 * @returns Promise<boolean> true if available, false if taken
 */
export async function isRoomCodeAvailable(code: string): Promise<boolean> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const roomRef = db.collection('rooms').doc(code);
  const roomDoc = await roomRef.get();
  return !roomDoc.exists;
}

/**
 * Generate a unique room code that doesn't exist in Firestore
 * @param maxAttempts Maximum number of attempts to generate a unique code
 * @returns Promise<string> A unique room code
 * @throws Error if unable to generate a unique code after maxAttempts
 */
export async function generateUniqueRoomCode(
  maxAttempts = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateRoomCode();
    const isAvailable = await isRoomCodeAvailable(code);
    if (isAvailable) {
      return code;
    }
  }
  throw new Error('Unable to generate unique room code after multiple attempts');
}
