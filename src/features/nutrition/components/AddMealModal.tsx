import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react-native';
import { palette, accent, text, spacing, radii, fonts } from '../../../styles/theme';
import {
  getRecents,
  type AddEntryInput,
  type NutritionEntry,
} from '../../../services/nutritionService';
import { useUser } from '../../../contexts/UserContext';
import type { MealSlot, NutritionIngredient } from '../../../types/supabase';

/**
 * AddMealModal — single entry surface for "log a meal".
 *
 * Layout: meal-slot chips → recents → hero kcal → item name → macros (4 up,
 * always visible with full-word labels). Macros aren't behind a toggle —
 * the screen has the room and "P / C / F / fib" was unreadable to a new user.
 *
 * Slot picker: 4 chips (breakfast/lunch/dinner/snack) + Custom… which reveals
 * a 32-char label input. Custom entries still bucket as 'snack' under the
 * hood; the enum stays 4 values, the label is purely a UI grouping aid.
 *
 * Recents are per-slot, refetched on slot change. Tap pre-fills (not auto-
 * saves) — portion sizes drift day-to-day.
 */

type Props = {
  visible: boolean;
  defaultSlot: MealSlot;
  defaultLabel?: string | null;
  /** When present, the modal opens in edit mode: pre-fills from the entry,
   *  swaps the header to "Edit meal" + "SAVE", and routes save through
   *  onUpdate instead of onSave. Recents are still loaded so the user can
   *  re-prefill from a different past meal mid-edit. */
  editEntry?: NutritionEntry | null;
  onClose: () => void;
  onSave: (input: Omit<AddEntryInput, 'userId' | 'dayId'>) => Promise<void>;
  /** Required when editEntry is present. */
  onUpdate?: (
    entryId: string,
    patch: Omit<AddEntryInput, 'userId' | 'dayId'>,
  ) => Promise<void>;
};

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch:     'Lunch',
  dinner:    'Dinner',
  snack:     'Snack',
};
const SLOT_ORDER: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const AddMealModal = ({
  visible,
  defaultSlot,
  defaultLabel,
  editEntry,
  onClose,
  onSave,
  onUpdate,
}: Props) => {
  const isEdit = !!editEntry;
  const { user } = useUser();
  const [slot, setSlot] = useState<MealSlot>(defaultSlot);
  const [isCustom, setIsCustom] = useState(!!defaultLabel);
  const [customLabel, setCustomLabel] = useState(defaultLabel ?? '');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [ingredients, setIngredients] = useState<NutritionIngredient[]>([]);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [recents, setRecents] = useState<NutritionEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editEntry) {
      // Edit mode — prefill every field from the existing row.
      const e = editEntry;
      setSlot((e.meal_slot as MealSlot) ?? defaultSlot);
      setIsCustom(!!e.meal_label);
      setCustomLabel(e.meal_label ?? '');
      setName(e.name ?? '');
      setQuantity(e.quantity_label ?? '');
      setKcal(String(e.kcal ?? ''));
      setProtein(String(e.protein_g ?? ''));
      setCarb(String(e.carb_g ?? ''));
      setFat(String(e.fat_g ?? ''));
      setFiber(String(e.fiber_g ?? ''));
      const editIngredients = (e.ingredients ?? []) as NutritionIngredient[];
      setIngredients(editIngredients);
      setIngredientsOpen(editIngredients.length > 0);
      return;
    }
    setSlot(defaultSlot);
    setIsCustom(!!defaultLabel);
    setCustomLabel(defaultLabel ?? '');
    setName('');
    setQuantity('');
    setKcal('');
    setProtein('');
    setCarb('');
    setFat('');
    setFiber('');
    setIngredients([]);
    setIngredientsOpen(false);
  }, [visible, defaultSlot, defaultLabel, editEntry]);

  useEffect(() => {
    if (!visible || !user?.id) return;
    void getRecents(user.id, slot, 8).then(setRecents);
  }, [visible, user?.id, slot]);

  const handlePickRecent = (r: NutritionEntry) => {
    setName(r.name ?? '');
    setQuantity(r.quantity_label ?? '');
    setKcal(String(r.kcal));
    setProtein(String(r.protein_g));
    setCarb(String(r.carb_g));
    setFat(String(r.fat_g));
    setFiber(String(r.fiber_g));
    const recIngredients = (r.ingredients ?? []) as NutritionIngredient[];
    setIngredients(recIngredients);
    setIngredientsOpen(recIngredients.length > 0);
  };

  const updateIngredient = (idx: number, patch: Partial<NutritionIngredient>) => {
    setIngredients(prev => prev.map((ing, i) => (i === idx ? { ...ing, ...patch } : ing)));
  };
  const addIngredientRow = () => {
    setIngredients(prev => [...prev, { quantity_label: '', name: '' }]);
    setIngredientsOpen(true);
  };
  const removeIngredient = (idx: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const canSave = !saving && parseInt(kcal, 10) > 0
    && (!isCustom || customLabel.trim().length > 0);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const patch = {
        mealSlot: slot,
        mealLabel: isCustom ? customLabel.trim() : null,
        quantityLabel: quantity.trim() || null,
        ingredients: ingredients.length > 0 ? ingredients : null,
        name: name.trim() || undefined,
        kcal: parseInt(kcal, 10) || 0,
        protein_g: parseInt(protein, 10) || 0,
        carb_g: parseInt(carb, 10) || 0,
        fat_g: parseInt(fat, 10) || 0,
        fiber_g: parseInt(fiber, 10) || 0,
      };
      if (isEdit && editEntry && onUpdate) {
        await onUpdate(editEntry.id, patch);
      } else {
        await onSave(patch);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={false}
    >
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.xl,
            paddingBottom: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: palette.borderStrong,
          }}
        >
          <Text style={{ color: text.primary, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 }}>
            {isEdit ? 'Edit meal' : 'Add meal'}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={isEdit ? 'Close edit meal' : 'Close add meal'}
          >
            <X size={22} color={text.tertiary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xxl,
            gap: spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Slot picker */}
          <View style={{ gap: spacing.sm }}>
            <SmallLabel>Meal</SmallLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {SLOT_ORDER.map(s => {
                const active = !isCustom && slot === s;
                return (
                  <SlotChip
                    key={s}
                    label={SLOT_LABELS[s]}
                    active={active}
                    onPress={() => {
                      setIsCustom(false);
                      setSlot(s);
                    }}
                  />
                );
              })}
              <SlotChip
                label="Custom…"
                active={isCustom}
                onPress={() => {
                  setIsCustom(true);
                  setSlot('snack');
                }}
              />
            </View>
            {isCustom ? (
              <TextInput
                value={customLabel}
                onChangeText={t => setCustomLabel(t.slice(0, 32))}
                placeholder="Label (e.g. Pre-workout)"
                placeholderTextColor={text.disabled}
                style={{
                  backgroundColor: palette.surface,
                  borderColor: customLabel.trim() ? accent.lift : palette.borderStrong,
                  borderWidth: 1,
                  borderRadius: radii.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  color: text.primary,
                  fontSize: 14,
                  fontWeight: '600',
                }}
                maxLength={32}
              />
            ) : null}
          </View>

          {/* Recents — horizontal chips so they don't dominate */}
          {recents.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <SmallLabel>Recent · tap to pre-fill</SmallLabel>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, paddingRight: spacing.xl }}
              >
                {recents.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => handlePickRecent(r)}
                    accessibilityRole="button"
                    accessibilityLabel={`Pre-fill from ${r.name ?? 'meal'}`}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: palette.surface,
                      borderColor: palette.borderStrong,
                      borderWidth: 1,
                      borderRadius: radii.sm,
                      maxWidth: 220,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{ color: text.primary, fontSize: 13, fontWeight: '700' }}
                    >
                      {r.name ?? 'Meal'}
                    </Text>
                    <Text
                      style={{
                        color: text.tertiary,
                        fontFamily: fonts.family.mono,
                        fontSize: 11,
                        fontWeight: '700',
                        fontVariant: fonts.tabularNums,
                        marginTop: 2,
                      }}
                    >
                      {r.kcal}
                      <Text style={{ color: text.quaternary, fontWeight: '500' }}>
                        {' kcal · '}
                      </Text>
                      {r.protein_g}P
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Hero: calories */}
          <View style={{ gap: spacing.sm }}>
            <SmallLabel>Calories</SmallLabel>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: palette.surface,
                borderColor: kcal ? accent.lift : palette.borderStrong,
                borderWidth: 1,
                borderRadius: radii.md,
                paddingHorizontal: spacing.lg,
              }}
            >
              <TextInput
                value={kcal}
                onChangeText={setKcal}
                placeholder="0"
                placeholderTextColor={text.disabled}
                keyboardType="number-pad"
                selectTextOnFocus
                style={{
                  flex: 1,
                  color: text.primary,
                  fontSize: 36,
                  fontWeight: '900',
                  letterSpacing: -1,
                  paddingVertical: spacing.md,
                  fontVariant: fonts.tabularNums,
                }}
              />
              <Text
                style={{
                  color: text.quaternary,
                  fontFamily: fonts.family.mono,
                  fontSize: 12,
                  letterSpacing: 1.8,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                }}
              >
                kcal
              </Text>
            </View>
          </View>

          {/* Item name */}
          <View style={{ gap: spacing.sm }}>
            <SmallLabel>Item</SmallLabel>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Grilled chicken"
              placeholderTextColor={text.disabled}
              style={{
                backgroundColor: palette.surface,
                borderColor: palette.borderStrong,
                borderWidth: 1,
                borderRadius: radii.md,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                color: text.primary,
                fontSize: 15,
                fontWeight: '600',
              }}
            />
          </View>

          {/* Quantity — free-text portion (e.g. "3 eggs", "200 g"). Optional.
              Display-only on the entry row + share card; macros above stay
              the source of truth for daily totals. */}
          <View style={{ gap: spacing.sm }}>
            <SmallLabel>Quantity · optional</SmallLabel>
            <TextInput
              value={quantity}
              onChangeText={t => setQuantity(t.slice(0, 32))}
              placeholder='e.g. "3 eggs", "200 g", "8 oz"'
              placeholderTextColor={text.disabled}
              maxLength={32}
              style={{
                backgroundColor: palette.surface,
                borderColor: quantity.trim() ? accent.lift : palette.borderStrong,
                borderWidth: 1,
                borderRadius: radii.md,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                color: text.primary,
                fontSize: 15,
                fontWeight: '600',
              }}
            />
          </View>

          {/* Ingredients — collapsible. Display-only structured breakdown
              for now ("5 g · Fennel", "1 tsp · Butter"). The future macro
              estimator will fill per-ingredient kcal/macros into each row;
              for now the user types the breakdown and dish-level macros
              above stay the source of truth for daily totals. */}
          <View style={{ gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => setIngredientsOpen(o => !o)}
              accessibilityRole="button"
              accessibilityLabel={ingredientsOpen ? 'Hide ingredients' : 'Show ingredients'}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 4,
              }}
            >
              {ingredientsOpen ? (
                <ChevronDown size={14} color={text.tertiary} />
              ) : (
                <ChevronRight size={14} color={text.tertiary} />
              )}
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
                Ingredients · optional
              </Text>
              {ingredients.length > 0 ? (
                <Text
                  style={{
                    color: accent.lift,
                    fontFamily: fonts.family.mono,
                    fontSize: 10,
                    letterSpacing: 1.2,
                    fontWeight: fonts.weight.heavy as '800',
                    fontVariant: fonts.tabularNums,
                  }}
                >
                  · {ingredients.length}
                </Text>
              ) : null}
            </TouchableOpacity>
            {ingredientsOpen ? (
              <View style={{ gap: 6 }}>
                {ingredients.map((ing, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    <TextInput
                      value={ing.quantity_label}
                      onChangeText={t => updateIngredient(idx, { quantity_label: t.slice(0, 16) })}
                      placeholder="30 g"
                      placeholderTextColor={text.disabled}
                      maxLength={16}
                      style={{
                        width: 88,
                        backgroundColor: palette.surface,
                        borderColor: ing.quantity_label.trim() ? accent.lift : palette.borderStrong,
                        borderWidth: 1,
                        borderRadius: radii.sm,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.sm,
                        color: text.primary,
                        fontSize: 14,
                        fontFamily: fonts.family.mono,
                        fontVariant: fonts.tabularNums,
                        fontWeight: fonts.weight.bold as '700',
                      }}
                    />
                    <TextInput
                      value={ing.name}
                      onChangeText={t => updateIngredient(idx, { name: t.slice(0, 48) })}
                      placeholder="Paneer"
                      placeholderTextColor={text.disabled}
                      maxLength={48}
                      style={{
                        flex: 1,
                        backgroundColor: palette.surface,
                        borderColor: ing.name.trim() ? accent.lift : palette.borderStrong,
                        borderWidth: 1,
                        borderRadius: radii.sm,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        color: text.primary,
                        fontSize: 14,
                        fontWeight: fonts.weight.semibold as '600',
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => removeIngredient(idx)}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ingredient ${idx + 1}`}
                      style={{
                        width: 36,
                        height: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} color={text.disabled} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={addIngredientRow}
                  accessibilityRole="button"
                  accessibilityLabel="Add ingredient row"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: spacing.sm,
                    borderWidth: 1,
                    borderColor: palette.borderStrong,
                    borderStyle: 'dashed',
                    borderRadius: radii.sm,
                  }}
                >
                  <Plus size={14} color={text.tertiary} />
                  <Text
                    style={{
                      color: text.tertiary,
                      fontFamily: fonts.family.mono,
                      fontSize: 11,
                      letterSpacing: 1.4,
                      fontWeight: fonts.weight.heavy as '800',
                    }}
                  >
                    ADD INGREDIENT
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Macros — always visible, fully labeled */}
          <View style={{ gap: spacing.sm }}>
            <SmallLabel>Macros · grams</SmallLabel>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <MacroCell
                label="Protein"
                value={protein}
                onChange={setProtein}
                accentColor={accent.lift}
              />
              <MacroCell
                label="Carbs"
                value={carb}
                onChange={setCarb}
                accentColor={accent.sessionUp}
              />
              <MacroCell
                label="Fat"
                value={fat}
                onChange={setFat}
                accentColor={accent.macroFat}
              />
              <MacroCell
                label="Fiber"
                value={fiber}
                onChange={setFiber}
                accentColor={text.tertiary}
              />
            </View>
          </View>

          {/* Save */}
          <TouchableOpacity
            testID="add-meal-save"
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Save meal entry"
            style={{
              marginTop: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              paddingVertical: spacing.lg,
              borderRadius: radii.md,
              backgroundColor: canSave ? accent.lift : palette.surface,
              borderWidth: 1,
              borderColor: canSave ? accent.lift : palette.borderStrong,
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Check size={16} color={canSave ? '#fff' : text.disabled} strokeWidth={3} />
            <Text
              style={{
                color: canSave ? '#fff' : text.disabled,
                fontFamily: fonts.family.mono,
                fontSize: 13,
                letterSpacing: 2.4,
                textTransform: 'uppercase',
                fontWeight: '800',
              }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save meal'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

// -- Local helpers -----------------------------------------------------------

const SmallLabel = ({ children }: { children: React.ReactNode }) => (
  <Text
    style={{
      color: text.quaternary,
      fontFamily: fonts.family.mono,
      fontSize: 10,
      letterSpacing: 1.8,
      textTransform: 'uppercase',
      fontWeight: '700',
    }}
  >
    {children}
  </Text>
);

const SlotChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    style={{
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: active ? accent.lift : palette.borderStrong,
      backgroundColor: active ? 'rgba(252, 76, 2, 0.10)' : palette.surface,
    }}
  >
    <Text
      style={{
        color: active ? accent.lift : text.secondary,
        fontFamily: fonts.family.mono,
        fontSize: 11,
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        fontWeight: '800',
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

/**
 * MacroCell — a stacked input: tiny color-dot + label on top, big number,
 * "g" suffix. The accent dot is the only color signal (subtle, not a full
 * border tint) so the four cells read as a related group, not four chips.
 */
const MacroCell = ({
  label,
  value,
  onChange,
  accentColor,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accentColor: string;
}) => {
  const filled = value.trim().length > 0;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.surface,
        borderColor: filled ? accentColor : palette.borderStrong,
        borderWidth: 1,
        borderRadius: radii.md,
        paddingHorizontal: spacing.sm,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        alignItems: 'center',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: accentColor,
          }}
        />
        <Text
          style={{
            color: text.quaternary,
            fontFamily: fonts.family.mono,
            fontSize: 9,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            fontWeight: '800',
          }}
        >
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={text.disabled}
          keyboardType="number-pad"
          selectTextOnFocus
          style={{
            color: filled ? text.primary : text.disabled,
            fontSize: 20,
            fontWeight: '800',
            textAlign: 'center',
            minWidth: 32,
            paddingVertical: 2,
            fontVariant: fonts.tabularNums,
          }}
        />
        <Text
          style={{
            color: text.quaternary,
            fontFamily: fonts.family.mono,
            fontSize: 11,
            fontWeight: '700',
            marginLeft: 2,
          }}
        >
          g
        </Text>
      </View>
    </View>
  );
};
