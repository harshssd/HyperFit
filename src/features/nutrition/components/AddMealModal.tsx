import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, Plus, X } from 'lucide-react-native';
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
 * Why this exists: the inline AddMealRow that lived inside each MealCard
 * forced the user to pick the right card, expand it, then type. Three
 * decisions before the first tap. This modal collapses that into one
 * primary "+ Add meal" button + one form, with the slot picker as the
 * first interaction. Cards become display-only.
 *
 * Slot picker: 4 chips for breakfast/lunch/dinner/snack + a "Custom…"
 * chip that reveals a 32-char text input (pre-workout, late night, etc).
 * Custom entries are still bucketed in the snack slot under the hood —
 * the enum stays 4 values, the label is purely a UI grouping aid.
 *
 * Recents: per-slot, refetched whenever the selected slot changes. Tap
 * a recent to pre-fill kcal/macros/name; the user can tweak before save.
 * Pre-fill (not auto-save) because portion sizes drift day-to-day.
 *
 * Macros gated behind "+ macros" toggle — same pattern as the AddMealRow
 * we replaced. Casual logging is kcal + name only.
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
  const [showMacros, setShowMacros] = useState(false);
  const [recents, setRecents] = useState<NutritionEntry[]>([]);
  const [saving, setSaving] = useState(false);

  // Re-seed when the modal reopens (different slot tapped, or pre-filled
  // for a custom card). Clears any in-flight typing the user abandoned.
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
    setShowMacros(false);
  }, [visible, defaultSlot, defaultLabel]);

  // Per-slot recents. Refetch when slot changes (custom uses 'snack' as
  // the backing slot, so its recents feed is the snack feed — fine).
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
    if (r.protein_g > 0 || r.carb_g > 0 || r.fat_g > 0 || r.fiber_g > 0) {
      setShowMacros(true);
    }
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
            gap: spacing.lg,
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

          {/* Recents */}
          {recents.length > 0 ? (
            <View style={{ gap: 4 }}>
              <SmallLabel>Tap to pre-fill</SmallLabel>
              <View style={{ gap: 4 }}>
                {recents.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => handlePickRecent(r)}
                    accessibilityRole="button"
                    accessibilityLabel={`Pre-fill from ${r.name ?? 'meal'}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.sm,
                      backgroundColor: palette.surface,
                      borderColor: palette.borderStrong,
                      borderWidth: 1,
                      borderRadius: radii.sm,
                    }}
                  >
                    <Plus size={14} color={accent.lift} strokeWidth={3} />
                    <Text
                      numberOfLines={1}
                      style={{ flex: 1, color: text.primary, fontSize: 13, fontWeight: '600' }}
                    >
                      {r.name ?? 'Meal'}
                    </Text>
                    <Text
                      style={{
                        color: text.tertiary,
                        fontFamily: fonts.family.mono,
                        fontSize: 12,
                        fontWeight: '700',
                        fontVariant: fonts.tabularNums,
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
              </View>
            </View>
          ) : null}

          {/* kcal + name */}
          <View style={{ gap: spacing.sm }}>
            <SmallLabel>What did you eat</SmallLabel>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <NumCell value={kcal} placeholder="kcal" onChange={setKcal} flex={1.2} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Item (e.g. chicken)"
                placeholderTextColor={text.disabled}
                style={{
                  flex: 3,
                  backgroundColor: palette.surface,
                  borderColor: palette.borderStrong,
                  borderWidth: 1,
                  borderRadius: radii.sm,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.sm,
                  color: text.primary,
                  fontSize: 14,
                  fontWeight: '600',
                }}
              />
            </View>
            {showMacros ? (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <NumCell value={protein} placeholder="P"   onChange={setProtein} />
                <NumCell value={carb}    placeholder="C"   onChange={setCarb} />
                <NumCell value={fat}     placeholder="F"   onChange={setFat} />
                <NumCell value={fiber}   placeholder="fib" onChange={setFiber} />
              </View>
            ) : null}
            <TouchableOpacity
              onPress={() => setShowMacros(s => !s)}
              accessibilityRole="button"
              accessibilityLabel={showMacros ? 'Hide macros' : 'Show macros'}
              style={{ alignSelf: 'flex-start', paddingVertical: 2 }}
            >
              <Text
                style={{
                  color: text.tertiary,
                  fontFamily: fonts.family.mono,
                  fontSize: 10,
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                  fontWeight: '700',
                }}
              >
                {showMacros ? '− macros' : '+ macros'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Save */}
          <TouchableOpacity
            testID="add-meal-save"
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Save meal entry"
            style={{
              marginTop: spacing.md,
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
