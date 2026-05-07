import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Check, Droplet, Trash2, Undo2, X } from 'lucide-react-native';
import { palette, accent, text, spacing, radii, fonts } from '../../../styles/theme';
import { formatVolume } from '../helpers';
import type { WaterLog } from '../../../services/nutritionService';

/**
 * WaterControls — header + always-visible add buttons + segment strip.
 *
 * +CUP and +BOTTLE are the primary actions, so they're rendered inline,
 * always visible. No expand-to-add gate — water logging is the cheapest
 * write in the app and shouldn't cost a tap to reach. The undo affordance
 * is a small icon on the header row (rare action, doesn't deserve real
 * estate next to the primaries).
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
  entries: WaterLog[];
  onDeleteEntry: (id: string) => Promise<void>;
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
  entries,
  onDeleteEntry,
}: Props) => {
  const [busy, setBusy] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const filled = Math.min(SEGMENTS, Math.floor((totalMl / targetMl) * SEGMENTS));
  // Reverse once per entries change — newest first for the feed.
  const reversedEntries = useMemo(() => [...entries].reverse(), [entries]);

  const wrap = async (op: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await op(); } finally { setBusy(false); }
  };

  const submitCustom = async () => {
    const typed = parseInt(customAmount, 10);
    if (!Number.isFinite(typed) || typed <= 0) return;
    // Input is rendered in the user's unit (label echoes UNIT.toUpperCase()),
    // so 8 in oz mode means 8 fl oz, not 8 ml. Convert before persisting.
    const ml = unit === 'oz' ? Math.round(typed * 29.5735) : typed;
    await wrap(() => onAddMl(ml));
    setCustomAmount('');
    setCustomMode(false);
  };

  const cancelCustom = () => {
    setCustomAmount('');
    setCustomMode(false);
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
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
        <TouchableOpacity
          testID="water-undo"
          onPress={() => wrap(onUndo)}
          disabled={busy || totalMl === 0}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Undo last water tap"
          style={{
            padding: spacing.xs,
            opacity: busy || totalMl === 0 ? 0.35 : 1,
          }}
        >
          <Undo2 size={16} color={text.tertiary} />
        </TouchableOpacity>
      </View>

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

      {customMode ? (
        // Inline custom-amount row replaces the action pills until the
        // user commits or cancels. Same green tone for visual continuity
        // with the cup/bottle pills it stands in for.
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            alignItems: 'center',
            marginTop: spacing.xs,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: radii.sm,
              borderWidth: 1,
              borderColor: accent.sessionUp,
              backgroundColor: 'rgba(0, 214, 143, 0.10)',
              paddingHorizontal: spacing.md,
            }}
          >
            <TextInput
              testID="water-custom-input"
              value={customAmount}
              onChangeText={setCustomAmount}
              onSubmitEditing={submitCustom}
              placeholder="0"
              placeholderTextColor={text.disabled}
              keyboardType="number-pad"
              autoFocus
              returnKeyType="done"
              maxLength={5}
              style={{
                flex: 1,
                color: text.primary,
                fontSize: 16,
                fontWeight: fonts.weight.heavy as '800',
                fontVariant: fonts.tabularNums,
                paddingVertical: spacing.md,
              }}
            />
            <Text
              style={{
                color: text.quaternary,
                fontFamily: fonts.family.mono,
                fontSize: 11,
                letterSpacing: 1.6,
                fontWeight: fonts.weight.heavy as '800',
              }}
            >
              {unit.toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            testID="water-custom-save"
            onPress={submitCustom}
            disabled={busy || !customAmount.trim()}
            accessibilityRole="button"
            accessibilityLabel="Save custom water amount"
            style={{
              width: 44,
              height: 44,
              borderRadius: radii.sm,
              borderWidth: 1,
              borderColor: accent.sessionUp,
              backgroundColor: accent.sessionUp,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: busy || !customAmount.trim() ? 0.4 : 1,
            }}
          >
            <Check size={18} color={palette.bg} strokeWidth={3} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={cancelCustom}
            accessibilityRole="button"
            accessibilityLabel="Cancel custom water amount"
            style={{
              width: 44,
              height: 44,
              borderRadius: radii.sm,
              borderWidth: 1,
              borderColor: palette.borderStrong,
              backgroundColor: palette.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color={text.tertiary} />
          </TouchableOpacity>
        </View>
      ) : (
        // Two rows: CUP + BOTTLE share the matched-pair row (one-tap
        // presets); CUSTOM is its own full-width row below. CUSTOM is
        // different in kind (gateway to an input, not a one-tap add),
        // so visually separating it tells the right story.
        <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <ActionButton
              label={`+ CUP · ${formatVolume(cupMl, unit)}`}
              tone="primary"
              onPress={() => wrap(() => onAddMl(cupMl))}
              disabled={busy}
              testID="water-add-cup"
            />
            <ActionButton
              label={`+ BOTTLE · ${formatVolume(bottleMl, unit)}`}
              tone="primary"
              onPress={() => wrap(() => onAddMl(bottleMl))}
              disabled={busy}
              testID="water-add-bottle"
            />
          </View>
          <ActionButton
            label="+ CUSTOM AMOUNT"
            tone="neutral"
            onPress={() => setCustomMode(true)}
            disabled={busy}
            testID="water-custom-open"
          />
        </View>
      )}

      {entries.length > 0 ? (
        <View style={{ marginTop: spacing.sm, gap: 1 }}>
          {reversedEntries.map((entry, idx, arr) => (
            <View
              key={entry.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.sm,
                borderTopWidth: idx === 0 ? 1 : 0,
                borderBottomWidth: idx === arr.length - 1 ? 0 : 1,
                borderColor: palette.borderSubtle,
              }}
            >
              <Droplet size={12} color={accent.sessionUp} />
              <Text
                style={{
                  flex: 1,
                  marginLeft: spacing.sm,
                  color: text.primary,
                  fontSize: 14,
                  fontWeight: '700',
                  fontVariant: fonts.tabularNums,
                }}
              >
                {formatVolume(entry.ml, unit)}
              </Text>
              <Text
                style={{
                  color: text.quaternary,
                  fontFamily: fonts.family.mono,
                  fontSize: 11,
                  letterSpacing: 1,
                  fontVariant: fonts.tabularNums,
                  marginRight: spacing.md,
                }}
              >
                {formatTime(entry.logged_at)}
              </Text>
              <TouchableOpacity
                testID={`water-delete-${entry.id}`}
                onPress={() => wrap(() => onDeleteEntry(entry.id))}
                disabled={busy}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Delete water entry"
                style={{ padding: spacing.xs, opacity: busy ? 0.35 : 1 }}
              >
                <Trash2 size={14} color={text.tertiary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

// Locale-aware short time (e.g. "9:41 AM" in en-US, "09:41" in pt-BR/de-DE).
// Falls back to undefined locale → device default. RN's Intl is bundled in
// Hermes so this works without a polyfill.
const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

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
        // text.primary on the green-washed surface guarantees >=4.5:1 contrast.
        // Green semantic meaning is carried by the border + (upstream) Droplet
        // icon; doubling it on the label was borderline against the wash.
        color: tone === 'primary' ? text.primary : text.secondary,
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
