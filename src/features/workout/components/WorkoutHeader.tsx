import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ChevronLeft, List, Maximize2, Plus } from 'lucide-react-native';
import workoutStyles from '../../../styles/workout';

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
    <View style={workoutStyles.workoutHeader}>
      {isSessionActive && (
        <TouchableOpacity onPress={onBackToOverview} style={workoutStyles.backToOverviewButton}>
          <ChevronLeft size={20} color="#94a3b8" />
          <Text style={workoutStyles.backToOverviewText}>OVERVIEW</Text>
        </TouchableOpacity>
      )}

      <View style={workoutStyles.workoutDots}>
        {Array.from({ length: totalExercises }).map((_, idx) => (
          <View
            key={idx}
            style={[
              workoutStyles.workoutDot,
              idx === currentIndex && workoutStyles.workoutDotActive
            ]}
          />
        ))}
      </View>

      <View style={workoutStyles.workoutHeaderActions}>
        <TouchableOpacity onPress={onToggleViewMode} style={workoutStyles.workoutHeaderButton}>
          {viewMode === 'list' ? (
            <Maximize2 size={18} color="#94a3b8" />
          ) : (
            <List size={18} color="#94a3b8" />
          )}
        </TouchableOpacity>
        {!isSessionActive && (
          <TouchableOpacity onPress={onAddExercise} style={workoutStyles.workoutHeaderButton}>
            <Plus size={18} color="#f97316" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default WorkoutHeader;

