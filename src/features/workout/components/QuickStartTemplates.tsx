import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Zap, Dumbbell, Footprints, Activity } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../styles/theme';

export type QuickTemplateType = 'push' | 'pull' | 'legs' | 'fullbody';

type Props = {
  onPick: (type: QuickTemplateType) => void;
};

const TEMPLATES: {
  type: QuickTemplateType;
  label: string;
  hint: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
}[] = [
  { type: 'push', label: 'PUSH', hint: 'Chest · Shoulders · Triceps', Icon: Dumbbell },
  { type: 'pull', label: 'PULL', hint: 'Back · Biceps', Icon: Activity },
  { type: 'legs', label: 'LEGS', hint: 'Quads · Hams · Calves', Icon: Footprints },
  { type: 'fullbody', label: 'FULL BODY', hint: '5 compound moves', Icon: Zap },
];

/**
 * Templates-first onboarding: when the user has no active plan, surface
 * 4 ready-to-go ad-hoc sessions so the first-run experience is "tap and lift"
 * instead of "build a plan first." Each tile invokes onQuickWorkout from
 * useWorkoutSession which seeds the session with QUICK_TEMPLATES exercises.
 */
export const QuickStartTemplates = ({ onPick }: Props) => {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>OR JUMP STRAIGHT IN</Text>
      <View style={styles.grid}>
        {TEMPLATES.map(t => (
          <TouchableOpacity
            key={t.type}
            onPress={() => onPick(t.type)}
            style={styles.tile}
            accessibilityRole="button"
            accessibilityLabel={`Start ${t.label} workout`}
          >
            <t.Icon size={22} color={colors.primary} />
            <Text style={styles.tileLabel}>{t.label}</Text>
            <Text style={styles.tileHint} numberOfLines={1}>{t.hint}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  heading: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    alignItems: 'center',
    gap: 4,
  },
  tileLabel: { color: colors.primary, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  tileHint: { color: colors.muted, fontSize: 10 },
});

export default QuickStartTemplates;
