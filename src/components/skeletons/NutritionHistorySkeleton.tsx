import React from 'react';
import { View } from 'react-native';
import { Skeleton, SkeletonRow } from '../Skeleton';
import { spacing, radii, palette } from '../../styles/theme';

const card = {
  backgroundColor: palette.surface,
  borderColor: palette.borderStrong,
  borderWidth: 1,
  borderRadius: radii.lg,
  padding: spacing.lg,
};

const DayRow = () => (
  <SkeletonRow gap={spacing.md}>
    <Skeleton width={56} height={11} />
    <Skeleton width={28} height={28} radius={radii.sm} />
    <View style={{ flex: 1, gap: spacing.xs }}>
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={10} />
    </View>
    <Skeleton width={36} height={11} />
  </SkeletonRow>
);

export const NutritionHistorySkeleton = () => (
  <View style={{ flex: 1, padding: spacing.xl, gap: spacing.md }}>
    <View style={card}>
      <View style={{ gap: spacing.md }}>
        <DayRow />
        <DayRow />
        <DayRow />
        <DayRow />
        <DayRow />
        <DayRow />
        <DayRow />
      </View>
    </View>
  </View>
);
