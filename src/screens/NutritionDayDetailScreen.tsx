import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Share2 } from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { LoadingState, EmptyState, ErrorState } from '../components/StateView';
import { palette, accent, text, spacing, radii, fonts } from '../styles/theme';
import { useUser } from '../contexts/UserContext';
import {
  getDaySummary,
  getEntriesByDate,
  getSettings,
  type NutritionDaySummary,
  type NutritionEntry,
  type NutritionSettings,
} from '../services/nutritionService';
import { buildDayPayload } from '../features/nutrition/shareHelpers';
import {
  SharePreviewSheet,
} from '../components/share/SharePreviewSheet';
import type {
  SharePayload,
} from '../components/share/ShareableSummaryCard';
import type { RootStackParamList } from '../navigation/types';
import type { MealSlot } from '../types/supabase';

type Route = RouteProp<RootStackParamList, 'NutritionDayDetail'>;

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'BFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
  snack: 'SNACK',
};

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

const formatHeaderDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return `${DAY_NAMES[d.getDay()]} · ${MONTH_NAMES[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
};

const FIBER_COLOR = '#4fb3a8';

/**
 * Read-only day detail — meals + macros for one past nutrition day.
 * Mirrors the SessionDetail modal pattern: opened from a row in the
 * History modal's NUTRITION segment, lets the user share the whole day.
 */
export const NutritionDayDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { user } = useUser();
  const date = route.params?.date;

  const [summary, setSummary] = useState<NutritionDaySummary | null>(null);
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [settings, setSettings] = useState<NutritionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);

  const load = useCallback(async () => {
    if (!user?.id || !date) return;
    try {
      setLoading(true);
      const [s, e, st] = await Promise.all([
        getDaySummary(user.id, date),
        getEntriesByDate(user.id, date),
        getSettings(user.id),
      ]);
      setSummary(s);
      setEntries(e);
      setSettings(st);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load nutrition day');
    } finally {
      setLoading(false);
    }
  }, [user?.id, date]);

  useEffect(() => { load(); }, [load]);

  const close = () => navigation.goBack();

  const handleShare = () => {
    if (entries.length === 0) return;
    setSharePayload(
      buildDayPayload({
        dateISO: date,
        summary,
        entries,
        proteinTarget: settings?.protein_target_g ?? 0,
        carbTarget: settings?.carb_target_g ?? 0,
        fatTarget: settings?.fat_target_g ?? 0,
        fiberTarget: settings?.fiber_target_g ?? 0,
        waterTarget: settings?.water_target_ml ?? 0,
        kcalTarget: settings?.kcal_target ?? summary?.kcal_target ?? 0,
      }),
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: palette.bg }}
    >
      <View style={{ height: 2, backgroundColor: accent.lift }} />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: Platform.OS === 'ios' ? spacing.sm : spacing.md,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: palette.borderStrong,
          backgroundColor: palette.bg,
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={close}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: radii.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.borderStrong,
          }}
        >
          <ChevronDown size={18} color={text.secondary} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{
              color: text.primary,
              fontFamily: fonts.family.black,
              fontSize: 13,
              letterSpacing: 1.8,
            }}
          >
            {formatHeaderDate(date)}
          </Text>
          <Text
            style={{
              color: text.quaternary,
              fontSize: 10,
              fontFamily: fonts.family.mono,
              fontWeight: fonts.weight.bold as '700',
              letterSpacing: 1.2,
              marginTop: 2,
              textTransform: 'uppercase',
            }}
          >
            Nutrition · Day
          </Text>
        </View>

        {entries.length > 0 ? (
          <TouchableOpacity
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share this day"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: radii.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(252, 76, 2, 0.10)',
              borderWidth: 1,
              borderColor: accent.lift,
            }}
          >
            <Share2 size={16} color={accent.lift} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {loading ? (
        <LoadingState label="Loading day…" />
      ) : err ? (
        <ErrorState message={err} onRetry={load} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg }}
        >
          <Totals summary={summary} />
          {entries.length === 0 ? (
            <View style={{ marginTop: spacing.xl }}>
              <EmptyState
                title="No meals logged"
                message="Nothing was logged on this date."
              />
            </View>
          ) : (
            <View
              style={{
                marginTop: spacing.lg,
                backgroundColor: palette.surfaceAlt,
                borderColor: palette.borderStrong,
                borderWidth: 1,
                borderRadius: radii.md,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  paddingHorizontal: spacing.md,
                  paddingTop: spacing.md,
                  paddingBottom: spacing.sm,
                }}
              >
                <Text
                  style={{
                    color: text.quaternary,
                    fontFamily: fonts.family.mono,
                    fontSize: 11,
                    letterSpacing: 1.6,
                    fontWeight: fonts.weight.heavy as '800',
                    textTransform: 'uppercase',
                  }}
                >
                  Meals · {entries.length} {entries.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
              {[...entries]
                .sort((a, b) => {
                  const ta = a.logged_at ? Date.parse(a.logged_at) : 0;
                  const tb = b.logged_at ? Date.parse(b.logged_at) : 0;
                  return tb - ta;
                })
                .map((entry, idx) => (
                  <DetailEntryRow key={entry.id} entry={entry} isFirst={idx === 0} />
                ))}
            </View>
          )}
        </ScrollView>
      )}

      <SharePreviewSheet
        visible={sharePayload !== null}
        payload={sharePayload}
        onClose={() => setSharePayload(null)}
      />
    </SafeAreaView>
  );
};

const Totals = ({ summary }: { summary: NutritionDaySummary | null }) => {
  if (!summary) {
    return (
      <View
        style={{
          padding: spacing.lg,
          borderRadius: radii.md,
          backgroundColor: palette.surfaceAlt,
          borderWidth: 1,
          borderColor: palette.borderStrong,
        }}
      >
        <Text style={{ color: text.tertiary, fontSize: 13 }}>
          No summary available for this day.
        </Text>
      </View>
    );
  }
  return (
    <View
      style={{
        padding: spacing.lg,
        borderRadius: radii.md,
        backgroundColor: palette.surfaceAlt,
        borderWidth: 1,
        borderColor: palette.borderStrong,
      }}
    >
      <Text
        style={{
          color: text.primary,
          fontFamily: fonts.family.mono,
          fontSize: 22,
          fontWeight: '800',
          fontVariant: fonts.tabularNums,
        }}
      >
        {summary.kcal_total.toLocaleString()}
        <Text style={{ color: text.quaternary, fontSize: 14, fontWeight: '600' }}>
          {' / '}
          {summary.kcal_target.toLocaleString()} kcal
        </Text>
      </Text>
      <Text
        style={{
          marginTop: 6,
          color: text.tertiary,
          fontFamily: fonts.family.mono,
          fontSize: 12,
          letterSpacing: 0.4,
          fontVariant: fonts.tabularNums,
        }}
      >
        {summary.protein_total_g}P · {summary.carb_total_g}C · {summary.fat_total_g}F ·{' '}
        <Text style={{ color: FIBER_COLOR }}>{summary.fiber_total_g}fib</Text>
        {summary.water_total_ml > 0 ? (
          <Text style={{ color: accent.sessionUp }}>
            {' · '}
            {summary.water_total_ml.toLocaleString()}ml
          </Text>
        ) : null}
      </Text>
    </View>
  );
};

const DetailEntryRow = ({ entry, isFirst }: { entry: NutritionEntry; isFirst: boolean }) => {
  const slot = entry.meal_slot as MealSlot | null;
  const slotLabel = entry.meal_label?.trim()
    ? entry.meal_label.toUpperCase()
    : slot
      ? SLOT_LABELS[slot]
      : 'MEAL';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderTopWidth: isFirst ? 1 : 0,
        borderBottomWidth: 1,
        borderTopColor: palette.borderStrong,
        borderBottomColor: palette.borderSubtle,
      }}
    >
      <View
        style={{
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: radii.xs,
          borderWidth: 1,
          borderColor: accent.lift,
          backgroundColor: 'rgba(252, 76, 2, 0.10)',
        }}
      >
        <Text
          style={{
            color: accent.lift,
            fontFamily: fonts.family.mono,
            fontSize: 9,
            letterSpacing: 1.2,
            fontWeight: fonts.weight.heavy as '800',
          }}
          numberOfLines={1}
        >
          {slotLabel}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{ color: text.primary, fontSize: 13, fontWeight: fonts.weight.semibold as '600' }}
        >
          {entry.name?.trim() || 'Meal'}
        </Text>
        {entry.ingredients && entry.ingredients.length > 0 ? (
          <Text
            numberOfLines={1}
            style={{
              color: text.tertiary,
              fontFamily: fonts.family.mono,
              fontSize: 10,
              letterSpacing: 0.4,
              marginTop: 1,
            }}
          >
            {entry.ingredients
              .slice(0, 3)
              .map(i => `${i.quantity_label || ''} ${i.name || ''}`.trim())
              .filter(Boolean)
              .join(' · ')}
            {entry.ingredients.length > 3 ? ` · +${entry.ingredients.length - 3}` : ''}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          color: text.tertiary,
          fontFamily: fonts.family.mono,
          fontSize: 12,
          fontVariant: fonts.tabularNums,
          fontWeight: fonts.weight.bold as '700',
        }}
      >
        {entry.kcal} · {entry.protein_g}P
      </Text>
    </View>
  );
};

export default NutritionDayDetailScreen;
