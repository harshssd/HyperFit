/**
 * Regression coverage for the date-bucket bug:
 *   useNutritionDay used to freeze the day at first mount via
 *   `useState(() => todayLocalISO())`. App opened yesterday and left
 *   running across midnight kept writing every meal/water/cheat-toggle
 *   to yesterday's bucket.
 *
 * useLocalToday now refreshes via AppState 'active' transitions + a
 * 60s interval. These tests exercise both paths.
 */
import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useLocalToday } from '../useLocalToday';

// Drive the hook's notion of "today" without poking the system clock.
// nutritionService.todayLocalISO() reads new Date().getDate/Month/Year,
// so manipulating the Date constructor is the cleanest fake.
const setSystemDate = (iso: string) => {
  jest.setSystemTime(new Date(`${iso}T12:00:00`));
};

describe('useLocalToday', () => {
  // Capture and replay the AppState 'change' subscription so tests can
  // simulate a foreground transition without booting RN's event loop.
  let appStateListener: ((state: string) => void) | null = null;
  let removeSpy: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    setSystemDate('2026-05-05');
    appStateListener = null;
    removeSpy = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((event, cb) => {
      if (event === 'change') appStateListener = cb as (s: string) => void;
      return { remove: removeSpy } as any;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns todayLocalISO at first render', () => {
    const { result } = renderHook(() => useLocalToday());
    expect(result.current).toBe('2026-05-05');
  });

  it('rolls forward when AppState fires "active" after midnight', () => {
    const { result } = renderHook(() => useLocalToday());
    expect(result.current).toBe('2026-05-05');

    // Simulate the app being backgrounded across midnight.
    setSystemDate('2026-05-06');
    act(() => {
      appStateListener?.('active');
    });

    expect(result.current).toBe('2026-05-06');
  });

  it('rolls forward via the 60s interval while foregrounded', () => {
    const { result } = renderHook(() => useLocalToday());
    expect(result.current).toBe('2026-05-05');

    // App stays open past midnight, no AppState transition fires.
    setSystemDate('2026-05-06');
    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current).toBe('2026-05-06');
  });

  it('does not re-render when the date is unchanged', () => {
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      return useLocalToday();
    });
    const initialRenders = renderCount;

    // Multiple AppState 'active' events on the same calendar day.
    act(() => {
      appStateListener?.('active');
      appStateListener?.('active');
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current).toBe('2026-05-05');
    // setDate's functional setter bails when prev === next, so React
    // skips the re-render. If this asserts > initialRenders we've
    // regressed the idempotency guarantee.
    expect(renderCount).toBe(initialRenders);
  });

  it('cleans up listener and interval on unmount', () => {
    const { unmount } = renderHook(() => useLocalToday());
    const clearSpy = jest.spyOn(global, 'clearInterval');

    unmount();

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalled();
  });
});
