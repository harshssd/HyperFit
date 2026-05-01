import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, SkipForward } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../styles/theme';

let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch {
  // optional
}

type Props = {
  restSeconds: number | null;
  totalSeconds: number | null;
  onExtend: (extra?: number) => void;
  onSkip: () => void;
};

const formatMMSS = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

/**
 * Sticky rest-timer bar shown at the bottom of the active workout.
 *
 * Renders nothing when `restSeconds` is null. Shows a progress bar that
 * fills as the timer counts down, large readable countdown, and quick
 * +30s / Skip controls. Buzzes once when the timer hits zero.
 */
export const RestTimerBar = ({ restSeconds, totalSeconds, onExtend, onSkip }: Props) => {
  const prevRef = useRef<number | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const prev = prevRef.current;
    // Buzz only on natural completion: previous tick was 1 and we're now null.
    // Skip jumps from N>1 to null and should NOT buzz.
    if (prev === 1 && restSeconds === null) {
      try {
        if (Haptics?.notificationAsync) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Vibration.vibrate(200);
        }
      } catch {
        /* ignore */
      }
    }
    prevRef.current = restSeconds;
  }, [restSeconds]);

  if (restSeconds === null) return null;

  const total = totalSeconds && totalSeconds >= restSeconds ? totalSeconds : restSeconds;
  const progress = Math.max(0, Math.min(1, 1 - restSeconds / total));

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.sm }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.label}>REST</Text>
            <Text style={styles.time}>{formatMMSS(restSeconds)}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => onExtend(30)}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="Add 30 seconds"
            >
              <Plus size={14} color={colors.primary} />
              <Text style={styles.actionText}>30s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSkip}
              style={[styles.actionBtn, styles.skipBtn]}
              accessibilityRole="button"
              accessibilityLabel="Skip rest"
            >
              <SkipForward size={14} color="#0f172a" />
              <Text style={[styles.actionText, styles.skipText]}>SKIP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  bar: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.55)',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  time: { color: '#f8fafc', fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(249,115,22,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.4)',
  },
  actionText: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  skipBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  skipText: { color: '#0f172a' },
});

export default RestTimerBar;
