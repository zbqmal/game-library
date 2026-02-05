import { sanitizePageName, getCurrentDateEST, shouldResetDailyCount } from '../utils';

describe('Utils', () => {
  describe('sanitizePageName', () => {
    it('replaces non-alphanumeric characters (except hyphens and underscores) with underscores', () => {
      expect(sanitizePageName('hello world')).toBe('hello_world');
      expect(sanitizePageName('page/name')).toBe('page_name');
      expect(sanitizePageName('test@page')).toBe('test_page');
    });

    it('keeps hyphens and underscores', () => {
      expect(sanitizePageName('hello-world')).toBe('hello-world');
      expect(sanitizePageName('hello_world')).toBe('hello_world');
      expect(sanitizePageName('test-page_name')).toBe('test-page_name');
    });

    it('keeps alphanumeric characters', () => {
      expect(sanitizePageName('page123')).toBe('page123');
      expect(sanitizePageName('ABC123xyz')).toBe('ABC123xyz');
    });

    it('handles empty string', () => {
      expect(sanitizePageName('')).toBe('');
    });
  });

  describe('getCurrentDateEST', () => {
    it('returns a date string in YYYY-MM-DD format', () => {
      const dateString = getCurrentDateEST();
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns a valid date', () => {
      const dateString = getCurrentDateEST();
      const date = new Date(dateString);
      expect(date).toBeInstanceOf(Date);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });

  describe('shouldResetDailyCount', () => {
    it('returns true when lastResetDate is undefined', () => {
      expect(shouldResetDailyCount(undefined)).toBe(true);
    });

    it('returns false when lastResetDate matches current date', () => {
      const currentDate = getCurrentDateEST();
      expect(shouldResetDailyCount(currentDate)).toBe(false);
    });

    it('returns true when lastResetDate is different from current date', () => {
      const oldDate = '2023-01-01';
      expect(shouldResetDailyCount(oldDate)).toBe(true);
    });

    it('returns true when lastResetDate is yesterday', () => {
      const now = new Date();
      const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const yesterday = new Date(estDate);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const yesterdayString = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      
      expect(shouldResetDailyCount(yesterdayString)).toBe(true);
    });
  });
});
