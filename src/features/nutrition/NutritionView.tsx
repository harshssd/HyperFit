import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flame, Plus, Salad, SlidersHorizontal } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ErrorState } from '../../components/StateView';
import { NutritionDaySkeleton } from '../../components/skeletons/NutritionDaySkeleton';
import { SharePreviewSheet } from '../../components/share/SharePreviewSheet';
import type { SharePayload } from '../../components/share/ShareableSummaryCard';
import { buildDayPayload, buildMealPayload } from './shareHelpers';
import type { NutritionEntry } from '../../services/nutritionService';
import { HeroGradient } from '../../components/HeroGradient';
import { palette, accent, text, spacing, radii, fonts } from '../../styles/theme';
import { useNutritionDayContext } from './hooks/useNutritionDay';
import { GoalSetupSheet } from './components/GoalSetupSheet';
import { EntriesList } from './components/EntriesList';
import { WaterControls } from './components/WaterControls';
import { CheatDayToggle } from './components/CheatDayToggle';
import { WeekRows } from './components/WeekRows';
import { AddMealModal } from './components/AddMealModal';
import { heroEyebrow, formatKcal } from './helpers';
import type { MealSlot } from '../../types/supabase';

/**
 * Nutrition tab — wired to user_nutrition_settings + nutrition_days +
 * nutrition_entries + water_logs + nutrition_day_summary_view.
 *
 * Pattern matches HomeView's "Today's Focus" card: orange-hairline outer
 * surface (when a goal is set), icon-chip header, compact macro readout,
 * WaterControls + ADD MEAL CTA + flat EntriesList inside. CheatDayToggle is a sibling
 * card below the focus surface.
 *
 * State boundary: this component owns presentation; useNutritionDay owns
 * data + actions. All persistence flows through the hook → service →
 * Supabase. No imperative refresh from here.
 */

const FIBER_COLOR = '#4fb3a8';
const CHEAT_BORDER = '#a855f7';

/**
 * Default meal slot picked from the wall clock when the user taps the
 * primary "+ Add meal" button. The modal still lets them pick a different
 * slot — this is just the cheap "right answer" for the typical case.
 */
const slotForHour = (hour: number): MealSlot => {
  if (hour < 10) return 'breakfast';
  if (hour < 14) return 'lunch';
  if (hour < 17) return 'snack';
  if (hour < 21) return 'dinner';
  return 'snack';
};

type AddMealRequest = { slot: MealSlot; label: string | null };

type Props = {
  /** When true, the modal opens on mount/update with a slot picked by
   *  wall clock. Used for the Home screen "Log a meal" deep link. */
  openAddMealOnMount?: boolean;
  /** Fires once the deep-link request has been consumed so the parent
   *  can flip its flag back off. */
  onAddMealConsumed?: () => void;
};

export const NutritionView = ({
  openAddMealOnMount,
  onAddMealConsumed,
}: Props = {}) => {
  const day = useNutritionDayContext();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [goalOpen, setGoalOpen] = useState(false);
  const [addMealRequest, setAddMealRequest] = useState<AddMealRequest | null>(null);
  const [editEntry, setEditEntry] = useState<NutritionEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);

  useEffect(() => {
    if (!openAddMealOnMount) return;
    const hour = new Date().getHours();
    setAddMealRequest({ slot: slotForHour(hour), label: null });
    onAddMealConsumed?.();
  }, [openAddMealOnMount, onAddMealConsumed]);

  if (day.loading) {
    return <NutritionDaySkeleton />;
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

  // Required targets fall back to migration defaults (kcal + protein are
  // the minimum every nutrition user opts in to). Optional targets read
  // raw — 0 in the DB means "not tracking", and the UI hides those
  // surfaces entirely so the user isn't fighting a phantom progress bar.
  const kcalTarget    = day.settings?.kcal_target      ?? 2200;
  const proteinTarget = day.settings?.protein_target_g ?? 160;
  const carbTarget    = day.settings?.carb_target_g    ?? 0;
  const fatTarget     = day.settings?.fat_target_g     ?? 0;
  const fiberTarget   = day.settings?.fiber_target_g   ?? 0;
  const waterTarget   = day.settings?.water_target_ml  ?? 0;
  const waterCup      = day.settings?.water_cup_ml     ?? 250;
  const waterBottle   = day.settings?.water_bottle_ml  ?? 500;
  const waterUnit     = day.settings?.water_unit       ?? 'ml';
  const cheatBudget   = day.settings?.cheat_days_per_week ?? 1;

  const tracksCarbs = carbTarget > 0;
  const tracksFat = fatTarget > 0;
  const tracksFiber = fiberTarget > 0;
  const tracksWater = waterTarget > 0;

  const kcalCurrent    = day.summary?.kcal_total      ?? 0;
  const proteinCurrent = day.summary?.protein_total_g ?? 0;
  const carbCurrent    = day.summary?.carb_total_g    ?? 0;
  const fatCurrent     = day.summary?.fat_total_g     ?? 0;
  const fiberCurrent   = day.summary?.fiber_total_g   ?? 0;
  const waterCurrent   = day.summary?.water_total_ml  ?? 0;

  const eyebrowColor = isCheat
    ? CHEAT_BORDER
    : text.tertiary;
  const surfaceBorder = isCheat ? CHEAT_BORDER : palette.borderStrong;

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
            borderTopWidth: 2,
            borderTopColor: isCheat ? surfaceBorder : accent.sessionUp,
            backgroundColor: palette.surface,
            overflow: 'hidden',
            shadowColor: surfaceBorder,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isCheat ? 0.15 : 0,
            shadowRadius: 8,
          }}
        >
          <HeroGradient tint="green" />
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
                  backgroundColor: 'rgba(0, 214, 143, 0.12)',
                  borderWidth: 1,
                  borderColor: accent.sessionUp,
                }}
              >
                <Salad size={16} color={accent.sessionUp} strokeWidth={2} />
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
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
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
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: radii.full,
                    borderWidth: 1,
                    borderColor: day.hasGoal ? palette.borderStrong : accent.lift,
                    backgroundColor: day.hasGoal
                      ? palette.surface
                      : 'rgba(252, 76, 2, 0.10)',
                  }}
                >
                  <SlidersHorizontal
                    size={11}
                    color={day.hasGoal ? text.tertiary : accent.lift}
                  />
                  <Text
                    style={{
                      color: day.hasGoal ? text.tertiary : accent.lift,
                      fontFamily: fonts.family.mono,
                      fontSize: 9,
                      letterSpacing: 1.2,
                      fontWeight: fonts.weight.heavy as '800',
                    }}
                  >
                    {day.hasGoal ? 'EDIT GOALS' : 'SET GOALS'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Macro bars row */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: spacing.lg }}>
              <MacroPill label="Protein" current={proteinCurrent} target={proteinTarget} color={accent.lift} />
              {tracksCarbs ? <MacroPill label="Carbs" current={carbCurrent}  target={carbTarget}  color={accent.sessionUp} /> : null}
              {tracksFat   ? <MacroPill label="Fat"   current={fatCurrent}   target={fatTarget}   color={text.tertiary} /> : null}
              {tracksFiber ? <MacroPill label="Fiber" current={fiberCurrent} target={fiberTarget} color={FIBER_COLOR} /> : null}
            </View>

            {/* Water → ADD MEAL CTA → flat EntriesList. The CTA sits
             * between water and the entries because adding a meal is the
             * user's main intent on this screen; the list below is the
             * receipt. Slot is picked inside AddMealModal — no per-slot
             * cards on the screen. */}
            <View style={{ gap: spacing.sm }}>
              {tracksWater ? (
                <WaterControls
                  totalMl={waterCurrent}
                  targetMl={waterTarget}
                  cupMl={waterCup}
                  bottleMl={waterBottle}
                  unit={waterUnit}
                  onAddMl={day.addWater}
                  onUndo={day.undoLastWater}
                  entries={day.waterLogs}
                  onDeleteEntry={day.deleteWaterEntry}
                />
              ) : null}

              <TouchableOpacity
                testID="nutrition-add-meal"
                onPress={() => {
                  const hour = new Date().getHours();
                  setAddMealRequest({ slot: slotForHour(hour), label: null });
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

              <EntriesList
                entries={day.entries}
                onDelete={day.deleteEntry}
                onShareDay={day.entries.length > 0
                  ? () => setSharePayload(buildDayPayload({
                      dateISO: day.date,
                      summary: day.summary ?? null,
                      entries: day.entries,
                      proteinTarget,
                      carbTarget,
                      fatTarget,
                      fiberTarget,
                      waterTarget,
                      kcalTarget,
                    }))
                  : undefined}
                onShareEntry={(entry: NutritionEntry) =>
                  setSharePayload(buildMealPayload(entry, day.date, isCheat))
                }
                onEditEntry={setEditEntry}
              />
            </View>
          </View>
        </View>

        {/* Cheat day toggle — sibling card outside the focus surface */}
        <View style={{ marginBottom: spacing.xl }}>
          <CheatDayToggle
            isCheatDay={isCheat}
            cheatBudget={cheatBudget}
            cheatsUsedThisWeek={day.cheatsUsedThisWeek}
            budgetExhausted={day.cheatBudgetExhausted}
            onToggle={day.toggleCheatDay}
          />
        </View>

        <WeekRows
          today={day.date}
          summaries={day.recentSummaries}
          onSeeAll={() => navigation.navigate('History', { initialMode: 'nutrition' })}
        />
      </ScrollView>

      <GoalSetupSheet
        visible={goalOpen}
        initial={day.settings}
        onClose={() => setGoalOpen(false)}
        onSave={day.saveSettings}
      />

      <AddMealModal
        visible={addMealRequest !== null || editEntry !== null}
        defaultSlot={
          editEntry ? (editEntry.meal_slot as 'breakfast' | 'lunch' | 'dinner' | 'snack') : addMealRequest?.slot ?? 'snack'
        }
        defaultLabel={addMealRequest?.label ?? null}
        editEntry={editEntry}
        onClose={() => {
          setAddMealRequest(null);
          setEditEntry(null);
        }}
        onSave={day.addEntry}
        onUpdate={day.updateEntry}
      />

      <SharePreviewSheet
        visible={sharePayload !== null}
        payload={sharePayload}
        onClose={() => setSharePayload(null)}
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
