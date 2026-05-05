import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { palette, text, spacing, radii, fonts } from '../../../styles/theme';

/**
 * CheatDayToggle — flips nutrition_days.is_cheat_day for today.
 *
 * Visual: a BannerRow with a diamond gradient marker + switch on the right.
 * On = orange→purple gradient on the marker, switch slides to active.
 * Off = neutral gray.
 *
 * Budget enforcement: when cheatsUsedThisWeek >= budget AND today is not
 * already cheat, the toggle is disabled — tapping shows an alert pointing
 * at the planner strip. The user has to flip a planned cheat off (or wait
 * til next Monday) to free a slot. If today IS already cheat, the toggle
 * stays enabled so the user can flip it off and reclaim the budget.
 *
 * Cheat day is a forgiveness flag, not a tracking-off switch — meals
 * still log normally on a cheat day, the streak just doesn't break.
 * The hero eyebrow flips to "TODAY · CHEAT DAY · STREAK SAFE" when on.
 */

type Props = {
  isCheatDay: boolean;
  cheatBudget: number;
  cheatsUsedThisWeek: number;
  budgetExhausted: boolean;
  onToggle: (next: boolean) => Promise<void>;
};

const CHEAT_GRADIENT_START = '#fc4c02';
const CHEAT_GRADIENT_END = '#a855f7';

export const CheatDayToggle = ({
  isCheatDay,
  cheatBudget,
  cheatsUsedThisWeek,
  budgetExhausted,
  onToggle,
}: Props) => {
  const [busy, setBusy] = useState(false);
  // Disable iff trying to turn ON when budget is already exhausted.
  // Toggling OFF is always allowed (frees a slot).
  const disabled = budgetExhausted && !isCheatDay;

  const handleToggle = async () => {
    if (busy) return;
    if (disabled) {
      Alert.alert(
        'Cheat budget used',
        `You've used ${cheatsUsedThisWeek} of ${cheatBudget} cheat days this week. Wait until Monday or raise your weekly budget in goals.`,
      );
      return;
    }
    setBusy(true);
    try { await onToggle(!isCheatDay); } finally { setBusy(false); }
  };

  return (
    <TouchableOpacity
      testID="cheat-day-toggle"
      onPress={handleToggle}
      disabled={busy}
      activeOpacity={0.85}
      accessibilityRole="switch"
      accessibilityState={{ checked: isCheatDay }}
      accessibilityLabel="Cheat day toggle"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: isCheatDay ? CHEAT_GRADIENT_END : palette.borderStrong,
        backgroundColor: palette.surface,
        opacity: busy ? 0.6 : disabled ? 0.55 : 1,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: radii.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isCheatDay
            ? 'rgba(168, 85, 247, 0.15)'
            : palette.surfaceAlt,
          borderWidth: 1,
          borderColor: isCheatDay ? CHEAT_GRADIENT_END : palette.borderStrong,
        }}
      >
        <Sparkles
          size={16}
          color={isCheatDay ? CHEAT_GRADIENT_START : disabled ? text.disabled : text.tertiary}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            color: isCheatDay ? CHEAT_GRADIENT_END : text.quaternary,
            fontFamily: fonts.family.mono,
            fontSize: 11,
            letterSpacing: 1.6,
            fontWeight: '800',
            textTransform: 'uppercase',
          }}
        >
          Cheat Day · {cheatsUsedThisWeek} / {cheatBudget} used
        </Text>
        <Text
          style={{
            color: disabled ? text.tertiary : text.primary,
            fontSize: 15,
            fontWeight: '800',
            letterSpacing: -0.2,
          }}
        >
          {isCheatDay
            ? 'On — streak safe'
            : disabled
              ? 'Budget used'
              : 'Off today'}
        </Text>
      </View>
      <Switch on={isCheatDay} />
    </TouchableOpacity>
  );
};

const Switch = ({ on }: { on: boolean }) => (
  <View
    style={{
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: on ? 'rgba(168, 85, 247, 0.25)' : palette.surfaceAlt,
      borderWidth: 1,
      borderColor: on ? CHEAT_GRADIENT_END : palette.borderStrong,
      justifyContent: 'center',
      paddingHorizontal: 2,
    }}
  >
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: on ? CHEAT_GRADIENT_END : text.tertiary,
        alignSelf: on ? 'flex-end' : 'flex-start',
      }}
    />
  </View>
);
