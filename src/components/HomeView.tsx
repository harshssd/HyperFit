import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { HeroGradient } from './HeroGradient';
import {
  ChevronRight,
  Droplet,
  Flame,
  Salad,
  Activity,
} from 'lucide-react-native';
import { homeStyles } from '../styles';
import { palette, text, accent, spacing, radii, fonts } from '../styles/theme';
import { UserData } from '../types/workout';
import { useUser } from '../contexts/UserContext';
import { useNutritionDayContext } from '../features/nutrition/hooks/useNutritionDay';
import { formatKcal, heroEyebrow } from '../features/nutrition/helpers';
import { useRecentVolume } from '../features/history/hooks/useRecentVolume';
import { useMuscleVolume } from '../features/analytics/heatmap/useMuscleVolume';
import { MiniSilhouette } from '../features/analytics/heatmap/MiniSilhouette';
import {
  getWorkoutForDate,
  getUpcomingWorkouts,
} from '../features/workout/helpers';
import type { MuscleId } from '../features/analytics/heatmap/muscleRegions';

type HomeViewProps = {
  data: UserData;
  onChangeView: (view: string) => void;
  streak?: number;
  xp?: number;
  /** Open the History + Analytics modal — wired from the Body+Week card. */
  onOpenHistory?: () => void;
};

const FIBER_COLOR = '#4fb3a8';
const CHEAT_BORDER = '#a855f7';

// Coarse bodypart → MuscleId region buckets. Used by the body card to spell
// out worked vs cold groups in plain English ("CHEST · LEGS hit, BACK cold").
// Keeps the verdict copy reading like a coach, not a database row.
const BODYPART_BUCKETS: Record<string, MuscleId[]> = {
  CHEST: ['chest'],
  BACK: ['lats', 'mid_back', 'lower_back', 'traps'],
  SHOULDERS: ['front_delts', 'side_delts', 'rear_delts'],
  ARMS: ['biceps', 'triceps', 'forearms'],
  CORE: ['abs', 'obliques'],
  LEGS: ['quads', 'hamstrings', 'calves', 'glutes', 'adductors'],
};

// Build the worked / cold verdict line. Hit = avg intensity > 0.25 across
// the bucket's regions; cold = no region in the bucket has any signal.
// Plain text falls back to a neutral sentence when the user has zero
// workouts in the window so the surface still reads like something.
const muscleVerdict = (intensities: Partial<Record<MuscleId, number>>): string => {
  const hit: string[] = [];
  const cold: string[] = [];
  for (const [name, regions] of Object.entries(BODYPART_BUCKETS)) {
    const vals = regions.map(r => intensities[r] ?? 0);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg > 0.25 || max > 0.5) hit.push(name);
    else if (max === 0) cold.push(name);
  }
  if (hit.length === 0) return 'No sessions this week — get back in';
  const hitStr = `${hit.slice(0, 3).join(' · ')} hit`;
  const coldStr = cold.length > 0 ? ` · ${cold[0]} cold` : '';
  return `${hitStr}${coldStr}`;
};

const localDayISO = (offset: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Day-of-week labels for the 7-day streak strip. Sunday-first to match
// gymLogs ISO date math + JS Date.getDay().
const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * HomeView — verdict-first dashboard. Three stacked surfaces, top-down:
 *
 *   1. Hero ribbon — date eyebrow + a one-line verdict driven by the active
 *      plan's state ("READY TO LIFT" / "REST DAY" / "PICK A PLAN") + 14-day
 *      volume sparkline + week-over-week delta + this-week mini silhouette
 *      in the corner. Radial orange wash + linear bottom-fade matches the
 *      GymView hero spec in DESIGN.md.
 *   2. Nutrition glance — kcal + macro pills + water progress. Read-only;
 *      tap → Nutrition tab. Border tints orange only when status is over
 *      or cheat (signal, not wallpaper).
 *   3. Body + week — large silhouette of this week's worked muscles + a
 *      verdict sentence ("CHEST · LEGS hit, BACK cold") + 7 day-of-week
 *      dots showing logged sessions + streak count. Tap → History modal.
 *
 * No action controls live here. Workout actions live on the Workout tab,
 * nutrition actions live on the Nutrition tab. Each tab has one job.
 */

const HomeView = ({ data, onChangeView, onOpenHistory }: HomeViewProps) => {
  const { user } = useUser();
  const dayCtx = useNutritionDayContext();
  const volume = useRecentVolume(user?.id, 14);
  const muscle = useMuscleVolume(user?.id, 7);

  const today = new Date();
  const activePlan = data.userWorkoutPlans?.find(p => p.isActive);
  const todaysWorkout = getWorkoutForDate(today, [], activePlan);
  const upcoming = getUpcomingWorkouts(activePlan, 1, 1)[0];
  // Completed-today detection: getWorkoutForDate's recentWorkouts arg isn't
  // available on UserData (only gymLogs), so check the date list directly.
  // Without this the "DONE TODAY" branch below was unreachable.
  const completedToday = data.gymLogs?.includes(localDayISO(0)) ?? false;

  // Verdict line — picks one of five states from plan + today + upcoming.
  // Kept terse on purpose: dashboard verdicts read better as 2-3 word
  // statements than as full sentences.
  const verdict: {
    eyebrowColor: string;
    eyebrowLabel: string;
    line: string;
    sub: string;
  } = (() => {
    if (activePlan && completedToday) {
      const next = upcoming ? ` · next: ${upcoming.name}` : '';
      const label = todaysWorkout?.type === 'completed' ? todaysWorkout.name : "Today's session";
      return {
        eyebrowColor: accent.sessionUp,
        eyebrowLabel: 'DONE',
        line: 'DONE TODAY',
        sub: `${label} logged${next}`,
      };
    }
    if (activePlan && todaysWorkout?.type === 'planned') {
      return {
        eyebrowColor: accent.lift,
        eyebrowLabel: 'READY',
        line: 'READY TO LIFT',
        sub: `Today: ${todaysWorkout.name}`,
      };
    }
    if (activePlan) {
      const next = upcoming ? `Next: ${upcoming.name}` : 'Active recovery recommended';
      return {
        eyebrowColor: text.secondary,
        eyebrowLabel: 'REST',
        line: 'REST DAY',
        sub: next,
      };
    }
    if ((data.gymLogs?.length ?? 0) > 0) {
      return {
        eyebrowColor: accent.lift,
        eyebrowLabel: 'NEXT STEP',
        line: 'PICK A PLAN',
        sub: 'Or jump into a custom workout from Gym',
      };
    }
    return {
      eyebrowColor: accent.lift,
      eyebrowLabel: 'WELCOME',
      line: "LET'S START",
      sub: 'Pick a starter plan in the Workout tab',
    };
  })();

  const Eyebrow = ({
    children,
    color = text.quaternary,
  }: {
    children: React.ReactNode;
    color?: string;
  }) => (
    <Text
      style={{
        color,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.6,
        fontFamily: fonts.family.mono,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );

  const renderHero = () => {
    const dateEyebrow = today
      .toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit' })
      .toUpperCase()
      .replace(/,/g, ' ·');

    return (
      <View
        testID="home-hero"
        style={{
          marginBottom: spacing.xl,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: palette.borderStrong,
          borderTopWidth: 2,
          borderTopColor: palette.liftActive,
          backgroundColor: palette.surface,
          overflow: 'hidden',
        }}
      >
        <HeroGradient />
        <View style={{ padding: spacing.xl, gap: spacing.md, minHeight: 200 }}>
          {/* Eyebrow row: date on the left, mini silhouette on the right */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Eyebrow color={text.tertiary}>{dateEyebrow}</Eyebrow>
              <Eyebrow color={verdict.eyebrowColor}>{verdict.eyebrowLabel}</Eyebrow>
            </View>
            <MiniSilhouette intensities={muscle.intensities} size={36} />
          </View>

          {/* Verdict line — the thing your eye lands on. */}
          <View style={{ gap: 4 }}>
            <Text
              style={{
                color: text.primary,
                fontSize: 30,
                fontFamily: fonts.family.black,
                letterSpacing: -0.6,
              }}
              numberOfLines={1}
            >
              {verdict.line}
            </Text>
            <Text style={{ color: text.secondary, fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
              {verdict.sub}
            </Text>
          </View>

          {/* Trajectory: 14-day sparkline + week-over-week delta. The
              sparkline IS the proof that the verdict is honest — empty
              renders as a flat baseline so the row never collapses. */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginTop: spacing.xs }}>
            <View style={{ flex: 1 }}>
              <VolumeSparkline points={volume.points} trend={volume.trend} />
            </View>
            <DeltaReadout deltaPct={volume.deltaPct} trend={volume.trend} thisWeek={volume.thisWeek} />
          </View>
        </View>
      </View>
    );
  };

  // First-action CTA — only renders for brand-new users (zero workouts
  // logged AND no active plan). The hero verdict already says "LET'S
  // START / Pick a starter plan in the Workout tab", but pure prose with
  // no tappable affordance reads like a broken empty state. This adds the
  // missing button so launch-traffic users have a single obvious next
  // tap. Auto-disappears once the user logs anything (since the verdict
  // flips out of the welcome branch).
  const renderFirstActionCTA = () => {
    const noLogs = (data.gymLogs?.length ?? 0) === 0;
    const noPlan = !activePlan;
    if (!noLogs || !noPlan) return null;
    return (
      <TouchableOpacity
        testID="home-first-action-cta"
        onPress={() => onChangeView('gym')}
        accessibilityRole="button"
        accessibilityLabel="Pick a starter plan"
        activeOpacity={0.85}
        style={{
          marginBottom: spacing.xl,
          paddingVertical: spacing.lg + 2,
          borderRadius: radii.lg,
          backgroundColor: accent.lift,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: palette.bg,
            fontFamily: fonts.family.mono,
            fontWeight: fonts.weight.black as '900',
            fontSize: 13,
            letterSpacing: 1.6,
          }}
        >
          PICK YOUR FIRST PLAN →
        </Text>
        <Text
          style={{
            color: 'rgba(10, 10, 10, 0.7)',
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          }}
        >
          Or hit the Workout tab to log a one-off session
        </Text>
      </TouchableOpacity>
    );
  };

  // Nutrition glance — read-only. Tap opens the Nutrition tab where the
  // logging controls live. Border tints orange only when status is over
  // (or purple on cheat day) — neutral otherwise so orange stays signal.
  const renderNutritionGlance = () => {
    const isCheat = dayCtx.summary?.is_cheat_day ?? false;
    const status = dayCtx.summary?.status ?? 'empty';
    const eyebrow = heroEyebrow(status, isCheat, dayCtx.hasGoal);
    // Per design audit: orange-on-everything is wallpaper. Reserve the
    // tinted border for states that actually mean something — over budget
    // or cheat day. On-track / under / no-goal stay neutral.
    const surfaceBorder = isCheat
      ? CHEAT_BORDER
      : status === 'over'
        ? accent.lift
        : palette.borderStrong;
    const eyebrowColor = isCheat
      ? CHEAT_BORDER
      : status === 'over'
        ? accent.lift
        : dayCtx.hasGoal
          ? text.tertiary
          : text.quaternary;

    const kcalTarget    = dayCtx.settings?.kcal_target      ?? 2200;
    const proteinTarget = dayCtx.settings?.protein_target_g ?? 160;
    const carbTarget    = dayCtx.settings?.carb_target_g    ?? 250;
    const fatTarget     = dayCtx.settings?.fat_target_g     ?? 70;
    const fiberTarget   = dayCtx.settings?.fiber_target_g   ?? 30;
    const waterTarget   = dayCtx.settings?.water_target_ml  ?? 2000;

    const kcalCurrent    = dayCtx.summary?.kcal_total      ?? 0;
    const proteinCurrent = dayCtx.summary?.protein_total_g ?? 0;
    const carbCurrent    = dayCtx.summary?.carb_total_g    ?? 0;
    const fatCurrent     = dayCtx.summary?.fat_total_g     ?? 0;
    const fiberCurrent   = dayCtx.summary?.fiber_total_g   ?? 0;
    const waterCurrent   = dayCtx.summary?.water_total_ml  ?? 0;

    return (
      <TouchableOpacity
        testID="home-nutrition"
        onPress={() => onChangeView('nutrition')}
        accessibilityRole="button"
        accessibilityLabel="Open nutrition tab to log meals and water"
        activeOpacity={0.85}
        style={{
          marginBottom: spacing.xl,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: surfaceBorder,
          backgroundColor: palette.surface,
          overflow: 'hidden',
        }}
      >
        <HeroGradient tint="green" />
        <View style={{ padding: spacing.xl }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingBottom: spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: palette.borderStrong,
              marginBottom: spacing.lg,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: radii.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: palette.surfaceAlt,
                borderWidth: 1,
                borderColor: palette.borderStrong,
              }}
            >
              <Salad size={16} color={text.secondary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
              <Text
                style={{
                  color: text.primary,
                  fontSize: 22,
                  fontWeight: '900',
                  letterSpacing: -0.4,
                  marginTop: 2,
                  fontVariant: fonts.tabularNums,
                }}
                numberOfLines={1}
              >
                {formatKcal(kcalCurrent)}
                <Text style={{ color: text.quaternary, fontWeight: '700', fontSize: 16 }}>
                  {' / '}{dayCtx.hasGoal ? formatKcal(kcalTarget) : '—'} kcal
                </Text>
              </Text>
            </View>
            <ChevronRight size={16} color={text.tertiary} />
          </View>

          {dayCtx.hasGoal ? (
            <>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: spacing.lg }}>
                <MacroPill label="Protein" current={proteinCurrent} target={proteinTarget} color={accent.lift} />
                <MacroPill label="Carbs"   current={carbCurrent}    target={carbTarget}    color={accent.sessionUp} />
                <MacroPill label="Fat"     current={fatCurrent}     target={fatTarget}     color={text.tertiary} />
                <MacroPill label="Fiber"   current={fiberCurrent}   target={fiberTarget}   color={FIBER_COLOR} />
              </View>

              {/* Water row — matched to the macro pill treatment so the
                  whole nutrition surface reads as one rhythm. Previous
                  version had a heavier bar height that fought the macros. */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Droplet size={12} color={accent.sessionUp} />
                <View
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: palette.borderStrong,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      // Guard against waterTarget=0 — settings allows it, and
                      // 0 division yields Infinity which RN renders as 100%
                      // (or a layout warning). Treat as no progress.
                      width: `${waterTarget > 0 ? Math.min(100, (waterCurrent / waterTarget) * 100) : 0}%`,
                      height: '100%',
                      backgroundColor: accent.sessionUp,
                    }}
                  />
                </View>
                <Text
                  style={{
                    color: text.quaternary,
                    fontFamily: fonts.family.mono,
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 1.2,
                    fontVariant: fonts.tabularNums,
                    textTransform: 'uppercase',
                  }}
                >
                  {(Math.round(waterCurrent / 100) / 10).toFixed(1)}L / {(Math.round(waterTarget / 100) / 10).toFixed(1)}L
                </Text>
              </View>
            </>
          ) : (
            <Placeholder
              label="Set a nutrition goal"
              hint="Tap to pick kcal + macro targets in the Nutrition tab"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Body + week — replaces the 3 numeric tiles. Big silhouette of this
  // week's worked muscles, verdict sentence, 7 day-of-week dots, streak
  // number with trend glyph. Whole card → opens History modal.
  const renderBodyWeek = () => {
    const streak = data.gymLogs?.length ?? 0;
    // Build the 7 day-of-week dots — Sunday-first to match Date.getDay().
    // Walk back 6 days from today, mark each filled if its ISO date is in
    // gymLogs. The trailing entry is always today.
    const today0 = new Date();
    const weekStart0 = new Date(today0);
    // Anchor on the most recent Sunday so the strip always reads as a
    // calendar week, not the trailing 7 days. (Saturday→Sunday rollover
    // resets the strip — matches how people think about "this week.")
    weekStart0.setDate(today0.getDate() - today0.getDay());
    // Nutrition-logged days (entries OR water) keyed by ISO. Drives the
    // green tick under each workout dot and the weekly nutrition summary.
    const nutritionByISO = new Map(
      (dayCtx.recentSummaries ?? []).map(s => [
        s.date,
        {
          logged: (s.entry_count ?? 0) > 0 || (s.water_total_ml ?? 0) > 0,
          kcal: s.kcal_total ?? 0,
          entries: s.entry_count ?? 0,
        },
      ]),
    );
    let nutritionEntriesThisWeek = 0;
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart0);
      d.setDate(weekStart0.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const nutr = nutritionByISO.get(iso);
      nutritionEntriesThisWeek += nutr?.entries ?? 0;
      return {
        label: DOW_LABELS[d.getDay()],
        logged: data.gymLogs?.includes(iso) ?? false,
        nutritionLogged: nutr?.logged ?? false,
        isToday: iso === localDayISO(0),
      };
    });
    const nutritionDaysThisWeek = days.filter(d => d.nutritionLogged).length;
    const hasAny = streak > 0 || nutritionDaysThisWeek > 0;

    const trendGlyph = volume.trend === 'up' ? '▲' : volume.trend === 'down' ? '▼' : volume.trend === 'flat' ? '·' : '·';
    const trendColor = volume.trend === 'up' ? accent.sessionUp : volume.trend === 'down' ? accent.regression : text.quaternary;

    return (
      <TouchableOpacity
        testID="home-body-week"
        onPress={() => onOpenHistory?.()}
        accessibilityRole="button"
        accessibilityLabel="Open history and analytics"
        activeOpacity={0.85}
        style={{
          marginBottom: spacing.xl,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: palette.borderStrong,
          backgroundColor: palette.surface,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: palette.borderStrong,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: radii.sm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.surfaceAlt,
              borderWidth: 1,
              borderColor: palette.borderStrong,
            }}
          >
            <Activity size={14} color={text.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow>This Week</Eyebrow>
            <Text style={{ color: text.primary, fontSize: 14, fontWeight: '800', marginTop: 2 }}>
              View history
            </Text>
          </View>
          <ChevronRight size={16} color={text.tertiary} />
        </View>

        {hasAny ? (
          <View style={{ padding: spacing.lg, gap: spacing.lg }}>
            {/* Body + verdict row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <MiniSilhouette intensities={muscle.intensities} size={64} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{
                    color: text.primary,
                    fontSize: 14,
                    fontWeight: '800',
                    letterSpacing: -0.2,
                  }}
                >
                  {muscleVerdict(muscle.intensities)}
                </Text>
                <Eyebrow>{muscle.setCount} sets · 7d</Eyebrow>
              </View>
            </View>

            {/* Nutrition mini-summary — parallel signal to the workout verdict.
                Counts logged days + total entries this week. */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingTop: spacing.md,
                borderTopWidth: 1,
                borderTopColor: palette.borderStrong,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: radii.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: palette.surfaceAlt,
                  borderWidth: 1,
                  borderColor: palette.borderStrong,
                }}
              >
                <Salad size={14} color={accent.sessionUp} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    color: text.primary,
                    fontSize: 14,
                    fontWeight: '800',
                    letterSpacing: -0.2,
                  }}
                >
                  {nutritionDaysThisWeek > 0
                    ? `Fueled ${nutritionDaysThisWeek} of 7 days`
                    : 'No fuel logged this week'}
                </Text>
                <Eyebrow>
                  {nutritionEntriesThisWeek} {nutritionEntriesThisWeek === 1 ? 'entry' : 'entries'} · 7d
                </Eyebrow>
              </View>
            </View>

            {/* Streak row — 7 day-of-week dots + count + trend glyph */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
                {days.map((d, i) => (
                  <View key={i} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
                    {/* Workout dot (orange) — top */}
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: d.logged ? accent.lift : 'transparent',
                        borderWidth: 1,
                        borderColor: d.logged ? accent.lift : palette.borderStrong,
                      }}
                    />
                    {/* Nutrition dot (green) — below; tracks meals/water logged */}
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: d.nutritionLogged ? accent.sessionUp : 'transparent',
                        borderWidth: 1,
                        borderColor: d.nutritionLogged ? accent.sessionUp : palette.borderStrong,
                      }}
                    />
                    <Text
                      style={{
                        color: d.isToday ? text.primary : text.quaternary,
                        fontFamily: fonts.family.mono,
                        fontSize: 9,
                        fontWeight: d.isToday ? '900' : '700',
                        letterSpacing: 0.4,
                      }}
                    >
                      {d.label}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Flame size={14} color={accent.lift} />
                <Text
                  testID="home-streak-value"
                  style={{
                    color: text.primary,
                    fontSize: 16,
                    fontWeight: '900',
                    fontVariant: fonts.tabularNums,
                  }}
                >
                  {streak}
                </Text>
                <Text style={{ color: trendColor, fontSize: 11, fontWeight: '900', marginLeft: 2 }}>
                  {trendGlyph}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ padding: spacing.lg }}>
            <Placeholder
              label="Log your first workout or meal"
              hint="Lift in the Workout tab or log a meal in Fuel — your week shows up here once you do"
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={homeStyles.homeView} contentContainerStyle={homeStyles.homeViewContent}>
      {renderHero()}
      {renderFirstActionCTA()}
      {renderNutritionGlance()}
      {renderBodyWeek()}
    </ScrollView>
  );
};

// 14-day volume sparkline. Auto-scales to its own min/max so even small
// variation reads. Stroke color follows trend so a glance tells direction
// before the numeric delta even registers.
const VolumeSparkline = ({
  points,
  trend,
}: {
  points: number[];
  trend: 'up' | 'flat' | 'down' | 'none';
}) => {
  if (points.length < 2 || points.every(p => p === 0)) {
    return (
      <Svg width="100%" height={36} viewBox="0 0 200 36" preserveAspectRatio="none">
        <Polyline points="2,18 198,18" fill="none" stroke={text.disabled} strokeWidth="1.4" />
      </Svg>
    );
  }
  const width = 200;
  const height = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = (width - 4) / (points.length - 1);
  const coords = points
    .map((v, i) => {
      const x = 2 + i * stepX;
      const y = 2 + (1 - (v - min) / range) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const stroke =
    trend === 'up' ? accent.sessionUp
    : trend === 'down' ? accent.regression
    : text.tertiary;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <Polyline points={coords} fill="none" stroke={stroke} strokeWidth="1.6" />
    </Svg>
  );
};

const DeltaReadout = ({
  deltaPct,
  trend,
  thisWeek,
}: {
  deltaPct: number | null;
  trend: 'up' | 'flat' | 'down' | 'none';
  thisWeek: number;
}) => {
  const color =
    trend === 'up' ? accent.sessionUp
    : trend === 'down' ? accent.regression
    : text.tertiary;
  const glyph = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '·';
  const pctLabel =
    deltaPct === null
      ? thisWeek > 0 ? 'first week' : 'no data'
      : `${deltaPct > 0 ? '+' : ''}${Math.round(deltaPct * 100)}%`;
  return (
    <View style={{ alignItems: 'flex-end', gap: 2 }}>
      <Text
        style={{
          color: text.quaternary,
          fontFamily: fonts.family.mono,
          fontSize: 9,
          fontWeight: '800',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}
      >
        14-day · vs prior wk
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text style={{ color, fontSize: 14, fontWeight: '900' }}>{glyph}</Text>
        <Text
          style={{
            color,
            fontSize: 16,
            fontWeight: '900',
            fontVariant: fonts.tabularNums,
          }}
        >
          {pctLabel}
        </Text>
      </View>
    </View>
  );
};

const Placeholder = ({ label, hint }: { label: string; hint: string }) => (
  <View style={{ paddingVertical: spacing.md, alignItems: 'center', gap: 4 }}>
    <Text
      style={{
        color: text.tertiary,
        fontFamily: fonts.family.mono,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.6,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Text>
    <Text style={{ color: text.quaternary, fontSize: 12, textAlign: 'center' }}>{hint}</Text>
  </View>
);

const MacroPill = ({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) => {
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text
        style={{
          color: text.primary,
          fontSize: 14,
          fontWeight: '800',
          letterSpacing: -0.02,
          fontVariant: fonts.tabularNums,
        }}
      >
        {current}
        <Text style={{ color: text.quaternary, fontWeight: '600', fontSize: 12 }}>
          {target > 0 ? ` / ${target}g` : 'g'}
        </Text>
      </Text>
      <View
        style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: palette.borderStrong,
          overflow: 'hidden',
        }}
      >
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color }} />
      </View>
      <Text
        style={{
          fontFamily: fonts.family.mono,
          fontSize: 9,
          letterSpacing: 1.6,
          color: text.quaternary,
          textTransform: 'uppercase',
          fontWeight: '700',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

export default HomeView;
