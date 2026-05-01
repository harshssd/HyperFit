import { useEffect, useMemo, useState } from 'react';
import { fetchWorkoutSessions } from '../../services/workoutService';
import type { DayOfWeek, UserWorkoutPlan } from '../../types/workout';

export type LoggedDay = {
  sessionId: string;
  name: string | null;
  date: string;          // YYYY-MM-DD
  totalSets: number;
  exerciseCount: number;
  status: string;
};

export type PlannedDay = {
  planSessionId: string;
  name: string;
  focus: string;
};

export type CalendarDay = {
  date: Date;
  iso: string;            // YYYY-MM-DD
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  logged: LoggedDay[];
  planned: PlannedDay[];
};

const DAY_KEY: DayOfWeek[] = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

const toIso = (d: Date) => {
  // Local-time YYYY-MM-DD. workout_sessions.workout_date is also a local
  // Postgres `date` column, so this matches without timezone gymnastics.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const startOfMonthGrid = (d: Date) => {
  const first = startOfMonth(d);
  const wd = first.getDay(); // 0=Sun
  // Grid starts on Monday — shift back to most recent Monday.
  const shift = wd === 0 ? 6 : wd - 1;
  return new Date(first.getFullYear(), first.getMonth(), 1 - shift);
};

/**
 * Build the 6-week grid for `month` and decorate each day with logged
 * workouts (from workout_sessions) and planned workouts (from the user's
 * active plan's plan_schedule). Past dates only carry `logged` entries;
 * today + future carry `planned`. Today gets both — what was logged and
 * what was planned, so the user can see if they hit it.
 */
export const useCalendarData = (
  userId: string | undefined,
  activePlan: UserWorkoutPlan | null | undefined,
  month: Date,
) => {
  const [logged, setLogged] = useState<LoggedDay[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setLogged([]); return; }
    let cancelled = false;
    setLoading(true);
    fetchWorkoutSessions(userId)
      .then((rows: any[]) => {
        if (cancelled) return;
        setLogged(rows.map((r) => ({
          sessionId: r.id,
          name: r.name,
          date: r.date,
          totalSets: r.total_sets ?? 0,
          exerciseCount: r.exercise_count ?? 0,
          status: r.status ?? 'completed',
        })));
      })
      .catch(() => { if (!cancelled) setLogged([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  // Build a lookup of date -> logged entries so the grid render is O(1) per cell.
  const loggedByDate = useMemo(() => {
    const map: Record<string, LoggedDay[]> = {};
    logged.forEach((l) => {
      const list = map[l.date] || (map[l.date] = []);
      list.push(l);
    });
    return map;
  }, [logged]);

  // Active plan's planned sessions per day-of-week.
  const plannedByDow = useMemo(() => {
    const map: Record<DayOfWeek, PlannedDay[]> = {
      monday: [], tuesday: [], wednesday: [], thursday: [],
      friday: [], saturday: [], sunday: [],
    };
    const plan = activePlan?.planData;
    if (!plan?.schedule) return map;
    const sessionLookup = new Map<string, { name: string; focus: string }>();
    (plan.sessions || []).forEach((s) =>
      sessionLookup.set(s.id, { name: s.name, focus: String(s.focus || '') }),
    );
    Object.entries(plan.schedule).forEach(([dow, scheduled]) => {
      (scheduled || []).forEach((sched: any) => {
        const meta = sessionLookup.get(sched.sessionId);
        if (!meta) return;
        map[dow as DayOfWeek].push({
          planSessionId: sched.sessionId,
          name: meta.name,
          focus: meta.focus,
        });
      });
    });
    return map;
  }, [activePlan]);

  const days: CalendarDay[] = useMemo(() => {
    const today = new Date();
    const todayIso = toIso(today);
    const start = startOfMonthGrid(month);
    const out: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const iso = toIso(d);
      const dow = DAY_KEY[d.getDay()];
      const isPast = iso < todayIso;
      out.push({
        date: d,
        iso,
        inMonth: d.getMonth() === month.getMonth(),
        isToday: iso === todayIso,
        isPast,
        logged: loggedByDate[iso] || [],
        // Future days show planned. Past days show only what was logged
        // (a planned-but-skipped is meaningless retroactively).
        planned: isPast ? [] : plannedByDow[dow] || [],
      });
    }
    return out;
  }, [month, loggedByDate, plannedByDow]);

  return { days, loading };
};
