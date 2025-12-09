import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Dumbbell, Play, Calendar, CheckCircle, TrendingUp, BarChart2 } from 'lucide-react-native';
import GlassCard from './GlassCard';
import { homeStyles } from '../styles';
import { colors, spacing, radii } from '../styles/theme';
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
  const todaysWorkout = getWorkoutForDate(today, [], data.userWorkoutPlans?.find(p => p.isActive));

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
              <CheckCircle size={32} color={colors.success} />
              <View>
                <Text style={{ color: colors.success, fontSize: 18, fontWeight: 'bold' }}>COMPLETED</Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Good job crushing {todaysWorkout.name}!</Text>
              </View>
            </View>
          </View>
        );
      } else if (todaysWorkout.type === 'planned') {
        return (
          <View style={{ gap: spacing.lg }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: spacing.xs }}>
                {todaysWorkout.name.toUpperCase()}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
                TODAY'S SESSION
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: spacing.xl }}>
              <View>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{todaysWorkout.exercises}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>EXERCISES</Text>
              </View>
              <View>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>~60</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>MINUTES</Text>
              </View>
            </View>

            <NeonButton onPress={() => onChangeView('gym')} style={{ width: '100%' }}>
              <Play size={20} color="#0f172a" />
              <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold' }}>START WORKOUT</Text>
            </NeonButton>
          </View>
        );
      }
    }

    return (
      <View style={{ gap: spacing.lg }}>
        <View>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: spacing.xs }}>
            REST DAY
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14 }}>
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
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: radii.md,
            alignSelf: 'flex-start'
          }}
        >
          <Dumbbell size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>START CUSTOM WORKOUT</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={homeStyles.homeView} contentContainerStyle={homeStyles.homeViewContent}>
      {/* Header Stats */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
        <GlassCard style={{ flex: 1, padding: spacing.lg, alignItems: 'center' }}>
          <TrendingUp size={24} color={colors.primary} />
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: spacing.sm }}>{streak}</Text>
          <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 1 }}>DAY STREAK</Text>
        </GlassCard>
        <GlassCard style={{ flex: 1, padding: spacing.lg, alignItems: 'center' }}>
          <BarChart2 size={24} color="#3b82f6" />
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: spacing.sm }}>{xp}</Text>
          <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 1 }}>TOTAL XP</Text>
        </GlassCard>
      </View>

      {/* Main Action Card */}
      <GlassCard style={{ padding: spacing.xl, marginBottom: spacing.xl, borderColor: colors.primary }}>
        {renderTodaysFocus()}
      </GlassCard>

      {/* Weekly Consistency */}
      <GlassCard style={{ padding: spacing.xl, marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <Calendar size={20} color={colors.primary} />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: spacing.sm }}>
            WEEKLY CONSISTENCY
          </Text>
        </View>
        <SimpleBarChart data={getWeeklyData()} color={colors.primary} />
      </GlassCard>

      {/* Quick Actions */}
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: spacing.md, marginLeft: spacing.sm }}>
        QUICK ACTIONS
      </Text>
      
      <View style={{ gap: spacing.md }}>
        <TouchableOpacity onPress={() => onChangeView('stats')} style={homeStyles.homeQuickAction}>
          <BarChart2 size={20} color={colors.primary} />
          <Text style={homeStyles.homeQuickActionText}>VIEW PROGRESS</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => onChangeView('history')} style={homeStyles.homeQuickAction}>
          <Calendar size={20} color={colors.primary} />
          <Text style={homeStyles.homeQuickActionText}>HISTORY LOG</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default HomeView;
