import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import { palette, accent, text, spacing, radii, fonts } from '../../../styles/theme';
import {
  getRecents,
  type AddEntryInput,
  type NutritionEntry,
} from '../../../services/nutritionService';
import { useUser } from '../../../contexts/UserContext';
import type { MealSlot } from '../../../types/supabase';

/**
 * MealCard — one meal slot (Breakfast / Lunch / Dinner / Snack).
 *
 * Collapsed: title + entry count + total kcal + chevron-down. Tap to expand.
 * Expanded:
 *   - Existing entries listed inline with delete affordances
 *   - Recents scroller (horizontal) — tap a chip to repeat the same numbers
 *   - Inline AddMealRow: kcal · P · C · F · fib · name
 *   - Save button
 *
 * Rows, not grids — same input pattern as the workout-set logger.
 * No modals on the common path; logging stays one tap deep.
 */

type Props = {
  slot: MealSlot;
  label: string;
  entries: NutritionEntry[];
  onAdd: (input: Omit<AddEntryInput, 'userId' | 'dayId'>) => Promise<void>;
  onDelete: (entryId: string) => Promise<void>;
};

const slotTotals = (entries: NutritionEntry[]) =>
  entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein_g,
      carb: acc.carb + e.carb_g,
      fat: acc.fat + e.fat_g,
      fiber: acc.fiber + e.fiber_g,
    }),
    { kcal: 0, protein: 0, carb: 0, fat: 0, fiber: 0 },
  );

export const MealCard = ({ slot, label, entries, onAdd, onDelete }: Props) => {
  const { user } = useUser();
  const [expanded, setExpanded] = useState(false);
  const [recents, setRecents] = useState<NutritionEntry[]>([]);
  const totals = slotTotals(entries);

  // Lazy-fetch recents on first expand. Refresh whenever entries change so
  // a freshly-logged meal becomes available as a recent next time.
  useEffect(() => {
    if (!expanded || !user?.id) return;
    void getRecents(user.id, slot, 10).then(setRecents);
  }, [expanded, user?.id, slot, entries.length]);

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
      <TouchableOpacity
        testID={`meal-card-${slot}`}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.85}
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
            }}
            numberOfLines={1}
          >
            {entries.length === 0
              ? 'Add meal'
              : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
          </Text>
        </View>
        {entries.length > 0 ? (
          <Text
            style={{
              color: text.tertiary,
              fontFamily: fonts.family.mono,
              fontSize: 13,
              fontWeight: '700',
              fontVariant: fonts.tabularNums,
            }}
          >
            {totals.kcal.toLocaleString()}
          </Text>
        ) : null}
        {expanded ? (
          <ChevronUp size={18} color={text.tertiary} />
        ) : (
          <ChevronDown size={18} color={text.tertiary} />
        )}
      </TouchableOpacity>

      {expanded ? (
        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.md,
            gap: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: palette.borderStrong,
            paddingTop: spacing.md,
          }}
        >
          {entries.map(entry => (
            <EntryRow key={entry.id} entry={entry} onDelete={onDelete} />
          ))}

          {recents.length > 0 ? (
            <RecentsScroller
              recents={recents}
              onPick={recent =>
                onAdd({
                  mealSlot: slot,
                  name: recent.name ?? undefined,
                  kcal: recent.kcal,
                  protein_g: recent.protein_g,
                  carb_g: recent.carb_g,
                  fat_g: recent.fat_g,
                  fiber_g: recent.fiber_g,
                })
              }
            />
          ) : null}

          <AddMealRow slot={slot} onAdd={onAdd} />
        </View>
      ) : null}
    </View>
  );
};

// -- Single existing entry row (with delete) ---------------------------------

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

// -- Recents scroller --------------------------------------------------------

const RecentsScroller = ({
  recents,
  onPick,
}: {
  recents: NutritionEntry[];
  onPick: (recent: NutritionEntry) => void;
}) => (
  <View>
    <Text
      style={{
        color: text.quaternary,
        fontFamily: fonts.family.mono,
        fontSize: 9,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: 6,
      }}
    >
      Recents
    </Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6 }}
    >
      {recents.map(r => (
        <TouchableOpacity
          key={r.id}
          onPress={() => onPick(r)}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: palette.surface,
            borderColor: palette.borderStrong,
            borderWidth: 1,
            borderRadius: radii.sm,
          }}
        >
          <Text style={{ color: text.secondary, fontSize: 12 }} numberOfLines={1}>
            {r.name}
          </Text>
          <Text
            style={{
              color: text.quaternary,
              fontFamily: fonts.family.mono,
              fontSize: 10,
              fontVariant: fonts.tabularNums,
              marginTop: 2,
            }}
          >
            {r.kcal} kcal
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

// -- Inline AddMealRow -------------------------------------------------------
// Five numeric inputs in a row + a name field underneath. Save → onAdd,
// then clear so the row is ready for another entry without dismissing.

type AddMealRowProps = {
  slot: MealSlot;
  onAdd: (input: Omit<AddEntryInput, 'userId' | 'dayId'>) => Promise<void>;
};

const AddMealRow = ({ slot, onAdd }: AddMealRowProps) => {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave =
    !!kcal && !saving && parseInt(kcal, 10) > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onAdd({
        mealSlot: slot,
        name: name.trim() || undefined,
        kcal: parseInt(kcal, 10) || 0,
        protein_g: parseInt(protein, 10) || 0,
        carb_g: parseInt(carb, 10) || 0,
        fat_g: parseInt(fat, 10) || 0,
        fiber_g: parseInt(fiber, 10) || 0,
      });
      setName('');
      setKcal('');
      setProtein('');
      setCarb('');
      setFat('');
      setFiber('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <NumCell value={kcal}    placeholder="kcal" onChange={setKcal} flex={1.4} />
        <NumCell value={protein} placeholder="P"    onChange={setProtein} />
        <NumCell value={carb}    placeholder="C"    onChange={setCarb} />
        <NumCell value={fat}     placeholder="F"    onChange={setFat} />
        <NumCell value={fiber}   placeholder="fib"  onChange={setFiber} />
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="What did you eat? (optional)"
          placeholderTextColor={text.disabled}
          style={{
            flex: 1,
            backgroundColor: palette.surface,
            borderColor: palette.borderStrong,
            borderWidth: 1,
            borderRadius: radii.sm,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            color: text.primary,
            fontSize: 13,
          }}
        />
        <TouchableOpacity
          testID={`meal-save-${slot}`}
          onPress={handleSave}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityLabel={`Save ${slot} entry`}
          style={{
            paddingHorizontal: spacing.md,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: canSave ? accent.lift : palette.surface,
            borderColor: canSave ? accent.lift : palette.borderStrong,
            borderWidth: 1,
            borderRadius: radii.sm,
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Check size={16} color={canSave ? '#fff' : text.disabled} strokeWidth={3} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const NumCell = ({
  value,
  placeholder,
  onChange,
  flex = 1,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  flex?: number;
}) => (
  <TextInput
    value={value}
    onChangeText={onChange}
    placeholder={placeholder}
    placeholderTextColor={text.disabled}
    keyboardType="number-pad"
    selectTextOnFocus
    style={{
      flex,
      backgroundColor: palette.surface,
      borderColor: palette.borderStrong,
      borderWidth: 1,
      borderRadius: radii.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      color: text.primary,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
      fontVariant: fonts.tabularNums,
    }}
  />
);
