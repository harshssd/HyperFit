import { palette, text, accent, spacing, radii } from '../../../../styles/theme';

/**
 * Shared style tokens for the SlimPlanCreator subcomponents. Kept here so a
 * small wording change (e.g. label letter-spacing) doesn't drift across
 * DayPicker / PlanBasicInfo / SessionExerciseEditor.
 */

export const labelStyle = {
  color: text.tertiary,
  fontFamily: 'monospace' as const,
  fontSize: 10,
  fontWeight: '700' as const,
  letterSpacing: 1.4,
  marginBottom: 4,
};

export const inputStyle = {
  color: text.primary,
  backgroundColor: palette.surface,
  borderWidth: 1,
  borderColor: palette.borderSubtle,
  borderRadius: radii.sm,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  fontSize: 14,
  marginBottom: spacing.xs,
};

export const chipStyle = {
  paddingHorizontal: spacing.sm,
  paddingVertical: 4,
  borderRadius: radii.sm,
  borderWidth: 1,
  borderColor: palette.borderSubtle,
};

export const chipActiveStyle = {
  borderColor: accent.lift,
  backgroundColor: 'rgba(252, 76, 2, 0.08)',
};

export const chipTextStyle = {
  color: text.tertiary,
  fontFamily: 'monospace' as const,
  fontSize: 10,
  fontWeight: '700' as const,
  letterSpacing: 1.2,
};

export const chipTextActiveStyle = {
  color: accent.lift,
};

export const dayChipStyle = {
  width: 36,
  height: 36,
  borderRadius: radii.sm,
  borderWidth: 1,
  borderColor: palette.borderSubtle,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

export const dayChipActiveStyle = {
  borderColor: accent.lift,
  backgroundColor: 'rgba(252, 76, 2, 0.12)',
};

export const dayChipTextStyle = {
  color: text.tertiary,
  fontFamily: 'monospace' as const,
  fontSize: 11,
  fontWeight: '700' as const,
};

export const dayChipTextActiveStyle = {
  color: accent.lift,
};
