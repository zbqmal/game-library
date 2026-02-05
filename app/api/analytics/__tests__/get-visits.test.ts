/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '../get-visits/route';
import { db } from '@/lib/firebase-admin';

// Mock firebase-admin
jest.mock('@/lib/firebase-admin', () => ({
  db: {
    collection: jest.fn(),
  },
}));

// Mock utils
jest.mock('@/app/lib/utils', () => ({
  sanitizePageName: jest.fn((page: string) => page.replace(/[^a-zA-Z0-9_-]/g, '_')),
  shouldResetDailyCount: jest.fn((lastResetDate: string | undefined) => {
    if (!lastResetDate) return true;
    return lastResetDate !== '2026-02-05';
  }),
}));

describe('GET /api/analytics/get-visits', () => {
  let mockGet: jest.Mock;
  let mockDoc: jest.Mock;
  let mockCollection: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGet = jest.fn();
    mockDoc = jest.fn(() => ({
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

    const request = new NextRequest('http://localhost:3000/api/analytics/get-visits?page=home');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain('Firebase is not configured');

    // Restore db
    (require('@/lib/firebase-admin') as any).db = originalDb;
  });

  it('returns 400 when page parameter is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/get-visits');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('page parameter is required');
  });

  it('returns 0 visits when document does not exist', async () => {
    mockGet.mockResolvedValue({
      exists: false,
    });

    const request = new NextRequest('http://localhost:3000/api/analytics/get-visits?page=home');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe('home');
    expect(data.visits).toBe(0);
  });

  it('returns 0 visits when a new day has started', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        home: 100,
        lastResetDate: '2026-02-04', // Old date
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/analytics/get-visits?page=home');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe('home');
    expect(data.visits).toBe(0);
  });

  it('returns current visit count when same day', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        home: 150,
        lastResetDate: '2026-02-05', // Same date
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/analytics/get-visits?page=home');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe('home');
    expect(data.visits).toBe(150);
  });

  it('returns 0 when page does not have visits yet', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        otherPage: 100,
        lastResetDate: '2026-02-05',
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/analytics/get-visits?page=home');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe('home');
    expect(data.visits).toBe(0);
  });

  it('sanitizes page names correctly', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        'test_page': 50,
        lastResetDate: '2026-02-05',
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/analytics/get-visits?page=test/page');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe('test_page');
    expect(data.visits).toBe(50);
  });

  it('handles errors gracefully', async () => {
    mockGet.mockRejectedValue(new Error('Firestore error'));

    const request = new NextRequest('http://localhost:3000/api/analytics/get-visits?page=home');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch visits');
    expect(data.message).toBe('Firestore error');
  });
});
