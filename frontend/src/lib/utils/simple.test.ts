import { describe, it, expect } from 'vitest';

// Simple test to verify testing framework works
describe('Testing Framework', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle strings', () => {
    expect('hello').toBe('hello');
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });
});
