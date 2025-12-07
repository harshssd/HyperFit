import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import styles from '../styles/appStyles';

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
    <View style={styles.workoutFocusHeader}>
      <TouchableOpacity
        onPress={onPrev}
        disabled={currentIndex === 0}
        style={[styles.workoutNavButton, currentIndex === 0 && styles.workoutNavButtonDisabled]}
      >
        <ChevronLeft size={24} color={currentIndex === 0 ? "#475569" : "#94a3b8"} />
      </TouchableOpacity>

      <View style={styles.workoutFocusTitle}>
        <Text style={styles.workoutFocusTitleText}>{currentExerciseName}</Text>
        <Text style={styles.workoutFocusSubtitle}>
          EXERCISE {currentIndex + 1} OF {totalExercises}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onNext}
        disabled={currentIndex === totalExercises - 1}
        style={[styles.workoutNavButton, currentIndex === totalExercises - 1 && styles.workoutNavButtonDisabled]}
      >
        <ChevronRight size={24} color={currentIndex === totalExercises - 1 ? "#475569" : "#94a3b8"} />
      </TouchableOpacity>
    </View>
  );
};

export default WorkoutFocusHeader;

