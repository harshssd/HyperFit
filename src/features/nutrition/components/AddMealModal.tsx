import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { palette, accent, text, spacing, radii, fonts } from '../../../styles/theme';
import {
  getRecents,
  type AddEntryInput,
  type NutritionEntry,
} from '../../../services/nutritionService';
import { useUser } from '../../../contexts/UserContext';
import type { MealSlot } from '../../../types/supabase';

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
  onClose: () => void;
  onSave: (input: Omit<AddEntryInput, 'userId' | 'dayId'>) => Promise<void>;
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
  onClose,
  onSave,
}: Props) => {
  const { user } = useUser();
  const [slot, setSlot] = useState<MealSlot>(defaultSlot);
  const [isCustom, setIsCustom] = useState(!!defaultLabel);
  const [customLabel, setCustomLabel] = useState(defaultLabel ?? '');
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [recents, setRecents] = useState<NutritionEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSlot(defaultSlot);
    setIsCustom(!!defaultLabel);
    setCustomLabel(defaultLabel ?? '');
    setName('');
    setKcal('');
    setProtein('');
    setCarb('');
    setFat('');
    setFiber('');
  }, [visible, defaultSlot, defaultLabel]);

  useEffect(() => {
    if (!visible || !user?.id) return;
    void getRecents(user.id, slot, 8).then(setRecents);
  }, [visible, user?.id, slot]);

  const handlePickRecent = (r: NutritionEntry) => {
    setName(r.name ?? '');
    setKcal(String(r.kcal));
    setProtein(String(r.protein_g));
    setCarb(String(r.carb_g));
    setFat(String(r.fat_g));
    setFiber(String(r.fiber_g));
  };

  const canSave = !saving && parseInt(kcal, 10) > 0
    && (!isCustom || customLabel.trim().length > 0);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        mealSlot: slot,
        mealLabel: isCustom ? customLabel.trim() : null,
        name: name.trim() || undefined,
        kcal: parseInt(kcal, 10) || 0,
        protein_g: parseInt(protein, 10) || 0,
        carb_g: parseInt(carb, 10) || 0,
        fat_g: parseInt(fat, 10) || 0,
        fiber_g: parseInt(fiber, 10) || 0,
      });
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
            Add meal
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close add meal"
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
              placeholder="e.g. Grilled chicken, 200 g"
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
              {saving ? 'Saving…' : 'Save meal'}
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
