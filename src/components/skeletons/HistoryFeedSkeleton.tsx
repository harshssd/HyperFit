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

const SessionRow = () => (
  <View style={card}>
    <SkeletonRow gap={spacing.md}>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Skeleton width="35%" height={10} />
        <Skeleton width="65%" height={20} />
      </View>
      <Skeleton width={56} height={28} radius={radii.sm} />
    </SkeletonRow>
    <View style={{ height: spacing.md }} />
    <SkeletonRow gap={spacing.lg}>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Skeleton width="50%" height={9} />
        <Skeleton width="70%" height={16} />
      </View>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Skeleton width="50%" height={9} />
        <Skeleton width="70%" height={16} />
      </View>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Skeleton width="50%" height={9} />
        <Skeleton width="70%" height={16} />
      </View>
    </SkeletonRow>
  </View>
);

export const HistoryFeedSkeleton = () => (
  <View style={{ flex: 1, padding: spacing.xl, gap: spacing.md }}>
    <SessionRow />
    <SessionRow />
    <SessionRow />
    <SessionRow />
  </View>
);
