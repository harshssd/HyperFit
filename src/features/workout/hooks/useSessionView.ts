import { useState, useEffect, useCallback } from 'react';
import { WorkoutExercise } from '../../../types/workout';

type ViewMode = 'list' | 'focus';

export const useSessionView = (visibleWorkout: WorkoutExercise[]) => {
  const [viewMode, setViewMode] = useState<ViewMode>('focus');
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [showOverview, setShowOverview] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Keep index in bounds when list size changes
  useEffect(() => {
    if (visibleWorkout.length === 0) {
      setCurrentExIndex(0);
      return;
    }
    if (currentExIndex >= visibleWorkout.length) {
      setCurrentExIndex(Math.max(0, visibleWorkout.length - 1));
    }
  }, [visibleWorkout.length, currentExIndex]);

  const selectExercise = useCallback((index: number) => {
    setCurrentExIndex(Math.max(0, Math.min(index, Math.max(visibleWorkout.length - 1, 0))));
    setViewMode('focus');
    setShowOverview(false);
  }, [visibleWorkout.length]);

  const nextExercise = useCallback(() => {
    setCurrentExIndex((idx) => Math.min(idx + 1, Math.max(visibleWorkout.length - 1, 0)));
  }, [visibleWorkout.length]);

  const prevExercise = useCallback(() => {
    setCurrentExIndex((idx) => Math.max(idx - 1, 0));
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((m) => (m === 'list' ? 'focus' : 'list'));
  }, []);

  const startSession = useCallback(() => {
    if (visibleWorkout.length === 0) return;
    setIsSessionActive(true);
    setShowOverview(false);
    setViewMode('focus');
    setCurrentExIndex(0);
  }, [visibleWorkout.length]);

  const stopSession = useCallback(() => {
    setIsSessionActive(false);
  }, []);

  const openOverview = useCallback(() => {
    setShowOverview(true);
    setIsSessionActive(false);
  }, []);

  const closeOverview = useCallback(() => {
    setShowOverview(false);
  }, []);

  return {
    viewMode,
    currentExIndex,
    showOverview,
    isSessionActive,
    selectExercise,
    nextExercise,
    prevExercise,
    toggleViewMode,
    startSession,
    stopSession,
    openOverview,
    closeOverview,
    setCurrentExIndex,
    setViewMode,
    setShowOverview,
  };
};

export type UseSessionViewReturn = ReturnType<typeof useSessionView>;

