import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { ChevronLeft, Layout, User, Plus, Search, Calendar, ChevronRight, Info } from 'lucide-react-native';
import GlassCard from '../../../components/GlassCard';
import NeonButton from '../../../components/NeonButton';
import { colors, spacing, radii } from '../../../styles/theme';
import { homeStyles } from '../../../styles';
// Removed: DEFAULT_PLANS import - plans now come from database
import { WorkoutPlan } from '../../../types/workout';
import { fetchWorkoutPlanDetails } from '../../../services/workoutService';
import { supabase } from '../../../services/supabase';

type WorkoutPlansLibraryProps = {
  visible: boolean;
  onClose: () => void;
  onSelectPlan: (plan: WorkoutPlan) => void;
  onManagePlan: (plan: WorkoutPlan) => void; // For user's plans
  onEditPlan?: (plan: WorkoutPlan) => void; // Edit user-created plans
  onSyncPlan?: (plan: WorkoutPlan) => void; // Sync with latest version
  onCreateNew?: () => void; // Function to create a new plan
  userPlans?: WorkoutPlan[]; // User's activated plan instances
  publicPlans?: WorkoutPlan[]; // Public/system plans from DB
  userCreatedPlans?: WorkoutPlan[]; // Plans created by user
  userEquipment?: 'gym' | 'bodyweight' | 'dumbbells' | 'mixed';
  userFrequency?: number;
  selectionMode?: 'activate' | 'session'; // New prop to determine button text
};

const WorkoutPlansLibrary = ({
  visible,
  onClose,
  onSelectPlan,
  onManagePlan,
  onEditPlan,
  onSyncPlan,
  onCreateNew,
  userPlans = [],
  publicPlans = [],
  userCreatedPlans = [],
  userEquipment = 'gym',
  userFrequency = 3,
  selectionMode = 'activate'
}: WorkoutPlansLibraryProps) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'myPlans'>('templates');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'public' | 'local'>('all');
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<WorkoutPlan | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Reset selected plan when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelectedPlan(null);
      setSelectedPlanDetails(null);
      setActiveTab('templates');
      setTemplateFilter('all');
    }
  }, [visible]);

  // Fetch detailed plan data when a plan is selected for details view
  React.useEffect(() => {
    const fetchPlanDetails = async () => {
      if (selectedPlan && !selectedPlan.sessions) {
        setLoadingDetails(true);
        try {
          // First verify the plan exists in the database
          const { data: planExists } = await supabase
            .from('workout_plans')
            .select('id')
            .eq('id', selectedPlan.id)
            .single();

          if (!planExists) {
            throw new Error(`Plan with ID ${selectedPlan.id} not found in database`);
          }

          const detailedPlan = await fetchWorkoutPlanDetails(selectedPlan.id);
          setSelectedPlanDetails(detailedPlan);
        } catch (error: any) {
          console.error('Error fetching plan details:', error);

          // Handle specific error cases
          if (error.message && error.message.includes('not found in database')) {
            console.warn(`Plan "${selectedPlan?.name}" not found in database, using basic data`);
            // For missing plans, still show basic info but mark as unavailable
            setSelectedPlanDetails({
              ...selectedPlan,
              description: `${selectedPlan.description}\n\n⚠️ This plan may no longer be available or has been modified.`,
              sessions: [],
              schedule: {}
            });
          } else {
            // For other errors, fallback to basic plan data
            setSelectedPlanDetails(selectedPlan);
          }
        } finally {
          setLoadingDetails(false);
        }
      } else if (selectedPlan) {
        // Plan already has details
        setSelectedPlanDetails(selectedPlan);
      }
    };

    fetchPlanDetails();
  }, [selectedPlan]);

  // Sort plans by relevance based on user preferences
  const sortPlansByRelevance = (plans: WorkoutPlan[]) => {
    return plans.map(plan => {
      let score = 0;

      // Higher score for matching equipment
      if (plan.equipment === userEquipment) score += 3;

      // Higher score for matching frequency (closer is better)
      const freqDiff = Math.abs(plan.frequency - userFrequency);
      score += Math.max(0, 2 - freqDiff); // Max 2 points for perfect match, 1 for 1-day difference, 0 for 2+ days

      return { plan, score };
    }).sort((a, b) => {
      // Sort by score descending, then by name for consistency
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.plan.name.localeCompare(b.plan.name);
    }).map(item => item.plan);
  };

  // Check if a plan is highly relevant (perfect equipment + frequency match)
  const isHighlyRelevant = (plan: WorkoutPlan) => {
    return plan.equipment === userEquipment && plan.frequency === userFrequency;
  };

  const renderPlanCard = (plan: WorkoutPlan, isUserPlan: boolean, isUserCreated: boolean = false) => (
    <GlassCard key={plan.id} style={{ marginBottom: spacing.md, padding: spacing.md }}>
      <TouchableOpacity
        onPress={() => setSelectedPlan(plan)}
        style={{
          marginBottom: spacing.sm
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: spacing.sm }}>
                {plan.name}
              </Text>
              {isHighlyRelevant(plan) && (
                <View style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: spacing.xs,
                  paddingVertical: 2,
                  borderRadius: radii.sm
                }}>
                  <Text style={{ color: '#0f172a', fontSize: 10, fontWeight: 'bold' }}>
                    RECOMMENDED
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: spacing.sm }} numberOfLines={2}>
              {plan.description}
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                borderRadius: radii.sm
              }}>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold' }}>
                  {plan.frequency}x / WEEK
                </Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                borderRadius: radii.sm
              }}>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold' }}>
                  {plan.difficulty?.toUpperCase() || 'GENERAL'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ alignItems: 'center' }}>
            <ChevronRight size={20} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>DETAILS</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TouchableOpacity
          onPress={() => onSelectPlan(plan)}
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: radii.sm,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: 'bold' }}>
            {selectionMode === 'activate' ? 'ACTIVATE' : 'SELECT PLAN'}
          </Text>
        </TouchableOpacity>

        {isUserCreated && onEditPlan && (
          <TouchableOpacity
            onPress={() => onEditPlan(plan)}
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: radii.sm,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: 'bold' }}>
              EDIT
            </Text>
          </TouchableOpacity>
        )}

        {isUserCreated && onSyncPlan && (() => {
          // Only show SYNC for plans that have a corresponding template in publicPlans
          const hasTemplate = publicPlans.some(template => template.name === plan.name);
          return hasTemplate ? (
            <TouchableOpacity
              onPress={() => onSyncPlan(plan)}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: radii.sm,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#10b981', fontSize: 12, fontWeight: 'bold' }}>
                SYNC
              </Text>
            </TouchableOpacity>
          ) : null;
        })()}
      </View>
    </GlassCard>
  );

  const renderPlanDetails = () => {
    if (!selectedPlan || !selectedPlanDetails) return null;

    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          onPress={() => {
            setSelectedPlan(null);
            setSelectedPlanDetails(null);
          }}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}
        >
          <ChevronLeft size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: 'bold', marginLeft: spacing.xs }}>BACK TO LIBRARY</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          {loadingDetails ? (
            <GlassCard style={{ padding: spacing.xl, alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 16 }}>Loading plan details...</Text>
            </GlassCard>
          ) : (
            <View>
              <GlassCard style={{ padding: spacing.xl, marginBottom: spacing.lg }}>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: spacing.sm }}>
                  {selectedPlanDetails.name}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 14, marginBottom: spacing.lg, lineHeight: 20 }}>
                  {selectedPlanDetails.description}
                </Text>

                <View style={{ flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl }}>
                  <View>
                    <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 2 }}>FREQUENCY</Text>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{selectedPlanDetails.frequency}x / week</Text>
                  </View>
                  <View>
                    <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 2 }}>DURATION</Text>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{selectedPlanDetails.duration || 8} weeks</Text>
                  </View>
                  <View>
                    <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 2 }}>LEVEL</Text>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{selectedPlanDetails.difficulty || 'All'}</Text>
                  </View>
                </View>

                <NeonButton onPress={() => onSelectPlan(selectedPlanDetails)} style={{ width: '100%' }}>
                  <Calendar size={20} color="#0f172a" />
                  <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold' }}>
                    {selectionMode === 'activate' ? 'ACTIVATE THIS PLAN' : 'SELECT THIS PLAN'}
                  </Text>
                </NeonButton>
              </GlassCard>

              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: spacing.md }}>
                WEEKLY SCHEDULE
              </Text>

              <View style={{ gap: spacing.md, marginBottom: spacing.xl }}>
            {selectedPlanDetails.schedule && selectedPlanDetails.sessions ? (
              ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const schedule = selectedPlanDetails.schedule[day as keyof typeof selectedPlanDetails.schedule];
                const hasWorkout = schedule && schedule.length > 0;
                const session = hasWorkout ? selectedPlanDetails.sessions.find(s => s.id === schedule[0].sessionId) : null;

              return (
                <GlassCard key={day} style={{ padding: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ 
                      width: 40, 
                      alignItems: 'center', 
                      marginRight: spacing.md,
                      borderRightWidth: 1,
                      borderRightColor: 'rgba(255,255,255,0.1)'
                    }}>
                      <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' }}>
                        {day.substring(0, 3)}
                      </Text>
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: hasWorkout ? '#fff' : colors.muted, fontWeight: hasWorkout ? 'bold' : 'normal' }}>
                        {hasWorkout ? session?.name : 'Rest Day'}
                      </Text>
                      {hasWorkout && session && (
                        <View>
                          <Text style={{ color: colors.muted, fontSize: 12 }}>
                            {session.exercises.length} Exercises • {session.focus.toUpperCase()}
                          </Text>
                          <View style={{ marginTop: spacing.xs }}>
                            {session.exercises.slice(0, 3).map((exercise, idx) => (
                              <Text key={idx} style={{ color: colors.muted, fontSize: 11 }}>
                                • {exercise.name} ({exercise.sets}×{exercise.repRange.min}-{exercise.repRange.max})
                              </Text>
                            ))}
                            {session.exercises.length > 3 && (
                              <Text style={{ color: colors.muted, fontSize: 11, fontStyle: 'italic' }}>
                                +{session.exercises.length - 3} more exercises...
                              </Text>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </GlassCard>
              );
            })
            ) : (
              <GlassCard style={{ padding: spacing.md }}>
                <View style={{ alignItems: 'center', padding: spacing.md }}>
                  <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center' }}>
                    This plan doesn't have detailed session information yet.
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: spacing.sm }}>
                    You can still start this plan, but the weekly schedule details are not available.
                  </Text>
                </View>
              </GlassCard>
              )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 1 }}>
            PLAN LIBRARY
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: colors.muted, fontWeight: 'bold' }}>CLOSE</Text>
          </TouchableOpacity>
        </View>

        {!selectedPlanDetails ? (
          <>
            {/* Tabs */}
            <View style={{ flexDirection: 'row', marginBottom: spacing.lg, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radii.md, padding: 4 }}>
              <TouchableOpacity
                onPress={() => setActiveTab('templates')}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  alignItems: 'center',
                  backgroundColor: activeTab === 'templates' ? colors.primary : 'transparent',
                  borderRadius: radii.sm
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Layout size={16} color={activeTab === 'templates' ? '#0f172a' : colors.muted} />
                  <Text style={{ color: activeTab === 'templates' ? '#0f172a' : colors.muted, fontWeight: 'bold' }}>TEMPLATES</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('myPlans')}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  alignItems: 'center',
                  backgroundColor: activeTab === 'myPlans' ? colors.primary : 'transparent',
                  borderRadius: radii.sm
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <User size={16} color={activeTab === 'myPlans' ? '#0f172a' : colors.muted} />
                  <Text style={{ color: activeTab === 'myPlans' ? '#0f172a' : colors.muted, fontWeight: 'bold' }}>MY PLANS</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Template Filter - Only show in templates tab */}
            {activeTab === 'templates' && (
              <View style={{ flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.sm }}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'public', label: 'Public' },
                  { key: 'local', label: 'My Templates' }
                ].map(filter => (
                  <TouchableOpacity
                    key={filter.key}
                    onPress={() => setTemplateFilter(filter.key as 'all' | 'public' | 'local')}
                    style={{
                      flex: 1,
                      paddingVertical: spacing.xs,
                      paddingHorizontal: spacing.sm,
                      backgroundColor: templateFilter === filter.key ? colors.primary : 'rgba(255,255,255,0.1)',
                      borderRadius: radii.sm,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{
                      color: templateFilter === filter.key ? '#0f172a' : colors.muted,
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* List */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {activeTab === 'templates' ? (
                <View>
                  {(() => {
                    let plansToShow: WorkoutPlan[] = [];

                    if (templateFilter === 'all') {
                      // Show unique plans from both sources
                      const allPlans = [...publicPlans, ...userCreatedPlans];
                      // Filter duplicates based on ID
                      plansToShow = Array.from(new Map(allPlans.map(p => [p.id, p])).values());
                    } else if (templateFilter === 'public') {
                      plansToShow = publicPlans;
                    } else if (templateFilter === 'local') {
                      plansToShow = userCreatedPlans;
                    }

                    return sortPlansByRelevance(plansToShow).map(plan => {
                      const isUserCreated = userCreatedPlans.some(p => p.id === plan.id);
                      return renderPlanCard(plan, false, isUserCreated);
                    });
                  })()}
                </View>
              ) : (
                <View>
                  {userPlans.length === 0 ? (
                    <View style={{ alignItems: 'center', padding: spacing.xl, opacity: 0.7 }}>
                      <Text style={{ color: colors.muted, textAlign: 'center', marginBottom: spacing.md }}>
                        You haven't created any custom plans yet.
                      </Text>
                      <NeonButton
                        onPress={() => {
                          onClose();
                          onCreateNew?.();
                        }}
                        style={{ paddingHorizontal: spacing.xl, height: 40 }}
                      >
                        <Plus size={16} color="#0f172a" />
                        <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: 'bold' }}>CREATE NEW</Text>
                      </NeonButton>
                    </View>
                  ) : (
                    sortPlansByRelevance(userPlans).map(plan => renderPlanCard(plan, true))
                  )}
                </View>
              )}
            </ScrollView>
          </>
        ) : (
          renderPlanDetails()
        )}
      </View>
    </Modal>
  );
};

export default WorkoutPlansLibrary;

