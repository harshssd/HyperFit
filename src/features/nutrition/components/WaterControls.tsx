import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Droplet, Undo2 } from 'lucide-react-native';
import { palette, accent, text, spacing, radii, fonts } from '../../../styles/theme';
import { formatVolume } from '../helpers';

/**
 * WaterControls — collapsed status row + expanded action buttons.
 *
 * Collapsed: droplet + "1,250 / 2,000 ml" + 8-segment progress strip.
 * Expanded: + CUP / + BOTTLE big buttons + undo affordance for the last
 * tap. Long-press on the row OR tap the segment strip toggles expand.
 *
 * Segment fill uses accent.sessionUp green — water is the rare metric
 * where "more = better" is uncomplicated, so progress green reads right.
 * No regression styling at the cap; hitting the goal just fills all 8
 * segments and stops there. Hydration shame is bad UX.
 */

type Props = {
  totalMl: number;
  targetMl: number;
  cupMl: number;
  bottleMl: number;
  unit: 'ml' | 'oz';
  onAddMl: (ml: number) => Promise<void>;
  onUndo: () => Promise<void>;
};

const SEGMENTS = 8;

export const WaterControls = ({
  totalMl,
  targetMl,
  cupMl,
  bottleMl,
  unit,
  onAddMl,
  onUndo,
}: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const filled = Math.min(SEGMENTS, Math.floor((totalMl / targetMl) * SEGMENTS));

  const wrap = async (op: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await op(); } finally { setBusy(false); }
  };

  return (
    <View
      style={{
        backgroundColor: palette.surfaceAlt,
        borderColor: palette.borderStrong,
        borderWidth: 1,
        borderRadius: radii.md,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <TouchableOpacity
        testID="water-toggle"
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.85}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: radii.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 214, 143, 0.10)',
            borderWidth: 1,
            borderColor: accent.sessionUp,
          }}
        >
          <Droplet size={16} color={accent.sessionUp} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              color: accent.sessionUp,
              fontFamily: fonts.family.mono,
              fontSize: 11,
              letterSpacing: 1.6,
              fontWeight: '800',
              textTransform: 'uppercase',
            }}
          >
            Water
          </Text>
          <Text
            style={{
              color: text.primary,
              fontSize: 15,
              fontWeight: '800',
              letterSpacing: -0.2,
              fontVariant: fonts.tabularNums,
            }}
          >
            {formatVolume(totalMl, unit)}
            <Text style={{ color: text.quaternary, fontWeight: '600' }}>
              {' / '}
              {formatVolume(targetMl, unit)}
            </Text>
          </Text>
        </View>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', gap: 4 }}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 2,
              backgroundColor: i < filled ? accent.sessionUp : palette.surface,
            }}
          />
        ))}
      </View>

      {expanded ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
          <ActionButton
            label={`+ CUP · ${cupMl}`}
            tone="primary"
            onPress={() => wrap(() => onAddMl(cupMl))}
            disabled={busy}
            testID="water-add-cup"
          />
          <ActionButton
            label={`+ BOTTLE · ${bottleMl}`}
            tone="primary"
            onPress={() => wrap(() => onAddMl(bottleMl))}
            disabled={busy}
            testID="water-add-bottle"
          />
          <TouchableOpacity
            testID="water-undo"
            onPress={() => wrap(onUndo)}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Undo last water tap"
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              borderRadius: radii.sm,
              borderWidth: 1,
              borderColor: palette.borderStrong,
              backgroundColor: palette.surface,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Undo2 size={16} color={text.tertiary} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const ActionButton = ({
  label,
  tone,
  onPress,
  disabled,
  testID,
}: {
  label: string;
  tone: 'primary' | 'neutral';
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) => (
  <TouchableOpacity
    testID={testID}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    style={{
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: tone === 'primary' ? accent.sessionUp : palette.borderStrong,
      backgroundColor:
        tone === 'primary' ? 'rgba(0, 214, 143, 0.10)' : palette.surface,
      alignItems: 'center',
      opacity: disabled ? 0.6 : 1,
    }}
  >
    <Text
      style={{
        color: tone === 'primary' ? accent.sessionUp : text.secondary,
        fontFamily: fonts.family.mono,
        fontSize: 11,
        letterSpacing: 1.6,
        fontWeight: '800',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);
