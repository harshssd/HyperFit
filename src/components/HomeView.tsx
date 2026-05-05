import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  ChevronRight,
  Droplet,
  Flame,
  Salad,
  TrendingUp,
  BarChart2,
} from 'lucide-react-native';
import { homeStyles } from '../styles';
import { palette, text, accent, spacing, radii, fonts } from '../styles/theme';
import { UserData } from '../types/workout';
import { calculateXP } from '../features/workout/helpers';
import { useNutritionDayContext } from '../features/nutrition/hooks/useNutritionDay';
import { formatKcal, heroEyebrow } from '../features/nutrition/helpers';

type HomeViewProps = {
  data: UserData;
  onChangeView: (view: string) => void;
  // Streak/XP retained for back-compat; insight tiles read from `data` directly.
  streak?: number;
  xp?: number;
  /** Open the History + Analytics modal — wired from any insight tile. */
  onOpenHistory?: () => void;
};

const FIBER_COLOR = '#4fb3a8';
const CHEAT_BORDER = '#a855f7';

/**
 * HomeView — pure dashboard. Two read-only insight surfaces:
 *
 *  1. Nutrition glance: kcal readout + macro pills + water progress. Tap
 *     opens the Nutrition tab where logging happens.
 *  2. Workout insight tiles: streak / sessions this week / total XP. Tap
 *     opens the History + Analytics modal.
 *
 * No action controls live here. Workout actions live on the Workout tab,
 * nutrition actions live on the Nutrition tab. Each tab has one job.
 * Placeholders fill empty insight slots so the dashboard always reads as
 * a coherent shape, not a half-loaded page.
 */

const HomeView = ({ data, onChangeView, onOpenHistory }: HomeViewProps) => {
  const dayCtx = useNutritionDayContext();

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

  // Nutrition glance — read-only insight. Tap opens Nutrition tab where
  // WaterControls, Add Meal CTA, and the day feed live. When no goal is
  // set we show a "Set a nutrition goal" placeholder instead of macros.
  const renderNutritionGlance = () => {
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

    const kcalCurrent    = dayCtx.summary?.kcal_total      ?? 0;
    const proteinCurrent = dayCtx.summary?.protein_total_g ?? 0;
    const carbCurrent    = dayCtx.summary?.carb_total_g    ?? 0;
    const fatCurrent     = dayCtx.summary?.fat_total_g     ?? 0;
    const fiberCurrent   = dayCtx.summary?.fiber_total_g   ?? 0;
    const waterCurrent   = dayCtx.summary?.water_total_ml  ?? 0;
    const waterPct       = waterTarget > 0 ? Math.min(1, waterCurrent / waterTarget) : 0;

    return (
      <TouchableOpacity
        testID="home-nutrition"
        onPress={() => onChangeView('nutrition')}
        accessibilityRole="button"
        accessibilityLabel="Open nutrition tab to log meals and water"
        activeOpacity={0.85}
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
          <View
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
          </View>

          {dayCtx.hasGoal ? (
            <>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: spacing.lg }}>
                <MacroPill label="Protein" current={proteinCurrent} target={proteinTarget} color={accent.lift} />
                <MacroPill label="Carbs"   current={carbCurrent}    target={carbTarget}    color={accent.sessionUp} />
                <MacroPill label="Fat"     current={fatCurrent}     target={fatTarget}     color={text.tertiary} />
                <MacroPill label="Fiber"   current={fiberCurrent}   target={fiberTarget}   color={FIBER_COLOR} />
              </View>

              {/* Water progress strip — read-only mirror of the Nutrition
                  tab's WaterControls. Tap-through opens the tab where
                  +CUP / +BOTTLE buttons live. */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Droplet size={14} color={accent.sessionUp} />
                <View
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: palette.surfaceAlt,
                    overflow: 'hidden',
                  }}
                >
                  <View style={{ width: `${waterPct * 100}%`, height: '100%', backgroundColor: accent.sessionUp }} />
                </View>
                <Text
                  style={{
                    color: text.tertiary,
                    fontFamily: fonts.family.mono,
                    fontSize: 11,
                    fontWeight: '800',
                    letterSpacing: 1.2,
                    fontVariant: fonts.tabularNums,
                    textTransform: 'uppercase',
                  }}
                >
                  {Math.round(waterCurrent / 1000 * 10) / 10}L / {Math.round(waterTarget / 1000 * 10) / 10}L
                </Text>
              </View>
            </>
          ) : (
            <Placeholder
              label="Set a nutrition goal"
              hint="Tap to pick kcal + macro targets in the Nutrition tab"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Workout insight tiles — three glanceable numbers. Tap opens the History
  // + Analytics modal. Always shows numbers (0 is a valid placeholder shape).
  const renderInsightTiles = () => {
    const xp = calculateXP(data);
    const streak = data.gymLogs?.length ?? 0;
    const sevenDayCutoff = new Date();
    sevenDayCutoff.setDate(sevenDayCutoff.getDate() - 6);
    const sevenDayCutoffISO = sevenDayCutoff.toISOString().slice(0, 10);
    const sessionsThisWeek = (data.gymLogs ?? []).filter(d => d >= sevenDayCutoffISO).length;
    const hasAnyHistory = streak > 0 || xp > 0;

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
            <Eyebrow>Workout Insights</Eyebrow>
            <Text
              style={{
                color: text.primary,
                fontSize: 14,
                fontWeight: '800',
                marginTop: 2,
              }}
            >
              {hasAnyHistory ? 'Tap for full history & analytics' : 'No sessions yet'}
            </Text>
          </View>
          <ChevronRight size={16} color={text.tertiary} />
        </View>
        {hasAnyHistory ? (
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
        ) : (
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
            <Placeholder
              label="Log your first workout"
              hint="Tap the Workout tab to start a session — stats appear here once you finish"
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={homeStyles.homeView} contentContainerStyle={homeStyles.homeViewContent}>
      {renderNutritionGlance()}
      {renderInsightTiles()}
    </ScrollView>
  );
};

// Empty-state filler used inside an insight surface when there's no data
// to show yet. Kept dim and uppercase so it reads as a placeholder, not a
// real metric. Caller is responsible for the surrounding tap-through.
const Placeholder = ({ label, hint }: { label: string; hint: string }) => (
  <View
    style={{
      paddingVertical: spacing.md,
      alignItems: 'center',
      gap: 4,
    }}
  >
    <Text
      style={{
        color: text.tertiary,
        fontFamily: fonts.family.mono,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.6,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        color: text.quaternary,
        fontSize: 12,
        textAlign: 'center',
      }}
    >
      {hint}
    </Text>
  </View>
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

export default HomeView;
