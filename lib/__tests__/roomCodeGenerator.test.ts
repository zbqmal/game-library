import {
  generateRoomCode,
  isRoomCodeAvailable,
  generateUniqueRoomCode,
} from '../roomCodeGenerator';
import { db } from '../firebase-admin';

// Mock the firebase-admin module
jest.mock('../firebase-admin', () => ({
  db: null,
}));

describe('roomCodeGenerator', () => {
  describe('generateRoomCode', () => {
    it('should generate a 6-character code', () => {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
    });

    it('should only use allowed characters', () => {
      const code = generateRoomCode();
      const allowedChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
      expect(code).toMatch(allowedChars);
    });

    it('should not include confusing characters', () => {
      const code = generateRoomCode();
      const confusingChars = /[OI01]/;
      expect(code).not.toMatch(confusingChars);
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRoomCode());
      }
      // With random generation, we should get multiple unique codes
      expect(codes.size).toBeGreaterThan(1);
    });
  });

  describe('isRoomCodeAvailable', () => {
    it('should throw error when Firebase is not configured', async () => {
      await expect(isRoomCodeAvailable('ABC123')).rejects.toThrow(
        'Firebase is not configured'
      );
    });

    it('should return true when room does not exist', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              exists: false,
            }),
          }),
        }),
      };

      // Temporarily mock db
      (require('../firebase-admin') as { db: typeof mockDb | null }).db = mockDb;

      const result = await isRoomCodeAvailable('ABC123');
      expect(result).toBe(true);

      // Restore mock
      (require('../firebase-admin') as { db: typeof mockDb | null }).db = null;
    });

    it('should return false when room exists', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              exists: true,
            }),
          }),
        }),
      };

      // Temporarily mock db
      (require('../firebase-admin') as { db: typeof mockDb | null }).db = mockDb;

      const result = await isRoomCodeAvailable('ABC123');
      expect(result).toBe(false);

      // Restore mock
      (require('../firebase-admin') as { db: typeof mockDb | null }).db = null;
    });
  });

  describe('generateUniqueRoomCode', () => {
    it('should throw error when Firebase is not configured', async () => {
      await expect(generateUniqueRoomCode()).rejects.toThrow(
        'Firebase is not configured'
      );
    });

    it('should return a unique code when available', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              exists: false, // Room doesn't exist
            }),
          }),
        }),
      };

      // Temporarily mock db
      (require('../firebase-admin') as { db: typeof mockDb | null }).db = mockDb;

      const code = await generateUniqueRoomCode();
      expect(code).toHaveLength(6);

      // Restore mock
      (require('../firebase-admin') as { db: typeof mockDb | null }).db = null;
    });

    it('should retry when code is taken and eventually find a unique one', async () => {
      let callCount = 0;
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockImplementation(() => {
              callCount++;
              // First 2 calls return exists: true, third call returns exists: false
              return Promise.resolve({
                exists: callCount <= 2,
              });
            }),
          }),
        }),
      };

      // Temporarily mock db
      (require('../firebase-admin') as { db: typeof mockDb | null }).db = mockDb;

      const code = await generateUniqueRoomCode();
      expect(code).toHaveLength(6);
      expect(callCount).toBe(3); // Should have tried 3 times

      // Restore mock
      (require('../firebase-admin') as { db: typeof mockDb | null }).db = null;
    });

    it('should throw error after max attempts', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              exists: true, // Always return exists: true
            }),
          }),
        }),
      };

      // Temporarily mock db
      (require('../firebase-admin') as { db: typeof mockDb | null }).db = mockDb;

      await expect(generateUniqueRoomCode(5)).rejects.toThrow(
        'Unable to generate unique room code after multiple attempts'
      );

      // Restore mock
      (require('../firebase-admin') as { db: typeof mockDb | null }).db = null;
    });
  });
});
