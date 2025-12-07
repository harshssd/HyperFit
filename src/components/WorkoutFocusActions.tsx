import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import NeonButton from './NeonButton';
import styles from '../styles/appStyles';

type WorkoutFocusActionsProps = {
  hasNext: boolean;
  onNext: () => void;
  onFinish: () => void;
  onAbort: () => void;
};

const WorkoutFocusActions = ({ hasNext, onNext, onFinish, onAbort }: WorkoutFocusActionsProps) => {
  return (
    <View style={styles.workoutFocusActions}>
      {hasNext ? (
        <NeonButton onPress={onNext} style={styles.nextButton}>
          <Text>NEXT EXERCISE</Text>
          <ArrowRight size={18} color="#0f172a" />
        </NeonButton>
      ) : (
        <NeonButton onPress={onFinish} style={styles.completeButton}>
          <Text>COMPLETE SESSION</Text>
        </NeonButton>
      )}
      <TouchableOpacity onPress={onAbort} style={styles.abortButton}>
        <Text style={styles.abortButtonText}>Abort Session</Text>
      </TouchableOpacity>
    </View>
  );
};

export default WorkoutFocusActions;

