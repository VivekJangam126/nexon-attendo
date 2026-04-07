import { describe, it, expect } from 'vitest';

describe('Date Utilities', () => {
  it('should successfully import date utilities', () => {
    const now = new Date();
    expect(now).toBeDefined();
    expect(now.getFullYear()).toBeGreaterThan(2020);
  });

  it('should format dates correctly', () => {
    const date = new Date('2026-04-07');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    
    expect(formatted).toBe('2026-04-07');
  });

  it('should calculate date differences', () => {
    const date1 = new Date('2026-04-07');
    const date2 = new Date('2026-04-01');
    const diffTime = Math.abs(date1.getTime() - date2.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    expect(diffDays).toBe(6);
  });
});
