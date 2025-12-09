import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import {
  PieChart,
  BarChart,
  LineChart,
} from 'react-native-chart-kit';
import { BarChart3, TrendingUp, Target, Calendar, Clock, Dumbbell } from 'lucide-react-native';
import GlassCard from '../../components/GlassCard';
import { homeStyles } from '../../styles';
import { colors, spacing, radii } from '../../styles/theme';
import { UserData, WorkoutExercise, WorkoutSet } from '../../types/workout';

type AnalyticsViewProps = {
  data: UserData;
};

type TimePeriod = 'week' | 'month' | 'all';

const AnalyticsView = ({ data }: AnalyticsViewProps) => {
  const screenWidth = Dimensions.get('window').width;
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');

  // Helper function to filter dates based on time period
  const getFilteredDates = (dates: string[], period: TimePeriod): string[] => {
    if (period === 'all') return dates;

    const now = new Date();
    const cutoffDate = new Date();

    if (period === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    }

    return dates.filter(date => new Date(date) >= cutoffDate);
  };

  // Calculate analytics data
  const analytics = useMemo(() => {
    const allWorkoutDates = data.gymLogs || [];
    const workoutDates = getFilteredDates(allWorkoutDates, timePeriod);
    const workouts = data.workouts || {};

    // Exercise frequency analysis
    const exerciseCount: Record<string, number> = {};
    const exerciseVolume: Record<string, number[]> = {}; // Array of volumes per date
    const volumeOverTime: Array<{ date: string; volume: number }> = [];

    // Process each workout
    workoutDates.forEach(date => {
      const exercises = workouts[date] || [];
      let dailyVolume = 0;

      exercises.forEach((exercise: WorkoutExercise) => {
        // Count exercise frequency
        exerciseCount[exercise.name] = (exerciseCount[exercise.name] || 0) + 1;

        // Calculate volume for this exercise
        let exerciseVolumeTotal = 0;
        exercise.sets.forEach((set: WorkoutSet) => {
          if (set.completed) {
            const weight = typeof set.weight === 'string' ? parseInt(set.weight, 10) : set.weight;
            const reps = typeof set.reps === 'string' ? parseInt(set.reps, 10) : set.reps;
            const setVolume = (weight || 0) * (reps || 0);
            exerciseVolumeTotal += setVolume;
            dailyVolume += setVolume;
          }
        });

        // Store volume progression for this exercise
        if (!exerciseVolume[exercise.name]) {
          exerciseVolume[exercise.name] = [];
        }
        exerciseVolume[exercise.name].push(exerciseVolumeTotal);
      });

      // Store daily volume
      volumeOverTime.push({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: dailyVolume
      });
    });

    // Get top exercises for pie chart
    const topExercises = Object.entries(exerciseCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([name, count], index) => ({
        name: name.length > 15 ? name.substring(0, 12) + '...' : name,
        count,
        color: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ][index % 8],
        legendFontColor: '#fff',
        legendFontSize: 12
      }));

    // Workout frequency by day of week
    const dayFrequency = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
    workoutDates.forEach(date => {
      const day = new Date(date).getDay();
      dayFrequency[day]++;
    });

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Performance metrics
    let totalSets = 0;
    let completedSets = 0;
    let totalRestTime = 0;
    let restTimeCount = 0;

    workoutDates.forEach(date => {
      const exercises = workouts[date] || [];
      exercises.forEach((exercise: WorkoutExercise) => {
        exercise.sets.forEach((set: WorkoutSet) => {
          totalSets++;
          if (set.completed) {
            completedSets++;
          }
          if (typeof set.restSeconds === 'number') {
            totalRestTime += set.restSeconds;
            restTimeCount++;
          }
        });
      });
    });

    const completionRate = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
    const avgRestTime = restTimeCount > 0 ? totalRestTime / restTimeCount : 0;

    // Determine how many days to show based on time period
    const getDaysToShow = (period: TimePeriod): number => {
      switch (period) {
        case 'week': return 7;
        case 'month': return 30;
        case 'all': return 14; // Last 14 days for all time view
        default: return 14;
      }
    };

    return {
      totalWorkouts: workoutDates.length,
      totalVolume: volumeOverTime.reduce((sum, day) => sum + day.volume, 0),
      topExercises,
      volumeOverTime: volumeOverTime.slice(-getDaysToShow(timePeriod)),
      dayFrequency,
      dayLabels,
      completionRate,
      avgRestTime,
      exerciseCount
    };
  }, [data, timePeriod]);

  const chartConfig = {
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const getVolumeChartTitle = (period: TimePeriod): string => {
    switch (period) {
      case 'week': return 'VOLUME PROGRESSION (Past Week)';
      case 'month': return 'VOLUME PROGRESSION (Past Month)';
      case 'all': return 'VOLUME PROGRESSION (Last 14 Days)';
      default: return 'VOLUME PROGRESSION';
    }
  };

  return (
    <ScrollView
      style={homeStyles.homeView}
      contentContainerStyle={homeStyles.homeViewContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{
          color: '#fff',
          fontSize: 22,
          fontWeight: 'bold',
          letterSpacing: 1
        }}>
          ANALYTICS
        </Text>
      </View>

      {/* Time Period Filters */}
      <GlassCard style={{ padding: spacing.xl, marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Calendar size={20} color={colors.primary} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: spacing.sm }}>
              TIME PERIOD
            </Text>
          </View>
        </View>

        <View style={{
          flexDirection: 'row',
          gap: spacing.sm
        }}>
          {[
            { key: 'week' as TimePeriod, label: 'WEEK', icon: '7d' },
            { key: 'month' as TimePeriod, label: 'MONTH', icon: '30d' },
            { key: 'all' as TimePeriod, label: 'ALL TIME', icon: '∞' }
          ].map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setTimePeriod(key)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacing.md,
                backgroundColor: timePeriod === key
                  ? 'rgba(249, 115, 22, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: timePeriod === key
                  ? colors.primary
                  : 'rgba(255, 255, 255, 0.1)',
                gap: spacing.sm
              }}
            >
              <Text style={{
                color: timePeriod === key ? colors.primary : colors.muted,
                fontSize: 12,
                fontWeight: 'bold',
                fontFamily: 'monospace'
              }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>

      {/* Overview Stats */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
        <GlassCard style={{ flex: 1, padding: spacing.lg, alignItems: 'center' }}>
          <Dumbbell size={24} color={colors.primary} />
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: spacing.sm }}>
            {analytics.totalWorkouts}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 1 }}>WORKOUTS</Text>
        </GlassCard>

        <GlassCard style={{ flex: 1, padding: spacing.lg, alignItems: 'center' }}>
          <Target size={24} color="#10b981" />
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: spacing.sm }}>
            {analytics.totalVolume > 1000 ? `${(analytics.totalVolume / 1000).toFixed(1)}k` : analytics.totalVolume}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 1 }}>VOLUME</Text>
        </GlassCard>

        <GlassCard style={{ flex: 1, padding: spacing.lg, alignItems: 'center' }}>
          <TrendingUp size={24} color="#3b82f6" />
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: spacing.sm }}>
            {analytics.completionRate.toFixed(0)}%
          </Text>
          <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 1 }}>COMPLETE</Text>
        </GlassCard>
      </View>

      {/* Exercise Frequency Pie Chart */}
      {analytics.topExercises.length > 0 && (
        <GlassCard style={{ marginBottom: spacing.xl, padding: spacing.xl }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.lg
          }}>
            <BarChart3 size={24} color={colors.primary} />
            <Text style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
              marginLeft: spacing.sm
            }}>
              MOST PERFORMED
            </Text>
          </View>

          <PieChart
            data={analytics.topExercises}
            width={screenWidth - spacing.xl * 2}
            height={220}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </GlassCard>
      )}

      {/* Volume Over Time */}
      {analytics.volumeOverTime.length > 1 && (
        <GlassCard style={{ marginBottom: spacing.xl, padding: spacing.xl }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.lg
          }}>
            <TrendingUp size={24} color="#10b981" />
            <Text style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
              marginLeft: spacing.sm
            }}>
              {getVolumeChartTitle(timePeriod).replace('VOLUME PROGRESSION', 'VOLUME')}
            </Text>
          </View>

          <LineChart
            data={{
              labels: analytics.volumeOverTime.map(d => d.date),
              datasets: [{
                data: analytics.volumeOverTime.map(d => d.volume),
                color: () => colors.primary,
                strokeWidth: 2
              }]
            }}
            width={screenWidth - spacing.xl * 2}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: () => colors.primary,
            }}
            bezier
            style={{
              marginVertical: spacing.md,
              borderRadius: 16
            }}
          />
        </GlassCard>
      )}

      {/* Workout Frequency by Day */}
      <GlassCard style={{ marginBottom: spacing.xl, padding: spacing.xl }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.lg
          }}>
            <Calendar size={24} color="#8b5cf6" />
            <Text style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
              marginLeft: spacing.sm
            }}>
              WORKOUT DAYS
            </Text>
          </View>

        <BarChart
          data={{
            labels: analytics.dayLabels,
            datasets: [{
              data: analytics.dayFrequency
            }]
          }}
          width={screenWidth - spacing.xl * 2}
          height={200}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            ...chartConfig,
            color: () => '#8b5cf6',
          }}
          showValuesOnTopOfBars
          fromZero
        />
      </GlassCard>

      {/* Performance Metrics */}
      <GlassCard style={{ padding: spacing.xl }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.lg
        }}>
          <Clock size={24} color="#f59e0b" />
          <Text style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            marginLeft: spacing.sm
          }}>
            PERFORMANCE
          </Text>
        </View>

        <View style={{ gap: spacing.lg }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{ color: colors.muted, fontSize: 14, letterSpacing: 1 }}>
              AVG REST TIME
            </Text>
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>
              {analytics.avgRestTime.toFixed(0)}s
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{ color: colors.muted, fontSize: 14, letterSpacing: 1 }}>
              COMPLETION RATE
            </Text>
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>
              {analytics.completionRate.toFixed(1)}%
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{ color: colors.muted, fontSize: 14, letterSpacing: 1 }}>
              UNIQUE EXERCISES
            </Text>
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>
              {Object.keys(analytics.exerciseCount).length}
            </Text>
          </View>
        </View>
      </GlassCard>
    </ScrollView>
  );
};

export default AnalyticsView;
