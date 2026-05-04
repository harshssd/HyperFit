import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Calendar, Share2, X } from 'lucide-react-native';
import GlassCard from '../../../components/GlassCard';
import { colors, palette, spacing, radii } from '../../../styles/theme';
import type { SessionWithLogs, WorkoutLog } from '../../../services/historyService';
import {
  ShareableSummaryCard,
  type ShareWorkoutPayload,
} from '../../../components/share/ShareableSummaryCard';
import { useShareCard } from '../../../components/share/useShareCard';
import {
  fetchSessionMuscleVolume,
  type SessionMuscleVolume,
} from '../../../services/sessionMuscleVolume';

type Props = {
  session: SessionWithLogs;
  onClose: () => void;
};

const formatDuration = (seconds: number | null | undefined) => {
  if (!seconds || seconds <= 0) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatTime = (timeStr: string | null | undefined) => {
  if (!timeStr) return '';
  return new Date(timeStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getExerciseGroups = (logs: WorkoutLog[]) => {
  const groups: Record<number, WorkoutLog[]> = {};
  logs.forEach(log => {
    if (!groups[log.order_index]) groups[log.order_index] = [];
    groups[log.order_index].push(log);
  });
  return Object.values(groups).sort((a, b) => a[0].order_index - b[0].order_index);
};

/**
 * Read-only session detail layout — header with stats + grouped exercise
 * sets. Used both as a Modal child in HistoryAnalyticsView and as the
 * body of the SessionDetailScreen modal route (Calendar deep-links here).
 */
export const SessionDetailView = ({ session, onClose }: Props) => {
  const [volume, setVolume] = useState<SessionMuscleVolume | null>(null);
  const { ref, share, state } = useShareCard();

  // Lazy-fetch the recruitment-weighted muscle volume the first time the
  // detail view mounts. Cheap: hits muscle_volume_v2_view, RLS-fenced.
  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;
    fetchSessionMuscleVolume(session.id)
      .then(v => {
        if (!cancelled) setVolume(v);
      })
      .catch(e => console.warn('fetchSessionMuscleVolume failed', e));
    return () => {
      cancelled = true;
    };
  }, [session?.id]);

  const sharePayload: ShareWorkoutPayload = useMemo(() => {
    const durationMin =
      session.duration_seconds && session.duration_seconds > 0
        ? Math.max(1, Math.round(session.duration_seconds / 60))
        : null;
    return {
      kind: 'workout',
      title: session.name?.trim() || 'WORKOUT',
      date: formatDate(session.date),
      durationMin,
      totalVolume: volume?.totalVolume ?? session.volume_load ?? 0,
      totalSets: session.set_count ?? 0,
      exerciseCount: session.exercise_count ?? 0,
      // Group session.logs by exercise; count = number of sets logged
      // for each. Stable per-exercise order via order_index from the
      // existing getExerciseGroups helper.
      exercises: getExerciseGroups(session.logs)
        .map(group => ({
          name: group[0]?.exercise_name?.trim() || 'Exercise',
          count: group.length,
        }))
        .filter(row => row.count > 0),
      intensities: volume?.intensities ?? {},
    };
  }, [session, volume]);

  const isSharing = state === 'capturing' || state === 'sharing';

  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <View
      style={{
        padding: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1 }}>
          {session.name}
        </Text>
        <TouchableOpacity
          onPress={share}
          disabled={isSharing}
          accessibilityRole="button"
          accessibilityLabel="Share session"
          style={{
            marginRight: spacing.md,
            padding: spacing.xs,
            opacity: isSharing ? 0.5 : 1,
          }}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color={palette.liftActive} />
          ) : (
            <Share2 size={20} color={palette.liftActive} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
          <X size={24} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.sm,
        }}
      >
        <Calendar size={14} color={colors.muted} />
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          {formatDate(session.date)} • {formatTime(session.start_time)}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.lg,
          marginTop: spacing.md,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <Stat label="DURATION" value={formatDuration(session.duration_seconds)} />
        <Stat label="EXERCISES" value={String(session.exercise_count)} />
        <Stat label="TOTAL SETS" value={String(session.set_count)} />
        <Stat
          label="VOLUME"
          value={Math.round(session.volume_load).toLocaleString()}
          accent
        />
      </View>
    </View>

    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.xl }}>
      {getExerciseGroups(session.logs).map((exerciseLogs, index) => {
        const firstLog = exerciseLogs[0];
        const exerciseName = firstLog.exercise_name || `Exercise ${index + 1}`;
        return (
          <GlassCard
            key={`${firstLog.order_index}-${exerciseName}`}
            style={{ padding: spacing.md, marginBottom: spacing.md }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.md,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                {exerciseName}
              </Text>
              <View
                style={{
                  backgroundColor: 'rgba(249, 115, 22, 0.2)',
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 2,
                  borderRadius: radii.full,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold' }}>
                  {exerciseLogs.length} SETS
                </Text>
              </View>
            </View>

            <View style={{ gap: spacing.xs }}>
              <View
                style={{
                  flexDirection: 'row',
                  paddingBottom: spacing.xs,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <Text
                  style={{ color: colors.muted, fontSize: 11, fontWeight: 'bold', width: 40 }}
                >
                  SET
                </Text>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 11,
                    fontWeight: 'bold',
                    flex: 1,
                    textAlign: 'center',
                  }}
                >
                  WEIGHT
                </Text>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 11,
                    fontWeight: 'bold',
                    flex: 1,
                    textAlign: 'center',
                  }}
                >
                  REPS
                </Text>
              </View>

              {exerciseLogs.map(log => (
                <View
                  key={log.id}
                  style={{ flexDirection: 'row', paddingVertical: spacing.xs }}
                >
                  <Text style={{ color: colors.muted, fontSize: 14, width: 40 }}>
                    {log.set_number}
                  </Text>
                  <Text
                    style={{ color: '#fff', fontSize: 14, flex: 1, textAlign: 'center' }}
                  >
                    {log.weight ? `${log.weight} lbs` : '-'}
                  </Text>
                  <Text
                    style={{ color: '#fff', fontSize: 14, flex: 1, textAlign: 'center' }}
                  >
                    {log.reps || '-'}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        );
      })}

      {session.notes && (
        <GlassCard style={{ padding: spacing.md }}>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: spacing.xs }}>
            NOTES
          </Text>
          <Text style={{ color: '#fff', fontSize: 14 }}>{session.notes}</Text>
        </GlassCard>
      )}
    </ScrollView>

    {/* Off-screen capture target. Negative offset keeps the 1080x1350 card
        out of layout flow while remaining mounted, so captureRef can grab
        it the moment the user taps share. */}
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: -10000, top: -10000 }}
    >
      <ShareableSummaryCard ref={ref} payload={sharePayload} />
    </View>
  </SafeAreaView>
  );
};

const Stat = ({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <View>
    <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 2 }}>{label}</Text>
    <Text
      style={{
        color: accent ? colors.success : '#fff',
        fontSize: 16,
        fontWeight: 'bold',
      }}
    >
      {value}
    </Text>
  </View>
);

export default SessionDetailView;
