import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import {
  ChevronRight, Calendar, Dumbbell, Clock, Target, TrendingUp,
  BarChart2, History, Utensils
} from 'lucide-react-native';
import NutritionHistoryView from '../nutrition/NutritionHistoryView';
import GlassCard from '../../components/GlassCard';
import NeonButton from '../../components/NeonButton';
import { EmptyState, ErrorState } from '../../components/StateView';
import { HistoryFeedSkeleton } from '../../components/skeletons/HistoryFeedSkeleton';
import SimpleBarChart from '../../components/SimpleBarChart';
import { MuscleHeatmap } from '../analytics/heatmap/MuscleHeatmap';
import { colors, spacing, radii, palette, text, accent, fonts } from '../../styles/theme';
import { useUser } from '../../contexts/UserContext';
import { useAppData } from '../../contexts/AppDataContext';
import {
  fetchUserSessions,
  fetchSessionDetails,
  type WorkoutSession,
  type SessionWithLogs,
} from '../../services/historyService';
import { calculateXP } from '../workout/helpers';
import SessionRow from './components/SessionRow';
import { SessionDetailView } from './components/SessionDetailView';
import { useSessionTrajectories } from './hooks/useSessionTrajectories';

export type HistoryViewMode = 'history' | 'nutrition' | 'analytics';

const ITEMS_PER_PAGE = 10;

const DAY_LABELS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = {
  initialMode?: HistoryViewMode;
};

const HistoryAnalyticsView = ({ initialMode = 'history' }: Props) => {
  const { user } = useUser();
  const { data } = useAppData();
  const [viewMode, setViewMode] = useState<HistoryViewMode>(initialMode);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionWithLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Per-session sparkline + trend dot, computed from a broader fetch of
  // session_summary_view grouped by plan_session_id (or session name).
  const trajectories = useSessionTrajectories(user?.id ?? null, sessions.length);

  useEffect(() => {
    if (user?.id && viewMode === 'history') {
      loadSessions();
    }
  }, [user, currentPage, viewMode]);

  const loadSessions = async (isRefresh = false) => {
    if (!user?.id) {
      console.warn('Cannot load sessions: No user ID');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { sessions: paginatedSessions, totalCount: count } = await fetchUserSessions(
        user.id,
        currentPage,
        ITEMS_PER_PAGE,
      );

      setSessions(paginatedSessions);
      setTotalCount(count);
      setLoadError(null);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    if (!user?.id) {
      console.warn('No user ID available for loading session details');
      return;
    }

    try {
      const sessionWithLogs = await fetchSessionDetails(sessionId, user.id);
      setSelectedSession(sessionWithLogs);
    } catch (error) {
      console.error('Error loading session details:', error);
      alert(`Failed to load session details: ${error}`);
    }
  };

  const renderHistoryView = () => {
    if (loading && !refreshing) {
      return <HistoryFeedSkeleton />;
    }

    if (loadError) {
      return <ErrorState message={loadError} onRetry={() => loadSessions()} />;
    }

    if (sessions.length === 0) {
      return (
        <EmptyState
          testID="history-empty-state"
          icon={<Dumbbell size={48} color={colors.muted} style={{ opacity: 0.5 }} />}
          title="No workout history yet"
          message="Finish a workout in Gym and it'll show up here."
        />
      );
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        // Toggle wrapper above already provides the top spacing.xl edge —
        // only push horizontal + bottom here so first card sits one
        // spacing.md below the toggle, matching Home/Plans rhythm.
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSessions(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Sessions list — dense rows, inline sparkline + trend dot per row.
            See DESIGN.md "honest mirror" — trajectory belongs in the list,
            not buried in a separate analytics tab. */}
        <View style={{
          backgroundColor: palette.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: palette.borderStrong,
          overflow: 'hidden',
          marginBottom: spacing.lg,
        }}>
          {sessions.map((session, idx) => (
            <View
              key={session.id}
              style={idx === sessions.length - 1 ? { borderBottomWidth: 0 } : undefined}
            >
              <SessionRow
                date={session.date}
                name={session.name}
                volumeLoad={session.volume_load}
                startTime={session.start_time}
                durationSeconds={session.duration_seconds}
                exerciseCount={session.exercise_count}
                setCount={session.set_count}
                trajectory={trajectories.byId[session.id]}
                onPress={() => loadSessionDetails(session.id)}
              />
            </View>
          ))}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: spacing.md,
            marginTop: spacing.xl
          }}>
            <TouchableOpacity
              onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                backgroundColor: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(249, 115, 22, 0.2)',
                borderRadius: radii.md,
              }}
            >
              <Text style={{ 
                color: currentPage === 1 ? colors.muted : colors.primary, 
                fontWeight: 'bold' 
              }}>
                Previous
              </Text>
            </TouchableOpacity>

            <Text style={{ color: colors.muted, fontSize: 14 }}>
              Page {currentPage} of {totalPages}
            </Text>

            <TouchableOpacity
              onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                backgroundColor: currentPage === totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(249, 115, 22, 0.2)',
                borderRadius: radii.md,
              }}
            >
              <Text style={{ 
                color: currentPage === totalPages ? colors.muted : colors.primary, 
                fontWeight: 'bold' 
              }}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Total count — only show when something is hidden. "Showing 7 of 7"
            is noise; the row count is visually obvious from the list. */}
        {sessions.length < totalCount ? (
          <Text style={{
            color: colors.muted,
            fontSize: 12,
            textAlign: 'center',
            marginTop: spacing.md,
          }}>
            Showing {sessions.length} of {totalCount} sessions
          </Text>
        ) : null}
      </ScrollView>
    );
  };

  const buildWeeklyConsistency = () => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      const dStr = d.toISOString().split('T')[0];
      return {
        label: DAY_LABELS_SHORT[d.getDay()],
        value: data.gymLogs?.includes(dStr) ? 1 : 0,
      };
    });
  };

  const renderAnalyticsView = () => {
    const streak = data.gymLogs?.length ?? 0;
    const xp = calculateXP(data);
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxl,
        }}
      >
        {/* Streak + XP — moved here from Home so the daily glance metric (streak)
            stays in the header, while retrospective totals live with analytics. */}
        <View testID="analytics-stats" style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
          <GlassCard style={{ flex: 1, padding: spacing.lg, alignItems: 'center' }}>
            <TrendingUp size={20} color={accent.lift} />
            <Text testID="analytics-streak-value" style={{ color: text.primary, fontSize: 22, fontWeight: '900', marginTop: spacing.sm, letterSpacing: -0.4, fontVariant: fonts.tabularNums }}>{streak}</Text>
            <Text style={{ color: text.quaternary, fontSize: 10, letterSpacing: 1.6, fontFamily: 'monospace', textTransform: 'uppercase' }}>Day Streak</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1, padding: spacing.lg, alignItems: 'center' }}>
            <BarChart2 size={20} color={text.secondary} />
            <Text testID="analytics-xp-value" style={{ color: text.primary, fontSize: 22, fontWeight: '900', marginTop: spacing.sm, letterSpacing: -0.4, fontVariant: fonts.tabularNums }}>{xp}</Text>
            <Text style={{ color: text.quaternary, fontSize: 10, letterSpacing: 1.6, fontFamily: 'monospace', textTransform: 'uppercase' }}>Total XP</Text>
          </GlassCard>
        </View>

        {/* Weekly consistency — past 7 days, attendance only. */}
        <GlassCard style={{ padding: spacing.xl, marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <Calendar size={16} color={text.tertiary} />
            <Text style={{ color: text.quaternary, fontSize: 11, fontWeight: '800', marginLeft: spacing.sm, letterSpacing: 1.6, fontFamily: 'monospace', textTransform: 'uppercase' }}>
              Weekly Consistency
            </Text>
          </View>
          <SimpleBarChart data={buildWeeklyConsistency()} color={accent.lift} />
        </GlassCard>

        <MuscleHeatmap userId={user?.id} defaultDays={7} />
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl }}>
          <BarChart2 size={48} color={colors.muted} style={{ opacity: 0.5 }} />
          <Text style={{ color: text.primary, fontSize: 16, fontWeight: 'bold', marginTop: spacing.md }}>
            More analytics coming
          </Text>
          <Text style={{ color: text.tertiary, textAlign: 'center', marginTop: spacing.xs }}>
            Volume trends, PR timeline, and adherence by week.
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Segmented control. Pill chrome matching the rest of the app: orange-
          tinted active state, surface-on-bg inactive, Inter caps on labels. */}
      <View style={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
      }}>
        <View style={{
          flexDirection: 'row',
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.borderStrong,
          borderRadius: radii.full,
          padding: 4,
          gap: 4,
        }}>
          {([
            { key: 'history', label: 'WORKOUTS', Icon: History },
            { key: 'nutrition', label: 'NUTRITION', Icon: Utensils },
            { key: 'analytics', label: 'ANALYTICS', Icon: BarChart2 },
          ] as const).map(({ key, label, Icon }) => {
            const active = viewMode === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setViewMode(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.sm + 2,
                  backgroundColor: active ? 'rgba(252, 76, 2, 0.14)' : 'transparent',
                  borderRadius: radii.full,
                  gap: spacing.xs,
                }}
              >
                <Icon size={14} color={active ? accent.lift : text.tertiary} />
                <Text style={{
                  color: active ? accent.lift : text.tertiary,
                  fontFamily: fonts.family.black,
                  fontSize: 11,
                  letterSpacing: 1.4,
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {viewMode === 'history'
        ? renderHistoryView()
        : viewMode === 'nutrition'
          ? <NutritionHistoryView />
          : renderAnalyticsView()}

      {/* Session Detail Modal */}
      <Modal
        visible={!!selectedSession}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedSession(null)}
      >
        {selectedSession && (
          <SessionDetailView
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
          />
        )}
      </Modal>
    </View>
  );
};

export default HistoryAnalyticsView;

