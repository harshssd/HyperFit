import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import NumberControl from '../../../components/NumberControl';
import styles from '../../../styles/appStyles';

type WorkoutFocusSetsProps = {
  currentExercise: any;
  getExerciseConfig: (name: string) => any;
  updateSet: (exerciseId: number, setIndex: number, field: string, value: any) => void;
};

const WorkoutFocusSets = ({ currentExercise, getExerciseConfig, updateSet }: WorkoutFocusSetsProps) => {
  if (!currentExercise) return null;

  return (
    <View style={styles.workoutSets}>
      {currentExercise.sets.map((set: any, setIndex: number) => {
        const exConfig = getExerciseConfig(currentExercise.name);
        return (
          <View
            key={set.id}
            style={[
              styles.workoutSet,
              set.completed && styles.workoutSetCompleted
            ]}
          >
            <View style={styles.workoutSetHeader}>
              <View style={[styles.workoutSetNumber, set.completed && styles.workoutSetNumberCompleted]}>
                <Text style={styles.workoutSetNumberText}>{setIndex + 1}</Text>
              </View>
              <View style={styles.workoutSetDivider} />
              <TouchableOpacity
                onPress={() => updateSet(currentExercise.id, setIndex, 'completed', !set.completed)}
                style={[
                  styles.workoutSetCheck,
                  set.completed && styles.workoutSetCheckCompleted
                ]}
              >
                <CheckCircle size={24} color={set.completed ? "#0f172a" : "#475569"} />
              </TouchableOpacity>
            </View>
            {!set.completed && (
              <View style={styles.workoutSetControls}>
                <NumberControl
                  label={exConfig.weightLabel}
                  value={set.weight}
                  step={exConfig.weightStep}
                  placeholder={exConfig.weightPlaceholder}
                  onChange={(val: any) => updateSet(currentExercise.id, setIndex, 'weight', val)}
                />
                <NumberControl
                  label={exConfig.repLabel}
                  value={set.reps}
                  step={exConfig.repStep}
                  placeholder={exConfig.repPlaceholder}
                  onChange={(val: any) => updateSet(currentExercise.id, setIndex, 'reps', val)}
                />
              </View>
            )}
            {set.completed && (
              <View style={styles.workoutSetCompletedInfo}>
                <Text style={styles.workoutSetCompletedText}>
                  {set.weight || 0} {exConfig.weightLabel === 'LBS' ? 'LBS' : ''}
                </Text>
                <Text style={styles.workoutSetCompletedText}>
                  {set.reps || 0} {exConfig.repLabel === 'REPS' ? 'REPS' : 'SEC'}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

export default WorkoutFocusSets;

