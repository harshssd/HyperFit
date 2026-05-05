import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  ChevronRight,
  Flame,
  Plus,
  Salad,
  TrendingUp,
  BarChart2,
} from 'lucide-react-native';
import { homeStyles } from '../styles';
import { palette, text, accent, spacing, radii, fonts } from '../styles/theme';
import { UserData } from '../types/workout';
import { calculateXP } from '../features/workout/helpers';
import { useNutritionDayContext } from '../features/nutrition/hooks/useNutritionDay';
import { WaterControls } from '../features/nutrition/components/WaterControls';
import { AddMealModal } from '../features/nutrition/components/AddMealModal';
import { formatKcal, heroEyebrow } from '../features/nutrition/helpers';
import type { MealSlot } from '../types/supabase';

type HomeViewProps = {
  data: UserData;
  onChangeView: (view: string) => void;
  // Streak/XP retained for back-compat; insight tiles read from `data` directly.
  streak?: number;
  xp?: number;
  /** Open the History + Analytics modal — wired from any insight tile. */
  onOpenHistory?: () => void;
};

// Daypart-aware default slot for the "+ Add meal" CTA. Modal still lets
// the user pick a different slot; this is the cheap "right answer."
const slotForHour = (hour: number): MealSlot => {
  if (hour < 10) return 'breakfast';
  if (hour < 14) return 'lunch';
  if (hour < 17) return 'snack';
  if (hour < 21) return 'dinner';
  return 'snack';
};

const FIBER_COLOR = '#4fb3a8';
const CHEAT_BORDER = '#a855f7';

/**
 * HomeView — pure dashboard. Two surfaces:
 *
 *  1. Fuel card: inline macro pills + WaterControls + Add Meal CTA. Same
 *     state as the Nutrition tab via NutritionDayProvider, so logging from
 *     either surface updates the other immediately.
 *  2. Insight tiles: streak / sessions this week / total XP. Tap anywhere →
 *     opens the History + Analytics modal.
 *
 * No "start a workout" affordance lives here. The Workout tab owns the full
 * session-start surface (Today's Session, Alternate, Manual, Browse Library,
 * Next 7 Days). Resolves FINDING-003 — Home/Plans IA overlap — by giving
 * each tab one job.
 */

const HomeView = ({ data, onChangeView, onOpenHistory }: HomeViewProps) => {
  const dayCtx = useNutritionDayContext();
  const [addMealRequest, setAddMealRequest] = useState<{ slot: MealSlot } | null>(null);

  // Reusable section caption — small uppercase mono label that anchors each
  // sub-block to the broader visual language.
  const Eyebrow = ({
    children,
    color = text.quaternary,
  }: {
    children: React.ReactNode;
    color?: string;
  }) => (
    <Text
      style={{
        color,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.6,
        fontFamily: 'monospace',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );

  // Inline Fuel card — same data + same controls as the Nutrition tab.
  // Reused via NutritionDayProvider so logging here updates Nutrition too.
  const renderFuelCard = () => {
    const isCheat = dayCtx.summary?.is_cheat_day ?? false;
    const status = dayCtx.summary?.status ?? 'empty';
    const eyebrow = heroEyebrow(status, isCheat, dayCtx.hasGoal);
    const surfaceBorder = isCheat
      ? CHEAT_BORDER
      : dayCtx.hasGoal
        ? accent.lift
        : palette.borderStrong;
    const eyebrowColor = isCheat
      ? CHEAT_BORDER
      : dayCtx.hasGoal
        ? accent.lift
        : text.quaternary;

    const kcalTarget    = dayCtx.settings?.kcal_target      ?? 2200;
    const proteinTarget = dayCtx.settings?.protein_target_g ?? 160;
    const carbTarget    = dayCtx.settings?.carb_target_g    ?? 250;
    const fatTarget     = dayCtx.settings?.fat_target_g     ?? 70;
    const fiberTarget   = dayCtx.settings?.fiber_target_g   ?? 30;
    const waterTarget   = dayCtx.settings?.water_target_ml  ?? 2000;
    const waterCup      = dayCtx.settings?.water_cup_ml     ?? 250;
    const waterBottle   = dayCtx.settings?.water_bottle_ml  ?? 500;
    const waterUnit     = dayCtx.settings?.water_unit       ?? 'ml';

    const kcalCurrent    = dayCtx.summary?.kcal_total      ?? 0;
    const proteinCurrent = dayCtx.summary?.protein_total_g ?? 0;
    const carbCurrent    = dayCtx.summary?.carb_total_g    ?? 0;
    const fatCurrent     = dayCtx.summary?.fat_total_g     ?? 0;
    const fiberCurrent   = dayCtx.summary?.fiber_total_g   ?? 0;
    const waterCurrent   = dayCtx.summary?.water_total_ml  ?? 0;

    return (
      <View
        testID="home-fuel"
        style={{
          marginBottom: spacing.xl,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: surfaceBorder,
          backgroundColor: palette.surface,
          overflow: 'hidden',
          shadowColor: surfaceBorder,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: dayCtx.hasGoal ? 0.15 : 0.2,
          shadowRadius: 8,
        }}
      >
        <View style={{ padding: spacing.xl }}>
          <TouchableOpacity
            testID="home-fuel-header"
            onPress={() => onChangeView('nutrition')}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingBottom: spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: palette.borderStrong,
              marginBottom: spacing.lg,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: radii.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(252, 76, 2, 0.12)',
                borderWidth: 1,
                borderColor: accent.lift,
              }}
            >
              <Salad size={16} color={accent.lift} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
              <Text
                style={{
                  color: text.primary,
                  fontSize: 22,
                  fontWeight: '900',
                  letterSpacing: -0.4,
                  marginTop: 2,
                  fontVariant: fonts.tabularNums,
                }}
                numberOfLines={1}
              >
                {formatKcal(kcalCurrent)}
                <Text style={{ color: text.quaternary, fontWeight: '700', fontSize: 16 }}>
                  {' / '}{dayCtx.hasGoal ? formatKcal(kcalTarget) : '—'} kcal
                </Text>
              </Text>
            </View>
            <ChevronRight size={16} color={text.tertiary} />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: spacing.lg }}>
            <MacroPill label="Protein" current={proteinCurrent} target={proteinTarget} color={accent.lift} />
            <MacroPill label="Carbs"   current={carbCurrent}    target={carbTarget}    color={accent.sessionUp} />
            <MacroPill label="Fat"     current={fatCurrent}     target={fatTarget}     color={text.tertiary} />
            <MacroPill label="Fiber"   current={fiberCurrent}   target={fiberTarget}   color={FIBER_COLOR} />
          </View>

          <View style={{ gap: spacing.sm }}>
            <WaterControls
              totalMl={waterCurrent}
              targetMl={waterTarget}
              cupMl={waterCup}
              bottleMl={waterBottle}
              unit={waterUnit}
              onAddMl={dayCtx.addWater}
              onUndo={dayCtx.undoLastWater}
            />

            <TouchableOpacity
              testID="home-add-meal"
              onPress={() => {
                const hour = new Date().getHours();
                setAddMealRequest({ slot: slotForHour(hour) });
              }}
              accessibilityRole="button"
              accessibilityLabel="Add meal entry"
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                paddingVertical: spacing.md,
                marginTop: spacing.xs,
                borderRadius: radii.md,
                backgroundColor: accent.lift,
              }}
            >
              <Plus size={16} color="#fff" strokeWidth={3} />
              <Text
                style={{
                  color: '#fff',
                  fontFamily: fonts.family.mono,
                  fontSize: 12,
                  letterSpacing: 2.2,
                  textTransform: 'uppercase',
                  fontWeight: '800',
                }}
              >
                Add meal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Insight tiles — three glanceable numbers backed by data we already have
  // (no new fetches). Tapping anywhere opens the History + Analytics modal.
  const renderInsightTiles = () => {
    const xp = calculateXP(data);
    const streak = data.gymLogs?.length ?? 0;
    const sevenDayCutoff = new Date();
    sevenDayCutoff.setDate(sevenDayCutoff.getDate() - 6);
    const sevenDayCutoffISO = sevenDayCutoff.toISOString().slice(0, 10);
    const sessionsThisWeek = (data.gymLogs ?? []).filter(d => d >= sevenDayCutoffISO).length;

    const Tile = ({
      icon,
      value,
      label,
      tint,
    }: {
      icon: React.ReactNode;
      value: number;
      label: string;
      tint: string;
    }) => (
      <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: radii.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: palette.surfaceAlt,
            borderWidth: 1,
            borderColor: tint,
          }}
        >
          {icon}
        </View>
        <Text
          style={{
            color: text.primary,
            fontSize: 22,
            fontWeight: '900',
            letterSpacing: -0.4,
            fontVariant: fonts.tabularNums,
            marginTop: 2,
          }}
        >
          {value}
        </Text>
        <Eyebrow>{label}</Eyebrow>
      </View>
    );

    return (
      <TouchableOpacity
        testID="home-insights"
        onPress={() => onOpenHistory?.()}
        accessibilityRole="button"
        accessibilityLabel="Open history and analytics"
        activeOpacity={0.85}
        style={{
          marginBottom: spacing.xl,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: palette.borderStrong,
          backgroundColor: palette.surface,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: palette.borderStrong,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: radii.sm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.surfaceAlt,
              borderWidth: 1,
              borderColor: palette.borderStrong,
            }}
          >
            <BarChart2 size={14} color={text.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow>Insights</Eyebrow>
            <Text
              style={{
                color: text.primary,
                fontSize: 14,
                fontWeight: '800',
                marginTop: 2,
              }}
            >
              Tap for full history & analytics
            </Text>
          </View>
          <ChevronRight size={16} color={text.tertiary} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.lg,
            gap: spacing.md,
          }}
        >
          <Tile
            icon={<Flame size={14} color={accent.lift} />}
            value={streak}
            label="Day Streak"
            tint={accent.lift}
          />
          <Tile
            icon={<TrendingUp size={14} color={accent.sessionUp} />}
            value={sessionsThisWeek}
            label="This Week"
            tint={accent.sessionUp}
          />
          <Tile
            icon={<BarChart2 size={14} color={text.secondary} />}
            value={xp}
            label="Total XP"
            tint={palette.borderStrong}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <ScrollView style={homeStyles.homeView} contentContainerStyle={homeStyles.homeViewContent}>
        {renderFuelCard()}
        {renderInsightTiles()}
      </ScrollView>

      <AddMealModal
        visible={addMealRequest !== null}
        defaultSlot={addMealRequest?.slot ?? 'snack'}
        defaultLabel={null}
        onClose={() => setAddMealRequest(null)}
        onSave={dayCtx.addEntry}
      />
    </>
  );
};

const MacroPill = ({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) => {
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text
        style={{
          color: text.primary,
          fontSize: 14,
          fontWeight: '800',
          letterSpacing: -0.02,
          fontVariant: fonts.tabularNums,
        }}
      >
        {current}
        <Text style={{ color: text.quaternary, fontWeight: '600', fontSize: 12 }}>
          {target > 0 ? ` / ${target}g` : 'g'}
        </Text>
      </Text>
      <View
        style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: palette.borderStrong,
          overflow: 'hidden',
        }}
      >
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color }} />
      </View>
      <Text
        style={{
          fontFamily: fonts.family.mono,
          fontSize: 9,
          letterSpacing: 1.6,
          color: text.quaternary,
          textTransform: 'uppercase',
          fontWeight: '700',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

export default HomeView;
