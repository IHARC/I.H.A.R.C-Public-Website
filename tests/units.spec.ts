import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase';
import { FocusTrap, announceToScreenReader, prefersReducedMotion } from '../src/lib/a11y';
import { countUp, easing } from '../src/lib/observe';
import { checkRateLimit } from '../src/lib/rate-limit';

describe('Accessibility Utilities', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <button id="first">First</button>
      <input id="second" />
      <a href="#" id="third">Third</a>
    `;
    document.body.appendChild(container);
  });

  describe('FocusTrap', () => {
    it('should trap focus within container', () => {
      const focusTrap = new FocusTrap(container);
      
      focusTrap.activate();
      expect(document.activeElement?.id).toBe('first');
    });

    it('should handle escape key when configured', () => {
      const focusTrap = new FocusTrap(container, { escapeDeactivates: true });
      const deactivateSpy = vi.spyOn(focusTrap, 'deactivate');
      
      focusTrap.activate();
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      
      expect(deactivateSpy).toHaveBeenCalled();
    });
  });

  describe('announceToScreenReader', () => {
    it('should create and remove announcement element', async () => {
      announceToScreenReader('Test message');
      
      // Wait for the element to be created
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const announcer = document.querySelector('[aria-live]');
      expect(announcer).toBeTruthy();
      expect(announcer?.textContent).toBe('Test message');
      
      // Wait for cleanup and verify element is removed
      await new Promise(resolve => setTimeout(resolve, 1200));
      const cleanedAnnouncer = document.querySelector('[aria-live]');
      expect(cleanedAnnouncer).toBeFalsy();
    });
  });

  describe('prefersReducedMotion', () => {
    it('should return false when motion is not reduced', () => {
      // Mock matchMedia to return false
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
      }));
      
      expect(prefersReducedMotion()).toBe(false);
    });

    it('should return true when motion is reduced', () => {
      // Mock matchMedia to return true for reduced motion
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      }));
      
      expect(prefersReducedMotion()).toBe(true);
    });
  });
});

describe('Observer Utilities', () => {
  describe('easing functions', () => {
    it('should return correct values for linear easing', () => {
      expect(easing.linear(0)).toBe(0);
      expect(easing.linear(0.5)).toBe(0.5);
      expect(easing.linear(1)).toBe(1);
    });

    it('should return correct values for easeOut', () => {
      expect(easing.easeOut(0)).toBe(0);
      expect(easing.easeOut(1)).toBe(1);
      expect(easing.easeOut(0.5)).toBeGreaterThan(0.5);
    });
  });

  describe('countUp', () => {
    it('should be a function', () => {
      expect(typeof countUp).toBe('function');
    });

    it('should resolve promise', async () => {
      // Simple test to verify the function exists and returns a promise
      const promise = countUp(10, { duration: 1 });
      expect(promise).toBeInstanceOf(Promise);
      await promise; // Just verify it resolves
    });
  });
});

describe('Rate limit helper', () => {
  const mockRpc = vi.fn();
  const mockSupabase = { rpc: mockRpc } as unknown as SupabaseClient<Database>;

  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('allows activity when under the limit', async () => {
    mockRpc.mockResolvedValue({ data: [{ allowed: true, retry_in_ms: 0 }], error: null });

    const result = await checkRateLimit({ supabase: mockSupabase, type: 'idea', limit: 5 });

    expect(result).toEqual({ allowed: true, retryInMs: 0 });
    expect(mockRpc).toHaveBeenCalledWith('portal_check_rate_limit', {
      p_event: 'idea',
      p_limit: 5,
      p_cooldown_ms: null,
    });
  });

  it('surfaces retry window when limit exceeded', async () => {
    mockRpc.mockResolvedValue({ data: [{ allowed: false, retry_in_ms: 45000 }], error: null });

    const result = await checkRateLimit({ supabase: mockSupabase, type: 'comment', limit: 2 });

    expect(result.allowed).toBe(false);
    expect(result.retryInMs).toBeGreaterThan(0);
  });

  it('applies cooldown windows', async () => {
    mockRpc.mockResolvedValue({ data: [{ allowed: false, retry_in_ms: 55000 }], error: null });

    const result = await checkRateLimit({ supabase: mockSupabase, type: 'flag', limit: 5, cooldownMs: 60000 });

    expect(result.allowed).toBe(false);
    expect(result.retryInMs).toBeGreaterThanOrEqual(45000);
  });
});
