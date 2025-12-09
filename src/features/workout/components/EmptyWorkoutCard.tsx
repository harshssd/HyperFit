import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Dumbbell, Layout, PlusCircle, Brain, Target, TrendingUp, Clock, Zap, Flame, RotateCcw } from 'lucide-react-native';
import NeonButton from '../../../components/NeonButton';
import GlassCard from '../../../components/GlassCard';
import workoutStyles from '../../../styles/workout';
import { colors, spacing, radii } from '../../../styles/theme';

type WorkoutPlannerProps = {
  onLoadTemplate: () => void;
  onCustomInput: () => void;
  onQuickWorkout: (type: string) => void;
  onAISuggestion: () => void;
  recentWorkouts?: any[];
  userGoals?: any;
  streak?: number;
  xp?: number;
};

const WorkoutPlanner = ({
  onLoadTemplate,
  onCustomInput,
  onQuickWorkout,
  onAISuggestion,
  recentWorkouts = [],
  userGoals,
  streak = 0,
  xp = 0
}: WorkoutPlannerProps) => {
  const quickWorkoutTypes = [
    { id: 'push', name: 'PUSH', description: 'Chest, Shoulders, Triceps', icon: '💪', color: '#f97316' },
    { id: 'pull', name: 'PULL', description: 'Back, Biceps, Rear Delts', icon: '🔄', color: '#22d3ee' },
    { id: 'legs', name: 'LEGS', description: 'Quads, Hamstrings, Calves', icon: '🦵', color: '#10b981' },
    { id: 'fullbody', name: 'FULL BODY', description: 'Complete compound workout', icon: '🏋️', color: '#8b5cf6' },
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Header */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{
          color: '#fff',
          fontSize: 20,
          fontWeight: 'bold',
          letterSpacing: 1
        }}>
          PLAN WORKOUT
        </Text>
        <Text style={{
          color: colors.muted,
          fontSize: 14,
          fontFamily: 'monospace'
        }}>
          CHOOSE YOUR TRAINING PROTOCOL
        </Text>
      </View>

      {/* Current Stats */}
      <GlassCard style={{
        marginBottom: spacing.xl,
        padding: spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between'
      }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Flame size={16} color={colors.primary} />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: spacing.xs }}>
              STREAK
            </Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            {streak}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <TrendingUp size={16} color="#22d3ee" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: spacing.xs }}>
              XP
            </Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            {xp.toLocaleString()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Target size={16} color="#10b981" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: spacing.xs }}>
              GOAL
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            SET GOAL
          </Text>
        </View>
      </GlassCard>

      {/* AI Suggestion */}
      <GlassCard style={{
        marginBottom: spacing.lg,
        padding: spacing.lg,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <Brain size={20} color="#8b5cf6" />
          <Text style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            marginLeft: spacing.sm
          }}>
            AI WORKOUT SUGGESTION
          </Text>
        </View>
        <Text style={{
          color: colors.muted,
          fontSize: 14,
          marginBottom: spacing.lg,
          lineHeight: 20
        }}>
          Based on your recent workouts and progress, we recommend a balanced full-body session today.
        </Text>
        <NeonButton
          onPress={onAISuggestion}
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderColor: '#8b5cf6'
          }}
        >
          <Zap size={20} color="#8b5cf6" />
          <Text style={{ marginLeft: 8, color: '#8b5cf6', fontWeight: 'bold' }}>
            GENERATE AI WORKOUT
          </Text>
        </NeonButton>
      </GlassCard>

      {/* Quick Workouts */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: spacing.lg
        }}>
          QUICK START WORKOUTS
        </Text>

        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.md
        }}>
          {quickWorkoutTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              onPress={() => onQuickWorkout(type.id)}
              style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: radii.lg,
                padding: spacing.lg,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 24, marginBottom: spacing.sm }}>{type.icon}</Text>
              <Text style={{
                color: '#fff',
                fontSize: 14,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: spacing.xs
              }}>
                {type.name}
              </Text>
              <Text style={{
                color: colors.muted,
                fontSize: 10,
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                {type.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: spacing.lg
          }}>
            RECENT WORKOUTS
          </Text>

          {recentWorkouts.slice(0, 3).map((workout, index) => (
            <GlassCard
              key={index}
              style={{
                marginBottom: spacing.md,
                padding: spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: radii.sm,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: spacing.md
                }}>
                  <RotateCcw size={16} color="#0f172a" />
                </View>
                <View>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                    {workout.name || 'Recent Workout'}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {workout.date} • {workout.exercises} exercises
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {/* Reapply this workout */}}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: colors.surface,
                  borderRadius: radii.sm,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                  REPEAT
                </Text>
              </TouchableOpacity>
            </GlassCard>
          ))}
        </View>
      )}

      {/* Alternative Options */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: spacing.lg
        }}>
          ADVANCED OPTIONS
        </Text>

        <View style={{ gap: spacing.md }}>
          <NeonButton
            onPress={onLoadTemplate}
            style={{
              width: '100%',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              borderColor: colors.primary
            }}
          >
            <Layout size={20} color={colors.primary} />
            <Text style={{ marginLeft: 8, color: colors.primary }}>
              BROWSE TEMPLATES
            </Text>
          </NeonButton>

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

export default WorkoutPlanner;

