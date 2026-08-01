import { describe, it, expect } from 'vitest';
import { formatPrice, formatDate, discountPercent, timeAgo } from '../lib/format';

describe('format helpers', () => {
  it('formats a price with symbol', () => {
    expect(formatPrice(12.5, 'USD', '$')).toBe('$12.50');
    expect(formatPrice(0, 'EUR', '€')).toBe('€0.00');
    expect(formatPrice(null)).toBe('$0.00');
  });

  it('calculates discount percentage', () => {
    expect(discountPercent(100, 75)).toBe(25);
    expect(discountPercent(100, 100)).toBe(0);
    expect(discountPercent(100, null)).toBe(0);
  });

  it('formats dates gracefully', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('2026-01-15T00:00:00Z')).toMatch(/2026/);
  });

  it('returns a relative time string', () => {
    expect(timeAgo(null)).toBe('—');
    expect(timeAgo(new Date(Date.now() - 5000).toISOString())).toBe('just now');
  });
});
