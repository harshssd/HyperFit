import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { Dumbbell, Layout, PlusCircle, Calendar, ChevronRight, CheckCircle, Globe, Lock, ChevronLeft, Search, Plus, Trash2, X, Edit3, Info } from 'lucide-react-native';
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

  // Import Modal State
  const [importSearchQuery, setImportSearchQuery] = useState('');
  const [expandedPlanIds, setExpandedPlanIds] = useState<string[]>([]);
  const [loadingImportPlans, setLoadingImportPlans] = useState(false);

  // Fetch plans when import modal opens
  React.useEffect(() => {
    if (showImportModal) {
      const loadPlans = async () => {
        setLoadingImportPlans(true);
        try {
          // Fetch all plans (RLS will automatically filter to show only public plans and user's private plans)
          const plans = await fetchWorkoutPlans();
          
          // Fetch complete details for each plan to ensure we have sessions
          const plansWithDetails = await Promise.all(
            plans.map(async (plan: any) => {
              try {
                // If plan already has sessions, use it as-is
                if (plan.sessions && plan.sessions.length > 0) {
                  return plan;
                }
                // Otherwise, fetch complete details
                const { fetchWorkoutPlanDetails } = await import('../../../services/workoutService');
                return await fetchWorkoutPlanDetails(plan.id);
              } catch (e) {
                console.warn(`Failed to fetch details for plan ${plan.id}`, e);
                return plan; // Return basic plan if fetch fails
              }
            })
          );
          
          // Filter for plans that have sessions
          const validPlans = plansWithDetails.filter((p: any) => p.sessions && p.sessions.length > 0);
          setImportablePlans(validPlans);
          
          // Auto-expand the first plan
          if (validPlans.length > 0 && validPlans[0].sessions?.length > 0) {
            setExpandedPlanIds([validPlans[0].id]);
          }
        } catch (e) {
          console.error("Failed to load plans for import", e);
        } finally {
          setLoadingImportPlans(false);
        }
      };
      loadPlans();
    } else {
      // Reset state when modal closes
      setImportSearchQuery('');
      setExpandedPlanIds([]);
      setImportablePlans([]);
    }
  }, [showImportModal]);

  // Fetch exercises once when the creator opens (visible)
  React.useEffect(() => {
    if (!visible) return;
    const loadExercises = async () => {
      try {
        const exercises = await fetchExercises();
        // Keep only id + name for suggestions, deduplicate by ID
        const mapped = exercises.map((e: any) => ({ id: e.id, name: e.name }));
        // Remove duplicates by ID to prevent React key conflicts
        const uniqueMapped = Array.from(new Map(mapped.map(item => [item.id, item])).values());
        setExerciseOptions(uniqueMapped);
        setExerciseSuggestions(uniqueMapped.slice(0, 8));
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
    setSessions(prev => prev.filter(s => {
      const id = s.id || (s as any).localId;
      return id !== sessionId;
    }));
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

    // Prevent adding the same exercise twice to a session
    const existingExercise = editingSession.exercises?.find(ex => ex.id === chosen.id);
    if (existingExercise) {
      // Could show a message here, but for now just silently ignore
      setSessionExerciseInput('');
      return;
    }

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

  const importSession = (templateSession: PlanSession, sourcePlan: WorkoutPlan) => {
    // If importing from a public plan, reference the original session
    // If importing from a custom plan, create a copy
    const isPublicSource = sourcePlan.is_public;
    
    const newSession = isPublicSource 
      ? {
          // Reference the original session from public plan
          ...templateSession,
          isReference: true, // Mark as reference
          sourcePlanId: sourcePlan.id, // Store source plan ID
          sourceSessionId: templateSession.id, // Store original session ID
          // Keep the original ID for referencing but add a local ID for React keys
          localId: `session_${Date.now()}_ref`,
        }
      : {
          // Create a copy for custom plans
          ...templateSession,
          id: `session_${Date.now()}_imported`,
          name: `${templateSession.name} (Copy)`,
          isReference: false,
        };
    
    setSessions(prev => [...prev, newSession]);
    setShowImportModal(false);
  };

  const togglePlanExpansion = (planId: string) => {
    setExpandedPlanIds(prev => 
      prev.includes(planId) 
        ? prev.filter(id => id !== planId)
        : [...prev, planId]
    );
  };

  const filteredImportPlans = importablePlans.filter(plan => 
    plan.name.toLowerCase().includes(importSearchQuery.toLowerCase())
  );

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

              {/* Informational Message for Public Plans */}
              {draft.isPublic && (
                <View style={{
                  padding: spacing.md,
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: radii.md,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.success,
                  gap: spacing.xs
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <Info size={16} color={colors.success} />
                    <Text style={{ color: colors.success, fontWeight: 'bold', fontSize: 13 }}>
                      Public Plans Are Final
                    </Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16 }}>
                    Once published, public plans become read-only templates. You won't be able to edit them later. 
                    Only custom (private) plans can be edited or updated based on your preferences.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* STEP 2: SESSIONS DEFINITION */}
          {step === 'sessions' && (
            <View style={{ gap: spacing.lg }}>
              {/* Header Actions */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                  SESSIONS ({sessions.length})
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowImportModal(true)}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <Layout size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: 'bold', marginLeft: 4, fontSize: 12 }}>
                    IMPORT
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sessions List */}
              {sessions.length > 0 ? (
                <View style={{ gap: spacing.md }}>
                  {sessions.map((session, index) => {
                    const isReference = (session as any).isReference;
                    return (
                      <GlassCard key={session.id || (session as any).localId} style={{ padding: spacing.md }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 }}>
                              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                {session.name}
                              </Text>
                              {isReference && (
                                <View style={{
                                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                  paddingHorizontal: spacing.xs,
                                  paddingVertical: 2,
                                  borderRadius: radii.full
                                }}>
                                  <Text style={{ color: colors.success, fontSize: 9, fontWeight: 'bold' }}>
                                    REFERENCED
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ color: colors.muted, fontSize: 12 }}>
                              {session.focus.toUpperCase()} • {session.exercises.length} Exercises
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                            {!isReference && (
                              <TouchableOpacity 
                                onPress={() => editSession(session)} 
                                style={{ 
                                  padding: spacing.xs,
                                  backgroundColor: 'rgba(255,255,255,0.1)',
                                  borderRadius: radii.sm
                                }}
                              >
                                <Edit3 size={16} color="#fff" />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                              onPress={() => deleteSession((session as any).localId || session.id)} 
                              style={{ 
                                padding: spacing.xs,
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                borderRadius: radii.sm
                              }}
                            >
                              <Trash2 size={16} color={colors.danger} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </GlassCard>
                    );
                  })}
                </View>
              ) : (
                <View style={{ 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: spacing.xl,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderStyle: 'dashed'
                }}>
                  <Dumbbell size={48} color={colors.muted} style={{ opacity: 0.5, marginBottom: spacing.md }} />
                  <Text style={{ color: colors.muted, textAlign: 'center' }}>
                    No sessions yet. Create a session to start building your plan.
                  </Text>
                </View>
              )}

              {/* Add Session Button */}
              <NeonButton onPress={openNewSession} style={{ width: '100%', marginTop: spacing.sm }}>
                <PlusCircle size={20} color="#0f172a" />
                <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold' }}>ADD NEW SESSION</Text>
              </NeonButton>
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
                      <View key={`${ex.id}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', padding: spacing.sm, borderRadius: radii.sm }}>
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
        <Modal visible={showImportModal} animationType="slide" transparent={true}>
          <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 60 }}>
            {/* Header */}
            <View style={{ padding: spacing.xl, paddingBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 1 }}>
                  IMPORT SESSION
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowImportModal(false);
                  setImportSearchQuery('');
                  setExpandedPlanIds([]);
                }}>
                  <Text style={{ color: colors.muted, fontSize: 14, fontWeight: 'bold' }}>CLOSE</Text>
                </TouchableOpacity>
              </View>

              {/* Description */}
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: spacing.lg }}>
                Import sessions from public plans and your custom plans
              </Text>

              {/* Search Bar */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                height: 44
              }}>
                <Search size={18} color={colors.muted} />
                <TextInput
                  value={importSearchQuery}
                  onChangeText={setImportSearchQuery}
                  placeholder="Search plans..."
                  placeholderTextColor={colors.muted}
                  style={{
                    flex: 1,
                    color: '#fff',
                    fontSize: 16,
                    marginLeft: spacing.sm,
                    height: 44
                  }}
                />
                {importSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setImportSearchQuery('')}>
                    <X size={18} color={colors.muted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Informational Message */}
              <View style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                padding: spacing.md,
                borderRadius: radii.md,
                borderLeftWidth: 3,
                borderLeftColor: '#3b82f6'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                  <Info size={14} color="#3b82f6" style={{ marginTop: 1 }} />
                  <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', color: '#3b82f6' }}>Public plans</Text> will be referenced (not copied), 
                    while <Text style={{ fontWeight: 'bold', color: colors.primary }}>custom plans</Text> will be copied and can be edited.
                  </Text>
                </View>
              </View>
            </View>

            {/* Plans List */}
            <ScrollView style={{ flex: 1, paddingHorizontal: spacing.xl }} showsVerticalScrollIndicator={false}>
              {loadingImportPlans ? (
                /* Loading State */
                <View style={{ gap: spacing.md, paddingBottom: spacing.xl }}>
                  {[1, 2, 3].map(i => (
                    <GlassCard key={i} style={{ padding: spacing.md }}>
                      {/* Skeleton Plan Header */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ 
                            width: '60%', 
                            height: 16, 
                            backgroundColor: 'rgba(255,255,255,0.1)', 
                            borderRadius: radii.sm,
                            marginBottom: 6
                          }} />
                          <View style={{ 
                            width: '40%', 
                            height: 12, 
                            backgroundColor: 'rgba(255,255,255,0.06)', 
                            borderRadius: radii.sm
                          }} />
                        </View>
                        <View style={{ 
                          width: 50, 
                          height: 20, 
                          backgroundColor: 'rgba(255,255,255,0.06)', 
                          borderRadius: radii.full
                        }} />
                      </View>
                      
                      {/* Skeleton Sessions */}
                      {i === 1 && (
                        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: spacing.sm }}>
                          {[1, 2].map(j => (
                            <View key={j} style={{ 
                              paddingVertical: spacing.sm,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <View style={{ flex: 1 }}>
                                <View style={{ 
                                  width: '50%', 
                                  height: 14, 
                                  backgroundColor: 'rgba(255,255,255,0.1)', 
                                  borderRadius: radii.sm,
                                  marginBottom: 4
                                }} />
                                <View style={{ 
                                  width: '35%', 
                                  height: 11, 
                                  backgroundColor: 'rgba(255,255,255,0.06)', 
                                  borderRadius: radii.sm
                                }} />
                              </View>
                              <View style={{ 
                                width: 60, 
                                height: 24, 
                                backgroundColor: 'rgba(255,255,255,0.06)', 
                                borderRadius: radii.sm
                              }} />
                            </View>
                          ))}
                        </View>
                      )}
                    </GlassCard>
                  ))}
                  
                  {/* Loading Text */}
                  <View style={{ alignItems: 'center', marginTop: spacing.md }}>
                    <Text style={{ color: colors.muted, fontSize: 14 }}>
                      Loading plans...
                    </Text>
                  </View>
                </View>
              ) : filteredImportPlans.length > 0 ? (
                <View style={{ gap: spacing.md, paddingBottom: spacing.xl }}>
                  {filteredImportPlans.map(plan => {
                    const isExpanded = expandedPlanIds.includes(plan.id);
                    const sessionCount = plan.sessions?.length || 0;

                    return (
                      <GlassCard key={plan.id} style={{ overflow: 'hidden' }}>
                        {/* Plan Header (Collapsible) */}
                        <TouchableOpacity
                          onPress={() => togglePlanExpansion(plan.id)}
                          style={{
                            padding: spacing.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                              {plan.name}
                            </Text>
                            <Text style={{ color: colors.muted, fontSize: 12 }}>
                              {sessionCount} session{sessionCount !== 1 ? 's' : ''} • {plan.frequency}x/week
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                            <View style={{
                              backgroundColor: plan.is_public ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                              paddingHorizontal: spacing.xs,
                              paddingVertical: 2,
                              borderRadius: radii.full
                            }}>
                              <Text style={{
                                color: plan.is_public ? colors.success : colors.primary,
                                fontSize: 9,
                                fontWeight: 'bold'
                              }}>
                                {plan.is_public ? 'PUBLIC' : 'CUSTOM'}
                              </Text>
                            </View>
                            <ChevronRight 
                              size={20} 
                              color={colors.muted} 
                              style={{ 
                                transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                                transition: 'transform 0.2s'
                              }} 
                            />
                          </View>
                        </TouchableOpacity>

                        {/* Sessions List (Expandable) */}
                        {isExpanded && plan.sessions && plan.sessions.length > 0 && (
                          <View style={{ 
                            borderTopWidth: 1, 
                            borderTopColor: 'rgba(255,255,255,0.08)',
                            paddingTop: spacing.sm
                          }}>
                            {plan.sessions.map((session, index) => (
                              <TouchableOpacity
                                key={session.id}
                                onPress={() => importSession(session, plan)}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  paddingHorizontal: spacing.md,
                                  paddingVertical: spacing.sm,
                                  backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                                }}
                              >
                                <View style={{ flex: 1 }}>
                                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
                                    {session.name}
                                  </Text>
                                  <Text style={{ color: colors.muted, fontSize: 11 }}>
                                    {session.focus?.toUpperCase() || 'GENERAL'} • {session.exercises?.length || 0} exercises
                                  </Text>
                                </View>
                                <View style={{
                                  backgroundColor: 'rgba(249, 115, 22, 0.2)',
                                  paddingHorizontal: spacing.sm,
                                  paddingVertical: spacing.xs,
                                  borderRadius: radii.sm,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 4
                                }}>
                                  <PlusCircle size={12} color={colors.primary} />
                                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold' }}>
                                    IMPORT
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        {/* Empty State */}
                        {isExpanded && (!plan.sessions || plan.sessions.length === 0) && (
                          <View style={{ 
                            padding: spacing.md,
                            borderTopWidth: 1,
                            borderTopColor: 'rgba(255,255,255,0.08)'
                          }}>
                            <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', fontStyle: 'italic' }}>
                              No sessions in this plan
                            </Text>
                          </View>
                        )}
                      </GlassCard>
                    );
                  })}
                </View>
              ) : (
                <View style={{ 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: spacing.xl,
                  marginTop: spacing.xl
                }}>
                  <Layout size={48} color={colors.muted} style={{ opacity: 0.5, marginBottom: spacing.md }} />
                  <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 14 }}>
                    {importSearchQuery ? 'No plans match your search' : 'No plans available to import from'}
                  </Text>
                </View>
              )}
            </ScrollView>
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

                {/* Available Sessions to Add */}
                <View style={{ gap: spacing.sm }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                    Available Sessions
                  </Text>
                  {sessions.length > 0 ? (
                    sessions.map((session) => {
                      // Use localId for referenced sessions, id for others
                      const sessionId = (session as any).localId || session.id;
                      const isAssigned = editingDay && schedule[editingDay]?.some(s => s.sessionId === sessionId);
                      
                      return (
                        <TouchableOpacity
                          key={sessionId}
                          onPress={() => {
                            if (!editingDay) return;
                            if (isAssigned) {
                              removeSessionFromDay(editingDay, sessionId);
                            } else {
                              assignSessionToDay(sessionId, editingDay);
                            }
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isAssigned ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255,255,255,0.05)',
                            padding: spacing.md,
                            borderRadius: radii.sm,
                            borderWidth: 1,
                            borderColor: isAssigned ? colors.primary : 'transparent',
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: isAssigned ? colors.primary : '#fff', fontSize: 14, fontWeight: 'bold' }}>
                              {session.name}
                            </Text>
                            <Text style={{ color: isAssigned ? colors.primary : colors.muted, fontSize: 12 }}>
                              {session.focus.toUpperCase()} • {session.exercises.length} exercises
                            </Text>
                          </View>
                          {isAssigned ? (
                            <CheckCircle size={20} color={colors.primary} />
                          ) : (
                            <PlusCircle size={20} color={colors.muted} />
                          )}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={{ color: colors.muted, fontStyle: 'italic', textAlign: 'center', padding: spacing.xl }}>
                      No sessions available. Create sessions first in the previous step.
                    </Text>
                  )}
                </View>

                {/* Optional Toggle for Assigned Sessions */}
                {editingDay && (schedule[editingDay] || []).length > 0 && (
                  <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                      Session Options
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
                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                              {session.name}
                            </Text>
                            <TouchableOpacity
                              onPress={() => toggleSessionOptional(editingDay, scheduledSession.sessionId)}
                              style={{
                                backgroundColor: scheduledSession.isOptional ? colors.primaryBright : 'rgba(255,255,255,0.1)',
                                paddingHorizontal: spacing.sm,
                                paddingVertical: spacing.xs,
                                borderRadius: radii.full,
                              }}
                            >
                              <Text style={{
                                color: scheduledSession.isOptional ? '#0f172a' : colors.muted,
                                fontSize: 10,
                                fontWeight: 'bold'
                              }}>
                                {scheduledSession.isOptional ? 'OPTIONAL' : 'REQUIRED'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                  </View>
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
