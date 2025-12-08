import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Trash2, ChevronRight, Calendar, Dumbbell, X, Clock, Target, TrendingUp } from 'lucide-react-native';
import GlassCard from '../../components/GlassCard';
import { layoutStyles } from '../../styles';
import { workoutStyles } from '../../styles/workout'; // Reusing workout styles for consistency
import { colors, spacing, radii } from '../../styles/theme';
import { UserData, WorkoutExercise } from '../../types/workout';
import { calculateTotalVolume, getExerciseConfig } from '../workout/helpers';
import { confirmAction } from '../../utils/alerts';

type HistoryViewProps = {
  data: UserData;
  updateData: (data: UserData) => void;
};

const HistoryView = ({ data, updateData }: HistoryViewProps) => {
  const [selectedSession, setSelectedSession] = useState<{ id: string; date: string; finishedAt?: string; exercises: WorkoutExercise[] } | null>(null);

  // Build session list (session-wise, using finishedAt when available)
  const sessions = (data.gymLogs || []).map((date) => {
    const status = data.workoutStatus?.[date] as any;
    const finishedAt = status?.finishedAt;
    const id = finishedAt ? `${date}-${finishedAt}` : date;
    return { id, date, finishedAt, exercises: data.workouts?.[date] || [] };
  });

  const sortedSessions = sessions.sort((a, b) => {
    const aTime = a.finishedAt ? new Date(a.finishedAt).getTime() : new Date(a.date).getTime();
    const bTime = b.finishedAt ? new Date(b.finishedAt).getTime() : new Date(b.date).getTime();
    return bTime - aTime;
  });

  const handleDeleteSession = (date: string) => {
    confirmAction(
      'Delete Session',
      'Are you sure you want to delete this workout session? This cannot be undone.',
      () => {
        const newLogs = data.gymLogs.filter((d) => d !== date);
        const newWorkouts = { ...data.workouts };
        delete newWorkouts[date];
        const newStatus = { ...data.workoutStatus };
        delete newStatus[date];

        updateData({
          ...data,
          gymLogs: newLogs,
          workouts: newWorkouts,
          workoutStatus: newStatus,
        });
        
        if (selectedSession?.date === date) {
          setSelectedSession(null);
        }
      },
      'Delete'
    );
  };

  const SessionDetailModal = () => {
    if (!selectedSession) return null;

    const volume = calculateTotalVolume(selectedSession.exercises);
    const dateLabel = new Date(selectedSession.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeLabel = selectedSession.finishedAt
      ? new Date(selectedSession.finishedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      : null;

    // Calculate session analytics
    const totalSets = selectedSession.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const completedSets = selectedSession.exercises.reduce((acc, ex) =>
      acc + ex.sets.filter(set => set.completed).length, 0
    );
    const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

    // Calculate rest time statistics
    const restTimes = selectedSession.exercises.flatMap(ex =>
      ex.sets.filter(set => typeof set.restSeconds === 'number').map(set => set.restSeconds as number)
    );
    const averageRestTime = restTimes.length > 0
      ? Math.round(restTimes.reduce((a, b) => a + b, 0) / restTimes.length)
      : 0;

    return (
      <Modal
        visible={!!selectedSession}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSession(null)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.lg,
            paddingTop: spacing.xl,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
                SESSION DETAILS
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: spacing.xs }}>
                {dateLabel}
                {timeLabel && ` • ${timeLabel}`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedSession(null)}
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.full,
                backgroundColor: colors.surface,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <X size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
            showsVerticalScrollIndicator={false}
          >
            {/* Session Overview Stats */}
            <View style={{ marginBottom: spacing.xl }}>
              <Text style={{
                color: '#fff',
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: spacing.lg
              }}>
                OVERVIEW
              </Text>

              <View style={{
                flexDirection: 'row',
                gap: spacing.md,
                marginBottom: spacing.lg
              }}>
                <GlassCard style={{
                  flex: 1,
                  padding: spacing.lg,
                  alignItems: 'center'
                }}>
                  <Dumbbell size={24} color={colors.primary} />
                  <Text style={{
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 'bold',
                    marginTop: spacing.sm
                  }}>
                    {volume}
                  </Text>
                  <Text style={{
                    color: colors.muted,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginTop: spacing.xs
                  }}>
                    TOTAL VOLUME
                  </Text>
                </GlassCard>

                <GlassCard style={{
                  flex: 1,
                  padding: spacing.lg,
                  alignItems: 'center'
                }}>
                  <Target size={24} color={colors.success} />
                  <Text style={{
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 'bold',
                    marginTop: spacing.sm
                  }}>
                    {completionRate}%
                  </Text>
                  <Text style={{
                    color: colors.muted,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginTop: spacing.xs
                  }}>
                    COMPLETION
                  </Text>
                </GlassCard>

                <GlassCard style={{
                  flex: 1,
                  padding: spacing.lg,
                  alignItems: 'center'
                }}>
                  <Clock size={24} color="#fbbf24" />
                  <Text style={{
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 'bold',
                    marginTop: spacing.sm
                  }}>
                    {averageRestTime}s
                  </Text>
                  <Text style={{
                    color: colors.muted,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginTop: spacing.xs
                  }}>
                    AVG REST
                  </Text>
                </GlassCard>
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: spacing.xl
              }}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {selectedSession.exercises.length} Exercises • {totalSets} Sets • {completedSets} Completed
                </Text>
              </View>
            </View>

            {/* Exercises List */}
            <Text style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: spacing.lg
            }}>
              EXERCISES
            </Text>

            {selectedSession.exercises.map((exercise, exerciseIndex) => {
              const exerciseConfig = getExerciseConfig(exercise.name);
              const exerciseVolume = exercise.sets.reduce((acc, set) => {
                const weight = set.weight ? parseInt(String(set.weight), 10) : 0;
                const reps = set.reps ? parseInt(String(set.reps), 10) : 0;
                return acc + (set.completed ? weight * reps : 0);
              }, 0);

              return (
                <GlassCard
                  key={exercise.id}
                  style={{
                    marginBottom: spacing.lg,
                    padding: spacing.lg
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
                      fontWeight: 'bold',
                      flex: 1
                    }}>
                      {exerciseIndex + 1}. {exercise.name}
                    </Text>
                    <View style={{
                      backgroundColor: 'rgba(249, 115, 22, 0.2)',
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: radii.sm,
                    }}>
                      <Text style={{
                        color: colors.primary,
                        fontSize: 12,
                        fontWeight: 'bold',
                        fontFamily: 'monospace'
                      }}>
                        {exerciseVolume} lbs
                      </Text>
                    </View>
                  </View>

                  {/* Sets */}
                  <View style={{ gap: spacing.sm }}>
                    {exercise.sets.map((set, setIndex) => (
                      <View
                        key={set.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: spacing.sm,
                          backgroundColor: set.completed
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(15, 23, 42, 0.3)',
                          borderRadius: radii.md,
                          borderWidth: 1,
                          borderColor: set.completed
                            ? 'rgba(16, 185, 129, 0.3)'
                            : colors.border,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                          <View style={{
                            width: 24,
                            height: 24,
                            borderRadius: radii.sm,
                            backgroundColor: set.completed ? colors.success : colors.surface,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                            <Text style={{
                              fontSize: 12,
                              fontWeight: 'bold',
                              fontFamily: 'monospace',
                              color: set.completed ? '#0f172a' : colors.mutedAlt
                            }}>
                              {setIndex + 1}
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
                            <View>
                              <Text style={{
                                color: colors.muted,
                                fontSize: 10,
                                textTransform: 'uppercase',
                                letterSpacing: 1
                              }}>
                                {exerciseConfig.weightLabel}
                              </Text>
                              <Text style={{
                                color: '#fff',
                                fontSize: 14,
                                fontFamily: 'monospace',
                                fontWeight: 'bold'
                              }}>
                                {set.weight || '-'}
                              </Text>
                            </View>

                            <View>
                              <Text style={{
                                color: colors.muted,
                                fontSize: 10,
                                textTransform: 'uppercase',
                                letterSpacing: 1
                              }}>
                                {exerciseConfig.repLabel}
                              </Text>
                              <Text style={{
                                color: '#fff',
                                fontSize: 14,
                                fontFamily: 'monospace',
                                fontWeight: 'bold'
                              }}>
                                {set.reps || '-'}
                              </Text>
                            </View>

                            {typeof set.restSeconds === 'number' && (
                              <View>
                                <Text style={{
                                  color: colors.muted,
                                  fontSize: 10,
                                  textTransform: 'uppercase',
                                  letterSpacing: 1
                                }}>
                                  REST
                                </Text>
                                <Text style={{
                                  color: '#fbbf24',
                                  fontSize: 14,
                                  fontFamily: 'monospace',
                                  fontWeight: 'bold'
                                }}>
                                  {set.restSeconds}s
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {set.completed && (
                          <View style={{
                            width: 20,
                            height: 20,
                            borderRadius: radii.full,
                            backgroundColor: colors.success,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: 'bold' }}>
                              ✓
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </GlassCard>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={{ flex: 1, paddingBottom: 100 }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: spacing.lg, paddingHorizontal: spacing.sm }}>
        SESSION HISTORY
      </Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.xl }}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
      >
        {sortedSessions.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Calendar size={48} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 16 }}>No completed sessions yet.</Text>
          </View>
        ) : (
          sortedSessions.map((session) => {
            const workout = session.exercises;
            const exerciseCount = workout.length;
            const volume = calculateTotalVolume(workout);
            const dateLabel = new Date(session.date).toLocaleDateString();
            const timeLabel = session.finishedAt
              ? new Date(session.finishedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
              : null;

            return (
              <GlassCard
                key={session.id}
                style={{
                  marginBottom: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: 72,
                }}
              >
                <TouchableOpacity 
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => setSelectedSession(session)}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(249, 115, 22, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                    <Dumbbell size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                      {dateLabel}{timeLabel ? ` • ${timeLabel}` : ''}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {exerciseCount} Exercises • {volume} lbs
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => handleDeleteSession(session.date)} style={{ padding: spacing.sm }}>
                  <Trash2 size={20} color={colors.danger} />
                </TouchableOpacity>
              </GlassCard>
            );
          })
        )}
      </ScrollView>
      <SessionDetailModal />
    </View>
  );
};

export default HistoryView;
