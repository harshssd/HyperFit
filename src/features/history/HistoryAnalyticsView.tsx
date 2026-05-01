import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, RefreshControl, SafeAreaView } from 'react-native';
import { 
  ChevronRight, Calendar, Dumbbell, X, Clock, Target, TrendingUp, 
  BarChart2, History, Filter, ChevronDown, CheckCircle
} from 'lucide-react-native';
import GlassCard from '../../components/GlassCard';
import NeonButton from '../../components/NeonButton';
import { LoadingState, EmptyState, ErrorState } from '../../components/StateView';
import { MuscleHeatmap } from '../analytics/heatmap/MuscleHeatmap';
import { colors, spacing, radii, palette, text } from '../../styles/theme';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../services/supabase';
import SessionRow from './components/SessionRow';
import { useSessionTrajectories } from './hooks/useSessionTrajectories';

type ViewMode = 'history' | 'analytics';

type WorkoutSession = {
  id: string;
  name: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  duration_seconds: number | null;
  volume_load: number;
  status: string;
  notes?: string | null;
  exercise_count?: number;
  set_count?: number;
  plan_id?: string | null;
  session_id?: string | null;
};

type WorkoutLog = {
  id: string;
  session_id: string;
  exercise_id: string | null;
  order_index: number;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe?: number | null;
  completed: boolean;
  notes?: string;
  exercise_name?: string; // Added from join with exercises table
  rest_duration_seconds?: number;
};

type SessionWithLogs = WorkoutSession & {
  logs: WorkoutLog[];
};

const ITEMS_PER_PAGE = 10;

const HistoryAnalyticsView = () => {
  const { user } = useUser();
  const [viewMode, setViewMode] = useState<ViewMode>('history');
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionWithLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all', 'completed', 'incomplete'
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Per-session sparkline + trend dot, computed from a broader fetch of
  // session_summary_view grouped by plan_session_id (or session name).
  const trajectories = useSessionTrajectories(user?.id ?? null, sessions.length);

  useEffect(() => {
    if (user?.id && viewMode === 'history') {
      loadSessions();
    }
  }, [user, currentPage, filterStatus, viewMode]);

  const loadSessions = async (isRefresh = false) => {
    if (!user?.id) {
      console.warn('Cannot load sessions: No user ID');
      return;
    }

    console.log('Loading sessions for user:', user.id, 'Page:', currentPage);

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // session_summary_view does the aggregation server-side. Range-based
      // pagination keeps the client from pulling all rows when the user has
      // hundreds of sessions.
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const [{ data: rows, error }, { count, error: countError }] = await Promise.all([
        supabase
          .from('session_summary_view')
          .select('*')
          .eq('user_id', user.id)
          .order('workout_date', { ascending: false })
          .order('start_time', { ascending: false, nullsFirst: false })
          .range(from, to),
        supabase
          .from('session_summary_view')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      if (error) throw error;
      if (countError) throw countError;

      const paginatedSessions = (rows ?? []).map((r: any) => ({
        id: r.id,
        name: r.session_name,
        date: r.workout_date,
        start_time: r.start_time,
        end_time: r.end_time,
        duration_seconds: r.duration_seconds,
        volume_load: Number(r.volume_load) || 0,
        status: r.status,
        notes: r.notes,
        exercise_count: r.exercise_count,
        set_count: r.total_sets,
        plan_id: r.plan_id,
        session_id: r.plan_session_id,
      }));

      setSessions(paginatedSessions);
      setTotalCount(count ?? paginatedSessions.length);
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

    console.log('Loading session details for:', sessionId);

    try {
      // sessionId is now the workout_sessions.id UUID directly.
      const [{ data: parent, error: parentError }, { data: sets, error: setsError }] =
        await Promise.all([
          supabase
            .from('session_summary_view')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('workout_sets')
            .select('*, exercise:exercises(id, name)')
            .eq('session_id', sessionId)
            .order('order_index', { ascending: true })
            .order('set_number', { ascending: true }),
        ]);

      if (parentError) throw parentError;
      if (setsError) throw setsError;
      if (!parent) throw new Error('Session not found');

      const transformedLogs = (sets ?? []).map((row: any) => ({
        id: row.id,
        session_id: sessionId,
        exercise_id: row.exercise_id,
        order_index: row.order_index,
        set_number: row.set_number,
        weight: row.weight,
        reps: row.reps,
        completed: row.completed,
        notes: undefined,
        exercise_name: row.exercise?.name || 'Unknown Exercise',
      }));

      const sessionWithLogs: SessionWithLogs = {
        id: parent.id,
        name: parent.session_name,
        date: parent.workout_date,
        start_time: parent.start_time,
        end_time: parent.end_time,
        duration_seconds: parent.duration_seconds,
        volume_load: Number(parent.volume_load) || 0,
        status: parent.status,
        notes: parent.notes,
        plan_id: parent.plan_id,
        session_id: parent.plan_session_id,
        exercise_count: parent.exercise_count,
        set_count: parent.total_sets,
        logs: transformedLogs,
      };

      setSelectedSession(sessionWithLogs);
    } catch (error) {
      console.error('Error loading session details:', error);
      alert(`Failed to load session details: ${error}`);
    }
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds || seconds <= 0) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderHistoryView = () => {
    if (loading && !refreshing) {
      return <LoadingState label="Loading your sessions…" />;
    }

    if (loadError) {
      return <ErrorState message={loadError} onRetry={() => loadSessions()} />;
    }

    if (sessions.length === 0) {
      return (
        <EmptyState
          icon={<Dumbbell size={48} color={colors.muted} style={{ opacity: 0.5 }} />}
          title="No workout history yet"
          message="Finish a workout in Gym and it'll show up here."
        />
      );
    }

    return (
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSessions(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Filter Bar */}
        <View style={{ marginBottom: spacing.lg }}>
          <TouchableOpacity
            onPress={() => setShowFilterMenu(!showFilterMenu)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: spacing.md,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: radii.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Filter size={16} color={colors.primary} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                {filterStatus === 'all' ? 'All Sessions' : 
                 filterStatus === 'completed' ? 'Completed' : 'Incomplete'}
              </Text>
            </View>
            <ChevronDown size={16} color={colors.muted} />
          </TouchableOpacity>

          {/* Filter Menu */}
          {showFilterMenu && (
            <View style={{
              marginTop: spacing.xs,
              backgroundColor: 'rgba(15, 23, 42, 0.98)',
              borderRadius: radii.md,
              padding: spacing.xs,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}>
              {['all', 'completed', 'incomplete'].map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => {
                    setFilterStatus(status);
                    setCurrentPage(1);
                    setShowFilterMenu(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing.md,
                    backgroundColor: filterStatus === status ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                    borderRadius: radii.sm,
                  }}
                >
                  <Text style={{
                    color: filterStatus === status ? colors.primary : '#fff',
                    fontSize: 14,
                    fontWeight: filterStatus === status ? 'bold' : 'normal',
                  }}>
                    {status === 'all' ? 'All Sessions' :
                     status === 'completed' ? 'Completed' : 'Incomplete'}
                  </Text>
                  {filterStatus === status && (
                    <CheckCircle size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

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

        {/* Total Count */}
        <Text style={{ 
          color: colors.muted, 
          fontSize: 12, 
          textAlign: 'center', 
          marginTop: spacing.md 
        }}>
          Showing {sessions.length} of {totalCount} sessions
        </Text>
      </ScrollView>
    );
  };

  const renderAnalyticsView = () => {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.xl }}>
        <MuscleHeatmap userId={user?.id} defaultDays={7} />
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl }}>
          <BarChart2 size={48} color={colors.muted} style={{ opacity: 0.5 }} />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: spacing.md }}>
            More analytics coming
          </Text>
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: spacing.xs }}>
            Volume trends, PR timeline, and adherence by week.
          </Text>
        </View>
      </ScrollView>
    );
  };

  // Group logs by exercise (order_index)
  const getExerciseGroups = (logs: WorkoutLog[]) => {
    const groups: { [key: number]: WorkoutLog[] } = {};
    logs.forEach(log => {
      if (!groups[log.order_index]) {
        groups[log.order_index] = [];
      }
      groups[log.order_index].push(log);
    });
    return Object.values(groups).sort((a, b) => a[0].order_index - b[0].order_index);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header with Toggle */}
      <View style={{ 
        padding: spacing.xl,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)'
      }}>
        <Text style={{ 
          color: '#fff', 
          fontSize: 24, 
          fontWeight: 'bold', 
          marginBottom: spacing.lg,
          letterSpacing: 1
        }}>
          HISTORY & ANALYTICS
        </Text>

        {/* Toggle Buttons */}
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: radii.md,
          padding: 4,
        }}>
          <TouchableOpacity
            onPress={() => setViewMode('history')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.sm,
              backgroundColor: viewMode === 'history' ? colors.primary : 'transparent',
              borderRadius: radii.sm,
              gap: spacing.xs,
            }}
          >
            <History size={18} color={viewMode === 'history' ? '#0f172a' : colors.muted} />
            <Text style={{
              color: viewMode === 'history' ? '#0f172a' : colors.muted,
              fontWeight: 'bold',
              fontSize: 14,
            }}>
              History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('analytics')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.sm,
              backgroundColor: viewMode === 'analytics' ? colors.primary : 'transparent',
              borderRadius: radii.sm,
              gap: spacing.xs,
            }}
          >
            <BarChart2 size={18} color={viewMode === 'analytics' ? '#0f172a' : colors.muted} />
            <Text style={{
              color: viewMode === 'analytics' ? '#0f172a' : colors.muted,
              fontWeight: 'bold',
              fontSize: 14,
            }}>
              Analytics
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {viewMode === 'history' ? renderHistoryView() : renderAnalyticsView()}

      {/* Session Detail Modal */}
      <Modal
        visible={!!selectedSession}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedSession(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          {selectedSession && (
            <>
              {/* Header */}
              <View style={{
                padding: spacing.xl,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.08)'
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1 }}>
                    {selectedSession.name}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedSession(null)}>
                    <X size={24} color={colors.muted} />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                  <Calendar size={14} color={colors.muted} />
                  <Text style={{ color: colors.muted, fontSize: 14 }}>
                    {formatDate(selectedSession.date)} • {formatTime(selectedSession.start_time)}
                  </Text>
                </View>

                {/* Stats Row */}
                <View style={{ 
                  flexDirection: 'row', 
                  gap: spacing.lg, 
                  marginTop: spacing.md,
                  paddingTop: spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(255,255,255,0.08)'
                }}>
                  <View>
                    <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 2 }}>DURATION</Text>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                      {formatDuration(selectedSession.duration_seconds)}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 2 }}>EXERCISES</Text>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                      {selectedSession.exercise_count}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 2 }}>TOTAL SETS</Text>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                      {selectedSession.set_count}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 2 }}>VOLUME</Text>
                    <Text style={{ color: colors.success, fontSize: 16, fontWeight: 'bold' }}>
                      {Math.round(selectedSession.volume_load).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Exercise List */}
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.xl }}>
                {getExerciseGroups(selectedSession.logs).map((exerciseLogs, index) => {
                  const firstLog = exerciseLogs[0];
                  const exerciseName = firstLog.exercise_name || `Exercise ${index + 1}`;

                  return (
                    <GlassCard key={index} style={{ padding: spacing.md, marginBottom: spacing.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                          {exerciseName}
                        </Text>
                        <View style={{
                          backgroundColor: 'rgba(249, 115, 22, 0.2)',
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 2,
                          borderRadius: radii.full
                        }}>
                          <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold' }}>
                            {exerciseLogs.length} SETS
                          </Text>
                        </View>
                      </View>

                      {/* Sets Table */}
                      <View style={{ gap: spacing.xs }}>
                        {/* Header */}
                        <View style={{ flexDirection: 'row', paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
                          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: 'bold', width: 40 }}>SET</Text>
                          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>WEIGHT</Text>
                          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>REPS</Text>
                          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: 'bold', width: 40, textAlign: 'center' }}>✓</Text>
                        </View>

                        {/* Rows */}
                        {exerciseLogs.map((log) => (
                          <View key={log.id} style={{ flexDirection: 'row', paddingVertical: spacing.xs }}>
                            <Text style={{ color: colors.muted, fontSize: 14, width: 40 }}>{log.set_number}</Text>
                            <Text style={{ color: '#fff', fontSize: 14, flex: 1, textAlign: 'center' }}>
                              {log.weight ? `${log.weight} lbs` : '-'}
                            </Text>
                            <Text style={{ color: '#fff', fontSize: 14, flex: 1, textAlign: 'center' }}>
                              {log.reps || '-'}
                            </Text>
                            <Text style={{ color: log.completed ? colors.success : colors.muted, fontSize: 14, width: 40, textAlign: 'center' }}>
                              {log.completed ? '✓' : '-'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </GlassCard>
                  );
                })}

                {selectedSession.notes && (
                  <GlassCard style={{ padding: spacing.md }}>
                    <Text style={{ color: colors.muted, fontSize: 12, marginBottom: spacing.xs }}>NOTES</Text>
                    <Text style={{ color: '#fff', fontSize: 14 }}>{selectedSession.notes}</Text>
                  </GlassCard>
                )}
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default HistoryAnalyticsView;

