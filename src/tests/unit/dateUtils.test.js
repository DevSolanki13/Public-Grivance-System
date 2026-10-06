/**
 * UNIT TESTS: dateUtils.js
 * Tests all date parsing and formatting utilities used across all role dashboards.
 */
import { describe, it, expect } from 'vitest';
import { parseDate, formatDate, formatDateTime, formatTimeOnly } from '../../utils/dateUtils';

describe('parseDate', () => {
  it('returns null for null input', () => {
    expect(parseDate(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseDate(undefined)).toBeNull();
  });

  it('parses ISO string to a Date object', () => {
    const result = parseDate('2026-10-05T10:15:00.000Z');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2026);
  });

  it('parses a Firestore Timestamp-like object with seconds property', () => {
    const firestoreTs = { seconds: 1759660800 }; // 2025-10-05
    const result = parseDate(firestoreTs);
    expect(result).toBeInstanceOf(Date);
  });

  it('parses a Firestore object with toDate() method', () => {
    const mockFirestoreTs = {
      toDate: () => new Date('2026-10-05T00:00:00Z'),
    };
    const result = parseDate(mockFirestoreTs);
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2026);
  });

  it('passes through a Date instance unchanged', () => {
    const date = new Date('2026-10-05');
    expect(parseDate(date)).toEqual(date);
  });

  it('returns null for an invalid date string', () => {
    expect(parseDate('not-a-date')).toBeNull();
  });
});

describe('formatDate', () => {
  it('returns an em-dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('formats a valid ISO string into dd Mon yyyy format', () => {
    const formatted = formatDate('2026-10-05T00:00:00.000Z');
    // Result will include day, short month, and year (locale formatted)
    expect(formatted).not.toBe('—');
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/Oct/);
  });

  it('formats a Firestore-like seconds object', () => {
    const ts = { seconds: 1759574400 }; // Approx Oct 4 2025
    const result = formatDate(ts);
    expect(result).not.toBe('—');
  });
});

describe('formatDateTime', () => {
  it('returns an em-dash for null', () => {
    expect(formatDateTime(null)).toBe('—');
  });

  it('includes time (AM/PM) in the formatted output', () => {
    const result = formatDateTime('2026-10-05T10:30:00.000Z');
    expect(result).not.toBe('—');
    // Should contain AM or PM
    expect(result).toMatch(/am|pm|AM|PM/i);
  });
});

describe('formatTimeOnly', () => {
  it('returns an em-dash for null', () => {
    expect(formatTimeOnly(null)).toBe('—');
  });

  it('extracts time from a date string', () => {
    const result = formatTimeOnly('2026-10-05T10:30:00.000Z');
    expect(result).not.toBe('—');
    expect(result).toMatch(/am|pm|AM|PM/i);
  });
});
