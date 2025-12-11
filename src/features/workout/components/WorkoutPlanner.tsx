import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Dumbbell, Calendar, ChevronLeft, ChevronRight, Play, Settings, CheckCircle, Brain, Layout, PlusCircle } from 'lucide-react-native';
import NeonButton from '../../../components/NeonButton';
import GlassCard from '../../../components/GlassCard';
import workoutStyles from '../../../styles/workout';
import homeStyles from '../../../styles/home';
import { colors, spacing, radii } from '../../../styles/theme';
import { WorkoutPlan } from '../../../types/workout';
import { getWorkoutForDate } from '../helpers';
import WorkoutPlanCreator from './WorkoutPlanCreator';
import PlanManagementMenu from './PlanManagementMenu';

/**
 * WORKOUT PLANNER COMPONENT
 * ========================
 * Main view for the Gym tab when no workout is active.
 * Handles plan management, scheduling, and quick actions.
 */

type WorkoutPlannerProps = {
  onLoadTemplate: () => void;
  onCustomInput: () => void;
  onQuickWorkout: (type: string) => void;
  onAISuggestion: () => void;
  onCreatePlan: (suggestedType?: WorkoutPlan['equipment']) => void;
  onBrowsePlans: () => void;
  onChangePlan: () => void;
  onCreateFromExisting: () => void;
  onEndPlan: () => void;
  onCleanupPlans?: () => void;
  onSelectWorkout: (workoutType: string, planId?: string) => void;
  onStartScheduledWorkout?: (date: Date, workout: any) => void;
  onStartCalendarWorkout?: (date: Date, workout: any) => void;
  recentWorkouts?: any[];
  workoutPlans?: WorkoutPlan[];
  activePlan?: any; // UserWorkoutPlan
  userEquipment?: WorkoutPlan['equipment'];
  userFrequency?: number;
  nextScheduledWorkout?: any;
};

const WorkoutPlanner = ({
  onLoadTemplate,
  onCustomInput,
  onQuickWorkout,
  onAISuggestion,
  onCreatePlan,
  onBrowsePlans,
  onChangePlan,
  onCreateFromExisting,
  onEndPlan,
  onCleanupPlans,
  onSelectWorkout,
  onStartScheduledWorkout,
  onStartCalendarWorkout,
  recentWorkouts = [],
  workoutPlans = [],
  activePlan,
  userEquipment = 'gym',
  userFrequency = 3,
  nextScheduledWorkout
}: WorkoutPlannerProps) => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [showPlanMenu, setShowPlanMenu] = React.useState(false);

  const getDaysInWeek = () => {
    const days = [];
    const current = new Date();
    // Start from Monday of the current week
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(current.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        date: d,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate()
      });
    }
    return days;
  };

  const getWorkoutStatus = (date: Date) => {
    return getWorkoutForDate(date, recentWorkouts, activePlan);
  };

  return (
    <ScrollView
      style={homeStyles.homeView}
      contentContainerStyle={homeStyles.homeViewContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Next Scheduled Workout - Priority Suggestion */}
      {nextScheduledWorkout && (
        <GlassCard style={{ padding: spacing.xl, marginBottom: spacing.xl, borderColor: colors.success }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <CheckCircle size={20} color={colors.success} />
            <Text style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: colors.success,
              marginLeft: spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Workout Suggestion
          </Text>
        </View>

          <View style={{ marginBottom: spacing.md }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 2 }}>
              {nextScheduledWorkout.name}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: spacing.sm }}>
              {nextScheduledWorkout.exercises} Exercises • {nextScheduledWorkout.dayName} • {
                nextScheduledWorkout.daysUntil === 0 ? 'Today' :
                nextScheduledWorkout.daysUntil === 1 ? 'Tomorrow' :
                `In ${nextScheduledWorkout.daysUntil} days`
              }
          </Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              Start scheduled workout or choose alternative
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <NeonButton
              onPress={() => onStartScheduledWorkout?.(nextScheduledWorkout.date, nextScheduledWorkout)}
              style={{ flex: 1 }}
            >
              <Play color="#0f172a" />
              <Text style={{ fontSize: 14, fontWeight: 'bold' }}>START</Text>
        </NeonButton>

            <TouchableOpacity
              onPress={onLoadTemplate}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: radii.md,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <Layout size={16} color={colors.primary} />
              <Text style={{ marginTop: 4, color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>
                ALTERNATE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCustomInput}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: radii.md,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <PlusCircle size={16} color={colors.primary} />
              <Text style={{ marginTop: 4, color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>
                MANUAL
              </Text>
            </TouchableOpacity>
        </View>
        </GlassCard>
      )}

      {/* Active Plan Card - The "Hero" */}
      <GlassCard style={{ padding: spacing.xl, marginBottom: spacing.xl, borderColor: colors.primary }}>
        <View style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <CheckCircle size={20} color={activePlan ? colors.success : colors.muted} />
            <Text style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: colors.muted,
              marginLeft: spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Active Plan
            </Text>
      </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
              color: '#fff',
              flex: 1,
              flexShrink: 1,
              marginRight: activePlan ? spacing.sm : 0,
            }} numberOfLines={2}>
              {activePlan ? (activePlan.customName || activePlan.planData?.name || 'Unknown Plan').toUpperCase() : 'No Active Plan'}
            </Text>
            {activePlan && (
              <TouchableOpacity
                onPress={() => setShowPlanMenu(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: radii.sm,
                  flexShrink: 0,
                }}
              >
                <Settings size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: spacing.xs }}>
                  CHANGE
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {activePlan ? (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <View style={{ flex: 1, height: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, marginRight: spacing.sm }}>
                <View style={{ width: '40%', height: '100%', backgroundColor: colors.primary, borderRadius: 2 }} />
              </View>
              <Text style={{ color: colors.muted, fontSize: 10, fontWeight: 'bold' }}>WEEK 2 / {activePlan.planData?.duration || 4}</Text>
            </View>
            <Text style={workoutStyles.activePlanSubtitle}>
              {activePlan.planData?.description} • {activePlan.planData?.frequency}x per week
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: spacing.sm }}>
            <Text style={{ color: colors.muted, fontSize: 14, marginBottom: spacing.lg }}>
              Create a plan to get structured workout recommendations and track your progress effectively.
          </Text>
            <NeonButton onPress={() => onCreatePlan()} style={{ width: '100%' }}>
              <PlusCircle size={20} color="#0f172a" />
              <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold' }}>CREATE NEW PLAN</Text>
            </NeonButton>

            <TouchableOpacity
              onPress={onBrowsePlans}
              style={{
                marginTop: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacing.md
              }}
            >
              <Layout size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: 'bold', marginLeft: spacing.sm }}>
                BROWSE PLAN LIBRARY
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </GlassCard>

      {/* Weekly Schedule */}
      <GlassCard style={{ padding: spacing.xl, marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Calendar size={20} color={colors.primary} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: spacing.sm }}>
              WEEKLY SCHEDULE
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {getDaysInWeek().map((day, index) => {
            const isSelected = day.date.toDateString() === selectedDate.toDateString();
            const isToday = day.date.toDateString() === new Date().toDateString();
            const workout = getWorkoutStatus(day.date);

            return (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedDate(day.date)}
                style={{
                  alignItems: 'center',
                  padding: spacing.xs,
                  backgroundColor: isSelected ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
                  borderRadius: radii.sm,
                  borderWidth: isSelected ? 1 : 0,
                  borderColor: colors.primary,
                  minWidth: 40
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 10, marginBottom: 4 }}>
                  {day.dayName}
                </Text>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: radii.full,
                  backgroundColor: isToday ? colors.primary : workout ? (workout.type === 'completed' ? colors.success : 'rgba(139, 92, 246, 0.2)') : 'rgba(255, 255, 255, 0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4
                }}>
                  <Text style={{ color: isToday ? '#fff' : '#fff', fontWeight: 'bold', fontSize: 14 }}>
                    {day.dayNumber}
                  </Text>
                </View>
                {workout && (
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: workout.type === 'completed' ? colors.success : '#8b5cf6' }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Date Workout Details */}
        <View style={{ marginTop: spacing.lg }}>
          {(() => {
            const todaysWorkout = getWorkoutStatus(selectedDate);
            
            if (todaysWorkout) {
              if (todaysWorkout.type === 'completed') {
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: radii.md }}>
                    <CheckCircle size={24} color={colors.success} />
                    <View>
                      <Text style={{ color: colors.success, fontSize: 16, fontWeight: 'bold' }}>COMPLETED</Text>
                      <Text style={{ color: colors.muted, fontSize: 14 }}>{todaysWorkout.name}</Text>
                    </View>
                  </View>
                );
              } else if (todaysWorkout.type === 'planned') {
                return (
                  <View>
                    <View style={{ marginBottom: spacing.md }}>
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
                        {todaysWorkout.name.toUpperCase()}
        </Text>
                      <Text style={{ color: colors.muted, fontSize: 14 }}>
                        {todaysWorkout.exercises} Exercises • {todaysWorkout.dayName}
            </Text>
                    </View>
                    <NeonButton onPress={() => onStartCalendarWorkout?.(selectedDate, todaysWorkout)} style={{ width: '100%' }}>
                      <Play size={20} color="#0f172a" />
                      <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold' }}>START SESSION</Text>
          </NeonButton>
                  </View>
                );
              }
            }
            
            return (
              <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
                <Text style={{ color: colors.muted, fontSize: 14, marginBottom: spacing.md }}>
                  No workout scheduled for this day.
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={onCustomInput}
            style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: 'rgba(249, 115, 22, 0.1)',
              borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: 'rgba(249, 115, 22, 0.3)'
                    }}
                  >
                    <PlusCircle size={16} color={colors.primary} />
                    <Text style={{ marginLeft: 6, color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>CUSTOM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={onAISuggestion}
                    style={{
              flexDirection: 'row',
              alignItems: 'center',
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: 'rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <Brain size={16} color="#8b5cf6" />
                    <Text style={{ marginLeft: 6, color: '#8b5cf6', fontWeight: 'bold', fontSize: 12 }}>AI</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </View>
      </GlassCard>


      {/* Plan Management Menu */}
      {activePlan && (
        <PlanManagementMenu
          visible={showPlanMenu}
          activePlan={activePlan}
          onClose={() => setShowPlanMenu(false)}
          onChangePlan={onChangePlan}
          onCreateFromExisting={onCreateFromExisting}
          onEndPlan={onEndPlan}
          onCleanupPlans={onCleanupPlans}
        />
      )}
    </ScrollView>
  );
};

export { WorkoutPlanCreator };
export default WorkoutPlanner;
