import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ArrowUp, ArrowDown, Trash2, Plus, Save, Play, X } from 'lucide-react-native';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import styles from '../styles/appStyles';

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
    <View style={styles.overviewContainer}>
      <View style={styles.overviewHeader}>
        <View>
          <Text style={styles.overviewTitle}>WORKOUT OVERVIEW</Text>
          <Text style={styles.overviewSubtitle}>{visibleWorkout.length} Exercises</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.overviewCloseButton}>
          <X size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.overviewList} contentContainerStyle={styles.overviewListContent}>
        {visibleWorkout.map((ex: any, index: number) => (
          <GlassCard key={ex.id} style={styles.overviewExerciseCard}>
            <View style={styles.overviewExerciseContent}>
              <View style={styles.overviewExerciseNumber}>
                <Text style={styles.overviewExerciseNumberText}>{index + 1}</Text>
              </View>
              {editingExerciseId === ex.id ? (
                <TextInput
                  style={styles.overviewExerciseNameInput}
                  value={ex.name}
                  onChangeText={(text) => onRenameExercise(ex.id, text)}
                  onSubmitEditing={onEndEdit}
                  onBlur={onEndEdit}
                  autoFocus
                />
              ) : (
                <Text style={styles.overviewExerciseName} onPress={() => onBeginEdit(ex.id)}>
                  {ex.name}
                </Text>
              )}
              <View style={styles.overviewExerciseActions}>
                <TouchableOpacity
                  onPress={() => onMoveExercise(ex.id, 'up')}
                  disabled={index === 0}
                  style={[styles.overviewActionButton, index === 0 && styles.overviewActionButtonDisabled]}
                >
                  <ArrowUp size={16} color={index === 0 ? "#475569" : "#94a3b8"} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onMoveExercise(ex.id, 'down')}
                  disabled={index === visibleWorkout.length - 1}
                  style={[styles.overviewActionButton, index === visibleWorkout.length - 1 && styles.overviewActionButtonDisabled]}
                >
                  <ArrowDown size={16} color={index === visibleWorkout.length - 1 ? "#475569" : "#94a3b8"} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDeleteExercise(ex.id)}
                  style={[styles.overviewActionButton, styles.overviewActionButtonDelete]}
                >
                  <Trash2 size={16} color="#f87171" />
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        ))}
      </ScrollView>

      <View style={styles.overviewActions}>
        <TouchableOpacity onPress={onAddExercise} style={styles.overviewAddButton}>
          <Plus size={20} color="#f97316" />
          <Text style={styles.overviewAddButtonText}>ADD EXERCISE</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSaveTemplate} style={styles.overviewSaveButton}>
          <Save size={20} color="#22d3ee" />
          <Text style={styles.overviewSaveButtonText}>SAVE TEMPLATE</Text>
        </TouchableOpacity>
        <NeonButton onPress={onStartSession} style={styles.overviewStartButton} disabled={visibleWorkout.length === 0}>
          <Play size={20} color="#0f172a" />
          <Text style={{ marginLeft: 8 }}>START SESSION</Text>
        </NeonButton>
      </View>
    </View>
  );
};

export default WorkoutOverview;

