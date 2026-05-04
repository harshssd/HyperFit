import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { palette, accent, text, spacing, radii, fonts } from '../../../styles/theme';
import type { NutritionEntry } from '../../../services/nutritionService';

/**
 * MealCard — display-only readout for one meal grouping.
 *
 * Was: collapsed card with an inline AddMealRow + recents list behind an
 * expand chevron. Now: pure display. Adding lives in AddMealModal,
 * opened via the parent's "+ Add meal" button or the per-card + icon.
 *
 * Empty state: whole card is tappable → onRequestAdd. The card is the
 * affordance.
 *
 * Non-empty: header (label + entry count + total kcal + small + icon)
 * with the entries listed always-visible underneath. + icon opens the
 * modal pre-filled with this card's slot/label so adding another item
 * is one tap.
 *
 * Custom-labeled cards reuse this same component — they pass their
 * label as `label` and the parent groups entries by meal_label before
 * passing them in.
 */

type Props = {
  label: string;
  entries: NutritionEntry[];
  onRequestAdd: () => void;
  onDelete: (entryId: string) => Promise<void>;
};

const slotTotals = (entries: NutritionEntry[]) =>
  entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein_g,
    }),
    { kcal: 0, protein: 0 },
  );

export const MealCard = ({ label, entries, onRequestAdd, onDelete }: Props) => {
  const totals = slotTotals(entries);
  const empty = entries.length === 0;

  if (empty) {
    return (
      <TouchableOpacity
        onPress={onRequestAdd}
        accessibilityRole="button"
        accessibilityLabel={`Add ${label} entry`}
        activeOpacity={0.85}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.md,
          backgroundColor: palette.surfaceAlt,
          borderColor: palette.borderStrong,
          borderWidth: 1,
          borderRadius: radii.md,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: radii.sm,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.borderStrong,
            backgroundColor: palette.surface,
          }}
        >
          <Plus size={14} color={text.tertiary} strokeWidth={3} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: text.quaternary,
              fontFamily: fonts.family.mono,
              fontSize: 11,
              letterSpacing: 1.6,
              fontWeight: '800',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              color: text.tertiary,
              fontSize: 14,
              fontWeight: '600',
              marginTop: 2,
            }}
          >
            Add an entry
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

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
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing.md,
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: text.quaternary,
              fontFamily: fonts.family.mono,
              fontSize: 11,
              letterSpacing: 1.6,
              fontWeight: '800',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              color: text.primary,
              fontSize: 15,
              fontWeight: '800',
              letterSpacing: -0.2,
              marginTop: 2,
              fontVariant: fonts.tabularNums,
            }}
            numberOfLines={1}
          >
            {totals.kcal.toLocaleString()}
            <Text style={{ color: text.quaternary, fontWeight: '600', fontSize: 13 }}>
              {' kcal · '}
              {entries.length} {entries.length === 1 ? 'item' : 'items'}
            </Text>
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRequestAdd}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Add another ${label} entry`}
          style={{
            width: 32,
            height: 32,
            borderRadius: radii.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(252, 76, 2, 0.10)',
            borderWidth: 1,
            borderColor: accent.lift,
          }}
        >
          <Plus size={16} color={accent.lift} strokeWidth={3} />
        </TouchableOpacity>
      </View>

      {/* Entries — always visible; the card IS the entries */}
      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
          gap: spacing.xs,
          borderTopWidth: 1,
          borderTopColor: palette.borderStrong,
          paddingTop: spacing.sm,
        }}
      >
        {entries.map(entry => (
          <EntryRow key={entry.id} entry={entry} onDelete={onDelete} />
        ))}
      </View>
    </View>
  );
};

const EntryRow = ({
  entry,
  onDelete,
}: {
  entry: NutritionEntry;
  onDelete: (id: string) => Promise<void>;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    }}
  >
    <Text
      numberOfLines={1}
      style={{ flex: 1, color: text.secondary, fontSize: 13 }}
    >
      {entry.name ?? 'Meal'}
    </Text>
    <Text
      style={{
        color: text.tertiary,
        fontFamily: fonts.family.mono,
        fontSize: 12,
        fontVariant: fonts.tabularNums,
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
