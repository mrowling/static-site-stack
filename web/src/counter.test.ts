import { describe, it, expect } from 'vitest';
import { setupCounter } from './counter';

// Basic DOM interaction test for setupCounter

describe('setupCounter', () => {
  it('initializes and increments counter on click', () => {
    const button = document.createElement('button');
    setupCounter(button);
    expect(button.innerHTML).toBe('count is 0');
    button.click();
    expect(button.innerHTML).toBe('count is 1');
    button.click();
    expect(button.innerHTML).toBe('count is 2');
  });
});
