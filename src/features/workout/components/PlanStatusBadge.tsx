import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, text, accent, fonts, space } from '../../../styles/theme';

export type PlanBadgeKind =
  | 'underReview'
  | 'published'
  | 'rejected'
  | 'recommended'
  | 'official'
  | 'active'
  | 'shared';

type Props = {
  kind: PlanBadgeKind;
};

/**
 * Terminal-style mono caps badge — small, low-contrast, scannable. Replaces
 * the saturated pill blobs from the prior design. Per DESIGN.md "honest mirror"
 * direction — status reads as instrument-panel labels, not iOS pills.
 */
const PlanStatusBadge = ({ kind }: Props) => {
  const config = badgeConfig[kind];
  return (
    <View testID={`plan-badge-${kind}`} style={[styles.badge, config.containerStyle]}>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const badgeConfig: Record<
  PlanBadgeKind,
  { label: string; color: string; containerStyle?: any }
> = {
  underReview: {
    label: '○ UNDER REVIEW',
    color: text.tertiary,
  },
  published: {
    label: 'PUBLISHED',
    color: accent.sessionUp,
  },
  rejected: {
    label: '✕ REJECTED',
    color: accent.regression,
  },
  recommended: {
    label: '★ RECOMMENDED',
    color: accent.lift,
  },
  official: {
    label: '[OFFICIAL]',
    color: text.tertiary,
  },
  active: {
    label: '● ACTIVE',
    color: accent.lift,
  },
  shared: {
    label: '↗ SHARED',
    color: text.tertiary,
  },
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: 'monospace',
    fontVariant: fonts.tabularNums,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});

// Group container — used to lay out multiple badges with consistent spacing.
export const PlanBadgeRow = ({ children }: { children: React.ReactNode }) => (
  <View style={badgeRowStyles.row}>{children}</View>
);

const badgeRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    flexWrap: 'wrap',
  },
});

export default PlanStatusBadge;
