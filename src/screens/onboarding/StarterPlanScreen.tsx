import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import {
  createUserWorkoutPlan,
  deactivateUserWorkoutPlans,
  findUserWorkoutPlan,
  updateUserWorkoutPlan,
} from '../../services/workoutService/userPlans';
import { markOnboarded, type Goal } from '../../services/profile';
import { palette, accent, text, spacing, radii, fonts } from '../../styles/theme';
import { OnboardingChrome, OnboardingTitle, OnboardingSubtitle } from './OnboardingChrome';
import { trackEvent, AnalyticsEvents } from '../../utils/posthog';

type PublicPlan = {
  id: string;
  name: string;
  description: string | null;
  frequency: number | null;
  duration: number | null;
};

// Per-goal preference order for the seeded plans. Ranks plans by frequency
// since that's the cleanest signal we have for goal fit:
//   build    → 4-6× hypertrophy splits (PPL, Upper/Lower) at the top
//   cut      → 5-6× higher frequency for the kcal burn
//   maintain → 3× full-body, sustainable
//   track    → no preference, default order
// Plans we don't recognize fall to the end so the recommended block stays
// curated even if seed data grows.
const goalPlanFrequencyOrder: Record<Goal, number[]> = {
  build:    [4, 5, 6, 3],
  cut:      [5, 6, 4, 3],
  maintain: [3, 4, 2, 5, 6],
  track:    [],
};

const rankPlansByGoal = (plans: PublicPlan[], goal: Goal | null): PublicPlan[] => {
  if (!goal || goal === 'track') return plans;
  const order = goalPlanFrequencyOrder[goal] ?? [];
  const rank = (p: PublicPlan) => {
    const idx = p.frequency != null ? order.indexOf(p.frequency) : -1;
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };
  return [...plans].sort((a, b) => rank(a) - rank(b));
};

export const StarterPlanScreen = () => {
  const { user } = useAuthContext();
  const goal = (user?.user_metadata?.goal as Goal | undefined) ?? null;
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rankedPlans = useMemo(() => rankPlansByGoal(plans, goal), [plans, goal]);
  const recommendedPlanId = goal && goal !== 'track' ? rankedPlans[0]?.id ?? null : null;

  useEffect(() => {
    trackEvent(AnalyticsEvents.ONBOARDING_STEP_VIEWED, {
      step: 'starter_plan',
      goal: goal ?? 'unset',
    });
  }, [goal]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('id, name, description, frequency, duration')
        .eq('is_public', true)
        .order('frequency', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.warn('starter plans fetch failed', error);
        setPlans([]);
      } else {
        setPlans((data ?? []) as PublicPlan[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finishOnboarding = async (activatePlanId: string | null) => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      if (activatePlanId) {
        await deactivateUserWorkoutPlans(user.id);
        const existing = await findUserWorkoutPlan(user.id, activatePlanId);
        if (existing) {
          await updateUserWorkoutPlan(existing.id, { is_active: true });
        } else {
          await createUserWorkoutPlan({
            user_id: user.id,
            plan_id: activatePlanId,
            is_active: true,
          });
        }
        trackEvent(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, {
          step: 'starter_plan',
          plan_id: activatePlanId,
          accepted_recommendation: activatePlanId === recommendedPlanId,
          goal: goal ?? 'unset',
        });
      } else {
        trackEvent(AnalyticsEvents.ONBOARDING_STEP_SKIPPED, {
          step: 'starter_plan',
          goal: goal ?? 'unset',
        });
      }
      await markOnboarded();
      trackEvent(AnalyticsEvents.ONBOARDING_FINISHED, {
        with_plan: Boolean(activatePlanId),
        goal: goal ?? 'unset',
      });
      // RootNavigator listens for user_metadata.onboarded_at via the auth
      // listener; once it flips, the Onboarding stack unmounts and the
      // user lands on Main automatically.
    } catch (e) {
      Alert.alert(
        'Could not finish setup',
        'We saved what we could — try again or pick a plan later from the Plans tab.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingChrome
      step={3}
      continueLabel={selected ? 'START THIS PLAN' : 'FINISH'}
      isContinueDisabled={false}
      isSubmitting={submitting}
      onContinue={() => finishOnboarding(selected)}
      onSkip={() => finishOnboarding(null)}
    >
      <OnboardingTitle>Pick a starting plan.</OnboardingTitle>
      <OnboardingSubtitle>
        You can change it any time. Skip to browse later from the Plans tab.
      </OnboardingSubtitle>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}>
        {loading ? (
          <Text style={{ color: text.tertiary, textAlign: 'center', marginTop: spacing.xl }}>
            Loading plans…
          </Text>
        ) : rankedPlans.length === 0 ? (
          <View
            style={{
              paddingVertical: spacing.xl,
              paddingHorizontal: spacing.lg,
              borderRadius: radii.md,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.borderStrong,
            }}
          >
            <Text style={{ color: text.primary, fontSize: 14, marginBottom: spacing.xs }}>
              No starter plans yet.
            </Text>
            <Text style={{ color: text.tertiary, fontSize: 13 }}>
              Tap FINISH and explore the Plans tab — you can build your own or pick one later.
            </Text>
          </View>
        ) : (
          rankedPlans.map(p => {
            const active = selected === p.id;
            const isRecommended = p.id === recommendedPlanId;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelected(active ? null : p.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  paddingVertical: spacing.lg,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: active ? accent.lift : palette.borderStrong,
                  backgroundColor: active ? 'rgba(252, 76, 2, 0.12)' : palette.surface,
                }}
              >
                {isRecommended ? (
                  <Text
                    style={{
                      color: accent.lift,
                      fontFamily: fonts.family.mono,
                      fontSize: 10,
                      fontWeight: fonts.weight.black as '900',
                      letterSpacing: 1.6,
                      marginBottom: 6,
                    }}
                  >
                    RECOMMENDED FOR YOUR GOAL
                  </Text>
                ) : null}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      color: active ? accent.lift : text.primary,
                      fontFamily: fonts.family.mono,
                      fontWeight: fonts.weight.black as '900',
                      fontSize: 15,
                      letterSpacing: 1.2,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {p.name.toUpperCase()}
                  </Text>
                  {p.frequency ? (
                    <Text
                      style={{
                        color: text.tertiary,
                        fontFamily: fonts.family.mono,
                        fontSize: 11,
                        fontWeight: fonts.weight.bold as '700',
                        letterSpacing: 1.2,
                        fontVariant: fonts.tabularNums,
                      }}
                    >
                      {p.frequency}×/WEEK
                    </Text>
                  ) : null}
                </View>
                {p.description ? (
                  <Text style={{ color: text.tertiary, fontSize: 13 }} numberOfLines={2}>
                    {p.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </OnboardingChrome>
  );
};
