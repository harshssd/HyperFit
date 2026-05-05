import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronRight as ChevronRightIcon } from 'lucide-react-native';
import GlassCard from '../../components/GlassCard';
import { HeroGradient } from '../../components/HeroGradient';
import { palette, text, accent, spacing, radii, fonts } from '../../styles/theme';
import { useUser } from '../../contexts/UserContext';
import { useAppData } from '../../contexts/AppDataContext';
import { useCalendarData, type CalendarDay } from './useCalendarData';
import { useMonthMuscleIntensities } from './useMonthMuscleIntensities';
import { MiniSilhouette } from '../analytics/heatmap/MiniSilhouette';
import type { MuscleId } from '../analytics/heatmap/muscleRegions';
import type { RootStackParamList } from '../../navigation/types';
import { getUpcomingWorkouts } from '../workout/helpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MONTH_NAMES = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
];
const DOW_LABELS = ['M','T','W','T','F','S','S'];

type CalendarViewProps = {
  /** When true, render inline (no outer ScrollView, tighter padding) so the
   *  view can be embedded inside another scrolling parent (e.g. Home). */
  embedded?: boolean;
};

/**
 * Calendar tab. Past dates show logged sessions; future dates show what's
 * scheduled by the user's active plan. Tap a past day with a logged session
 * to drill in; tap a future day to see what's planned.
 */
const CalendarView = ({ embedded = false }: CalendarViewProps) => {
  const navigation = useNavigation<Nav>();
  const { user } = useUser();
  const { data } = useAppData();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState<CalendarDay | null>(null);

  const activePlan = useMemo(
    () => (data.userWorkoutPlans || []).find((p: any) => p.isActive) || null,
    [data.userWorkoutPlans],
  );

  const { days } = useCalendarData(user?.id, activePlan, month);
  const muscleByDay = useMonthMuscleIntensities(
    user?.id,
    days[0]?.iso,
    days[days.length - 1]?.iso,
  );

  // Clear the selection when leaving the month — otherwise the bottom sheet
  // keeps showing data for a day that's no longer on the grid.
  const goPrev = () => { setSelected(null); setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)); };
  const goNext = () => { setSelected(null); setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)); };
  const jumpToday = () => {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    const todayCell = days.find((d) => d.isToday);
    setSelected(todayCell || null);
  };

  const onTapDay = (d: CalendarDay) => {
    setSelected(d);
    if (d.logged.length === 1) {
      navigation.navigate('SessionDetail', { sessionId: d.logged[0].sessionId });
    }
  };

  const body = (
    <>
      {/* Month header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <TouchableOpacity testID="calendar-prev-month" onPress={goPrev} accessibilityLabel="Previous month" style={{ padding: 8 }}>
          <ChevronLeft size={20} color={text.primary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text testID="calendar-month-label" style={{ color: text.primary, fontFamily: 'monospace', fontSize: 13, fontWeight: '700', letterSpacing: 1.6 }}>
            {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
          </Text>
          <TouchableOpacity testID="calendar-today-button" onPress={jumpToday} style={{ marginTop: 2 }}>
            <Text style={{ color: accent.lift, fontFamily: 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 1.4 }}>
              TODAY
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity testID="calendar-next-month" onPress={goNext} accessibilityLabel="Next month" style={{ padding: 8 }}>
          <ChevronRight size={20} color={text.primary} />
        </TouchableOpacity>
      </View>

      {/* Day-of-week header */}
      <View style={{ flexDirection: 'row', marginBottom: spacing.xs }}>
        {DOW_LABELS.map((lbl, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: text.quaternary, fontFamily: 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 1.4 }}>
              {lbl}
            </Text>
          </View>
        ))}
      </View>

      {/* 6-row grid */}
      {Array.from({ length: 6 }).map((_, week) => (
        <View key={week} style={{ flexDirection: 'row' }}>
          {days.slice(week * 7, week * 7 + 7).map((d) => (
            <DayCell
              key={d.iso}
              day={d}
              isSelected={selected?.iso === d.iso}
              intensities={muscleByDay.get(d.iso)?.intensities}
              onPress={() => onTapDay(d)}
            />
          ))}
        </View>
      ))}

      {/* Selection sheet */}
      {selected && (
        <GlassCard style={{ marginTop: spacing.lg, padding: spacing.md }}>
          <Text style={{ color: text.tertiary, fontFamily: 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: spacing.xs }}>
            {selected.iso.toUpperCase()}
            {selected.isToday && '  ·  TODAY'}
            {selected.isPast && !selected.isToday && '  ·  PAST'}
            {!selected.isPast && !selected.isToday && '  ·  UPCOMING'}
          </Text>

          {selected.logged.length === 0 && selected.planned.length === 0 && (
            <Text style={{ color: text.quaternary, fontSize: 13 }}>
              {selected.isPast ? 'No workout logged.' : 'No session scheduled.'}
            </Text>
          )}

          {selected.logged.map((l) => (
            <TouchableOpacity
              key={l.sessionId}
              onPress={() => navigation.navigate('SessionDetail', { sessionId: l.sessionId })}
              style={{
                marginTop: spacing.xs,
                padding: spacing.sm,
                borderWidth: 1,
                borderColor: palette.borderSubtle,
                borderRadius: radii.sm,
              }}
            >
              <Text style={{ color: accent.sessionUp, fontFamily: 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>
                ● LOGGED
              </Text>
              <Text style={{ color: text.primary, fontSize: 14, fontWeight: '700', marginTop: 2 }}>
                {l.name || 'Workout'}
              </Text>
              <Text
                style={{
                  color: text.quaternary,
                  fontFamily: 'monospace',
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                  fontVariant: fonts.tabularNums,
                  marginTop: 2,
                }}
              >
                {l.totalSets} SETS · {l.exerciseCount} EX
              </Text>
            </TouchableOpacity>
          ))}

          {selected.planned.map((p) => (
            <View
              key={p.planSessionId}
              style={{
                marginTop: spacing.xs,
                padding: spacing.sm,
                borderWidth: 1,
                borderColor: palette.borderSubtle,
                borderRadius: radii.sm,
              }}
            >
              <Text style={{ color: accent.lift, fontFamily: 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>
                ○ PLANNED · {p.focus.toUpperCase() || 'SESSION'}
              </Text>
              <Text style={{ color: text.primary, fontSize: 14, fontWeight: '700', marginTop: 2 }}>
                {p.name}
              </Text>
            </View>
          ))}
        </GlassCard>
      )}
    </>
  );

  if (embedded) {
    return <View>{body}</View>;
  }

  // Wrap body in the same card chrome as Home / Plans / Nutrition: hairline
  // border on `palette.surface`, icon-chip + eyebrow header, padding inside.
  // Without this, Calendar reads as a bare grid floating on bg while the
  // other tabs read as composed dashboards. Same pattern, same surface.
  const upcoming = getUpcomingWorkouts(activePlan ?? undefined, 5, 0);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
    >
      <View
        style={{
          marginBottom: spacing.xl,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: palette.borderStrong,
          borderTopWidth: 2,
          borderTopColor: palette.textTertiary,
          backgroundColor: palette.surface,
          overflow: 'hidden',
        }}
      >
        <HeroGradient tint="blue" />
        {/* Card header — icon-chip + eyebrow + month label. Mirrors the
            "ACTIVE PLAN" / "FUEL" / "THIS WEEK" header pattern from the
            other tabs so all dashboards read as one design system. */}
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
            <CalendarIcon size={14} color={text.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: text.quaternary, fontSize: 11, fontWeight: '800', letterSpacing: 1.6, fontFamily: 'monospace', textTransform: 'uppercase' }}>
              Schedule
            </Text>
            <Text style={{ color: text.primary, fontSize: 14, fontWeight: '800', marginTop: 2 }}>
              Month at a glance
            </Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg }}>
          {body}
        </View>
      </View>

      {/* Upcoming sibling card — fills the empty space below the calendar
          and gives users a quick "what's next" feed without having to read
          the grid. Pulled from the active plan's schedule. */}
      {activePlan && upcoming.length > 0 ? (
        <View
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
                backgroundColor: 'rgba(252, 76, 2, 0.12)',
                borderWidth: 1,
                borderColor: accent.lift,
              }}
            >
              <CalendarIcon size={14} color={accent.lift} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: accent.lift, fontSize: 11, fontWeight: '800', letterSpacing: 1.6, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                Upcoming
              </Text>
              <Text style={{ color: text.primary, fontSize: 14, fontWeight: '800', marginTop: 2 }}>
                Next {upcoming.length} session{upcoming.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
          <View>
            {upcoming.map((u, i) => (
              <View
                key={`${u.sessionId}-${i}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderBottomWidth: i < upcoming.length - 1 ? 1 : 0,
                  borderBottomColor: palette.borderSubtle,
                  gap: spacing.md,
                }}
              >
                <View style={{ minWidth: 60 }}>
                  <Text
                    style={{
                      color: u.daysUntil === 0 ? accent.lift : text.tertiary,
                      fontFamily: 'monospace',
                      fontSize: 11,
                      fontWeight: '800',
                      letterSpacing: 1.4,
                      fontVariant: fonts.tabularNums,
                    }}
                  >
                    {u.daysUntil === 0
                      ? 'TODAY'
                      : u.daysUntil === 1
                        ? 'TOMORROW'
                        : u.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit' }).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: text.primary, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
                    {u.name}
                  </Text>
                  <Text
                    style={{
                      color: text.quaternary,
                      fontFamily: 'monospace',
                      fontSize: 10,
                      fontWeight: '700',
                      letterSpacing: 1.2,
                      marginTop: 2,
                    }}
                  >
                    {u.exercises} EXERCISES
                  </Text>
                </View>
                <ChevronRightIcon size={14} color={text.tertiary} />
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
};

const DayCell = ({
  day, isSelected, intensities, onPress,
}: {
  day: CalendarDay;
  isSelected: boolean;
  intensities?: Partial<Record<MuscleId, number>>;
  onPress: () => void;
}) => {
  const hasLogged = day.logged.length > 0;
  const hasPlanned = day.planned.length > 0;
  const dim = !day.inMonth;
  const hasCoverage = !!intensities && Object.values(intensities).some(v => (v ?? 0) > 0);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 2,
        borderRadius: radii.sm,
        borderWidth: 1,
        borderColor: day.isToday
          ? accent.lift
          : isSelected
            ? palette.borderStrong
            : 'transparent',
        backgroundColor: day.isToday
          ? 'rgba(252, 76, 2, 0.08)'
          : isSelected
            ? palette.surface
            : 'transparent',
        opacity: dim ? 0.32 : 1,
      }}
      accessibilityLabel={day.iso}
    >
      {hasLogged && hasCoverage && (
        // Silhouette sits absolutely behind the number at low opacity so
        // the date stays grid-aligned. The same recruitment-weighted hue
        // ramp as the full heatmap, just faded.
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 1,
          }}
        >
          <MiniSilhouette intensities={intensities ?? {}} size={24} tone="ghost" />
        </View>
      )}
      <Text
        style={{
          color: day.isToday ? accent.lift : text.primary,
          fontFamily: 'monospace',
          fontSize: 13,
          fontWeight: day.isToday ? '700' : '500',
          fontVariant: fonts.tabularNums,
        }}
      >
        {day.date.getDate()}
      </Text>
      {!(hasLogged && hasCoverage) && (hasLogged || hasPlanned) && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 3,
            flexDirection: 'row',
            gap: 2,
          }}
        >
          {hasLogged && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent.sessionUp }} />}
          {hasPlanned && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent.lift }} />}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CalendarView;
