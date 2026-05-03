import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Plus } from 'lucide-react-native';
import WorkoutHeader from './WorkoutHeader';
import WorkoutListView from './WorkoutListView';
import WorkoutFocusHeader from './WorkoutFocusHeader';
import WorkoutFocusSets from './WorkoutFocusSets';
import WorkoutFocusActions from './WorkoutFocusActions';
import FinishedSessionView from './FinishedSessionView';
import workoutStyles from '../../../styles/workout';
import { getExerciseConfig } from '../helpers';
import type { WorkoutExercise } from '../../../types/workout';

/**
 * Active workout surface — the focused/list/finished UI inside the
 * ActiveWorkout modal route. Pure presentation: every callback is owned
 * by GymView, every piece of state is passed in. The split exists to
 * isolate the session UI from the planner so each can evolve without
 * the other tripping it up.
 *
 * State (newExerciseName, isAddingExercise, viewMode, etc.) still lives
 * in the parent for now — moving it here is a follow-up once the modal
 * route owns the lifetime instead of the planner mount.
 */

type GhostState = {
  sets: any[];
  date: string | null;
};

type ActiveSessionViewProps = {
  visibleWorkout: WorkoutExercise[];
  currentExercise: WorkoutExercise | undefined;
  currentExIndex: number;
  viewMode: 'list' | 'focus';
  ghost: GhostState;
  isFinished: boolean;

  /** Dismiss the modal (back arrow / "Done" on finished view). */
  onBack: () => void;
  onToggleViewMode: () => void;
  onAddExercise: () => void;
  onSelectExercise: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;

  onAddSet: (exId: number) => void;
  onUpdateSet: (exId: number, idx: number, key: string, val: any) => void;
  onFinish: () => void;
  onAbort: () => void;

  /** Finished-state handlers. */
  onStartNewSession: () => void;
  onUndoFinish: () => void;
  calculateTotalVolume: () => number;
};

const ActiveSessionView = ({
  visibleWorkout,
  currentExercise,
  currentExIndex,
  viewMode,
  ghost,
  isFinished,
  onBack,
  onToggleViewMode,
  onAddExercise,
  onSelectExercise,
  onPrev,
  onNext,
  onAddSet,
  onUpdateSet,
  onFinish,
  onAbort,
  onStartNewSession,
  onUndoFinish,
  calculateTotalVolume,
}: ActiveSessionViewProps) => {
  if (isFinished) {
    return (
      <FinishedSessionView
        visibleWorkout={visibleWorkout}
        calculateTotalVolume={calculateTotalVolume}
        onStartNewSession={onStartNewSession}
        onUndo={onUndoFinish}
        onClose={onBack}
      />
    );
  }

  // Race-guard fallback: parent dismisses on the next tick if visibleWorkout
  // is empty. Render nothing in the meantime so the modal doesn't flash an
  // empty header.
  if (visibleWorkout.length === 0) {
    return null;
  }

  const renderFocus = () => (
    <View style={workoutStyles.workoutFocus}>
      <WorkoutFocusHeader
        currentExerciseName={currentExercise?.name}
        currentIndex={currentExIndex}
        totalExercises={visibleWorkout.length}
        onPrev={onPrev}
        onNext={onNext}
      />

      <WorkoutFocusSets
        currentExercise={currentExercise}
        getExerciseConfig={getExerciseConfig}
        updateSet={onUpdateSet}
        ghostSets={ghost.sets}
        lastDate={ghost.date}
      />

      <TouchableOpacity
        onPress={() => currentExercise && onAddSet(currentExercise.id)}
        style={workoutStyles.addSetButton}
        disabled={!currentExercise}
      >
        <Plus size={16} color="#64748b" />
        <Text style={workoutStyles.addSetButtonText}>ADD SET</Text>
      </TouchableOpacity>

      <WorkoutFocusActions
        hasNext={currentExIndex < visibleWorkout.length - 1}
        onNext={onNext}
        onFinish={onFinish}
        onAbort={onAbort}
      />
    </View>
  );

  return (
    <ScrollView style={workoutStyles.gymView} contentContainerStyle={workoutStyles.gymViewContent}>
      <View style={workoutStyles.workoutContainer}>
        <WorkoutHeader
          isSessionActive={true}
          viewMode={viewMode}
          currentIndex={currentExIndex}
          totalExercises={visibleWorkout.length}
          onBackToOverview={onBack}
          onToggleViewMode={onToggleViewMode}
          onAddExercise={onAddExercise}
        />
        {viewMode === 'list' ? (
          <WorkoutListView
            visibleWorkout={visibleWorkout}
            onSelectExercise={onSelectExercise}
            onFinish={onFinish}
            onAbort={onAbort}
          />
        ) : (
          renderFocus()
        )}
      </View>
    </ScrollView>
  );
};

export default ActiveSessionView;
