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
      {/* 🎯 UNIFIED WORKOUT CENTRAL - Hero Section */}
      <GlassCard style={{ 
        padding: 0, 
        marginBottom: spacing.xl, 
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: activePlan ? colors.primary : 'rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header: Active Plan Status */}
        <View style={{ 
          padding: spacing.xl,
          paddingBottom: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.08)',
          backgroundColor: activePlan ? 'rgba(249, 115, 22, 0.05)' : 'rgba(255, 255, 255, 0.02)'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <Dumbbell size={18} color={activePlan ? colors.primary : colors.muted} />
                <Text style={{
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: colors.muted,
                  marginLeft: spacing.xs,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                }}>
                  {activePlan ? 'ACTIVE PLAN' : 'NO ACTIVE PLAN'}
                </Text>
              </View>
              <Text style={{
                fontSize: 22,
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: spacing.xs,
              }} numberOfLines={2}>
                {activePlan ? (activePlan.customName || activePlan.planData?.name || 'Unknown Plan') : 'Ready to Start?'}
              </Text>
              {activePlan && (
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {activePlan.planData?.description || ''} • {activePlan.planData?.frequency || 3}x/week
                </Text>
              )}
            </View>
            
            {activePlan && (
              <TouchableOpacity
                onPress={() => setShowPlanMenu(true)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Settings size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {activePlan && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
              <View style={{ flex: 1, height: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: radii.full, marginRight: spacing.sm }}>
                <View style={{ width: '40%', height: '100%', backgroundColor: colors.primary, borderRadius: radii.full }} />
              </View>
              <Text style={{ color: colors.muted, fontSize: 10, fontWeight: 'bold' }}>
                WEEK 2/{activePlan.planData?.duration || 4}
              </Text>
            </View>
          )}
        </View>

        {/* Main Content: Today's Workout or Quick Actions */}
        <View style={{ padding: spacing.xl }}>
          {nextScheduledWorkout ? (
            /* TODAY'S RECOMMENDED WORKOUT */
            <View>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginBottom: spacing.md,
                paddingBottom: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255, 255, 255, 0.08)'
              }}>
                <Calendar size={16} color={colors.success} />
                <Text style={{ 
                  color: colors.success, 
                  fontSize: 12, 
                  fontWeight: 'bold',
                  marginLeft: spacing.xs,
                  textTransform: 'uppercase',
                  letterSpacing: 1
                }}>
                  {nextScheduledWorkout.daysUntil === 0 ? 'TODAY' : 
                   nextScheduledWorkout.daysUntil === 1 ? 'TOMORROW' : 
                   `IN ${nextScheduledWorkout.daysUntil} DAYS`}
                </Text>
              </View>

              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: spacing.xs }}>
                {nextScheduledWorkout.name}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 14, marginBottom: spacing.xl }}>
                {nextScheduledWorkout.exercises} Exercises • {nextScheduledWorkout.dayName}
              </Text>

              <NeonButton onPress={() => onStartScheduledWorkout?.(nextScheduledWorkout.date, nextScheduledWorkout)} style={{ width: '100%', marginBottom: spacing.md }}>
                <Play size={20} color="#0f172a" />
                <Text style={{ marginLeft: spacing.sm, fontSize: 16, fontWeight: 'bold' }}>START WORKOUT</Text>
              </NeonButton>

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity
                  onPress={onLoadTemplate}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: spacing.md,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Layout size={16} color={colors.muted} />
                  <Text style={{ marginLeft: spacing.xs, color: colors.muted, fontSize: 13, fontWeight: 'bold' }}>
                    ALTERNATE
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onCustomInput}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: spacing.md,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <PlusCircle size={16} color={colors.muted} />
                  <Text style={{ marginLeft: spacing.xs, color: colors.muted, fontSize: 13, fontWeight: 'bold' }}>
                    MANUAL
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* NO SCHEDULED WORKOUT - QUICK ACTIONS */
            <View>
              <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center', marginBottom: spacing.xl }}>
                {activePlan 
                  ? 'No workout scheduled for today. Choose an option below to get started.' 
                  : 'Create or select a plan to get personalized workout recommendations.'}
              </Text>

              {!activePlan ? (
                <View>
                  <NeonButton onPress={() => onCreatePlan()} style={{ width: '100%', marginBottom: spacing.md }}>
                    <PlusCircle size={20} color="#0f172a" />
                    <Text style={{ marginLeft: spacing.sm, fontSize: 16, fontWeight: 'bold' }}>CREATE NEW PLAN</Text>
                  </NeonButton>

                  <TouchableOpacity
                    onPress={onBrowsePlans}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: spacing.md,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Layout size={16} color={colors.primary} />
                    <Text style={{ marginLeft: spacing.sm, color: colors.primary, fontWeight: 'bold' }}>
                      BROWSE PLAN LIBRARY
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: spacing.sm }}>
                  <TouchableOpacity
                    onPress={onLoadTemplate}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: spacing.lg,
                      backgroundColor: 'rgba(249, 115, 22, 0.1)',
                      borderRadius: radii.md,
                      borderWidth: 2,
                      borderColor: 'rgba(249, 115, 22, 0.3)',
                    }}
                  >
                    <Layout size={20} color={colors.primary} />
                    <Text style={{ marginLeft: spacing.sm, color: colors.primary, fontSize: 15, fontWeight: 'bold' }}>
                      SELECT FROM PLAN
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onCustomInput}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: spacing.lg,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <PlusCircle size={20} color="#fff" />
                    <Text style={{ marginLeft: spacing.sm, color: '#fff', fontSize: 15, fontWeight: 'bold' }}>
                      LOG MANUAL WORKOUT
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onAISuggestion}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: spacing.lg,
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: 'rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <Brain size={20} color="#8b5cf6" />
                    <Text style={{ marginLeft: spacing.sm, color: '#8b5cf6', fontSize: 15, fontWeight: 'bold' }}>
                      AI SUGGESTION
                    </Text>
                    <View style={{
                      marginLeft: spacing.xs,
                      paddingHorizontal: spacing.xs,
                      paddingVertical: 2,
                      backgroundColor: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: radii.sm
                    }}>
                      <Text style={{ color: '#8b5cf6', fontSize: 9, fontWeight: 'bold' }}>SOON</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </GlassCard>

      {/* 📅 WEEKLY CALENDAR VIEW */}
      <GlassCard style={{ padding: spacing.xl, marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Calendar size={18} color={colors.primary} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: spacing.sm }}>
              WEEKLY SCHEDULE
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '600' }}>
            {(() => {
              const days = getDaysInWeek();
              const start = days[0].date;
              const end = days[6].date;
              return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            })()}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg }}>
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
                  padding: spacing.sm,
                  backgroundColor: isSelected ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                  borderRadius: radii.md,
                  borderWidth: isSelected ? 2 : 0,
                  borderColor: colors.primary,
                  minWidth: 44
                }}
              >
                <Text style={{ 
                  color: isSelected ? colors.primary : colors.muted, 
                  fontSize: 10, 
                  fontWeight: 'bold',
                  marginBottom: spacing.xs 
                }}>
                  {day.dayName.toUpperCase()}
                </Text>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: radii.full,
                  backgroundColor: isToday 
                    ? colors.primary 
                    : workout 
                      ? (workout.type === 'completed' ? colors.success : 'rgba(139, 92, 246, 0.2)') 
                      : 'rgba(255, 255, 255, 0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ 
                    color: isToday || workout?.type === 'completed' ? '#0f172a' : '#fff', 
                    fontWeight: 'bold', 
                    fontSize: 15 
                  }}>
                    {day.dayNumber}
                  </Text>
                </View>
                {workout && (
                  <View style={{ 
                    marginTop: spacing.xs,
                    width: 5, 
                    height: 5, 
                    borderRadius: radii.full, 
                    backgroundColor: workout.type === 'completed' ? colors.success : '#8b5cf6' 
                  }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Day Details */}
        <View style={{
          padding: spacing.lg,
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          {(() => {
            const selectedWorkout = getWorkoutStatus(selectedDate);
            const isSelectedToday = selectedDate.toDateString() === new Date().toDateString();
            
            if (selectedWorkout) {
              if (selectedWorkout.type === 'completed') {
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: radii.full,
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircle size={24} color={colors.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.success, fontSize: 13, fontWeight: 'bold', marginBottom: 2 }}>
                        COMPLETED
                      </Text>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                        {selectedWorkout.name}
                      </Text>
                    </View>
                  </View>
                );
              } else if (selectedWorkout.type === 'planned') {
                // Calculate days until workout
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selected = new Date(selectedDate);
                selected.setHours(0, 0, 0, 0);
                const daysUntil = Math.floor((selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                // Generate meaningful button text
                let buttonText = 'START WORKOUT';
                if (daysUntil === 0) {
                  buttonText = 'START TODAY';
                } else if (daysUntil === 1) {
                  buttonText = "START TOMORROW'S WORKOUT";
                } else if (daysUntil > 1 && daysUntil <= 6) {
                  buttonText = `START ${selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}'S WORKOUT`;
                } else if (daysUntil < 0) {
                  // Past date
                  buttonText = 'LOG MISSED WORKOUT';
                }
                
                return (
                  <View>
                    <View style={{ marginBottom: spacing.md }}>
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: spacing.xs }}>
                        {selectedWorkout.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Text style={{ color: colors.muted, fontSize: 13 }}>
                          {selectedWorkout.exercises} Exercises • {selectedWorkout.dayName}
                        </Text>
                        {daysUntil > 0 && (
                          <View style={{
                            paddingHorizontal: spacing.xs,
                            paddingVertical: 2,
                            backgroundColor: 'rgba(249, 115, 22, 0.2)',
                            borderRadius: radii.sm
                          }}>
                            <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold' }}>
                              IN {daysUntil} {daysUntil === 1 ? 'DAY' : 'DAYS'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <NeonButton 
                      onPress={() => onStartCalendarWorkout?.(selectedDate, selectedWorkout)} 
                      style={{ width: '100%' }}
                    >
                      <Play size={18} color="#0f172a" />
                      <Text style={{ marginLeft: spacing.sm, fontSize: 15, fontWeight: 'bold' }}>
                        {buttonText}
                      </Text>
                    </NeonButton>
                  </View>
                );
              }
            }
            
            return (
              <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
                <Text style={{ color: colors.muted, fontSize: 13, marginBottom: spacing.md }}>
                  No workout scheduled
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
                      borderRadius: radii.sm,
                      borderWidth: 1,
                      borderColor: 'rgba(249, 115, 22, 0.3)'
                    }}
                  >
                    <PlusCircle size={14} color={colors.primary} />
                    <Text style={{ marginLeft: spacing.xs, color: colors.primary, fontWeight: 'bold', fontSize: 11 }}>
                      ADD WORKOUT
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={onAISuggestion}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      borderRadius: radii.sm,
                      borderWidth: 1,
                      borderColor: 'rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <Brain size={14} color="#8b5cf6" />
                    <Text style={{ marginLeft: spacing.xs, color: '#8b5cf6', fontWeight: 'bold', fontSize: 11 }}>
                      AI SUGGEST
                    </Text>
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
