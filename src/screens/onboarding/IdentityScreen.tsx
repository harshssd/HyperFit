import React, { useState } from 'react';
import { Alert, TextInput, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthContext } from '../../contexts/AuthContext';
import { setDisplayName, setUnitsCoupled, type Units } from '../../services/profile';
import { palette, accent, text, spacing, radii, fonts } from '../../styles/theme';
import type { OnboardingStackParamList } from '../../navigation/types';
import { OnboardingChrome, OnboardingTitle, OnboardingSubtitle } from './OnboardingChrome';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Identity'>;

export const IdentityScreen = () => {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthContext();
  const defaultName =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    '';
  const defaultUnits: Units = (user?.user_metadata?.units as Units) ?? 'lb';

  const [name, setName] = useState(defaultName);
  const [units, setU] = useState<Units>(defaultUnits);
  const [submitting, setSubmitting] = useState(false);

  const persistAndAdvance = async (persistName: boolean) => {
    setSubmitting(true);
    try {
      if (persistName && name.trim() && name.trim() !== defaultName) {
        await setDisplayName(name);
      }
      if (units !== defaultUnits && user?.id) {
        await setUnitsCoupled(units, user.id);
      }
      navigation.navigate('Goal');
    } catch (e) {
      Alert.alert('Could not save', 'Try again, or skip and update from Profile later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingChrome
      step={1}
      onContinue={() => persistAndAdvance(true)}
      onSkip={() => persistAndAdvance(false)}
      isSubmitting={submitting}
    >
      <OnboardingTitle>Welcome.</OnboardingTitle>
      <OnboardingSubtitle>
        How should we address you, and how do you weigh your lifts?
      </OnboardingSubtitle>

      <Text
        style={{
          color: text.quaternary,
          fontSize: 11,
          fontFamily: fonts.family.mono,
          letterSpacing: 1.4,
          fontWeight: fonts.weight.bold as '700',
          textTransform: 'uppercase',
          marginBottom: spacing.sm,
        }}
      >
        Display name
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Alex"
        placeholderTextColor={text.disabled}
        autoCapitalize="words"
        maxLength={32}
        style={{
          backgroundColor: palette.surface,
          borderColor: name.trim() ? accent.lift : palette.borderStrong,
          borderWidth: 1,
          borderRadius: radii.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          color: text.primary,
          fontSize: 16,
          fontWeight: fonts.weight.semibold as '600',
          marginBottom: spacing.xl,
        }}
      />

      <Text
        style={{
          color: text.quaternary,
          fontSize: 11,
          fontFamily: fonts.family.mono,
          letterSpacing: 1.4,
          fontWeight: fonts.weight.bold as '700',
          textTransform: 'uppercase',
          marginBottom: spacing.sm,
        }}
      >
        Units
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {(['lb', 'kg'] as Units[]).map(u => {
          const active = units === u;
          return (
            <TouchableOpacity
              key={u}
              onPress={() => setU(u)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: active ? accent.lift : palette.borderStrong,
                backgroundColor: active ? 'rgba(252, 76, 2, 0.12)' : palette.surface,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: active ? accent.lift : text.primary,
                  fontFamily: fonts.family.mono,
                  fontWeight: fonts.weight.black as '900',
                  fontSize: 16,
                  letterSpacing: 1.6,
                }}
              >
                {u === 'lb' ? 'LB · OZ' : 'KG · ML'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingChrome>
  );
};
