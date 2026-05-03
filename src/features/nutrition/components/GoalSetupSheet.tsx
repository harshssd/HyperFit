import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';
import { palette, accent, text, spacing, radii, fonts } from '../../../styles/theme';
import { ForkKnifeCrossed } from '../../../components/icons/ForkKnifeCrossed';
import type { NutritionSettings } from '../../../services/nutritionService';

/**
 * GoalSetupSheet — bottom-sheet modal for the user's nutrition goals.
 *
 * Six macro inputs (kcal · P · C · F · fib · cheat days/wk) plus three
 * water inputs (target · cup · bottle) plus a ml/oz toggle. Save calls
 * the parent's saveSettings, which upserts user_nutrition_settings.
 *
 * First-launch: settings is null. Inputs prefill with the same defaults
 * the migration's CHECK constraints accept (matches "Maintain" preset).
 * Editing later passes the existing row in.
 */

type Props = {
  visible: boolean;
  initial: NutritionSettings | null;
  onClose: () => void;
  onSave: (patch: Partial<NutritionSettings>) => Promise<void>;
};

const DEFAULTS = {
  kcal_target: 2200,
  protein_target_g: 160,
  carb_target_g: 250,
  fat_target_g: 70,
  fiber_target_g: 30,
  cheat_days_per_week: 1,
  water_target_ml: 2000,
  water_cup_ml: 250,
  water_bottle_ml: 500,
  water_unit: 'ml' as const,
};

// 1 fl oz (US) = 29.5735 ml. Match the rounding used by formatVolume so the
// displayed value here lines up with the WaterControls readout.
const ML_PER_OZ = 29.5735;
const mlToOzStr = (ml: number) => String(Math.round(ml / ML_PER_OZ));
const ozStrToMl = (oz: string, fallback: number) => {
  const n = parseInt(oz, 10);
  if (!n || isNaN(n)) return fallback;
  return Math.round(n * ML_PER_OZ);
};
const seedWaterStr = (ml: number, unit: 'ml' | 'oz') =>
  unit === 'oz' ? mlToOzStr(ml) : String(ml);

export const GoalSetupSheet = ({ visible, initial, onClose, onSave }: Props) => {
  const seed = initial ?? DEFAULTS;
  const [kcal, setKcal] = useState(String(seed.kcal_target));
  const [protein, setProtein] = useState(String(seed.protein_target_g));
  const [carb, setCarb] = useState(String(seed.carb_target_g));
  const [fat, setFat] = useState(String(seed.fat_target_g));
  const [fiber, setFiber] = useState(String(seed.fiber_target_g));
  const [cheats, setCheats] = useState(String(seed.cheat_days_per_week));
  const [waterTarget, setWaterTarget] = useState(seedWaterStr(seed.water_target_ml, seed.water_unit));
  const [waterCup, setWaterCup] = useState(seedWaterStr(seed.water_cup_ml, seed.water_unit));
  const [waterBottle, setWaterBottle] = useState(seedWaterStr(seed.water_bottle_ml, seed.water_unit));
  const [waterUnit, setWaterUnit] = useState<'ml' | 'oz'>(seed.water_unit);
  const [saving, setSaving] = useState(false);

  // Re-seed when the modal reopens with fresh data (after a save round-trip
  // brings new server values back, or the user edits twice in a session).
  useEffect(() => {
    if (!visible) return;
    const s = initial ?? DEFAULTS;
    setKcal(String(s.kcal_target));
    setProtein(String(s.protein_target_g));
    setCarb(String(s.carb_target_g));
    setFat(String(s.fat_target_g));
    setFiber(String(s.fiber_target_g));
    setCheats(String(s.cheat_days_per_week));
    setWaterTarget(seedWaterStr(s.water_target_ml, s.water_unit));
    setWaterCup(seedWaterStr(s.water_cup_ml, s.water_unit));
    setWaterBottle(seedWaterStr(s.water_bottle_ml, s.water_unit));
    setWaterUnit(s.water_unit);
  }, [visible, initial]);

  // Inputs are displayed in the user's chosen unit; storage is always ml.
  const toMlFromInput = (s: string, fallback: number) => {
    if (waterUnit === 'oz') return ozStrToMl(s, fallback);
    return parseInt(s, 10) || fallback;
  };

  // Toggle unit: re-render the three water fields in the new unit so the
  // user sees consistent numbers. Converts via ml as the canonical pivot.
  const handleUnitChange = (next: 'ml' | 'oz') => {
    if (next === waterUnit) return;
    const tMl = toMlFromInput(waterTarget, DEFAULTS.water_target_ml);
    const cMl = toMlFromInput(waterCup, DEFAULTS.water_cup_ml);
    const bMl = toMlFromInput(waterBottle, DEFAULTS.water_bottle_ml);
    setWaterTarget(seedWaterStr(tMl, next));
    setWaterCup(seedWaterStr(cMl, next));
    setWaterBottle(seedWaterStr(bMl, next));
    setWaterUnit(next);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave({
        kcal_target: parseInt(kcal, 10) || DEFAULTS.kcal_target,
        protein_target_g: parseInt(protein, 10) || DEFAULTS.protein_target_g,
        carb_target_g: parseInt(carb, 10) || DEFAULTS.carb_target_g,
        fat_target_g: parseInt(fat, 10) || DEFAULTS.fat_target_g,
        fiber_target_g: parseInt(fiber, 10) || DEFAULTS.fiber_target_g,
        cheat_days_per_week: parseInt(cheats, 10) || DEFAULTS.cheat_days_per_week,
        water_target_ml: toMlFromInput(waterTarget, DEFAULTS.water_target_ml),
        water_cup_ml: toMlFromInput(waterCup, DEFAULTS.water_cup_ml),
        water_bottle_ml: toMlFromInput(waterBottle, DEFAULTS.water_bottle_ml),
        water_unit: waterUnit,
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <ForkKnifeCrossed size={20} color={accent.lift} strokeWidth={2} />
            <Text style={{ color: text.primary, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 }}>
              Daily Goal
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close goal setup"
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
        >
          <SectionLabel>Macros</SectionLabel>
          <Field label="Calories" unit="kcal" value={kcal} onChange={setKcal} />
          <Field label="Protein" unit="g"  value={protein} onChange={setProtein} />
          <Field label="Carbs"   unit="g"  value={carb} onChange={setCarb} />
          <Field label="Fat"     unit="g"  value={fat} onChange={setFat} />
          <Field label="Fiber"   unit="g"  value={fiber} onChange={setFiber} />
          <Field label="Cheat days / week" unit="" value={cheats} onChange={setCheats} />

          <SectionLabel>Water</SectionLabel>
          <Field label="Daily target" unit={waterUnit} value={waterTarget} onChange={setWaterTarget} />
          <Field label="Cup size"     unit={waterUnit} value={waterCup} onChange={setWaterCup} />
          <Field label="Bottle size"  unit={waterUnit} value={waterBottle} onChange={setWaterBottle} />

          <View>
            <SmallLabel>Display unit</SmallLabel>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              {(['ml', 'oz'] as const).map(u => {
                const active = waterUnit === u;
                return (
                  <TouchableOpacity
                    key={u}
                    onPress={() => handleUnitChange(u)}
                    style={{
                      flex: 1,
                      paddingVertical: spacing.md,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: active ? accent.lift : palette.borderStrong,
                      backgroundColor: active ? 'rgba(252,76,2,0.10)' : palette.surface,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: active ? accent.lift : text.secondary,
                        fontFamily: fonts.family.mono,
                        fontSize: 12,
                        letterSpacing: 1.6,
                        textTransform: 'uppercase',
                        fontWeight: '700',
                      }}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            style={{
              marginTop: spacing.lg,
              paddingVertical: spacing.lg,
              borderRadius: radii.md,
              backgroundColor: accent.lift,
              alignItems: 'center',
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontFamily: fonts.family.mono,
                fontSize: 13,
                letterSpacing: 2.4,
                textTransform: 'uppercase',
                fontWeight: '800',
              }}
            >
              {saving ? 'Saving…' : 'Save goal'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

// -- Local helpers -----------------------------------------------------------

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Text
    style={{
      color: text.quaternary,
      fontFamily: fonts.family.mono,
      fontSize: 11,
      letterSpacing: 2.2,
      textTransform: 'uppercase',
      fontWeight: '800',
      marginTop: spacing.md,
    }}
  >
    {children}
  </Text>
);

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

const Field = ({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderColor: palette.borderStrong,
      borderWidth: 1,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.md,
    }}
  >
    <Text style={{ flex: 1, color: text.secondary, fontSize: 14, fontWeight: '600' }}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      keyboardType="number-pad"
      style={{
        minWidth: 70,
        textAlign: 'right',
        color: text.primary,
        fontSize: 16,
        fontWeight: '800',
        fontVariant: fonts.tabularNums,
      }}
      selectTextOnFocus
    />
    {unit ? (
      <Text
        style={{
          color: text.quaternary,
          fontFamily: fonts.family.mono,
          fontSize: 11,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          fontWeight: '700',
          minWidth: 28,
        }}
      >
        {unit}
      </Text>
    ) : null}
  </View>
);
