/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../track-visit/route';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getCurrentDateEST } from '@/app/lib/utils';

// Mock firebase-admin
jest.mock('@/lib/firebase-admin', () => ({
  db: {
    collection: jest.fn(),
  },
}));

// Mock utils
jest.mock('@/app/lib/utils', () => ({
  sanitizePageName: jest.fn((page: string) => page.replace(/[^a-zA-Z0-9_-]/g, '_')),
  getCurrentDateEST: jest.fn(() => '2026-02-05'),
  shouldResetDailyCount: jest.fn((lastResetDate: string | undefined) => {
    if (!lastResetDate) return true;
    return lastResetDate !== '2026-02-05';
  }),
}));

describe('POST /api/analytics/track-visit', () => {
  let mockSet: jest.Mock;
  let mockGet: jest.Mock;
  let mockDoc: jest.Mock;
  let mockCollection: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSet = jest.fn().mockResolvedValue(undefined);
    mockGet = jest.fn();
    mockDoc = jest.fn(() => ({
      set: mockSet,
      get: mockGet,
    }));
    mockCollection = jest.fn(() => ({
      doc: mockDoc,
    }));

    (db as any).collection = mockCollection;
  });

  it('returns 503 when Firebase is not configured', async () => {
    // Temporarily set db to null
    const originalDb = (db as any);
    (require('@/lib/firebase-admin') as any).db = null;

    const request = new NextRequest('http://localhost:3000/api/analytics/track-visit', {
      method: 'POST',
      body: JSON.stringify({ page: 'home' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain('Firebase is not configured');

    // Restore db
    (require('@/lib/firebase-admin') as any).db = originalDb;
  });

  it('returns 400 when page is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/track-visit', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('page field is required');
  });

  it('returns 400 when page is not a string', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/track-visit', {
      method: 'POST',
      body: JSON.stringify({ page: 123 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('page field is required and must be a string');
  });

  it('resets count to 1 when a new day starts', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        home: 100,
        lastResetDate: '2026-02-04', // Different date
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/analytics/track-visit', {
      method: 'POST',
      body: JSON.stringify({ page: 'home' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSet).toHaveBeenCalledWith(
      {
        home: 1,
        lastResetDate: '2026-02-05',
        lastUpdated: expect.anything(),
      },
      { merge: false } // Changed to false to reset all page counts
    );
  });

  it('increments count when same day', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        home: 50,
        lastResetDate: '2026-02-05', // Same date
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/analytics/track-visit', {
      method: 'POST',
      body: JSON.stringify({ page: 'home' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSet).toHaveBeenCalledWith(
      {
        home: expect.any(Object), // FieldValue.increment(1)
        lastUpdated: expect.anything(),
      },
      { merge: true }
    );
  });

  it('initializes count when no document exists', async () => {
    mockGet.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });

    const request = new NextRequest('http://localhost:3000/api/analytics/track-visit', {
      method: 'POST',
      body: JSON.stringify({ page: 'home' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSet).toHaveBeenCalledWith(
      {
        home: 1,
        lastResetDate: '2026-02-05',
        lastUpdated: expect.anything(),
      },
      { merge: false } // Changed to false to reset all page counts
    );
  });

  it('handles errors gracefully', async () => {
    mockGet.mockRejectedValue(new Error('Firestore error'));

    const request = new NextRequest('http://localhost:3000/api/analytics/track-visit', {
      method: 'POST',
      body: JSON.stringify({ page: 'home' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to track visit');
    expect(data.message).toBe('Firestore error');
  });
});
