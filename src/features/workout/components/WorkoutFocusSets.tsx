import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import NumberControl from '../../../components/NumberControl';
import LastSessionRule from './LastSessionRule';
import workoutStyles from '../../../styles/workout';
import type { GhostSet } from '../hooks/useLastSessionSets';
import { palette, text } from '../../../styles/theme';

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

  if (!currentExercise) return null;

  const exConfig = getExerciseConfig(currentExercise.name);

  return (
    <View>
      <LastSessionRule
        ghostSets={ghostSets}
        lastDate={lastDate}
        topToday={topToday}
      />

      <View style={workoutStyles.workoutSets}>
        {currentExercise.sets.map((set: any, setIndex: number) => {
          const ghost = ghostSets[setIndex];
          const ghostFallback = ghostSets.length > 0
            ? ghostSets[Math.min(setIndex, ghostSets.length - 1)]
            : undefined;
          const ghostFor = ghost ?? ghostFallback;
          const weightPlaceholder = ghostString(ghostFor?.weight, exConfig.weightPlaceholder);
          const repsPlaceholder = ghostString(ghostFor?.reps, exConfig.repPlaceholder);

          return (
            <View
              key={set.id}
              style={[
                workoutStyles.workoutSet,
                set.completed && workoutStyles.workoutSetCompleted,
              ]}
            >
              <View style={workoutStyles.workoutSetHeader}>
                <View
                  style={[
                    workoutStyles.workoutSetNumber,
                    set.completed && workoutStyles.workoutSetNumberCompleted,
                  ]}
                >
                  <Text style={workoutStyles.workoutSetNumberText}>{setIndex + 1}</Text>
                </View>
                <View style={workoutStyles.workoutSetDivider} />
                <TouchableOpacity
                  onPress={() =>
                    updateSet(currentExercise.id, setIndex, 'completed', !set.completed)
                  }
                  style={[
                    workoutStyles.workoutSetCheck,
                    set.completed && workoutStyles.workoutSetCheckCompleted,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    set.completed ? `Mark set ${setIndex + 1} incomplete` : `Mark set ${setIndex + 1} complete`
                  }
                >
                  <CheckCircle size={22} color={set.completed ? palette.bg : text.tertiary} />
                </TouchableOpacity>
              </View>
              {!set.completed && (
                <View style={workoutStyles.workoutSetControls}>
                  <NumberControl
                    label={exConfig.weightLabel}
                    value={set.weight}
                    step={exConfig.weightStep}
                    placeholder={weightPlaceholder}
                    onChange={(val: any) => updateSet(currentExercise.id, setIndex, 'weight', val)}
                  />
                  <NumberControl
                    label={exConfig.repLabel}
                    value={set.reps}
                    step={exConfig.repStep}
                    placeholder={repsPlaceholder}
                    onChange={(val: any) => updateSet(currentExercise.id, setIndex, 'reps', val)}
                  />
                </View>
              )}
              {set.completed && (
                <View style={workoutStyles.workoutSetCompletedInfo}>
                  <Text style={workoutStyles.workoutSetCompletedText}>
                    {set.weight || 0} {exConfig.weightLabel === 'LBS' ? 'LBS' : ''}
                  </Text>
                  <Text style={workoutStyles.workoutSetCompletedText}>
                    {set.reps || 0} {exConfig.repLabel === 'REPS' ? 'REPS' : 'SEC'}
                  </Text>
                  {typeof set.restSeconds === 'number' && (
                    <Text style={workoutStyles.workoutSetCompletedText}>
                      Rest: {set.restSeconds}s
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default WorkoutFocusSets;
