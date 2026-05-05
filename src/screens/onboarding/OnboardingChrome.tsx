import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, accent, text, spacing, radii, fonts } from '../../styles/theme';
import { HeroGradient } from '../../components/HeroGradient';

type Props = {
  step: 1 | 2 | 3;
  /** Continue button label. Disabled when isContinueDisabled is true. */
  continueLabel?: string;
  isContinueDisabled?: boolean;
  isSubmitting?: boolean;
  onContinue: () => void;
  onSkip: () => void;
  children: ReactNode;
};

const TOTAL_STEPS = 3;

export const OnboardingChrome = ({
  step,
  continueLabel = 'CONTINUE',
  isContinueDisabled,
  isSubmitting,
  onContinue,
  onSkip,
  children,
}: Props) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, overflow: 'hidden' }}>
      <HeroGradient tint="orange" />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
            const idx = i + 1;
            const filled = idx <= step;
            return (
              <View
                key={idx}
                style={{
                  width: 24,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: filled ? accent.lift : palette.borderStrong,
                }}
              />
            );
          })}
        </View>
        <TouchableOpacity
          onPress={onSkip}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Skip this step"
        >
          <Text
            style={{
              color: text.tertiary,
              fontSize: 11,
              fontFamily: fonts.family.mono,
              fontWeight: fonts.weight.bold as '700',
              letterSpacing: 1.4,
              textTransform: 'uppercase',
            }}
          >
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
        {children}
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
        <TouchableOpacity
          onPress={onContinue}
          disabled={isContinueDisabled || isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={continueLabel}
          accessibilityState={{ disabled: !!(isContinueDisabled || isSubmitting) }}
          style={{
            backgroundColor: accent.lift,
            paddingVertical: spacing.lg,
            borderRadius: radii.md,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isContinueDisabled || isSubmitting ? 0.4 : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={text.primary} />
          ) : (
            <Text
              style={{
                color: text.primary,
                fontSize: 13,
                fontFamily: fonts.family.mono,
                fontWeight: fonts.weight.black as '900',
                letterSpacing: 1.6,
              }}
            >
              {continueLabel}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export const OnboardingTitle = ({ children }: { children: ReactNode }) => (
  <Text
    style={{
      color: text.primary,
      fontSize: 26,
      fontFamily: fonts.family.black,
      letterSpacing: -0.5,
      marginBottom: spacing.sm,
    }}
  >
    {children}
  </Text>
);

export const OnboardingSubtitle = ({ children }: { children: ReactNode }) => (
  <Text
    style={{
      color: text.tertiary,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: spacing.xl,
    }}
  >
    {children}
  </Text>
);
