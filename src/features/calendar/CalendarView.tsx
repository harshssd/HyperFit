import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import GlassCard from '../../components/GlassCard';
import { palette, text, accent, spacing, radii, fonts } from '../../styles/theme';
import { useUser } from '../../contexts/UserContext';
import { useAppData } from '../../contexts/AppDataContext';
import { useCalendarData, type CalendarDay } from './useCalendarData';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MONTH_NAMES = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
];
const DOW_LABELS = ['M','T','W','T','F','S','S'];

/**
 * Calendar tab. Past dates show logged sessions; future dates show what's
 * scheduled by the user's active plan. Tap a past day with a logged session
 * to drill in; tap a future day to see what's planned.
 */
const CalendarView = () => {
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
    >
      {/* Month header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <TouchableOpacity onPress={goPrev} accessibilityLabel="Previous month" style={{ padding: 8 }}>
          <ChevronLeft size={20} color={text.primary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: text.primary, fontFamily: 'monospace', fontSize: 13, fontWeight: '700', letterSpacing: 1.6 }}>
            {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
          </Text>
          <TouchableOpacity onPress={jumpToday} style={{ marginTop: 2 }}>
            <Text style={{ color: accent.lift, fontFamily: 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 1.4 }}>
              TODAY
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={goNext} accessibilityLabel="Next month" style={{ padding: 8 }}>
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
    </ScrollView>
  );
};

const DayCell = ({
  day, isSelected, onPress,
}: { day: CalendarDay; isSelected: boolean; onPress: () => void }) => {
  const hasLogged = day.logged.length > 0;
  const hasPlanned = day.planned.length > 0;
  const dim = !day.inMonth;

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
      <View style={{ flexDirection: 'row', gap: 2, marginTop: 3, height: 4 }}>
        {hasLogged && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent.sessionUp }} />}
        {hasPlanned && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent.lift }} />}
      </View>
    </TouchableOpacity>
  );
};

export default CalendarView;
