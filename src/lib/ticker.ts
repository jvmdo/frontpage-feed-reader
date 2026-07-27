type Listener = () => void;

const TICKER_INTERVAL = 30000; // 30s

const listeners = new Set<Listener>();

let intervalId: ReturnType<typeof setInterval> | null = null;
let currentNow = Date.now();

function startTimer() {
  currentNow = Date.now();

  if (intervalId !== null) {
    return;
  }

  intervalId = setInterval(() => {
    currentNow = Date.now();
    listeners.forEach((listener) => {
      listener();
    });
  }, TICKER_INTERVAL);
}

function stopTimer() {
  if (listeners.size === 0 && intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * Subscribes a component to the global 30s ticker.
 * Starts timer on first subscriber and stops when all unmount.
 */
export function subscribeToTicker(listener: Listener) {
  listeners.add(listener);

  startTimer();

  return () => {
    listeners.delete(listener);
    stopTimer();
  };
}

/** Returns client timestamp on browser */
export function getTickerSnapshot() {
  return currentNow;
}

/** Static constant for SSR to ensure zero hydration mismatch */
export function getTickerServerSnapshot() {
  return 0;
}
