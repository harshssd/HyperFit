import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { palette, accent, text, spacing, radii, fonts } from '../../../styles/theme';
import type { NutritionEntry } from '../../../services/nutritionService';
import type { MealSlot } from '../../../types/supabase';

/**
 * EntriesList — flat reverse-chronological feed of today's logged meals.
 *
 * Replaces the four-MealCard layout. The empty slot scaffolding (Breakfast/
 * Lunch/Dinner/Snack each as a placeholder card) burned screen real estate
 * for zero information. The picker still lives in AddMealModal — slot is
 * surfaced here as a small pill on each row so the grouping signal stays
 * legible without dedicating a card to it.
 *
 * Newest-first: when the user logs something, it lands at the top, which is
 * also where their eyes are after dismissing the modal.
 */

type Props = {
  entries: NutritionEntry[];
  onDelete: (entryId: string) => Promise<void>;
};

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'BFAST',
  lunch:     'LUNCH',
  dinner:    'DINNER',
  snack:     'SNACK',
};

export const EntriesList = ({ entries, onDelete }: Props) => {
  if (entries.length === 0) {
    return (
      <View
        style={{
          paddingVertical: spacing.xl,
          paddingHorizontal: spacing.lg,
          borderRadius: radii.md,
          backgroundColor: palette.surfaceAlt,
          borderWidth: 1,
          borderColor: palette.borderStrong,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: text.tertiary,
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          No meals logged yet today.
        </Text>
        <Text
          style={{
            color: text.quaternary,
            fontSize: 12,
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          Tap ADD MEAL above to log your first entry.
        </Text>
      </View>
    );
  }

  // Newest-first by logged_at; fall back to id for stable order on ties.
  const sorted = [...entries].sort((a, b) => {
    const ta = a.logged_at ? Date.parse(a.logged_at) : 0;
    const tb = b.logged_at ? Date.parse(b.logged_at) : 0;
    if (tb !== ta) return tb - ta;
    return b.id.localeCompare(a.id);
  });

  return (
    <View
      style={{
        backgroundColor: palette.surfaceAlt,
        borderColor: palette.borderStrong,
        borderWidth: 1,
        borderRadius: radii.md,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
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
          Today's entries
        </Text>
        <Text
          style={{
            color: text.quaternary,
            fontFamily: fonts.family.mono,
            fontSize: 11,
            letterSpacing: 1.4,
            fontWeight: fonts.weight.bold as '700',
            fontVariant: fonts.tabularNums,
          }}
        >
          {entries.length} {entries.length === 1 ? 'ITEM' : 'ITEMS'}
        </Text>
      </View>
      {sorted.map((entry, idx) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          onDelete={onDelete}
          isFirst={idx === 0}
        />
      ))}
    </View>
  );
};

const EntryRow = ({
  entry,
  onDelete,
  isFirst,
}: {
  entry: NutritionEntry;
  onDelete: (id: string) => Promise<void>;
  isFirst: boolean;
}) => {
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
      <Text
        numberOfLines={1}
        style={{ flex: 1, color: text.primary, fontSize: 13, fontWeight: fonts.weight.semibold as '600' }}
      >
        {entry.name?.trim() || 'Meal'}
      </Text>
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
      <TouchableOpacity
        onPress={() => onDelete(entry.id)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${entry.name ?? 'entry'}`}
      >
        <Trash2 size={14} color={text.disabled} />
      </TouchableOpacity>
    </View>
  );
};
