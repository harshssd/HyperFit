import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { GhostSet } from '../hooks/useLastSessionSets';
import { palette, text, accent, fonts, space } from '../../../styles/theme';

type SetState = {
  weight: number | string | null;
  reps: number | string | null;
  completed: boolean;
};

type Props = {
  /** Today's planned/completed sets (from currentExercise.sets). */
  sets: SetState[];
  /** Last-session sets, used as fallback values for pending rows. */
  ghostSets: GhostSet[];
  /** Index of the next-up "live" set (first non-completed). -1 if all done. */
  liveIndex: number;
  /** Tap handler for each cell (so live cell can open input). */
  onTapCell?: (index: number) => void;
};

type Cellstate = 'done' | 'live' | 'pending';

const formatVal = (n: number | string | null | undefined, fallback: string): string => {
  if (n === null || n === undefined || n === '') return fallback;
  const v = typeof n === 'string' ? Number(n) : n;
  if (!Number.isFinite(v as number)) return fallback;
  return Number.isInteger(v) ? String(v) : (v as number).toString();
};

const cellState = (i: number, sets: SetState[], liveIndex: number): Cellstate => {
  if (sets[i]?.completed) return 'done';
  if (i === liveIndex) return 'live';
  return 'pending';
};

const labelFor = (i: number, state: Cellstate): string => {
  if (state === 'live') return 'LIVE';
  return `SET ${i + 1}`;
};

const SetGrid = ({ sets, ghostSets, liveIndex, onTapCell }: Props) => {
  if (sets.length === 0) return null;

  return (
    <View style={styles.grid}>
      {sets.map((set, i) => {
        const state = cellState(i, sets, liveIndex);
        const ghost = ghostSets[i] ?? ghostSets[ghostSets.length - 1];
        // Done: actual values. Live & pending: today's planned, falling back
        // to ghost (last session's same-index set).
        const w =
          state === 'done'
            ? formatVal(set.weight, '—')
            : formatVal(set.weight ?? ghost?.weight, '?');
        const r =
          state === 'done'
            ? formatVal(set.reps, '—')
            : formatVal(set.reps ?? ghost?.reps, '?');

        const valStyle =
          state === 'done'
            ? styles.valDone
            : state === 'live'
              ? styles.valLive
              : styles.valPending;
        const lblStyle =
          state === 'live' ? styles.lblLive : styles.lblDefault;

        const cellInner = (
          <>
            <Text style={[styles.val, valStyle]} numberOfLines={1}>
              {w}·{r}
            </Text>
            <Text style={[styles.lbl, lblStyle]}>{labelFor(i, state)}</Text>
          </>
        );

        const isLast = i === sets.length - 1;

        return onTapCell ? (
          <TouchableOpacity
            key={set.weight + '-' + i}
            style={[styles.cell, !isLast && styles.cellDivider]}
            onPress={() => onTapCell(i)}
            activeOpacity={0.7}
          >
            {cellInner}
          </TouchableOpacity>
        ) : (
          <View
            key={'static-' + i}
            style={[styles.cell, !isLast && styles.cellDivider]}
          >
            {cellInner}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    marginTop: space.lg,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: space.xs,
  },
  cellDivider: {
    borderRightWidth: 1,
    borderColor: palette.borderSubtle,
  },
  val: {
    fontSize: 22,
    fontWeight: '900',
    fontVariant: fonts.tabularNums,
    letterSpacing: -0.2,
  },
  valDone: {
    color: text.primary,
    opacity: 0.5,
  },
  valLive: {
    color: accent.lift,
  },
  valPending: {
    color: text.disabled,
  },
  lbl: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: space['2sm'],
  },
  lblDefault: {
    color: text.quaternary,
    opacity: 0.6,
  },
  lblLive: {
    color: accent.lift,
    opacity: 1,
  },
});

export default SetGrid;
