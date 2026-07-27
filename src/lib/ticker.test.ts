import {
  getTickerServerSnapshot,
  getTickerSnapshot,
  subscribeToTicker,
} from "./ticker";

describe("ticker store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 for SSR snapshot", () => {
    expect(getTickerServerSnapshot()).toBe(0);
  });

  it("starts timer on first subscription and notifies listeners on 30s tick", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToTicker(listener);

    const initialTime = getTickerSnapshot();

    vi.advanceTimersByTime(30_000);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getTickerSnapshot()).toBeGreaterThanOrEqual(initialTime + 30_000);

    unsubscribe();
  });

  it("notifies multiple subscribers on the same tick", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    const unsubA = subscribeToTicker(listenerA);
    const unsubB = subscribeToTicker(listenerB);

    vi.advanceTimersByTime(30_000);

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);

    unsubA();
    unsubB();
  });

  it("stops the interval when all subscribers unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToTicker(listener);

    unsubscribe();

    vi.advanceTimersByTime(30_000);
    expect(listener).not.toHaveBeenCalled();
  });
});
