import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FocusTrap, announceToScreenReader, prefersReducedMotion } from '../src/lib/a11y';
import { countUp, easing } from '../src/lib/observe';

type RateLimitScenario = {
  count: number;
  countError: Error | null;
  latest: { data: { created_at: string } | null; error: Error | null };
  oldest: { data: { created_at: string } | null; error: Error | null };
};

const rateLimitScenario: RateLimitScenario = {
  count: 0,
  countError: null,
  latest: { data: null, error: null },
  oldest: { data: null, error: null },
};

class MockQuery {
  private selectArgs: { columns: string; options?: Record<string, unknown> } | null = null;
  private orderArgs: { ascending?: boolean } | null = null;
  private useMaybeSingle = false;

  select(columns: string, options?: Record<string, unknown>) {
    this.selectArgs = { columns, options };
    return this;
  }

  eq() {
    return this;
  }

  gte() {
    return this;
  }

  order(_column: string, options: { ascending?: boolean }) {
    this.orderArgs = options;
    return this;
  }

  limit() {
    return this;
  }

  maybeSingle() {
    this.useMaybeSingle = true;
    return this;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    try {
      const result = this.execute();
      if (onfulfilled) {
        return Promise.resolve(onfulfilled(result));
      }
      return Promise.resolve(result) as unknown as Promise<TResult1>;
    } catch (error) {
      if (onrejected) {
        return Promise.resolve(onrejected(error));
      }
      return Promise.reject(error) as unknown as Promise<TResult2>;
    }
  }

  private execute() {
    if (this.selectArgs?.options?.count === 'exact') {
      if (rateLimitScenario.countError) {
        throw rateLimitScenario.countError;
      }
      return { count: rateLimitScenario.count, error: null };
    }

    if (this.useMaybeSingle) {
      const target = this.orderArgs?.ascending === false ? rateLimitScenario.latest : rateLimitScenario.oldest;
      if (!target) {
        return { data: null, error: null };
      }
      if (target.error) {
        throw target.error;
      }
      return target;
    }

    return { data: null, error: null };
  }
}

vi.mock('@/lib/supabase/service', () => {
  return {
    createSupabaseServiceClient: vi.fn(() => ({
      schema: vi.fn(() => ({
        from: vi.fn(() => new MockQuery()),
      })),
    })),
  };
});

const { checkRateLimit } = await import('../src/lib/rate-limit');

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

function resetRateLimitScenario() {
  rateLimitScenario.count = 0;
  rateLimitScenario.countError = null;
  rateLimitScenario.latest = { data: null, error: null };
  rateLimitScenario.oldest = { data: null, error: null };
}

describe('Rate limit helper', () => {
  beforeEach(() => {
    resetRateLimitScenario();
  });

  it('allows activity when under the limit', async () => {
    rateLimitScenario.count = 1;

    const result = await checkRateLimit({ profileId: 'profile-1', type: 'idea', limit: 5 });

    expect(result).toEqual({ allowed: true, retryInMs: 0 });
  });

  it('surfaces retry window when limit exceeded', async () => {
    rateLimitScenario.count = 5;
    rateLimitScenario.oldest = {
      data: { created_at: new Date(Date.now() - 120000).toISOString() },
      error: null,
    };

    const result = await checkRateLimit({ profileId: 'profile-2', type: 'comment', limit: 2 });

    expect(result.allowed).toBe(false);
    expect(result.retryInMs).toBeGreaterThan(0);
  });

  it('applies cooldown windows', async () => {
    rateLimitScenario.count = 0;
    rateLimitScenario.latest = {
      data: { created_at: new Date(Date.now() - 15000).toISOString() },
      error: null,
    };

    const result = await checkRateLimit({ profileId: 'profile-3', type: 'flag', limit: 5, cooldownMs: 60000 });

    expect(result.allowed).toBe(false);
    expect(result.retryInMs).toBeGreaterThanOrEqual(45000);
  });
});
