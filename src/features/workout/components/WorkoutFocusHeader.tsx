import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import workoutStyles from '../../../styles/workout';

type WorkoutFocusHeaderProps = {
  currentExerciseName?: string;
  currentIndex: number;
  totalExercises: number;
  onPrev: () => void;
  onNext: () => void;
};

const WorkoutFocusHeader = ({
  currentExerciseName,
  currentIndex,
  totalExercises,
  onPrev,
  onNext,
}: WorkoutFocusHeaderProps) => {
  return (
    <View style={workoutStyles.workoutFocusHeader}>
      <TouchableOpacity
        onPress={onPrev}
        disabled={currentIndex === 0}
        style={[workoutStyles.workoutNavButton, currentIndex === 0 && workoutStyles.workoutNavButtonDisabled]}
      >
        <ChevronLeft size={24} color={currentIndex === 0 ? "#475569" : "#94a3b8"} />
      </TouchableOpacity>

      <View style={workoutStyles.workoutFocusTitle}>
        <Text style={workoutStyles.workoutFocusTitleText}>{currentExerciseName}</Text>
        <Text style={workoutStyles.workoutFocusSubtitle}>
          EXERCISE {currentIndex + 1} OF {totalExercises}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onNext}
        disabled={currentIndex === totalExercises - 1}
        style={[workoutStyles.workoutNavButton, currentIndex === totalExercises - 1 && workoutStyles.workoutNavButtonDisabled]}
      >
        <ChevronRight size={24} color={currentIndex === totalExercises - 1 ? "#475569" : "#94a3b8"} />
      </TouchableOpacity>
    </View>
  );
};

export default WorkoutFocusHeader;

