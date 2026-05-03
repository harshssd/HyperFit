import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronRight, Flame } from 'lucide-react-native';
import { ForkKnifeCrossed } from '../../components/icons/ForkKnifeCrossed';
import { ErrorState, LoadingState } from '../../components/StateView';
import { palette, accent, text, spacing, radii, fonts } from '../../styles/theme';
import { useNutritionDay } from './hooks/useNutritionDay';
import { GoalSetupSheet } from './components/GoalSetupSheet';
import { MealCard } from './components/MealCard';
import { WaterControls } from './components/WaterControls';
import { CheatDayToggle } from './components/CheatDayToggle';
import { heroEyebrow, formatKcal } from './helpers';
import type { MealSlot } from '../../types/supabase';

/**
 * Nutrition tab — wired to user_nutrition_settings + nutrition_days +
 * nutrition_entries + water_logs + nutrition_day_summary_view.
 *
 * Pattern matches HomeView's "Today's Focus" card: orange-hairline outer
 * surface (when a goal is set), icon-chip header, compact macro readout,
 * stack of MealCards + WaterControls inside. CheatDayToggle is a sibling
 * card below the focus surface.
 *
 * State boundary: this component owns presentation; useNutritionDay owns
 * data + actions. All persistence flows through the hook → service →
 * Supabase. No imperative refresh from here.
 */

const FIBER_COLOR = '#4fb3a8';
const CHEAT_BORDER = '#a855f7';

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch:     'Lunch',
  dinner:    'Dinner',
  snack:     'Snack',
};
const MEAL_ORDER: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const NutritionView = () => {
  const day = useNutritionDay();
  const [goalOpen, setGoalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (day.loading) {
    return <LoadingState label="Loading today" />;
  }

  if (day.error) {
    return (
      <ErrorState
        message={`Couldn't load nutrition: ${day.error.message}`}
        onRetry={day.refresh}
      />
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await day.refresh(); } finally { setRefreshing(false); }
  };

  const isCheat = day.summary?.is_cheat_day ?? false;
  const status = day.summary?.status ?? 'empty';
  const eyebrow = heroEyebrow(status, isCheat, day.hasGoal);

  // Targets resolve from settings when set; fall back to migration defaults
  // so the empty-state silhouette still has a shape to fill, with the
  // eyebrow flagging "NO GOAL SET" so the user knows to tap the header.
  const kcalTarget    = day.settings?.kcal_target      ?? 2200;
  const proteinTarget = day.settings?.protein_target_g ?? 160;
  const carbTarget    = day.settings?.carb_target_g    ?? 250;
  const fatTarget     = day.settings?.fat_target_g     ?? 70;
  const fiberTarget   = day.settings?.fiber_target_g   ?? 30;
  const waterTarget   = day.settings?.water_target_ml  ?? 2000;
  const waterCup      = day.settings?.water_cup_ml     ?? 250;
  const waterBottle   = day.settings?.water_bottle_ml  ?? 500;
  const waterUnit     = day.settings?.water_unit       ?? 'ml';
  const cheatBudget   = day.settings?.cheat_days_per_week ?? 1;

  const kcalCurrent    = day.summary?.kcal_total      ?? 0;
  const proteinCurrent = day.summary?.protein_total_g ?? 0;
  const carbCurrent    = day.summary?.carb_total_g    ?? 0;
  const fatCurrent     = day.summary?.fat_total_g     ?? 0;
  const fiberCurrent   = day.summary?.fiber_total_g   ?? 0;
  const waterCurrent   = day.summary?.water_total_ml  ?? 0;

  const eyebrowColor = isCheat
    ? CHEAT_BORDER
    : day.hasGoal
      ? accent.lift
      : text.quaternary;
  const surfaceBorder = isCheat
    ? CHEAT_BORDER
    : day.hasGoal
      ? accent.lift
      : palette.borderStrong;

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={text.tertiary}
          />
        }
      >
        {/* Today's Focus — orange (or purple on cheat day) hairline surface */}
        <View
          testID="nutrition-focus"
          style={{
            marginBottom: spacing.xl,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: surfaceBorder,
            backgroundColor: palette.surface,
            overflow: 'hidden',
            shadowColor: surfaceBorder,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: day.hasGoal ? 0.15 : 0,
            shadowRadius: 8,
          }}
        >
          <View style={{ padding: spacing.xl }}>
            {/* Header: tap-to-edit goal */}
            <TouchableOpacity
              testID="nutrition-edit-goal"
              onPress={() => setGoalOpen(true)}
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
                <ForkKnifeCrossed size={16} color={accent.lift} strokeWidth={2} />
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
                  <Text
                    style={{
                      color: text.quaternary,
                      fontWeight: '700',
                      fontSize: 16,
                    }}
                  >
                    {' / '}
                    {day.hasGoal ? formatKcal(kcalTarget) : '—'} kcal
                  </Text>
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                {day.streak > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Flame size={12} color={accent.lift} />
                    <Text
                      style={{
                        color: accent.lift,
                        fontFamily: fonts.family.mono,
                        fontSize: 12,
                        fontWeight: '800',
                        fontVariant: fonts.tabularNums,
                      }}
                    >
                      {day.streak}
                    </Text>
                  </View>
                ) : null}
                <ChevronRight size={16} color={text.tertiary} />
              </View>
            </TouchableOpacity>

            {/* Macro bars row */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: spacing.lg }}>
              <MacroPill label="Protein" current={proteinCurrent} target={proteinTarget} color={accent.lift} />
              <MacroPill label="Carbs"   current={carbCurrent}    target={carbTarget}    color={accent.sessionUp} />
              <MacroPill label="Fat"     current={fatCurrent}     target={fatTarget}     color={text.tertiary} />
              <MacroPill label="Fiber"   current={fiberCurrent}   target={fiberTarget}   color={FIBER_COLOR} />
            </View>

            {/* Water + meal cards stack */}
            <View style={{ gap: spacing.sm }}>
              <WaterControls
                totalMl={waterCurrent}
                targetMl={waterTarget}
                cupMl={waterCup}
                bottleMl={waterBottle}
                unit={waterUnit}
                onAddMl={day.addWater}
                onUndo={day.undoLastWater}
              />
              {MEAL_ORDER.map(slot => (
                <MealCard
                  key={slot}
                  slot={slot}
                  label={MEAL_LABELS[slot]}
                  entries={day.entries.filter(e => e.meal_slot === slot)}
                  onAdd={day.addEntry}
                  onDelete={day.deleteEntry}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Cheat day toggle — sibling card outside the focus surface */}
        <CheatDayToggle
          isCheatDay={isCheat}
          cheatBudget={cheatBudget}
          onToggle={day.toggleCheatDay}
        />
      </ScrollView>

      <GoalSetupSheet
        visible={goalOpen}
        initial={day.settings}
        onClose={() => setGoalOpen(false)}
        onSave={day.saveSettings}
      />
    </>
  );
};

// -- Local UI helpers --------------------------------------------------------

const Eyebrow = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <Text
    style={{
      color,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.6,
      fontFamily: fonts.family.mono,
      textTransform: 'uppercase',
    }}
  >
    {children}
  </Text>
);

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
        <Text style={{ color: text.quaternary, fontWeight: '600', fontSize: 12 }}>g</Text>
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
        {label} {target}
      </Text>
    </View>
  );
};
