import { beforeEach } from 'vitest';
import {
  TestElement,
  createTestEnvironment,
  TestKeyboardEvent,
  TestEvent,
} from './mock-dom';

let env = createTestEnvironment();

function applyEnvironment() {
  env = createTestEnvironment();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).document = env.document as unknown as Document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).window = env.window as unknown as Window & typeof globalThis;
  // Provide HTMLElement/Element bindings expected by the code under test.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).HTMLElement = TestElement as unknown as typeof HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Element = TestElement as unknown as typeof Element;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Node = TestElement as unknown as typeof Node;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).KeyboardEvent = TestKeyboardEvent as unknown as typeof KeyboardEvent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Event = TestEvent as unknown as typeof Event;

  // Polyfill animation frame APIs used by countUp.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).requestAnimationFrame = (callback: (time: number) => void) => {
    return setTimeout(() => callback(Date.now()), 16);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).cancelAnimationFrame = (handle: ReturnType<typeof setTimeout>) => {
    clearTimeout(handle);
  };

  // Mock IntersectionObserver for components that expect it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).IntersectionObserver = class IntersectionObserver {
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  };
}

applyEnvironment();

beforeEach(() => {
  applyEnvironment();
});
