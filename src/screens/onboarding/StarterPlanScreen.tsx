import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import {
  createUserWorkoutPlan,
  deactivateUserWorkoutPlans,
  findUserWorkoutPlan,
  updateUserWorkoutPlan,
} from '../../services/workoutService/userPlans';
import { markOnboarded } from '../../services/profile';
import { palette, accent, text, spacing, radii, fonts } from '../../styles/theme';
import { OnboardingChrome, OnboardingTitle, OnboardingSubtitle } from './OnboardingChrome';

type PublicPlan = {
  id: string;
  name: string;
  description: string | null;
  frequency: number | null;
  duration: number | null;
};

export const StarterPlanScreen = () => {
  const { user } = useAuthContext();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      }
      await markOnboarded();
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
        ) : plans.length === 0 ? (
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
          plans.map(p => {
            const active = selected === p.id;
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
