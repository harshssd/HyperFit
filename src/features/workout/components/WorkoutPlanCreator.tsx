import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { Dumbbell, Layout, PlusCircle, Calendar, ChevronRight, CheckCircle, Globe, Lock, ChevronLeft, Search, Plus, Trash2, X } from 'lucide-react-native';
import GlassCard from '../../../components/GlassCard';
import NeonButton from '../../../components/NeonButton';
import { colors, spacing, radii } from '../../../styles/theme';
import { WorkoutPlan, EquipmentType, DayOfWeek, PlanSession, SessionFocus, ScheduledSession } from '../../../types/workout';
import { DEFAULT_EXERCISES } from '../../../constants/appConstants';
// Removed: DEFAULT_PLANS import - plans come from database via props
import { fetchWorkoutPlans, fetchExercises } from '../../../services/workoutService';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

type CreatorStep = 'details' | 'sessions' | 'schedule' | 'review';

type PlanDraft = {
  name: string;
  description: string;
  frequency: number;
  equipment: EquipmentType;
  duration: number;
  isPublic: boolean;
};

// ---------------------------------------------------------------------------
// MOCK DATA (Will be replaced with real templates later)
// ---------------------------------------------------------------------------
const EQUIPMENT_OPTIONS: { key: EquipmentType; label: string; icon: string }[] = [
  { key: 'gym', label: 'Full Gym', icon: '🏋️' },
  { key: 'dumbbells', label: 'Dumbbells', icon: '🧱' },
  { key: 'bodyweight', label: 'Bodyweight', icon: '💪' },
  { key: 'mixed', label: 'Mixed', icon: '🔄' },
];

const FREQUENCY_OPTIONS = [3, 4, 5, 6];

const FOCUS_OPTIONS: { key: SessionFocus; label: string }[] = [
  { key: 'push', label: 'Push' },
  { key: 'pull', label: 'Pull' },
  { key: 'legs', label: 'Legs' },
  { key: 'upper', label: 'Upper' },
  { key: 'lower', label: 'Lower' },
  { key: 'full-body', label: 'Full Body' },
  { key: 'conditioning', label: 'Conditioning' },
  { key: 'other', label: 'Other' },
];

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

const StepIndicator = ({ currentStep }: { currentStep: CreatorStep }) => {
  const steps: CreatorStep[] = ['details', 'sessions', 'schedule', 'review'];
  const currentIndex = steps.indexOf(currentStep);

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.xl }}>
      {steps.map((step, index) => (
        <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: radii.full,
            backgroundColor: index <= currentIndex ? colors.primary : 'rgba(255, 255, 255, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: index === currentIndex ? 2 : 0,
            borderColor: index === currentIndex ? '#fff' : 'transparent',
          }}>
            <Text style={{ color: index <= currentIndex ? '#0f172a' : colors.muted, fontWeight: 'bold' }}>
              {index + 1}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View style={{
              width: 24,
              height: 2,
              backgroundColor: index < currentIndex ? colors.primary : 'rgba(255, 255, 255, 0.1)',
              marginHorizontal: spacing.xs
            }} />
          )}
        </View>
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

const WorkoutPlanCreator = ({ visible, onClose, onCreatePlan }: {
  visible: boolean;
  onClose: () => void;
  onCreatePlan: (plan: any) => void; // Using 'any' temporarily while refining types
}) => {
  const [step, setStep] = useState<CreatorStep>('details');
  const [draft, setDraft] = useState<PlanDraft>({
    name: '',
    description: '',
    frequency: 3,
    equipment: 'gym',
    duration: 4,
    isPublic: false,
  });
  
  const [sessions, setSessions] = useState<PlanSession[]>([]);
  const [schedule, setSchedule] = useState<{ [K in DayOfWeek]?: ScheduledSession[] }>({});

  // Session Editor State
  const [showSessionEditor, setShowSessionEditor] = useState(false);
  const [editingSession, setEditingSession] = useState<Partial<PlanSession>>({});
  const [sessionExerciseInput, setSessionExerciseInput] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importablePlans, setImportablePlans] = useState<WorkoutPlan[]>([]);
  const [exerciseOptions, setExerciseOptions] = useState<{ id: string; name: string }[]>([]);
  const [exerciseSuggestions, setExerciseSuggestions] = useState<{ id: string; name: string }[]>([]);

  // Schedule Editor State
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);

  // Fetch plans when import modal opens
  React.useEffect(() => {
    if (showImportModal) {
      const loadPlans = async () => {
        try {
          const plans = await fetchWorkoutPlans();
          // Filter for only public plans or user's own plans that have sessions
          // Assuming fetchWorkoutPlans returns all relevant plans based on RLS
          setImportablePlans(plans.filter((p: any) => p.sessions && p.sessions.length > 0));
        } catch (e) {
          console.error("Failed to load plans for import", e);
        }
      };
      loadPlans();
    }
  }, [showImportModal]);

  // Fetch exercises once when the creator opens (visible)
  React.useEffect(() => {
    if (!visible) return;
    const loadExercises = async () => {
      try {
        const exercises = await fetchExercises();
        // Keep only id + name for suggestions
        const mapped = exercises.map((e: any) => ({ id: e.id, name: e.name }));
        setExerciseOptions(mapped);
        setExerciseSuggestions(mapped.slice(0, 8));
      } catch (e) {
        console.error('Failed to load exercises', e);
      }
    };
    loadExercises();
  }, [visible]);

  const handleNext = () => {
    if (step === 'details') setStep('sessions');
    else if (step === 'sessions') {
      if (sessions.length === 0) {
        // Validation: Need at least one session
        alert('Please add at least one session to your plan.');
        return;
      }
      setStep('schedule');
    }
    else if (step === 'schedule') {
      // Validate that at least one session is scheduled
      const totalScheduledSessions = Object.values(schedule).reduce((total, daySessions) => total + (daySessions?.length || 0), 0);
      if (totalScheduledSessions === 0) {
        alert('Please assign at least one session to a day in your weekly schedule.');
        return;
      }
      setStep('review');
    }
    else if (step === 'review') {
      // Finalize creation
      onCreatePlan({
        ...draft,
        sessions: sessions,
        schedule: schedule,
        createdAt: new Date().toISOString(),
        isTemplate: draft.isPublic
      });
      onClose();
      resetForm();
    }
  };

  const handleBack = () => {
    if (step === 'review') setStep('schedule');
    else if (step === 'schedule') setStep('sessions');
    else if (step === 'sessions') setStep('details');
  };

  const resetForm = () => {
    setStep('details');
    setDraft({
      name: '',
      description: '',
      frequency: 3,
      equipment: 'gym',
      duration: 4,
      isPublic: false,
    });
    setSessions([]);
    setSchedule({});
    setEditingSession({});
  };

  // Session Management
  const openNewSession = () => {
    setEditingSession({
      id: `session_${Date.now()}`,
      name: '',
      description: '',
      focus: 'full-body',
      exercises: []
    });
    setShowSessionEditor(true);
  };

  const editSession = (session: PlanSession) => {
    setEditingSession({ ...session });
    setShowSessionEditor(true);
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const saveSession = () => {
    if (!editingSession.name || !editingSession.exercises) return;
    
    setSessions(prev => {
      const exists = prev.find(s => s.id === editingSession.id);
      if (exists) {
        return prev.map(s => s.id === editingSession.id ? editingSession as PlanSession : s);
      }
      return [...prev, editingSession as PlanSession];
    });
    setShowSessionEditor(false);
    setEditingSession({});
  };

  const addExerciseToSession = (selected?: { id: string; name: string }) => {
    const chosen = selected || exerciseSuggestions.find((e) => e.name.toLowerCase() === sessionExerciseInput.toLowerCase());
    if (!chosen) return;

    const newExercise = {
      id: chosen.id,
      name: chosen.name,
      primaryMuscleGroup: 'other' as any, // Simplified default until we pull full exercise meta
      sets: 3,
      repRange: { min: 8, max: 12 },
      restSeconds: 60,
      order: (editingSession.exercises?.length || 0) + 1
    };

    setEditingSession(prev => ({
      ...prev,
      exercises: [...(prev.exercises || []), newExercise]
    }));
    setSessionExerciseInput('');
    setExerciseSuggestions(exerciseOptions.slice(0, 8));
  };

  const removeExerciseFromSession = (exId: string) => {
    setEditingSession(prev => ({
      ...prev,
      exercises: (prev.exercises || []).filter(e => e.id !== exId)
    }));
  };

  const importSession = (templateSession: PlanSession) => {
    const newSession = {
      ...templateSession,
      id: `session_${Date.now()}_imported`, // New ID to avoid conflicts
      name: `${templateSession.name} (Copy)`
    };
    setSessions(prev => [...prev, newSession]);
    setShowImportModal(false);
  };

  // Schedule Management
  const openScheduleEditor = (day: DayOfWeek) => {
    setEditingDay(day);
    setShowScheduleEditor(true);
  };

  const assignSessionToDay = (sessionId: string, day: DayOfWeek, isOptional = false) => {
    const existingSessions = schedule[day] || [];
    const nextOrder = Math.max(0, ...existingSessions.map(s => s.order)) + 1;

    const newScheduledSession: ScheduledSession = {
      sessionId,
      order: nextOrder,
      isOptional
    };

    setSchedule(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), newScheduledSession]
    }));
  };

  const removeSessionFromDay = (day: DayOfWeek, sessionId: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: (prev[day] || []).filter(s => s.sessionId !== sessionId)
    }));
  };

  const toggleSessionOptional = (day: DayOfWeek, sessionId: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: (prev[day] || []).map(s =>
        s.sessionId === sessionId ? { ...s, isOptional: !s.isOptional } : s
      )
    }));
  };

  const reorderDaySessions = (day: DayOfWeek, sessionId: string, newOrder: number) => {
    setSchedule(prev => {
      const daySessions = prev[day] || [];
      const sessionIndex = daySessions.findIndex(s => s.sessionId === sessionId);
      if (sessionIndex === -1) return prev;

      const updatedSessions = [...daySessions];
      const [movedSession] = updatedSessions.splice(sessionIndex, 1);
      updatedSessions.splice(newOrder - 1, 0, { ...movedSession, order: newOrder });

      // Reorder all sessions
      const reordered = updatedSessions.map((s, index) => ({ ...s, order: index + 1 }));

      return {
        ...prev,
        [day]: reordered
      };
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.xl,
        paddingTop: 60, // Safe area
      }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {step !== 'details' && (
              <TouchableOpacity onPress={handleBack} style={{ marginRight: spacing.md }}>
                <ChevronLeft size={24} color={colors.muted} />
              </TouchableOpacity>
            )}
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', letterSpacing: 1 }}>
              CREATE PLAN
            </Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: colors.muted, fontSize: 14, fontWeight: 'bold' }}>CLOSE</Text>
          </TouchableOpacity>
        </View>

        <StepIndicator currentStep={step} />

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          
          {/* STEP 1: PLAN DETAILS */}
          {step === 'details' && (
            <View style={{ gap: spacing.xl }}>
              <GlassCard style={{ padding: spacing.xl }}>
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: 'bold', marginBottom: spacing.sm, textTransform: 'uppercase' }}>
                  Plan Name
                </Text>
                <TextInput
                  value={draft.name}
                  onChangeText={(t) => setDraft(d => ({ ...d, name: t }))}
                  placeholder="e.g., Summer Shred 2024"
                  placeholderTextColor={colors.muted}
                  style={{
                    fontSize: 18,
                    color: '#fff',
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    paddingBottom: spacing.sm,
                    marginBottom: spacing.lg
                  }}
                />

                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: 'bold', marginBottom: spacing.sm, textTransform: 'uppercase' }}>
                  Description
                </Text>
                <TextInput
                  value={draft.description}
                  onChangeText={(t) => setDraft(d => ({ ...d, description: t }))}
                  placeholder="What is the goal of this plan?"
                  placeholderTextColor={colors.muted}
                  multiline
                  style={{
                    fontSize: 16,
                    color: '#fff',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: radii.sm,
                    padding: spacing.md,
                    minHeight: 80,
                    textAlignVertical: 'top'
                  }}
                />
              </GlassCard>

              <GlassCard style={{ padding: spacing.xl }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: spacing.lg }}>
                  CONFIGURATION
                </Text>

                {/* Frequency */}
                <View style={{ marginBottom: spacing.xl }}>
                  <Text style={{ color: colors.muted, fontSize: 12, marginBottom: spacing.sm }}>WEEKLY FREQUENCY</Text>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        onPress={() => setDraft(d => ({ ...d, frequency: freq }))}
                        style={{
                          flex: 1,
                          paddingVertical: spacing.md,
                          alignItems: 'center',
                          backgroundColor: draft.frequency === freq ? colors.primary : 'rgba(255, 255, 255, 0.05)',
                          borderRadius: radii.sm,
                        }}
                      >
                        <Text style={{
                          color: draft.frequency === freq ? '#0f172a' : '#fff',
                          fontWeight: 'bold',
                          fontSize: 16
                        }}>
                          {freq}x
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Equipment */}
                <View>
                  <Text style={{ color: colors.muted, fontSize: 12, marginBottom: spacing.sm }}>REQUIRED EQUIPMENT</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {EQUIPMENT_OPTIONS.map((eq) => (
                      <TouchableOpacity
                        key={eq.key}
                        onPress={() => setDraft(d => ({ ...d, equipment: eq.key }))}
                        style={{
                          width: '48%',
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: spacing.md,
                          backgroundColor: draft.equipment === eq.key ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          borderRadius: radii.sm,
                          borderWidth: 1,
                          borderColor: draft.equipment === eq.key ? colors.primary : 'transparent'
                        }}
                      >
                        <Text style={{ fontSize: 16, marginRight: spacing.sm }}>{eq.icon}</Text>
                        <Text style={{
                          color: draft.equipment === eq.key ? colors.primary : '#fff',
                          fontWeight: 'bold',
                          fontSize: 14
                        }}>
                          {eq.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </GlassCard>

              {/* Visibility Toggle */}
              <TouchableOpacity
                onPress={() => setDraft(d => ({ ...d, isPublic: !d.isPublic }))}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.lg,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: draft.isPublic ? colors.success : 'transparent'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  {draft.isPublic ? (
                    <Globe size={24} color={colors.success} />
                  ) : (
                    <Lock size={24} color={colors.muted} />
                  )}
                  <View>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                      {draft.isPublic ? 'Public Plan' : 'Private Plan'}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {draft.isPublic ? 'Visible to community library' : 'Only visible to you'}
                    </Text>
                  </View>
                </View>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: radii.full,
                  borderWidth: 2,
                  borderColor: draft.isPublic ? colors.success : colors.muted,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {draft.isPublic && <View style={{ width: 12, height: 12, borderRadius: radii.full, backgroundColor: colors.success }} />}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: SESSIONS DEFINITION */}
          {step === 'sessions' && (
            <View style={{ gap: spacing.xl }}>
              <GlassCard style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Dumbbell size={48} color={colors.primary} />
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: spacing.md }}>
                  Define Your Sessions
                </Text>
                <Text style={{ color: colors.muted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg }}>
                  Create the different workouts that make up your plan (e.g., "Push A", "Legs", "Full Body").
                </Text>

                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <NeonButton onPress={openNewSession} style={{ paddingHorizontal: spacing.xl }}>
                    <PlusCircle size={20} color="#0f172a" />
                    <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: 'bold' }}>NEW SESSION</Text>
                  </NeonButton>
                  
                  <TouchableOpacity
                    onPress={() => setShowImportModal(true)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: radii.sm,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <Layout size={20} color="#fff" />
                    <Text style={{ marginLeft: 8, color: '#fff', fontSize: 14, fontWeight: 'bold' }}>IMPORT TEMPLATE</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>

              {/* Sessions List */}
              {sessions.length > 0 ? (
                <View style={{ gap: spacing.md }}>
                  {sessions.map((session, index) => (
                    <GlassCard key={session.id} style={{ padding: spacing.md }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{session.name}</Text>
                          <Text style={{ color: colors.muted, fontSize: 12 }}>
                            {session.focus.toUpperCase()} • {session.exercises.length} Exercises
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                          <TouchableOpacity onPress={() => editSession(session)} style={{ padding: spacing.xs }}>
                            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>EDIT</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteSession(session.id)} style={{ padding: spacing.xs }}>
                            <Trash2 size={18} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </GlassCard>
                  ))}
                </View>
              ) : (
                <Text style={{ color: colors.muted, textAlign: 'center', marginTop: spacing.lg }}>
                  No sessions added yet. Start by adding a session above.
                </Text>
              )}
            </View>
          )}

          {step === 'schedule' && (
            <View style={{ gap: spacing.xl }}>
              <GlassCard style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Calendar size={48} color={colors.primary} />
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: spacing.md }}>
                  Weekly Schedule
                </Text>
                <Text style={{ color: colors.muted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg }}>
                  Assign your sessions to specific days of the week. You can have multiple sessions per day and mark them as optional.
                </Text>
              </GlassCard>

              {/* Weekly Schedule Grid */}
              <View style={{ gap: spacing.md }}>
                {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as DayOfWeek[]).map((day) => {
                  const daySessions = schedule[day] || [];
                  const sessionCount = daySessions.length;

                  return (
                    <GlassCard key={day} style={{ padding: spacing.lg }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                        <View>
                          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'capitalize' }}>
                            {day}
                          </Text>
                          <Text style={{ color: colors.muted, fontSize: 12 }}>
                            {sessionCount} session{sessionCount !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => openScheduleEditor(day)}
                          style={{
                            backgroundColor: colors.primary,
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.sm,
                            borderRadius: radii.sm,
                          }}
                        >
                          <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 12 }}>
                            {sessionCount === 0 ? 'ADD SESSIONS' : 'EDIT'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {sessionCount > 0 ? (
                        <View style={{ gap: spacing.sm }}>
                          {daySessions
                            .sort((a, b) => a.order - b.order)
                            .map((scheduledSession) => {
                              const session = sessions.find(s => s.id === scheduledSession.sessionId);
                              if (!session) return null;

                              return (
                                <View key={scheduledSession.sessionId} style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  padding: spacing.sm,
                                  borderRadius: radii.sm,
                                }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Text style={{ color: colors.primary, fontSize: 12, marginRight: spacing.sm }}>
                                      #{scheduledSession.order}
                                    </Text>
                                    <View style={{ flex: 1 }}>
                                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                                        {session.name}
                                      </Text>
                                      <Text style={{ color: colors.muted, fontSize: 12 }}>
                                        {session.focus.toUpperCase()} • {session.exercises.length} exercises
                                      </Text>
                                    </View>
                                    {scheduledSession.isOptional && (
                                      <View style={{
                                        backgroundColor: colors.primaryBright,
                                        paddingHorizontal: spacing.xs,
                                        paddingVertical: 2,
                                        borderRadius: radii.full,
                                        marginLeft: spacing.sm
                                      }}>
                                        <Text style={{ color: '#0f172a', fontSize: 10, fontWeight: 'bold' }}>
                                          OPTIONAL
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                  <TouchableOpacity
                                    onPress={() => removeSessionFromDay(day, scheduledSession.sessionId)}
                                    style={{ padding: spacing.xs }}
                                  >
                                    <X size={16} color={colors.danger} />
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                        </View>
                      ) : (
                        <Text style={{ color: colors.muted, fontStyle: 'italic', textAlign: 'center', padding: spacing.md }}>
                          No sessions assigned to {day}
                        </Text>
                      )}
                    </GlassCard>
                  );
                })}
              </View>
            </View>
          )}

          {step === 'review' && (
            <GlassCard style={{ padding: spacing.xl, alignItems: 'center' }}>
              <CheckCircle size={48} color={colors.success} />
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: spacing.md }}>
                Ready to Publish?
              </Text>
              <Text style={{ color: colors.muted, textAlign: 'center', marginTop: spacing.sm }}>
                Review your plan details before saving.
              </Text>
              
              <View style={{ width: '100%', marginTop: spacing.xl, gap: spacing.sm }}>
                <Text style={{ color: '#fff' }}>Name: {draft.name}</Text>
                <Text style={{ color: '#fff' }}>Frequency: {draft.frequency}x / week</Text>
                <Text style={{ color: '#fff' }}>Sessions: {sessions.length}</Text>
                <Text style={{ color: '#fff' }}>Scheduled Sessions: {Object.values(schedule).reduce((total, daySessions) => total + (daySessions?.length || 0), 0)}</Text>
                <Text style={{ color: '#fff' }}>Visibility: {draft.isPublic ? 'Public' : 'Private'}</Text>

                {/* Schedule Summary */}
                <View style={{ marginTop: spacing.md }}>
                  <Text style={{ color: colors.muted, fontSize: 12, marginBottom: spacing.sm }}>WEEKLY SCHEDULE:</Text>
                  {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as DayOfWeek[]).map(day => {
                    const daySessions = schedule[day] || [];
                    if (daySessions.length === 0) return null;

                    return (
                      <Text key={day} style={{ color: '#fff', fontSize: 12, marginBottom: spacing.xs }}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}: {daySessions
                          .sort((a, b) => a.order - b.order)
                          .map(s => {
                            const session = sessions.find(sess => sess.id === s.sessionId);
                            return session ? session.name : 'Unknown';
                          })
                          .join(', ')}
                      </Text>
                    );
                  })}
                </View>
              </View>
            </GlassCard>
          )}

        </ScrollView>

        {/* Footer Actions */}
        <View style={{ paddingTop: spacing.lg }}>
          <NeonButton
            onPress={handleNext}
            style={{ width: '100%' }}
            disabled={
              (step === 'details' && !draft.name.trim()) ||
              (step === 'sessions' && sessions.length === 0) ||
              (step === 'schedule' && Object.values(schedule).reduce((total, daySessions) => total + (daySessions?.length || 0), 0) === 0)
            }
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginRight: spacing.sm }}>
              {step === 'review' ? 'CREATE PLAN' : 'NEXT STEP'}
            </Text>
            <ChevronRight size={20} color="#0f172a" />
          </NeonButton>
        </View>

        {/* Session Editor Modal */}
        <Modal visible={showSessionEditor} animationType="slide" transparent={true}>
          <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl, paddingTop: 60 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>
                {editingSession.id ? 'EDIT SESSION' : 'NEW SESSION'}
              </Text>
              <TouchableOpacity onPress={() => setShowSessionEditor(false)}>
                <Text style={{ color: colors.muted, fontWeight: 'bold' }}>CANCEL</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: spacing.lg }}>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 12, marginBottom: spacing.xs }}>SESSION NAME</Text>
                  <TextInput
                    value={editingSession.name}
                    onChangeText={(t) => setEditingSession(prev => ({ ...prev, name: t }))}
                    placeholder="e.g. Push Day"
                    placeholderTextColor={colors.muted}
                    style={{ color: '#fff', fontSize: 16, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 }}
                  />
                </View>

                <View>
                  <Text style={{ color: colors.muted, fontSize: 12, marginBottom: spacing.xs }}>FOCUS</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {FOCUS_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => setEditingSession(prev => ({ ...prev, focus: opt.key }))}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.xs,
                          backgroundColor: editingSession.focus === opt.key ? colors.primary : 'rgba(255,255,255,0.1)',
                          borderRadius: radii.full
                        }}
                      >
                        <Text style={{ color: editingSession.focus === opt.key ? '#0f172a' : '#fff', fontSize: 12, fontWeight: 'bold' }}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text style={{ color: colors.muted, fontSize: 12, marginBottom: spacing.sm }}>EXERCISES</Text>
                  
                  {/* Add Exercise Input (from master exercises) */}
                  <View style={{ marginBottom: spacing.md }}>
                    <TextInput
                      value={sessionExerciseInput}
                      onChangeText={(text) => {
                        setSessionExerciseInput(text);
                        const filtered = exerciseOptions
                          .filter((ex) => ex.name.toLowerCase().includes(text.toLowerCase()))
                          .slice(0, 8);
                        setExerciseSuggestions(filtered);
                      }}
                      placeholder="Search exercises..."
                      placeholderTextColor={colors.muted}
                      style={{ 
                        color: '#fff', 
                        backgroundColor: 'rgba(255,255,255,0.05)', 
                        borderRadius: radii.sm,
                        paddingHorizontal: spacing.md,
                        height: 40
                      }}
                    />
                    <View style={{ marginTop: spacing.xs, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: radii.sm }}>
                      {exerciseSuggestions.map((ex) => (
                        <TouchableOpacity
                          key={ex.id}
                          onPress={() => addExerciseToSession(ex)}
                          style={{ padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                        >
                          <Text style={{ color: '#fff' }}>{ex.name}</Text>
                        </TouchableOpacity>
                      ))}
                      {exerciseSuggestions.length === 0 && (
                        <Text style={{ color: colors.muted, padding: spacing.sm, fontStyle: 'italic' }}>No matches</Text>
                      )}
                    </View>
                  </View>

                  {/* Exercise List */}
                  <View style={{ gap: spacing.sm }}>
                    {editingSession.exercises?.map((ex, i) => (
                      <View key={ex.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', padding: spacing.sm, borderRadius: radii.sm }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                          <Text style={{ color: colors.muted, fontSize: 12, width: 20 }}>{i + 1}</Text>
                          <Text style={{ color: '#fff', fontSize: 14 }}>{ex.name}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeExerciseFromSession(ex.id)}>
                          <X size={16} color={colors.muted} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {(!editingSession.exercises || editingSession.exercises.length === 0) && (
                      <Text style={{ color: colors.muted, fontStyle: 'italic', fontSize: 12 }}>No exercises added yet.</Text>
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={{ paddingTop: spacing.xl }}>
              <NeonButton onPress={saveSession} style={{ width: '100%' }} disabled={!editingSession.name}>
                <Text style={{ fontWeight: 'bold' }}>SAVE SESSION</Text>
              </NeonButton>
            </View>
          </View>
        </Modal>

        {/* Import Template Modal */}
        <Modal visible={showImportModal} animationType="fade" transparent={true}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: spacing.xl }}>
            <GlassCard style={{ padding: spacing.xl, maxHeight: '80%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Import Session</Text>
                <TouchableOpacity onPress={() => setShowImportModal(false)}>
                  <X size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {importablePlans.map(plan => (
                  <View key={plan.id} style={{ marginBottom: spacing.lg }}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold', marginBottom: spacing.sm }}>
                      {plan.name.toUpperCase()}
                    </Text>
                    <View style={{ gap: spacing.xs }}>
                      {plan.sessions?.map(s => (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => importSession(s)}
                          style={{
                            padding: spacing.md,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: radii.sm,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <Text style={{ color: '#fff' }}>{s.name}</Text>
                          <PlusCircle size={16} color={colors.muted} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
                {importablePlans.length === 0 && (
                  <Text style={{ color: colors.muted, textAlign: 'center', marginTop: spacing.xl }}>
                    No templates found to import from.
                  </Text>
                )}
              </ScrollView>
            </GlassCard>
          </View>
        </Modal>

        {/* Schedule Editor Modal */}
        <Modal visible={showScheduleEditor} animationType="slide" transparent={true}>
          <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl, paddingTop: 60 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>
                SCHEDULE {editingDay?.toUpperCase()}
              </Text>
              <TouchableOpacity onPress={() => setShowScheduleEditor(false)}>
                <Text style={{ color: colors.muted, fontWeight: 'bold' }}>DONE</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: spacing.lg }}>
                <Text style={{ color: colors.muted, fontSize: 14 }}>
                  Add sessions to {editingDay}. Sessions will be ordered by the sequence you add them.
                </Text>

                {/* Current Sessions for this Day */}
                {editingDay && (schedule[editingDay] || []).length > 0 && (
                  <View style={{ gap: spacing.sm }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                      Current Sessions ({schedule[editingDay]?.length})
                    </Text>
                    {schedule[editingDay]
                      ?.sort((a, b) => a.order - b.order)
                      .map((scheduledSession) => {
                        const session = sessions.find(s => s.id === scheduledSession.sessionId);
                        if (!session) return null;

                        return (
                          <View key={scheduledSession.sessionId} style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            padding: spacing.md,
                            borderRadius: radii.sm,
                          }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                              <Text style={{ color: colors.primary, fontSize: 12, marginRight: spacing.sm }}>
                                #{scheduledSession.order}
                              </Text>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                                  {session.name}
                                </Text>
                                <Text style={{ color: colors.muted, fontSize: 12 }}>
                                  {session.focus.toUpperCase()} • {session.exercises.length} exercises
                                </Text>
                              </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                              <TouchableOpacity
                                onPress={() => toggleSessionOptional(editingDay, scheduledSession.sessionId)}
                                style={{
                                  backgroundColor: scheduledSession.isOptional ? colors.primaryBright : 'rgba(255,255,255,0.1)',
                                  paddingHorizontal: spacing.sm,
                                  paddingVertical: spacing.xs,
                                  borderRadius: radii.sm,
                                }}
                              >
                                <Text style={{
                                  color: scheduledSession.isOptional ? '#0f172a' : colors.muted,
                                  fontSize: 10,
                                  fontWeight: 'bold'
                                }}>
                                  OPTIONAL
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => removeSessionFromDay(editingDay, scheduledSession.sessionId)}
                                style={{ padding: spacing.xs }}
                              >
                                <X size={16} color={colors.danger} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                  </View>
                )}

                {/* Available Sessions to Add */}
                <View style={{ gap: spacing.sm }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                    Add Sessions
                  </Text>
                  {sessions.length > 0 ? (
                    sessions.map((session) => {
                      const isAssigned = editingDay && schedule[editingDay]?.some(s => s.sessionId === session.id);
                      if (isAssigned) return null;

                      return (
                        <TouchableOpacity
                          key={session.id}
                          onPress={() => editingDay && assignSessionToDay(session.id, editingDay)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            padding: spacing.md,
                            borderRadius: radii.sm,
                            borderWidth: 1,
                            borderColor: 'rgba(249, 115, 22, 0.3)',
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                              {session.name}
                            </Text>
                            <Text style={{ color: colors.muted, fontSize: 12 }}>
                              {session.focus.toUpperCase()} • {session.exercises.length} exercises
                            </Text>
                          </View>
                          <PlusCircle size={20} color={colors.primary} />
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={{ color: colors.muted, fontStyle: 'italic', textAlign: 'center', padding: spacing.xl }}>
                      No sessions available. Create sessions first in the previous step.
                    </Text>
                  )}
                </View>

                {/* Show assigned sessions that are already added */}
                {editingDay && schedule[editingDay]?.length === sessions.length && (
                  <Text style={{ color: colors.muted, fontStyle: 'italic', textAlign: 'center', padding: spacing.md }}>
                    All available sessions have been assigned to {editingDay}.
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>

      </View>
    </Modal>
  );
};

export default WorkoutPlanCreator;
