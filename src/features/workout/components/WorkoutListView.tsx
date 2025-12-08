import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import GlassCard from '../../../components/GlassCard';
import NeonButton from '../../../components/NeonButton';
import styles from '../../../styles/appStyles';

type WorkoutListViewProps = {
  visibleWorkout: any[];
  onSelectExercise: (index: number) => void;
  onFinish: () => void;
  onAbort: () => void;
};

const WorkoutListView = ({ visibleWorkout, onSelectExercise, onFinish, onAbort }: WorkoutListViewProps) => {
  return (
    <View style={styles.workoutList}>
      {visibleWorkout.map((ex: any, i: number) => (
        <GlassCard
          key={ex.id}
          onPress={() => onSelectExercise(i)}
          style={styles.workoutListItem}
        >
          <Text style={styles.workoutListItemName}>{ex.name}</Text>
          <View style={styles.workoutListItemInfo}>
            <Text style={styles.workoutListItemSets}>
              {ex.sets.filter((s: any) => s.completed).length}/{ex.sets.length} SETS
            </Text>
            <ChevronRight size={16} color="#64748b" />
          </View>
        </GlassCard>
      ))}
      <View style={styles.workoutListActions}>
        <NeonButton onPress={onFinish} style={styles.finishButton}>
          <Text>FINISH WORKOUT</Text>
        </NeonButton>
        <TouchableOpacity onPress={onAbort} style={styles.abortButton}>
          <Text style={styles.abortButtonText}>Abort Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WorkoutListView;

