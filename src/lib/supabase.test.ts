import { describe, it, expect } from 'vitest';
import { supabase } from './supabase';

describe('Supabase Client', () => {
  it('should be initialized', () => {
    expect(supabase).toBeDefined();
  });

  it('should have auth method', () => {
    expect(supabase.auth).toBeDefined();
  });

  it('should have from method for table access', () => {
    expect(supabase.from).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  it('should have realtime method', () => {
    expect(supabase.realtime).toBeDefined();
  });
});
