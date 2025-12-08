import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import GlassCard from '../../../components/GlassCard';
import NeonButton from '../../../components/NeonButton';
import workoutStyles from '../../../styles/workout';

type WorkoutListViewProps = {
  visibleWorkout: any[];
  onSelectExercise: (index: number) => void;
  onFinish: () => void;
  onAbort: () => void;
};

const WorkoutListView = ({ visibleWorkout, onSelectExercise, onFinish, onAbort }: WorkoutListViewProps) => {
  return (
    <View style={workoutStyles.workoutList}>
      {visibleWorkout.map((ex: any, i: number) => (
        <GlassCard
          key={ex.id}
          onPress={() => onSelectExercise(i)}
          style={workoutStyles.workoutListItem}
        >
          <Text style={workoutStyles.workoutListItemName}>{ex.name}</Text>
          <View style={workoutStyles.workoutListItemInfo}>
            <Text style={workoutStyles.workoutListItemSets}>
              {ex.sets.filter((s: any) => s.completed).length}/{ex.sets.length} SETS
            </Text>
            <ChevronRight size={16} color="#64748b" />
          </View>
        </GlassCard>
      ))}
      <View style={workoutStyles.workoutListActions}>
        <NeonButton onPress={onFinish} style={workoutStyles.finishButton}>
          <Text>FINISH WORKOUT</Text>
        </NeonButton>
        <TouchableOpacity onPress={onAbort} style={workoutStyles.abortButton}>
          <Text style={workoutStyles.abortButtonText}>Abort Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default React.memo(WorkoutListView);

