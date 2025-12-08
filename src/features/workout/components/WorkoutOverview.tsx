import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ArrowUp, ArrowDown, Trash2, Plus, Save, Play, X } from 'lucide-react-native';
import GlassCard from '../../../components/GlassCard';
import NeonButton from '../../../components/NeonButton';
import workoutStyles from '../../../styles/workout';

type WorkoutOverviewProps = {
  visibleWorkout: any[];
  editingExerciseId: number | null;
  onClose: () => void;
  onAddExercise: () => void;
  onSaveTemplate: () => void;
  onStartSession: () => void;
  onMoveExercise: (id: number, direction: 'up' | 'down') => void;
  onDeleteExercise: (id: number) => void;
  onBeginEdit: (id: number) => void;
  onRenameExercise: (id: number, name: string) => void;
  onEndEdit: () => void;
};

const WorkoutOverview = ({
  visibleWorkout,
  editingExerciseId,
  onClose,
  onAddExercise,
  onSaveTemplate,
  onStartSession,
  onMoveExercise,
  onDeleteExercise,
  onBeginEdit,
  onRenameExercise,
  onEndEdit,
}: WorkoutOverviewProps) => {
  return (
    <View style={workoutStyles.overviewContainer}>
      <View style={workoutStyles.overviewHeader}>
        <View>
          <Text style={workoutStyles.overviewTitle}>WORKOUT OVERVIEW</Text>
          <Text style={workoutStyles.overviewSubtitle}>{visibleWorkout.length} Exercises</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={workoutStyles.overviewCloseButton}>
          <X size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView style={workoutStyles.overviewList} contentContainerStyle={workoutStyles.overviewListContent}>
        {visibleWorkout.map((ex: any, index: number) => (
          <GlassCard key={ex.id} style={workoutStyles.overviewExerciseCard}>
            <View style={workoutStyles.overviewExerciseContent}>
              <View style={workoutStyles.overviewExerciseNumber}>
                <Text style={workoutStyles.overviewExerciseNumberText}>{index + 1}</Text>
              </View>
              {editingExerciseId === ex.id ? (
                <TextInput
                  style={workoutStyles.overviewExerciseNameInput}
                  value={ex.name}
                  onChangeText={(text) => onRenameExercise(ex.id, text)}
                  onSubmitEditing={onEndEdit}
                  onBlur={onEndEdit}
                  autoFocus
                />
              ) : (
                <Text style={workoutStyles.overviewExerciseName} onPress={() => onBeginEdit(ex.id)}>
                  {ex.name}
                </Text>
              )}
              <View style={workoutStyles.overviewExerciseActions}>
                <TouchableOpacity
                  onPress={() => onMoveExercise(ex.id, 'up')}
                  disabled={index === 0}
                  style={[workoutStyles.overviewActionButton, index === 0 && workoutStyles.overviewActionButtonDisabled]}
                >
                  <ArrowUp size={16} color={index === 0 ? "#475569" : "#94a3b8"} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onMoveExercise(ex.id, 'down')}
                  disabled={index === visibleWorkout.length - 1}
                  style={[workoutStyles.overviewActionButton, index === visibleWorkout.length - 1 && workoutStyles.overviewActionButtonDisabled]}
                >
                  <ArrowDown size={16} color={index === visibleWorkout.length - 1 ? "#475569" : "#94a3b8"} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDeleteExercise(ex.id)}
                  style={[workoutStyles.overviewActionButton, workoutStyles.overviewActionButtonDelete]}
                >
                  <Trash2 size={16} color="#f87171" />
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        ))}
      </ScrollView>

      <View style={workoutStyles.overviewActions}>
        <TouchableOpacity onPress={onAddExercise} style={workoutStyles.overviewAddButton}>
          <Plus size={20} color="#f97316" />
          <Text style={workoutStyles.overviewAddButtonText}>ADD EXERCISE</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSaveTemplate} style={workoutStyles.overviewSaveButton}>
          <Save size={20} color="#22d3ee" />
          <Text style={workoutStyles.overviewSaveButtonText}>SAVE TEMPLATE</Text>
        </TouchableOpacity>
        <NeonButton onPress={onStartSession} style={workoutStyles.overviewStartButton} disabled={visibleWorkout.length === 0}>
          <Play size={20} color="#0f172a" />
          <Text style={{ marginLeft: 8 }}>START SESSION</Text>
        </NeonButton>
      </View>
    </View>
  );
};

export default WorkoutOverview;

