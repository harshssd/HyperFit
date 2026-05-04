import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Medal, RotateCcw, PlusCircle, X, Share2 } from 'lucide-react-native';
import GlassCard from '../../../components/GlassCard';
import NeonButton from '../../../components/NeonButton';
import workoutStyles from '../../../styles/workout';
import {
  ShareableSummaryCard,
  type ShareWorkoutPayload,
} from '../../../components/share/ShareableSummaryCard';
import { useShareCard } from '../../../components/share/useShareCard';
import {
  fetchSessionMuscleVolume,
  type SessionMuscleVolume,
} from '../../../services/sessionMuscleVolume';
import { countSessionPRs } from '../../../services/sessionPRs';
import { useUser } from '../../../contexts/UserContext';
import { palette } from '../../../styles/theme';
import type { WorkoutExercise } from '../../../types/workout';

type FinishedSessionViewProps = {
  visibleWorkout: WorkoutExercise[];
  calculateTotalVolume: () => number;
  /** Id of the persisted workout_sessions row, drives the share-card muscle fetch. */
  sessionId: string | null;
  sessionStartTime: string | null;
  sessionName: string | null;
  onStartNewSession: () => void;
  onUndo: () => void;
  onClose: () => void;
};

const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const FinishedSessionView = ({
  visibleWorkout,
  calculateTotalVolume,
  sessionId,
  sessionStartTime,
  sessionName,
  onStartNewSession,
  onUndo,
  onClose,
}: FinishedSessionViewProps) => {
  const [volume, setVolume] = useState<SessionMuscleVolume | null>(null);
  const [prCount, setPrCount] = useState(0);
  const { user } = useUser();
  const { ref, share, state } = useShareCard();

  // Pull recruitment-weighted muscle volume for this session as soon as we
  // have a session id. The post-session view always lives on top of a
  // freshly-saved row, so this should hit cache quickly.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetchSessionMuscleVolume(sessionId)
      .then(v => {
        if (!cancelled) setVolume(v);
      })
      .catch(e => console.warn('fetchSessionMuscleVolume failed', e));
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // PR count drives the badge on the share card. Failure is non-fatal —
  // a missed brag is better than a missing share.
  useEffect(() => {
    if (!sessionId || !user?.id) return;
    let cancelled = false;
    countSessionPRs(user.id, sessionId)
      .then(n => {
        if (!cancelled) setPrCount(n);
      })
      .catch(e => console.warn('countSessionPRs failed', e));
    return () => {
      cancelled = true;
    };
  }, [sessionId, user?.id]);

  const totalSets = useMemo(
    () =>
      visibleWorkout.reduce(
        (n, ex) =>
          n +
          ex.sets.filter(s => {
            const w = Number(s.weight);
            const r = Number(s.reps);
            return (Number.isFinite(w) && w > 0) || (Number.isFinite(r) && r > 0);
          }).length,
        0
      ),
    [visibleWorkout]
  );

  const durationMin = useMemo(() => {
    if (!sessionStartTime) return null;
    const start = new Date(sessionStartTime).getTime();
    const ms = Date.now() - start;
    if (!Number.isFinite(ms) || ms <= 0) return null;
    return Math.max(1, Math.round(ms / 60_000));
  }, [sessionStartTime]);

  const sharePayload: ShareWorkoutPayload = useMemo(
    () => ({
      kind: 'workout',
      title: sessionName?.trim() || 'WORKOUT',
      date: formatDate(new Date()),
      durationMin,
      totalVolume: volume?.totalVolume ?? calculateTotalVolume(),
      totalSets,
      exerciseCount: visibleWorkout.length,
      prCount,
      byMuscle: volume?.byMuscle ?? {},
      intensities: volume?.intensities ?? {},
    }),
    [calculateTotalVolume, durationMin, prCount, sessionName, totalSets, visibleWorkout.length, volume]
  );

  const shareDisabled = !sessionId || state === 'capturing' || state === 'sharing';

  return (
    <ScrollView contentContainerStyle={workoutStyles.finishedContainer}>
      <View style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <TouchableOpacity
          onPress={onClose}
          style={{
            padding: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <X size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={workoutStyles.finishedIcon}>
        <Medal size={48} color="#22d3ee" />
      </View>
      <View style={workoutStyles.finishedText}>
        <Text style={workoutStyles.finishedTitle}>SESSION COMPLETE</Text>
        <Text style={workoutStyles.finishedSubtitle}>DATA UPLOADED SUCCESSFULLY</Text>
        {prCount > 0 ? (
          <View style={prChipStyle.chip}>
            <Text style={prChipStyle.chipText}>
              🔥 {prCount} {prCount === 1 ? 'NEW PR' : 'NEW PRS'}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={workoutStyles.finishedStats}>
        <GlassCard style={workoutStyles.finishedStatCard}>
          <Text style={workoutStyles.finishedStatValue}>{visibleWorkout.length}</Text>
          <Text style={workoutStyles.finishedStatLabel}>Exercises</Text>
        </GlassCard>
        <GlassCard style={workoutStyles.finishedStatCard}>
          <Text style={workoutStyles.finishedStatValue}>{calculateTotalVolume().toLocaleString()}</Text>
          <Text style={workoutStyles.finishedStatLabel}>Vol. Load (LB)</Text>
        </GlassCard>
      </View>
      <View style={workoutStyles.finishedActions}>
        <NeonButton onPress={onStartNewSession} style={workoutStyles.finishedButton}>
          <PlusCircle size={18} color="#0f172a" />
          <Text style={{ marginLeft: 8 }}>INITIATE NEW SESSION</Text>
        </NeonButton>

        <TouchableOpacity
          onPress={share}
          disabled={shareDisabled}
          accessibilityRole="button"
          accessibilityState={{ disabled: shareDisabled }}
          style={[
            shareButtonStyle.button,
            shareDisabled && shareButtonStyle.buttonDisabled,
          ]}
        >
          {state === 'capturing' || state === 'sharing' ? (
            <ActivityIndicator size="small" color={palette.liftActive} />
          ) : (
            <Share2 size={14} color={palette.liftActive} />
          )}
          <Text style={shareButtonStyle.label}>
            {state === 'capturing'
              ? 'CAPTURING…'
              : state === 'sharing'
                ? 'SHARING…'
                : 'SHARE WORKOUT'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onUndo} style={workoutStyles.finishedUndo}>
          <RotateCcw size={12} color="#64748b" />
          <Text style={workoutStyles.finishedUndoText}>MODIFY LOG DATA</Text>
        </TouchableOpacity>
      </View>

      {/* Off-screen capture target. Kept mounted so captureRef can grab it
          without a render flash. Pointer events disabled so taps hit the
          real UI underneath. */}
      <View pointerEvents="none" style={shareButtonStyle.captureHost}>
        <ShareableSummaryCard ref={ref} payload={sharePayload} />
      </View>
    </ScrollView>
  );
};

const shareButtonStyle = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: palette.liftActive,
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: 'rgba(252, 76, 2, 0.08)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    color: palette.liftActive,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  captureHost: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    // Pinned at the natural card size; transform below shouldn't matter for
    // captureRef (it captures the layout-rect at 1:1 by default).
  },
});

const prChipStyle = StyleSheet.create({
  chip: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.liftActive,
    backgroundColor: 'rgba(252, 76, 2, 0.12)',
  },
  chipText: {
    color: palette.liftActive,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
});

export default FinishedSessionView;
