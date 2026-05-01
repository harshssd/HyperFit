import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import NumberControl from '../../../components/NumberControl';
import LastSessionRule from './LastSessionRule';
import SetGrid from './SetGrid';
import type { GhostSet } from '../hooks/useLastSessionSets';
import { palette, text, accent, fonts, space, radii } from '../../../styles/theme';

type WorkoutFocusSetsProps = {
  currentExercise: any;
  getExerciseConfig: (name: string) => any;
  updateSet: (exerciseId: number, setIndex: number, field: string, value: any) => void;
  /** Last-session values per set index — shown as ghost placeholders. */
  ghostSets?: GhostSet[];
  /** ISO date of the prior session, surfaced in the LAST · 5d AGO label. */
  lastDate?: string | null;
};

const ghostString = (val: number | null | undefined, fallback: string): string => {
  if (val === null || val === undefined) return fallback;
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Number.isInteger(n) ? String(n) : n.toString();
};

const computeTopToday = (sets: any[]): number | null => {
  let top = 0;
  for (const s of sets ?? []) {
    if (!s?.completed) continue;
    const w = Number(s.weight ?? 0);
    if (Number.isFinite(w) && w > top) top = w;
  }
  return top > 0 ? top : null;
};

const WorkoutFocusSets = ({
  currentExercise,
  getExerciseConfig,
  updateSet,
  ghostSets = [],
  lastDate = null,
}: WorkoutFocusSetsProps) => {
  const topToday = useMemo(
    () => computeTopToday(currentExercise?.sets ?? []),
    [currentExercise?.sets]
  );

  const liveIndex = useMemo(() => {
    const arr = currentExercise?.sets ?? [];
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i].completed) return i;
    }
    return -1;
  }, [currentExercise?.sets]);

  if (!currentExercise) return null;

  const exConfig = getExerciseConfig(currentExercise.name);
  const liveSet = liveIndex >= 0 ? currentExercise.sets[liveIndex] : null;
  const liveGhost =
    liveIndex >= 0
      ? (ghostSets[liveIndex] ?? ghostSets[ghostSets.length - 1])
      : undefined;
  const weightPlaceholder = ghostString(liveGhost?.weight, exConfig.weightPlaceholder);
  const repsPlaceholder = ghostString(liveGhost?.reps, exConfig.repPlaceholder);

  return (
    <View style={styles.wrap}>
      <LastSessionRule
        ghostSets={ghostSets}
        lastDate={lastDate}
        topToday={topToday}
      />

      <SetGrid
        sets={currentExercise.sets}
        ghostSets={ghostSets}
        liveIndex={liveIndex}
      />

      {liveSet ? (
        <View style={styles.liveCard}>
          <View style={styles.liveHeader}>
            <Text style={styles.liveLabel}>
              ENTER SET {liveIndex + 1}
            </Text>
            <TouchableOpacity
              onPress={() =>
                updateSet(currentExercise.id, liveIndex, 'completed', true)
              }
              style={styles.markBtn}
              accessibilityRole="button"
              accessibilityLabel={`Mark set ${liveIndex + 1} complete`}
            >
              <CheckCircle size={18} color={palette.bg} />
              <Text style={styles.markBtnText}>MARK SET</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.liveControls}>
            <NumberControl
              label={exConfig.weightLabel}
              value={liveSet.weight}
              step={exConfig.weightStep}
              placeholder={weightPlaceholder}
              onChange={(val: any) =>
                updateSet(currentExercise.id, liveIndex, 'weight', val)
              }
            />
            <NumberControl
              label={exConfig.repLabel}
              value={liveSet.reps}
              step={exConfig.repStep}
              placeholder={repsPlaceholder}
              onChange={(val: any) =>
                updateSet(currentExercise.id, liveIndex, 'reps', val)
              }
            />
          </View>
        </View>
      ) : (
        <View style={styles.allDone}>
          <CheckCircle size={20} color={accent.sessionUp} />
          <Text style={styles.allDoneText}>ALL SETS DONE</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 0,
  },
  liveCard: {
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderColor: palette.borderSubtle,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  liveLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: accent.lift,
    letterSpacing: 1.8,
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radii.sm,
    backgroundColor: accent.lift,
  },
  markBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.bg,
    letterSpacing: 1.4,
  },
  liveControls: {
    flexDirection: 'row',
    gap: space.lg,
  },
  allDone: {
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderColor: palette.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  allDoneText: {
    fontSize: 12,
    fontWeight: '800',
    color: accent.sessionUp,
    letterSpacing: 2,
  },
});

export default WorkoutFocusSets;
