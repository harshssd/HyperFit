import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton, SkeletonRow, SkeletonStack } from '../Skeleton';
import { spacing, radii, palette } from '../../styles/theme';

const card = {
  backgroundColor: palette.surface,
  borderColor: palette.borderStrong,
  borderWidth: 1,
  borderRadius: radii.lg,
  padding: spacing.lg,
};

export const HomeSkeleton = () => (
  <ScrollView
    style={{ flex: 1, backgroundColor: palette.bg }}
    contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
    showsVerticalScrollIndicator={false}
  >
    <View style={card}>
      <SkeletonRow gap={spacing.sm}>
        <Skeleton width={64} height={10} />
        <Skeleton width={80} height={10} />
      </SkeletonRow>
      <View style={{ height: spacing.sm }} />
      <Skeleton width="60%" height={28} radius={radii.sm} />
      <View style={{ height: spacing.xs }} />
      <Skeleton width="80%" height={14} />
      <View style={{ height: spacing.lg }} />
      <SkeletonRow gap={spacing.lg}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Skeleton width="50%" height={10} />
          <Skeleton width="70%" height={20} />
        </View>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Skeleton width="50%" height={10} />
          <Skeleton width="70%" height={20} />
        </View>
      </SkeletonRow>
    </View>

    <View style={card}>
      <SkeletonStack gap={spacing.md}>
        <Skeleton width="40%" height={11} />
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
          <Skeleton width={140} height={220} radius={radii.lg} />
        </View>
      </SkeletonStack>
    </View>

    <View style={card}>
      <SkeletonRow gap={spacing.md}>
        <Skeleton width={36} height={36} radius={radii.md} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Skeleton width="40%" height={10} />
          <Skeleton width="65%" height={20} />
        </View>
      </SkeletonRow>
      <View style={{ height: spacing.md }} />
      <Skeleton width="100%" height={6} radius={radii.sm} />
    </View>

    <View style={card}>
      <Skeleton width="40%" height={11} />
      <View style={{ height: spacing.sm }} />
      <Skeleton width="55%" height={18} />
    </View>
  </ScrollView>
);
