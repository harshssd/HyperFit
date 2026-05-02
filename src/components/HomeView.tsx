import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Dumbbell, Play, Calendar, CheckCircle, TrendingUp, BarChart2 } from 'lucide-react-native';
import GlassCard from './GlassCard';
import { homeStyles } from '../styles';
import { palette, text, accent, spacing, radii } from '../styles/theme';
import { UserData } from '../types/workout';
import { getWorkoutForDate } from '../features/workout/helpers';
import NeonButton from './NeonButton';

type HomeViewProps = {
  data: UserData;
  onChangeView: (view: string) => void;
  streak: number;
  xp: number;
};

import SimpleBarChart from './SimpleBarChart';

const HomeView = ({ data, onChangeView, streak, xp }: HomeViewProps) => {
  const today = new Date();
  const activePlan = data.userWorkoutPlans?.find(p => p.isActive);
  const todaysWorkout = getWorkoutForDate(today, [], activePlan);

  // Calculate Weekly Consistency
  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    // Get last 7 days including today
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      return d;
    });

    return last7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const hasWorkout = data.gymLogs?.includes(dateStr);
      const dayLabel = days[date.getDay()];
      return { 
        label: dayLabel, 
        value: hasWorkout ? 1 : 0 
      };
    });
  };

  // Determine workout status for dashboard display
  const renderTodaysFocus = () => {
    if (todaysWorkout) {
      if (todaysWorkout.type === 'completed') {
        return (
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <CheckCircle size={32} color={accent.sessionUp} />
              <View>
                <Text style={{ color: accent.sessionUp, fontSize: 13, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>Completed</Text>
                <Text style={{ color: text.tertiary, fontSize: 14 }}>Good job crushing {todaysWorkout.name}!</Text>
              </View>
            </View>
          </View>
        );
      } else if (todaysWorkout.type === 'planned') {
        return (
          <View style={{ gap: spacing.lg }}>
            <View>
              <Text style={{ color: text.primary, fontSize: 24, fontWeight: '900', letterSpacing: -0.4, marginBottom: spacing.xs }}>
                {todaysWorkout.name.toUpperCase()}
              </Text>
              <Text style={{ color: accent.lift, fontSize: 11, fontWeight: '800', letterSpacing: 1.6, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                Today's Session
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.xl }}>
              <View>
                <Text style={{ color: text.primary, fontSize: 18, fontWeight: '800' }}>{todaysWorkout.exercises}</Text>
                <Text style={{ color: text.quaternary, fontSize: 11, letterSpacing: 1.6, fontFamily: 'monospace', textTransform: 'uppercase' }}>Exercises</Text>
              </View>
              <View>
                <Text style={{ color: text.primary, fontSize: 18, fontWeight: '800' }}>~60</Text>
                <Text style={{ color: text.quaternary, fontSize: 11, letterSpacing: 1.6, fontFamily: 'monospace', textTransform: 'uppercase' }}>Minutes</Text>
              </View>
            </View>

            <NeonButton onPress={() => onChangeView('gym')} style={{ width: '100%' }}>
              <Play size={18} color={palette.bg} />
              <Text style={{ marginLeft: spacing.sm, fontSize: 13, fontWeight: '800', letterSpacing: 1.2, color: palette.bg }}>START WORKOUT</Text>
            </NeonButton>
          </View>
        );
      }
    }

    return (
      <View style={{ gap: spacing.lg }}>
        <View>
          <Text style={{ color: text.primary, fontSize: 24, fontWeight: '900', letterSpacing: -0.4, marginBottom: spacing.xs }}>
            REST DAY
          </Text>
          <Text style={{ color: text.tertiary, fontSize: 14 }}>
            Active recovery or light cardio recommended.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onChangeView('gym')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.borderStrong,
            borderRadius: radii.md,
            alignSelf: 'flex-start'
          }}
        >
          <Dumbbell size={16} color={text.primary} />
          <Text style={{ color: text.primary, fontWeight: '800', fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase' }}>Start Custom Workout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={homeStyles.homeView} contentContainerStyle={homeStyles.homeViewContent}>
      {/* Header Stats */}
      <View testID="home-stats" style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
        <GlassCard style={{ flex: 1, padding: spacing.lg, alignItems: 'center' }}>
          <TrendingUp size={20} color={accent.lift} />
          <Text testID="home-streak-value" style={{ color: text.primary, fontSize: 22, fontWeight: '900', marginTop: spacing.sm, letterSpacing: -0.4 }}>{streak}</Text>
          <Text style={{ color: text.quaternary, fontSize: 10, letterSpacing: 1.6, fontFamily: 'monospace', textTransform: 'uppercase' }}>Day Streak</Text>
        </GlassCard>
        <GlassCard style={{ flex: 1, padding: spacing.lg, alignItems: 'center' }}>
          <BarChart2 size={20} color={text.secondary} />
          <Text testID="home-xp-value" style={{ color: text.primary, fontSize: 22, fontWeight: '900', marginTop: spacing.sm, letterSpacing: -0.4 }}>{xp}</Text>
          <Text style={{ color: text.quaternary, fontSize: 10, letterSpacing: 1.6, fontFamily: 'monospace', textTransform: 'uppercase' }}>Total XP</Text>
        </GlassCard>
      </View>

      {/* Main Action Card */}
      <GlassCard style={{ padding: spacing.xl, marginBottom: spacing.xl }}>
        {renderTodaysFocus()}
      </GlassCard>

      {/* Weekly Consistency */}
      <GlassCard style={{ padding: spacing.xl, marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <Calendar size={16} color={text.tertiary} />
          <Text style={{ color: text.quaternary, fontSize: 11, fontWeight: '800', marginLeft: spacing.sm, letterSpacing: 1.6, fontFamily: 'monospace', textTransform: 'uppercase' }}>
            Weekly Consistency
          </Text>
        </View>
        <SimpleBarChart data={getWeeklyData()} color={accent.lift} />
      </GlassCard>

      {/* Quick Actions */}
      <Text style={{ color: text.quaternary, fontSize: 11, fontWeight: '800', marginBottom: spacing.md, marginLeft: spacing.sm, letterSpacing: 1.6, fontFamily: 'monospace', textTransform: 'uppercase' }}>
        Quick Actions
      </Text>

      <View style={{ gap: spacing.md }}>
        <TouchableOpacity onPress={() => onChangeView('stats')} style={homeStyles.homeQuickAction}>
          <BarChart2 size={18} color={accent.lift} />
          <Text style={homeStyles.homeQuickActionText}>VIEW PROGRESS</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onChangeView('history')} style={homeStyles.homeQuickAction}>
          <Calendar size={18} color={accent.lift} />
          <Text style={homeStyles.homeQuickActionText}>HISTORY LOG</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default HomeView;
