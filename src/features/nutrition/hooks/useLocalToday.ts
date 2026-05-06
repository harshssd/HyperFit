import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { todayLocalISO } from '../../../utils/localDate';

/**
 * useLocalToday — returns today's local-ISO date (YYYY-MM-DD), refreshed
 * whenever the app foregrounds and once a minute while it stays open.
 *
 * Why this exists: a naive `useState(() => todayLocalISO())` freezes the
 * value at first mount. An app opened yesterday and left running across
 * midnight kept writing every action to yesterday's bucket while the UI
 * thought it was today. Caused real production data corruption (logged
 * water + meals against the wrong day).
 *
 * Two refresh paths:
 *  - AppState 'active' transitions catch the common case (background ->
 *    foreground after midnight)
 *  - 60 s interval catches the rare case (phone on charger, app open
 *    across midnight). 60 s is the worst-case stale window.
 *
 * Both paths converge through the same idempotent setter that bails
 * out when the value hasn't changed, so paired triggers don't cause
 * duplicate re-renders.
 */
export const useLocalToday = (): string => {
  const [today, setToday] = useState<string>(() => todayLocalISO());

  useEffect(() => {
    const sync = () => {
      const next = todayLocalISO();
      setToday(prev => (prev === next ? prev : next));
    };
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') sync();
    });
    const interval = setInterval(sync, 60_000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, []);

  return today;
};
