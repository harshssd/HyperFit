import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { Dumbbell, Layout, PlusCircle, Calendar, ChevronRight, CheckCircle, Globe, Lock, ChevronLeft } from 'lucide-react-native';
import GlassCard from '../../../components/GlassCard';
import NeonButton from '../../../components/NeonButton';
import { colors, spacing, radii } from '../../../styles/theme';
import { WorkoutPlan, EquipmentType, DayOfWeek } from '../../../types/workout';

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

  const handleNext = () => {
    if (step === 'details') setStep('sessions');
    else if (step === 'sessions') setStep('schedule');
    else if (step === 'schedule') setStep('review');
    else if (step === 'review') {
      // Finalize creation
      onCreatePlan({
        ...draft,
        sessions: [], // TODO: Add actual sessions
        schedule: {}, // TODO: Add actual schedule
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

          {/* PLACEHOLDERS FOR FUTURE STEPS */}
          {step === 'sessions' && (
            <GlassCard style={{ padding: spacing.xl, alignItems: 'center' }}>
              <Dumbbell size={48} color={colors.primary} />
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: spacing.md }}>
                Define Your Sessions
              </Text>
              <Text style={{ color: colors.muted, textAlign: 'center', marginTop: spacing.sm }}>
                Here you will add sessions like "Push A", "Legs", etc.
                (Coming in next update)
              </Text>
            </GlassCard>
          )}

          {step === 'schedule' && (
            <GlassCard style={{ padding: spacing.xl, alignItems: 'center' }}>
              <Calendar size={48} color={colors.primary} />
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: spacing.md }}>
                Weekly Schedule
              </Text>
              <Text style={{ color: colors.muted, textAlign: 'center', marginTop: spacing.sm }}>
                Map your sessions to specific days of the week.
                (Coming in next update)
              </Text>
            </GlassCard>
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
                <Text style={{ color: '#fff' }}>Visibility: {draft.isPublic ? 'Public' : 'Private'}</Text>
              </View>
            </GlassCard>
          )}

        </ScrollView>

        {/* Footer Actions */}
        <View style={{ paddingTop: spacing.lg }}>
          <NeonButton
            onPress={handleNext}
            style={{ width: '100%' }}
            disabled={step === 'details' && !draft.name.trim()}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginRight: spacing.sm }}>
              {step === 'review' ? 'CREATE PLAN' : 'NEXT STEP'}
            </Text>
            <ChevronRight size={20} color="#0f172a" />
          </NeonButton>
        </View>
      </View>
    </Modal>
  );
};

export default WorkoutPlanCreator;
