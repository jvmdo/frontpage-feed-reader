import { vi } from "vitest";

let latestCallback: ((entries: any[]) => void) | null = null;

/**
 * A triggerable mock for IntersectionObserver that captures the callback
 * from the most recently created instance.
 */
export class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  
  constructor(callback: (entries: any[]) => void) {
    latestCallback = callback;
  }
}

/**
 * Simulates an intersection event for the latest IntersectionObserver instance.
 */
export function triggerIntersection(isIntersecting: boolean) {
  if (latestCallback) {
    latestCallback([{ isIntersecting }]);
  } else {
    console.warn("No IntersectionObserver instance found to trigger.");
  }
}

/**
 * Global setup for IntersectionObserver mock.
 */
export function setupIntersectionObserverMock() {
  window.IntersectionObserver = MockIntersectionObserver as any;
  latestCallback = null; // Reset between setups
}
