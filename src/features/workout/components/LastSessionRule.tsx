import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GhostSet } from '../hooks/useLastSessionSets';
import { palette, text, accent, fonts, space } from '../../../styles/theme';

type Props = {
  /** Ordered last-session sets, or empty if no prior session. */
  ghostSets: GhostSet[];
  /** ISO date (YYYY-MM-DD) of the prior session, or null. */
  lastDate: string | null;
  /** Heaviest completed weight today, used to compute the lift-delta. */
  topToday: number | null;
};

/** "MMM DD" for the values; "5d AGO" for the eyebrow if we have a date. */
const formatDayDelta = (iso: string | null): string | null => {
  if (!iso) return null;
  const last = new Date(iso + 'T00:00:00');
  if (Number.isNaN(last.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ms = today.getTime() - last.getTime();
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  if (days === 0) return 'TODAY';
  if (days === 1) return '1d AGO';
  if (days < 14) return `${days}d AGO`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks}w AGO`;
  return `${Math.floor(days / 30)}mo AGO`;
};

const formatVal = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return '—';
  if (!Number.isFinite(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toString();
};

const formatSets = (ghosts: GhostSet[]): string => {
  return ghosts
    .filter(g => g && (g.weight !== null || g.reps !== null))
    .map(g => `${formatVal(g?.weight)}·${formatVal(g?.reps)}`)
    .join(' · ');
};

const computeTopLast = (ghosts: GhostSet[]): number => {
  let top = 0;
  for (const g of ghosts) {
    const w = Number(g?.weight ?? 0);
    if (Number.isFinite(w) && w > top) top = w;
  }
  return top;
};

const LastSessionRule = ({ ghostSets, lastDate, topToday }: Props) => {
  const hasGhosts = ghostSets.some(g => g && (g.weight !== null || g.reps !== null));
  if (!hasGhosts) return null;

  const valStr = formatSets(ghostSets);
  const dayLabel = formatDayDelta(lastDate);
  const topLast = computeTopLast(ghostSets);

  // Delta only meaningful when both sides have a top weight.
  let delta: number | null = null;
  if (topToday !== null && topToday > 0 && topLast > 0) {
    delta = topToday - topLast;
  }

  const deltaColor =
    delta === null || delta === 0
      ? text.quaternary
      : delta > 0
        ? accent.lift
        : accent.regression;

  const deltaLabel =
    delta === null
      ? null
      : delta === 0
        ? 'matched'
        : `${delta > 0 ? '+' : ''}${delta}`;

  return (
    <View style={styles.rule}>
      <View style={styles.labelGroup}>
        <Text style={styles.label}>LAST</Text>
        {dayLabel ? <Text style={styles.subLabel}>· {dayLabel}</Text> : null}
      </View>
      <Text style={styles.vals} numberOfLines={1} ellipsizeMode="tail">
        {valStr}
      </Text>
      {deltaLabel ? (
        <Text style={[styles.delta, { color: deltaColor }]}>{deltaLabel}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.borderSubtle,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space['2sm'],
    flexShrink: 0,
  },
  label: {
    fontSize: 11,
    color: text.quaternary,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  subLabel: {
    fontSize: 10,
    color: text.disabled,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  vals: {
    flex: 1,
    fontSize: 13,
    color: text.secondary,
    fontWeight: '600',
    fontVariant: fonts.tabularNums,
  },
  delta: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: fonts.tabularNums,
    flexShrink: 0,
  },
});

export default LastSessionRule;
