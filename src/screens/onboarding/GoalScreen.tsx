import React, { useState } from 'react';
import { Alert, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { setGoal, type Goal } from '../../services/profile';
import { trackEvent, AnalyticsEvents } from '../../utils/posthog';
import { palette, accent, text, spacing, radii, fonts } from '../../styles/theme';
import type { OnboardingStackParamList } from '../../navigation/types';
import { OnboardingChrome, OnboardingTitle, OnboardingSubtitle } from './OnboardingChrome';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Goal'>;

const OPTIONS: { id: Goal; label: string; sub: string }[] = [
  { id: 'build', label: 'BUILD', sub: 'Add muscle, lift heavier' },
  { id: 'cut', label: 'CUT', sub: 'Lean out, keep strength' },
  { id: 'maintain', label: 'MAINTAIN', sub: 'Stay where I am' },
  { id: 'track', label: 'JUST TRACK', sub: 'Log it, no agenda' },
];

export const GoalScreen = () => {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState<Goal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const advance = async (persist: boolean) => {
    setSubmitting(true);
    try {
      if (persist && selected) {
        await setGoal(selected);
        trackEvent(AnalyticsEvents.GOAL_SET, { scope: 'onboarding', goal: selected });
      }
      navigation.navigate('StarterPlan');
    } catch (e) {
      Alert.alert('Could not save', 'Try again, or skip and set this from Profile later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingChrome
      step={2}
      onContinue={() => advance(true)}
      onSkip={() => advance(false)}
      isContinueDisabled={!selected}
      isSubmitting={submitting}
    >
      <OnboardingTitle>What's the goal?</OnboardingTitle>
      <OnboardingSubtitle>
        Helps us frame future suggestions. You can change it any time from Profile.
      </OnboardingSubtitle>

      <View style={{ gap: spacing.sm }}>
        {OPTIONS.map(opt => {
          const active = selected === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setSelected(opt.id)}
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
              <Text
                style={{
                  color: active ? accent.lift : text.primary,
                  fontFamily: fonts.family.mono,
                  fontWeight: fonts.weight.black as '900',
                  fontSize: 16,
                  letterSpacing: 1.4,
                  marginBottom: 2,
                }}
              >
                {opt.label}
              </Text>
              <Text style={{ color: text.tertiary, fontSize: 13 }}>{opt.sub}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingChrome>
  );
};
