import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import NumberControl from '../../../components/NumberControl';
import workoutStyles from '../../../styles/workout';

type GhostSet = { weight: number | null; reps: number | null };

type WorkoutFocusSetsProps = {
  currentExercise: any;
  getExerciseConfig: (name: string) => any;
  updateSet: (exerciseId: number, setIndex: number, field: string, value: any) => void;
  /** Last-session values per set index — shown as ghost placeholders. */
  ghostSets?: GhostSet[];
};

const ghostString = (val: number | null | undefined, fallback: string): string => {
  if (val === null || val === undefined) return fallback;
  // Trim trailing .0 so "100" reads cleaner than "100.0".
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Number.isInteger(n) ? String(n) : n.toString();
};

const WorkoutFocusSets = ({
  currentExercise,
  getExerciseConfig,
  updateSet,
  ghostSets = [],
}: WorkoutFocusSetsProps) => {
  if (!currentExercise) return null;

  return (
    <View style={workoutStyles.workoutSets}>
      {currentExercise.sets.map((set: any, setIndex: number) => {
        const exConfig = getExerciseConfig(currentExercise.name);
        const ghost = ghostSets[setIndex];
        // Carry the latest known set forward if last session had fewer sets.
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
              set.completed && workoutStyles.workoutSetCompleted
            ]}
          >
            <View style={workoutStyles.workoutSetHeader}>
              <View style={[workoutStyles.workoutSetNumber, set.completed && workoutStyles.workoutSetNumberCompleted]}>
                <Text style={workoutStyles.workoutSetNumberText}>{setIndex + 1}</Text>
              </View>
              <View style={workoutStyles.workoutSetDivider} />
              <TouchableOpacity
                onPress={() => updateSet(currentExercise.id, setIndex, 'completed', !set.completed)}
                style={[
                  workoutStyles.workoutSetCheck,
                  set.completed && workoutStyles.workoutSetCheckCompleted
                ]}
              >
                <CheckCircle size={24} color={set.completed ? "#0f172a" : "#475569"} />
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
  );
};

export default WorkoutFocusSets;

