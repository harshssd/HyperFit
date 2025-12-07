import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ChevronLeft, List, Maximize2, Plus } from 'lucide-react-native';
import styles from '../styles/appStyles';

type WorkoutHeaderProps = {
  isSessionActive: boolean;
  viewMode: 'list' | 'focus';
  currentIndex: number;
  totalExercises: number;
  onBackToOverview: () => void;
  onToggleViewMode: () => void;
  onAddExercise: () => void;
};

const WorkoutHeader = ({
  isSessionActive,
  viewMode,
  currentIndex,
  totalExercises,
  onBackToOverview,
  onToggleViewMode,
  onAddExercise,
}: WorkoutHeaderProps) => {
  return (
    <View style={styles.workoutHeader}>
      {isSessionActive && (
        <TouchableOpacity onPress={onBackToOverview} style={styles.backToOverviewButton}>
          <ChevronLeft size={20} color="#94a3b8" />
          <Text style={styles.backToOverviewText}>OVERVIEW</Text>
        </TouchableOpacity>
      )}

      <View style={styles.workoutDots}>
        {Array.from({ length: totalExercises }).map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.workoutDot,
              idx === currentIndex && styles.workoutDotActive
            ]}
          />
        ))}
      </View>

      <View style={styles.workoutHeaderActions}>
        <TouchableOpacity onPress={onToggleViewMode} style={styles.workoutHeaderButton}>
          {viewMode === 'list' ? (
            <Maximize2 size={18} color="#94a3b8" />
          ) : (
            <List size={18} color="#94a3b8" />
          )}
        </TouchableOpacity>
        {!isSessionActive && (
          <TouchableOpacity onPress={onAddExercise} style={styles.workoutHeaderButton}>
            <Plus size={18} color="#f97316" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default WorkoutHeader;

