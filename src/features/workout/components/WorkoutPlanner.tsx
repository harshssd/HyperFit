import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Dumbbell, Layout, PlusCircle, Brain, Target, Calendar, ChevronLeft, ChevronRight, Play, Settings, Edit, CheckCircle } from 'lucide-react-native';
import NeonButton from '../../../components/NeonButton';
import GlassCard from '../../../components/GlassCard';
import workoutStyles from '../../../styles/workout';
import { colors, spacing, radii } from '../../../styles/theme';
import { WorkoutPlan } from '../../../types/workout';

// Shared plan templates
const planTemplates = {
  'push-pull-legs': {
    name: 'Push-Pull-Legs',
    description: 'Classic 3-day split focusing on movement patterns',
    workouts: {
      monday: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Tricep Dips', 'Lateral Raises'],
      tuesday: ['Deadlift', 'Pull-ups', 'Barbell Rows', 'Face Pulls', 'Bicep Curls'],
      wednesday: ['Squats', 'Romanian Deadlift', 'Leg Press', 'Calf Raises', 'Leg Curls'],
      thursday: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Tricep Dips', 'Lateral Raises'],
      friday: ['Deadlift', 'Pull-ups', 'Barbell Rows', 'Face Pulls', 'Bicep Curls'],
      saturday: ['Squats', 'Romanian Deadlift', 'Leg Press', 'Calf Raises', 'Leg Curls'],
    }
  },
  'full-body': {
    name: 'Full Body',
    description: 'Complete workouts hitting all major muscle groups',
    workouts: {
      monday: ['Bench Press', 'Squats', 'Pull-ups', 'Overhead Press', 'Plank'],
      tuesday: ['Deadlift', 'Push-ups', 'Barbell Rows', 'Lateral Raises', 'Calf Raises'],
      wednesday: ['Bench Press', 'Squats', 'Pull-ups', 'Overhead Press', 'Plank'],
      thursday: ['Deadlift', 'Push-ups', 'Barbell Rows', 'Lateral Raises', 'Calf Raises'],
      friday: ['Bench Press', 'Squats', 'Pull-ups', 'Overhead Press', 'Plank'],
    }
  },
  'upper-lower': {
    name: 'Upper-Lower',
    description: 'Split focusing on upper and lower body workouts',
    workouts: {
      monday: ['Bench Press', 'Overhead Press', 'Pull-ups', 'Barbell Rows', 'Bicep Curls'],
      tuesday: ['Squats', 'Deadlift', 'Leg Press', 'Calf Raises', 'Leg Curls'],
      wednesday: ['Bench Press', 'Overhead Press', 'Pull-ups', 'Barbell Rows', 'Bicep Curls'],
      thursday: ['Squats', 'Deadlift', 'Leg Press', 'Calf Raises', 'Leg Curls'],
      friday: ['Bench Press', 'Overhead Press', 'Pull-ups', 'Barbell Rows', 'Bicep Curls'],
    }
  },
  'custom': {
    name: 'Custom Plan',
    description: 'Create your own workout structure',
    workouts: {}
  }
};

// Workout Plan Creator Component
const WorkoutPlanCreator = ({ visible, onClose, onCreatePlan, suggestedType }: {
  visible: boolean;
  onClose: () => void;
  onCreatePlan: (plan: Omit<WorkoutPlan, 'id' | 'createdAt'>) => void;
  suggestedType?: WorkoutPlan['type'];
}) => {
  const [planName, setPlanName] = React.useState('');
  const [planType, setPlanType] = React.useState<WorkoutPlan['type']>(suggestedType || 'push-pull-legs');
  const [frequency, setFrequency] = React.useState(3);
  const [equipment, setEquipment] = React.useState<WorkoutPlan['equipment']>('gym');
  const [duration, setDuration] = React.useState(4); // weeks
  const [isCustomPlan, setIsCustomPlan] = React.useState(suggestedType === 'custom');

  const handleCreate = () => {
    if (isCustomPlan && !planName.trim()) return;
    if (!isCustomPlan && duration <= 0) return;

    const template = planTemplates[planType];
    const endDate = isCustomPlan ? undefined : new Date(Date.now() + duration * 7 * 24 * 60 * 60 * 1000).toISOString();

    const plan: Omit<WorkoutPlan, 'id' | 'createdAt'> = {
      name: isCustomPlan ? planName : template.name,
      description: template.description,
      type: planType,
      frequency,
      equipment,
      duration: isCustomPlan ? undefined : duration,
      endDate,
      workouts: template.workouts,
      isActive: false
    };

    onCreatePlan(plan);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setPlanName('');
    setPlanType('push-pull-legs');
    setFrequency(3);
    setEquipment('gym');
    setDuration(4);
    setIsCustomPlan(false);
  };

  const handlePlanTypeChange = (type: WorkoutPlan['type']) => {
    setPlanType(type);
    setIsCustomPlan(type === 'custom');
    if (type === 'custom') {
      setPlanName('');
    }
  };

  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      zIndex: 1000,
      padding: spacing.xl
    }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{
            color: '#fff',
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: spacing.sm
          }}>
            CREATE WORKOUT PLAN
          </Text>
          <Text style={{
            color: colors.muted,
            fontSize: 14
          }}>
            Choose a standard plan or create your own
          </Text>
        </View>

        {/* Plan Type Selection */}
        <GlassCard style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: spacing.md
          }}>
            PLAN TYPE
          </Text>

          <View style={{ gap: spacing.sm }}>
            {/* Standard Plans */}
            {Object.entries(planTemplates).filter(([key]) => key !== 'custom').map(([key, template]) => (
              <TouchableOpacity
                key={key}
                onPress={() => handlePlanTypeChange(key as WorkoutPlan['type'])}
                style={{
                  padding: spacing.md,
                  backgroundColor: planType === key && !isCustomPlan ? 'rgba(249, 115, 22, 0.2)' : colors.surface,
                  borderRadius: radii.md,
                  borderWidth: planType === key && !isCustomPlan ? 2 : 0,
                  borderColor: colors.primary
                }}
              >
                <Text style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginBottom: spacing.xs
                }}>
                  {template.name}
                </Text>
                <Text style={{
                  color: colors.muted,
                  fontSize: 14
                }}>
                  {template.description}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Custom Plan */}
            <TouchableOpacity
              onPress={() => handlePlanTypeChange('custom')}
              style={{
                padding: spacing.md,
                backgroundColor: isCustomPlan ? 'rgba(139, 92, 246, 0.2)' : colors.surface,
                borderRadius: radii.md,
                borderWidth: isCustomPlan ? 2 : 0,
                borderColor: '#8b5cf6'
              }}
            >
              <Text style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: 'bold',
                marginBottom: spacing.xs
              }}>
                🛠️ Custom Plan
              </Text>
              <Text style={{
                color: colors.muted,
                fontSize: 14
              }}>
                Design your own workout structure
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Conditional Form Fields */}
        {isCustomPlan ? (
          /* Custom Plan Form */
          <GlassCard style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              marginBottom: spacing.md
            }}>
              PLAN NAME
            </Text>
            <TextInput
              value={planName}
              onChangeText={setPlanName}
              placeholder="e.g., My Custom Strength Plan"
              placeholderTextColor={colors.muted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.md,
                padding: spacing.md,
                color: '#fff',
                fontSize: 16
              }}
            />
          </GlassCard>
        ) : (
          /* Standard Plan Form */
          <GlassCard style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              marginBottom: spacing.md
            }}>
              HOW LONG WILL YOU FOLLOW THIS PLAN?
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
              {[2, 4, 6, 8, 12].map((weeks) => (
                <TouchableOpacity
                  key={weeks}
                  onPress={() => setDuration(weeks)}
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    backgroundColor: duration === weeks ? 'rgba(249, 115, 22, 0.2)' : colors.surface,
                    borderRadius: radii.md,
                    alignItems: 'center',
                    borderWidth: duration === weeks ? 2 : 0,
                    borderColor: colors.primary
                  }}
                >
                  <Text style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 'bold'
                  }}>
                    {weeks}
                  </Text>
                  <Text style={{
                    color: colors.muted,
                    fontSize: 12
                  }}>
                    weeks
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{
              color: colors.muted,
              fontSize: 14,
              fontStyle: 'italic'
            }}>
              Plan will end on: {new Date(Date.now() + duration * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </Text>
          </GlassCard>
        )}

        {/* Frequency */}
        <GlassCard style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: spacing.md
          }}>
            TRAINING FREQUENCY
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {[3, 4, 5, 6].map((freq) => (
              <TouchableOpacity
                key={freq}
                onPress={() => setFrequency(freq)}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  backgroundColor: frequency === freq ? 'rgba(249, 115, 22, 0.2)' : colors.surface,
                  borderRadius: radii.md,
                  alignItems: 'center',
                  borderWidth: frequency === freq ? 2 : 0,
                  borderColor: colors.primary
                }}
              >
                <Text style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 'bold'
                }}>
                  {freq}x
                </Text>
                <Text style={{
                  color: colors.muted,
                  fontSize: 12
                }}>
                  per week
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Equipment */}
        <GlassCard style={{ padding: spacing.lg, marginBottom: spacing.xl }}>
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: spacing.md
          }}>
            AVAILABLE EQUIPMENT
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {[
              { key: 'gym', label: 'Full Gym', icon: '🏋️' },
              { key: 'bodyweight', label: 'Bodyweight', icon: '💪' },
              { key: 'dumbbells', label: 'Dumbbells', icon: '🏋️‍♀️' },
              { key: 'mixed', label: 'Mixed', icon: '🔄' }
            ].map((eq) => (
              <TouchableOpacity
                key={eq.key}
                onPress={() => setEquipment(eq.key as WorkoutPlan['equipment'])}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  backgroundColor: equipment === eq.key ? 'rgba(249, 115, 22, 0.2)' : colors.surface,
                  borderRadius: radii.md,
                  alignItems: 'center',
                  borderWidth: equipment === eq.key ? 2 : 0,
                  borderColor: colors.primary
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: spacing.xs }}>{eq.icon}</Text>
                <Text style={{
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {eq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              flex: 1,
              padding: spacing.lg,
              backgroundColor: colors.surface,
              borderRadius: radii.md,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>CANCEL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={isCustomPlan ? !planName.trim() : duration <= 0}
            style={{
              flex: 1,
              padding: spacing.lg,
              backgroundColor: (isCustomPlan ? planName.trim() : duration > 0) ? colors.primary : colors.muted,
              borderRadius: radii.md,
              alignItems: 'center'
            }}
          >
            <Text style={{
              color: (isCustomPlan ? planName.trim() : duration > 0) ? '#0f172a' : '#64748b',
              fontWeight: 'bold'
            }}>
              CREATE PLAN
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

type WorkoutPlannerProps = {
  onLoadTemplate: () => void;
  onCustomInput: () => void;
  onQuickWorkout: (type: string) => void;
  onAISuggestion: () => void;
  onCreatePlan: (suggestedType?: WorkoutPlan['type']) => void;
  onSelectWorkout: (workoutType: string, planId?: string) => void;
  recentWorkouts?: any[];
  workoutPlans?: WorkoutPlan[];
  activePlan?: WorkoutPlan;
  onActivatePlan: (planId: string) => void;
  userEquipment?: WorkoutPlan['equipment'];
  userFrequency?: number;
};

const WorkoutPlanner = ({
  onLoadTemplate,
  onCustomInput,
  onQuickWorkout,
  onAISuggestion,
  onCreatePlan,
  onSelectWorkout,
  recentWorkouts = [],
  workoutPlans = [],
  activePlan,
  onActivatePlan,
  userEquipment = 'gym',
  userFrequency = 3
}: WorkoutPlannerProps) => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const getWorkoutForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const completedWorkout = recentWorkouts.find(w => w.dateStr === dateStr);

    // If there's a completed workout, show it
    if (completedWorkout) {
      return { ...completedWorkout, type: 'completed' };
    }

    // If there's an active plan, show planned workout
    if (activePlan) {
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];

      const plannedExercises = activePlan.workouts[dayName];
      if (plannedExercises && plannedExercises.length > 0) {
        return {
          type: 'planned',
          exercises: plannedExercises.length,
          name: plannedExercises[0] + (plannedExercises.length > 1 ? ` +${plannedExercises.length - 1}` : ''),
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1)
        };
      }
    }

    return null;
  };

  const getSuggestedWorkout = () => {
    if (!activePlan) return null;

    // Simple logic to suggest next workout based on plan
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    if (activePlan.type === 'push-pull-legs') {
      const cycle = ['push', 'pull', 'legs'];
      const dayIndex = (dayOfWeek - 1) % 3; // Start with Monday
      return cycle[dayIndex >= 0 ? dayIndex : 2];
    }

    return 'fullbody';
  };

  const suggestedWorkout = getSuggestedWorkout();

  // Smart plan suggestions based on equipment and frequency
  const getSmartSuggestions = () => {
    const suggestions = [];

    // Equipment-based suggestions
    if (userEquipment === 'gym') {
      suggestions.push({
        type: 'push-pull-legs' as const,
        reason: 'Full gym access allows for optimal push-pull-legs split',
        priority: 'high'
      });
      suggestions.push({
        type: 'full-body' as const,
        reason: 'Complete access to compound movements',
        priority: 'medium'
      });
    } else if (userEquipment === 'bodyweight') {
      suggestions.push({
        type: 'full-body' as const,
        reason: 'Bodyweight training works best with full-body sessions',
        priority: 'high'
      });
    } else if (userEquipment === 'dumbbells') {
      suggestions.push({
        type: 'full-body' as const,
        reason: 'Dumbbells enable effective full-body workouts',
        priority: 'high'
      });
      suggestions.push({
        type: 'push-pull-legs' as const,
        reason: 'Can perform basic push-pull-legs with dumbbells',
        priority: 'medium'
      });
    }

    // Frequency-based adjustments
    if (userFrequency >= 5) {
      // High frequency - suggest push-pull-legs for recovery
      const pplIndex = suggestions.findIndex(s => s.type === 'push-pull-legs');
      if (pplIndex >= 0) {
        suggestions[pplIndex].priority = 'high';
        suggestions[pplIndex].reason += ' (ideal for 5-6x/week training)';
      }
    } else if (userFrequency <= 3) {
      // Low frequency - suggest full body for efficiency
      const fbIndex = suggestions.findIndex(s => s.type === 'full-body');
      if (fbIndex >= 0) {
        suggestions[fbIndex].priority = 'high';
        suggestions[fbIndex].reason += ' (efficient for 2-3x/week training)';
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const smartSuggestions = getSmartSuggestions();

  const handlePlanTypeChange = (type: WorkoutPlan['type']) => {
    // Open plan creator with pre-selected type
    onCreatePlan(type);
  };
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{
          color: '#fff',
          fontSize: 28,
          fontWeight: 'bold',
          marginBottom: spacing.sm,
          letterSpacing: 1
        }}>
          WORKOUT PLANNER
        </Text>
        <Text style={{
          color: colors.muted,
          fontSize: 14,
          fontFamily: 'monospace'
        }}>
          PLAN YOUR TRAINING JOURNEY
        </Text>
      </View>

      {/* Active Plan Status */}
      {activePlan && (
        <GlassCard style={{
          marginBottom: spacing.xl,
          padding: spacing.lg,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <CheckCircle size={20} color="#10b981" />
                <Text style={{
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginLeft: spacing.sm
                }}>
                  ACTIVE PLAN: {activePlan.name.toUpperCase()}
                </Text>
              </View>
              <Text style={{
                color: colors.muted,
                fontSize: 14,
                lineHeight: 20
              }}>
                {activePlan.description} • {activePlan.frequency}x per week • {activePlan.equipment}
              </Text>
              {activePlan.endDate && (
                <Text style={{
                  color: colors.primary,
                  fontSize: 12,
                  marginTop: spacing.sm,
                  fontStyle: 'italic'
                }}>
                  Ends on {new Date(activePlan.endDate).toLocaleDateString()}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onCreatePlan}
              style={{
                padding: spacing.sm,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: radii.sm,
              }}
            >
              <Settings size={16} color="#10b981" />
            </TouchableOpacity>
          </View>
        </GlassCard>
      )}

      {/* Workout Calendar */}
      <GlassCard style={{
        marginBottom: spacing.xl,
        padding: spacing.lg
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.lg
        }}>
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }}
            style={{ padding: spacing.sm }}
          >
            <ChevronLeft size={20} color={colors.muted} />
          </TouchableOpacity>

          <Text style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>

          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }}
            style={{ padding: spacing.sm }}
          >
            <ChevronRight size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={{ marginBottom: spacing.lg }}>
          {/* Day headers */}
          <View style={{
            flexDirection: 'row',
            marginBottom: spacing.sm
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text
                key={day}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  color: colors.muted,
                  fontSize: 12,
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar days */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap'
          }}>
            {getDaysInMonth(selectedDate).map((day, index) => {
              if (day === null) {
                return <View key={index} style={{ flex: 1, aspectRatio: 1, margin: 1 }} />;
              }

              const currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
              const isToday = currentDate.toDateString() === new Date().toDateString();
              const workout = getWorkoutForDate(currentDate);

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedDate(currentDate)}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    margin: 1,
                    borderRadius: radii.sm,
                    backgroundColor: isToday
                      ? 'rgba(249, 115, 22, 0.2)'
                      : workout?.type === 'completed'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : workout?.type === 'planned'
                          ? 'rgba(139, 92, 246, 0.15)'
                          : 'rgba(15, 23, 42, 0.3)',
                    borderWidth: isToday ? 2 : 0,
                    borderColor: colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    color: isToday
                      ? colors.primary
                      : workout?.type === 'completed'
                        ? '#10b981'
                        : workout?.type === 'planned'
                          ? '#8b5cf6'
                          : colors.muted,
                    fontSize: 14,
                    fontWeight: isToday ? 'bold' : 'normal'
                  }}>
                    {day}
                  </Text>
                  {workout && (
                    <View style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: workout.type === 'completed' ? '#10b981' : '#8b5cf6'
                    }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Today's Workout Plan */}
        <View style={{
          padding: spacing.lg,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          borderRadius: radii.md,
          marginBottom: spacing.lg
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.md
          }}>
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold'
            }}>
              {selectedDate.toDateString() === new Date().toDateString() ? 'TODAY\'S WORKOUT' : 'SELECTED DATE'}
            </Text>
            <Text style={{
              color: colors.muted,
              fontSize: 12
            }}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
          </View>

          {(() => {
            const todaysWorkout = getWorkoutForDate(selectedDate);

            if (todaysWorkout) {
              if (todaysWorkout.type === 'completed') {
                return (
                  <View>
                    <Text style={{
                      color: '#10b981',
                      fontSize: 18,
                      fontWeight: 'bold',
                      marginBottom: spacing.sm
                    }}>
                      ✓ COMPLETED
                    </Text>
                    <Text style={{
                      color: colors.muted,
                      fontSize: 14,
                      marginBottom: spacing.lg
                    }}>
                      {todaysWorkout.name}
                    </Text>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.md,
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderRadius: radii.md,
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: '#10b981', fontWeight: 'bold' }}>VIEW DETAILS</Text>
                    </TouchableOpacity>
                  </View>
                );
              } else if (todaysWorkout.type === 'planned') {
                return (
                  <View>
                    <Text style={{
                      color: '#8b5cf6',
                      fontSize: 18,
                      fontWeight: 'bold',
                      marginBottom: spacing.sm
                    }}>
                      {todaysWorkout.dayName.toUpperCase()}
                    </Text>
                    <Text style={{
                      color: colors.muted,
                      fontSize: 14,
                      marginBottom: spacing.sm
                    }}>
                      {todaysWorkout.name}
                    </Text>
                    <Text style={{
                      color: colors.muted,
                      fontSize: 12,
                      marginBottom: spacing.lg
                    }}>
                      Planned from {activePlan?.name}
                    </Text>

                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <NeonButton
                        onPress={() => onSelectWorkout(todaysWorkout.dayName.toLowerCase(), activePlan?.id)}
                        style={{ flex: 1 }}
                      >
                        <Play size={16} color="#0f172a" />
                        <Text style={{ marginLeft: 8 }}>START</Text>
                      </NeonButton>

                      <TouchableOpacity
                        onPress={() => {/* Show alternatives */}}
                        style={{
                          paddingHorizontal: spacing.lg,
                          paddingVertical: spacing.md,
                          backgroundColor: colors.surface,
                          borderRadius: radii.md,
                          justifyContent: 'center'
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>MODIFY</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
            }

            return (
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  color: colors.muted,
                  fontSize: 16,
                  textAlign: 'center',
                  marginBottom: spacing.lg
                }}>
                  No workout planned for this day
                </Text>
                <NeonButton onPress={onAISuggestion}>
                  <Brain size={16} color="#0f172a" />
                  <Text style={{ marginLeft: 8 }}>GET SUGGESTION</Text>
                </NeonButton>
              </View>
            );
          })()}
        </View>
      </GlassCard>

      {/* Smart Plan Suggestions */}
      {!activePlan && smartSuggestions.length > 0 && (
        <GlassCard style={{
          marginBottom: spacing.xl,
          padding: spacing.lg,
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderColor: 'rgba(139, 92, 246, 0.3)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
            <Brain size={20} color="#8b5cf6" />
            <Text style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
              marginLeft: spacing.sm
            }}>
              RECOMMENDED PLANS
            </Text>
          </View>

          <Text style={{
            color: colors.muted,
            fontSize: 14,
            marginBottom: spacing.lg,
            lineHeight: 20
          }}>
            Based on your equipment ({userEquipment}) and {userFrequency}x/week frequency:
          </Text>

          {smartSuggestions.slice(0, 2).map((suggestion, index) => {
            const template = planTemplates[suggestion.type];
            return (
              <TouchableOpacity
                key={suggestion.type}
                onPress={() => handlePlanTypeChange(suggestion.type)}
                style={{
                  padding: spacing.md,
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: radii.md,
                  marginBottom: index < smartSuggestions.length - 1 ? spacing.md : 0,
                  borderWidth: 2,
                  borderColor: 'rgba(139, 92, 246, 0.3)'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 'bold',
                      marginBottom: spacing.xs
                    }}>
                      {template.name}
                    </Text>
                    <Text style={{
                      color: colors.muted,
                      fontSize: 12,
                      lineHeight: 18
                    }}>
                      {suggestion.reason}
                    </Text>
                  </View>
                  <View style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    backgroundColor: suggestion.priority === 'high' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.5)',
                    borderRadius: radii.sm,
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {suggestion.priority}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={onCreatePlan}
            style={{
              marginTop: spacing.lg,
              padding: spacing.md,
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              borderRadius: radii.md,
              alignItems: 'center'
            }}
          >
            <Text style={{
              color: '#8b5cf6',
              fontSize: 14,
              fontWeight: 'bold'
            }}>
              CUSTOMIZE PLAN →
            </Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      {/* Workout Plans */}
      <View style={{ marginBottom: spacing.xl }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.lg
        }}>
          <Text style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            YOUR PLANS
          </Text>
          <TouchableOpacity
            onPress={onCreatePlan}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: colors.primary,
              borderRadius: radii.sm,
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <PlusCircle size={16} color="#0f172a" />
            <Text style={{
              color: '#0f172a',
              fontWeight: 'bold',
              marginLeft: spacing.xs
            }}>
              CREATE
            </Text>
          </TouchableOpacity>
        </View>

        {workoutPlans.length === 0 ? (
          <GlassCard style={{
            padding: spacing.xl,
            alignItems: 'center'
          }}>
            <Dumbbell size={48} color={colors.muted} />
            <Text style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
              marginTop: spacing.lg,
              marginBottom: spacing.sm
            }}>
              NO WORKOUT PLANS YET
            </Text>
            <Text style={{
              color: colors.muted,
              fontSize: 14,
              textAlign: 'center',
              marginBottom: spacing.xl
            }}>
              Create a structured workout plan to guide your training journey
            </Text>
            <NeonButton onPress={onCreatePlan}>
              <PlusCircle size={20} color="#0f172a" />
              <Text style={{ marginLeft: 8 }}>CREATE YOUR FIRST PLAN</Text>
            </NeonButton>
          </GlassCard>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              {workoutPlans.map((plan) => (
                <GlassCard
                  key={plan.id}
                  style={{
                    width: 280,
                    padding: spacing.lg,
                    backgroundColor: plan.isActive
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(15, 23, 42, 0.5)',
                    borderColor: plan.isActive
                      ? 'rgba(16, 185, 129, 0.3)'
                      : undefined
                  }}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: spacing.md
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 'bold'
                    }}>
                      {plan.name}
                    </Text>
                    {plan.isActive && (
                      <CheckCircle size={16} color="#10b981" />
                    )}
                  </View>

                  <Text style={{
                    color: colors.muted,
                    fontSize: 12,
                    marginBottom: spacing.md,
                    lineHeight: 18
                  }}>
                    {plan.description}
                    {plan.endDate && (
                      <Text style={{ color: colors.primary, fontSize: 10 }}>
                        {'\n'}Ends: {new Date(plan.endDate).toLocaleDateString()}
                      </Text>
                    )}
                  </Text>

                  <View style={{
                    flexDirection: 'row',
                    gap: spacing.sm,
                    marginBottom: spacing.lg
                  }}>
                    <View style={{
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      backgroundColor: 'rgba(249, 115, 22, 0.2)',
                      borderRadius: radii.sm
                    }}>
                      <Text style={{
                        color: colors.primary,
                        fontSize: 10,
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {plan.frequency}x/week
                      </Text>
                    </View>

                    <View style={{
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      backgroundColor: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: radii.sm
                    }}>
                      <Text style={{
                        color: '#8b5cf6',
                        fontSize: 10,
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {plan.equipment}
                      </Text>
                    </View>
                  </View>

                  <View style={{ gap: spacing.sm }}>
                    {plan.isActive ? (
                      <TouchableOpacity
                        onPress={() => onActivatePlan('')}
                        style={{
                          padding: spacing.sm,
                          backgroundColor: colors.surface,
                          borderRadius: radii.sm,
                          alignItems: 'center'
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                          DEACTIVATE
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <NeonButton
                        onPress={() => onActivatePlan(plan.id)}
                        style={{ width: '100%', paddingVertical: spacing.sm }}
                      >
                        <Play size={14} color="#0f172a" />
                        <Text style={{ marginLeft: 6, fontSize: 12 }}>ACTIVATE</Text>
                      </NeonButton>
                    )}

                    <TouchableOpacity
                      onPress={() => {/* Edit plan */}}
                      style={{
                        padding: spacing.sm,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: radii.sm,
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                        EDIT PLAN
                      </Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Quick Actions */}
      <View style={{ gap: spacing.md }}>
        <Text style={{
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: spacing.sm
        }}>
          QUICK OPTIONS
        </Text>

        <View style={{ gap: spacing.sm }}>
          <NeonButton
            onPress={onAISuggestion}
            style={{
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              borderColor: '#8b5cf6'
            }}
          >
            <Brain size={20} color="#8b5cf6" />
            <Text style={{ marginLeft: 8, color: '#8b5cf6', fontWeight: 'bold' }}>
              AI WORKOUT SUGGESTION
            </Text>
          </NeonButton>

          <TouchableOpacity
            onPress={onLoadTemplate}
            style={{
              width: '100%',
              paddingVertical: spacing.lg,
              borderRadius: radii.md,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.md,
            }}
          >
            <Layout size={20} color={colors.muted} />
            <Text style={{
              color: colors.muted,
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: 16,
              letterSpacing: 1
            }}>
              BROWSE TEMPLATES
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCustomInput}
            style={{
              width: '100%',
              paddingVertical: spacing.lg,
              borderRadius: radii.md,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.md,
            }}
          >
            <PlusCircle size={20} color={colors.muted} />
            <Text style={{
              color: colors.muted,
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: 16,
              letterSpacing: 1
            }}>
              CREATE CUSTOM WORKOUT
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export { WorkoutPlanCreator };
export default WorkoutPlanner;

