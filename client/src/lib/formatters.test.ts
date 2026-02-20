import { describe, it, expect } from 'vitest';
import { formatDate, formatShortDate, formatFullDate, formatViewCount } from './formatters';

describe('formatDate', () => {
  it('formats date as "Month Day, Year"', () => {
    // Use noon UTC to avoid timezone edge cases
    expect(formatDate('2025-06-15T12:00:00.000Z')).toBe('June 15, 2025');
  });

  it('formats another date correctly', () => {
    expect(formatDate('2025-12-25T12:00:00.000Z')).toBe('December 25, 2025');
  });
});

describe('formatShortDate', () => {
  it('formats date with abbreviated month', () => {
    expect(formatShortDate('2025-06-15T12:00:00.000Z')).toBe('Jun 15, 2025');
  });

  it('formats another date correctly', () => {
    expect(formatShortDate('2025-12-25T12:00:00.000Z')).toBe('Dec 25, 2025');
  });
});

describe('formatFullDate', () => {
  it('includes weekday in the formatted date', () => {
    expect(formatFullDate('2025-06-15T12:00:00.000Z')).toBe('Sunday, June 15, 2025');
  });

  it('formats another date with weekday', () => {
    expect(formatFullDate('2025-12-25T12:00:00.000Z')).toBe('Thursday, December 25, 2025');
  });
});

describe('formatViewCount', () => {
  it('returns plain number for counts under 1000', () => {
    expect(formatViewCount(0)).toBe('0');
    expect(formatViewCount(999)).toBe('999');
  });

  it('formats 1000 as "1.0K"', () => {
    expect(formatViewCount(1000)).toBe('1.0K');
  });

  it('formats 1500 as "1.5K"', () => {
    expect(formatViewCount(1500)).toBe('1.5K');
  });

  it('formats larger thousands', () => {
    expect(formatViewCount(10000)).toBe('10.0K');
    expect(formatViewCount(25300)).toBe('25.3K');
  });

  it('formats millions as "M"', () => {
    expect(formatViewCount(1000000)).toBe('1.0M');
    expect(formatViewCount(2500000)).toBe('2.5M');
    expect(formatViewCount(10000000)).toBe('10.0M');
  });
});
