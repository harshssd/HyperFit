import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton, SkeletonRow } from '../Skeleton';
import { spacing, radii, palette } from '../../styles/theme';

const card = {
  backgroundColor: palette.surface,
  borderColor: palette.borderStrong,
  borderWidth: 1,
  borderRadius: radii.lg,
  padding: spacing.lg,
};

const WeekRow = () => (
  <SkeletonRow gap={spacing.md}>
    <Skeleton width={64} height={11} />
    <Skeleton width={28} height={28} radius={radii.sm} />
    <View style={{ flex: 1 }} />
    <Skeleton width={48} height={11} />
  </SkeletonRow>
);

export const NutritionDaySkeleton = () => (
  <ScrollView
    style={{ flex: 1, backgroundColor: palette.bg }}
    contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
    showsVerticalScrollIndicator={false}
  >
    <View style={card}>
      <SkeletonRow gap={spacing.md}>
        <Skeleton width={40} height={40} radius={radii.md} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Skeleton width="55%" height={10} />
          <Skeleton width="35%" height={22} />
        </View>
        <Skeleton width={80} height={28} radius={radii.sm} />
      </SkeletonRow>
      <View style={{ height: spacing.lg }} />
      <Skeleton width="40%" height={20} />
      <View style={{ height: spacing.xs }} />
      <Skeleton width="100%" height={6} radius={radii.sm} />
      <View style={{ height: spacing.xs }} />
      <Skeleton width="20%" height={11} />
      <View style={{ height: spacing.lg }} />
      <Skeleton width="100%" height={48} radius={radii.md} />
      <View style={{ height: spacing.md }} />
      <Skeleton width="100%" height={56} radius={radii.md} />
    </View>

    <View style={card}>
      <SkeletonRow gap={spacing.md}>
        <Skeleton width={40} height={40} radius={radii.md} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Skeleton width="40%" height={10} />
          <Skeleton width="30%" height={18} />
        </View>
        <Skeleton width={48} height={28} radius={radii.full} />
      </SkeletonRow>
    </View>

    <View style={card}>
      <Skeleton width="35%" height={11} />
      <View style={{ height: spacing.md }} />
      <View style={{ gap: spacing.md }}>
        <WeekRow />
        <WeekRow />
        <WeekRow />
        <WeekRow />
      </View>
    </View>
  </ScrollView>
);
