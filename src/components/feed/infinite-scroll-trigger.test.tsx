import { vi } from "vitest";
import {
  setupIntersectionObserverMock,
  triggerIntersection,
} from "@/tests/intersection-observer";
import { render } from "@/tests/rtl-utils";
import { InfiniteScrollTrigger } from "./infinite-scroll-trigger";

describe("InfiniteScrollTrigger", () => {
  beforeEach(() => {
    setupIntersectionObserverMock();
  });

  test("calls onIntersect when the trigger enters the viewport", () => {
    const onIntersect = vi.fn();
    render(<InfiniteScrollTrigger onIntersect={onIntersect} />);

    // Trigger intersection
    triggerIntersection(true);

    expect(onIntersect).toHaveBeenCalledTimes(1);
  });

  test("does not call onIntersect when it's not intersecting", () => {
    const onIntersect = vi.fn();
    render(<InfiniteScrollTrigger onIntersect={onIntersect} />);

    // Trigger non-intersection
    triggerIntersection(false);

    expect(onIntersect).not.toHaveBeenCalled();
  });

  test("does not call onIntersect when disabled", () => {
    const onIntersect = vi.fn();
    render(<InfiniteScrollTrigger onIntersect={onIntersect} enabled={false} />);

    // Even if we force a trigger, the component logic should prevent the call
    // (though in reality the observer wouldn't even be attached)
    triggerIntersection(true);

    expect(onIntersect).not.toHaveBeenCalled();
  });
});
