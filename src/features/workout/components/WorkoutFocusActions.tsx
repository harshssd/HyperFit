import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import NeonButton from '../../../components/NeonButton';
import workoutStyles from '../../../styles/workout';

type WorkoutFocusActionsProps = {
  hasNext: boolean;
  onNext: () => void;
  onFinish: () => void;
  onAbort: () => void;
};

const WorkoutFocusActions = ({ hasNext, onNext, onFinish, onAbort }: WorkoutFocusActionsProps) => {
  return (
    <View style={workoutStyles.workoutFocusActions}>
      {hasNext ? (
        <NeonButton onPress={onNext} style={workoutStyles.nextButton}>
          <Text>NEXT EXERCISE</Text>
          <ArrowRight size={18} color="#0f172a" />
        </NeonButton>
      ) : (
        <NeonButton onPress={onFinish} style={workoutStyles.completeButton}>
          <Text>COMPLETE SESSION</Text>
        </NeonButton>
      )}
      <TouchableOpacity onPress={onAbort} style={workoutStyles.abortButton}>
        <Text style={workoutStyles.abortButtonText}>Abort Session</Text>
      </TouchableOpacity>
    </View>
  );
};

export default WorkoutFocusActions;

