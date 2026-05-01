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
import { colors, spacing, radii } from '../../styles/theme';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../services/supabase';

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

      // Fetch all workout logs for the user (client-side aggregation)
      const { data: logs, error } = await supabase
        .from('workout_log')
        .select(`
          workout_date,
          session_name,
          start_time,
          end_time,
          plan_id,
          session_id,
          set_number,
          weight,
          reps,
          rpe,
          completed,
          exercise_id
        `)
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false })
        .order('start_time', { ascending: false })
        .order('order_index', { ascending: true })
        .order('set_number', { ascending: true });

      if (error) throw error;

      // Group by session and aggregate data client-side
      const sessionsMap = new Map();

      logs?.forEach((log: any) => {
        const key = `${log.workout_date}-${log.session_name}`;
        if (!sessionsMap.has(key)) {
          sessionsMap.set(key, {
            id: key,
            name: log.session_name,
            date: log.workout_date,
            start_time: log.start_time,
            end_time: log.end_time,
            duration_seconds: log.start_time && log.end_time ?
              Math.floor((new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 1000) : null,
            volume_load: 0,
            status: 'completed', // Will be updated based on completion status
            notes: null,
            exercise_count: 0,
            set_count: 0,
            plan_id: log.plan_id,
            session_id: log.session_id,
            exercises: new Set(), // Track unique exercises
            all_completed: true // Assume completed until we find incomplete sets
          });
        }

        const session = sessionsMap.get(key);

        // Track unique exercises
        if (log.exercise_id) {
          session.exercises.add(log.exercise_id);
        }

        // Aggregate volume
        if (log.weight && log.reps) {
          session.volume_load += (log.weight * log.reps);
        }

        // Count sets
        session.set_count += 1;

        // Check completion status
        if (!log.completed) {
          session.all_completed = false;
          session.status = 'incomplete';
        }
      });

      // Convert exercises sets to counts and finalize sessions
      const allSessions = Array.from(sessionsMap.values()).map(session => ({
        ...session,
        exercise_count: session.exercises.size,
        status: session.all_completed ? 'completed' : 'incomplete'
      }));

      // Apply client-side pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE;
      const paginatedSessions = allSessions.slice(from, to);

      console.log('Loaded sessions:', paginatedSessions.length, 'Total:', allSessions.length);
      setSessions(paginatedSessions);
      setTotalCount(allSessions.length);
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
      // Parse session ID (format: "YYYY-MM-DD-Session Name")
      const [date, ...nameParts] = sessionId.split('-');
      const sessionName = nameParts.join('-');

      if (!date || !sessionName) {
        throw new Error('Invalid session ID format');
      }

      // Fetch workout logs for this session with exercise names
      const { data: logsData, error: logsError } = await supabase
        .from('workout_log')
        .select(`
          *,
          exercises (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('workout_date', date)
        .eq('session_name', sessionName)
        .order('order_index')
        .order('set_number');

      if (logsError) {
        console.error('Error fetching logs:', logsError);
        throw logsError;
      }

      console.log('Logs loaded:', logsData?.length, 'logs');

      if (!logsData || logsData.length === 0) {
        throw new Error('No workout data found for this session');
      }

      // Create session data from the first log entry
      const firstLog = logsData[0];
      const sessionData = {
        id: sessionId,
        name: firstLog.session_name,
        date: firstLog.workout_date,
        start_time: firstLog.start_time,
        end_time: firstLog.end_time,
        duration_seconds: firstLog.start_time && firstLog.end_time ?
          Math.floor((new Date(firstLog.end_time).getTime() - new Date(firstLog.start_time).getTime()) / 1000) : null,
        volume_load: logsData.reduce((sum, log) => sum + ((log.weight || 0) * (log.reps || 0)), 0),
        status: 'completed',
        notes: null,
        plan_id: firstLog.plan_id,
        session_id: firstLog.session_id
      };

      // Transform logs to include exercise names
      const transformedLogs = (logsData || []).map((log: any) => ({
        id: `${log.id}`, // Convert to string for compatibility
        session_id: sessionId,
        exercise_id: log.exercise_id,
        order_index: log.order_index,
        set_number: log.set_number,
        weight: log.weight,
        reps: log.reps,
        completed: log.completed,
        notes: log.notes,
        exercise_name: log.exercises?.name || 'Unknown Exercise',
      }));

      const uniqueExercises = new Set(transformedLogs.map((l: any) => l.exercise_id));

      const sessionWithLogs: SessionWithLogs = {
        ...sessionData,
        exercise_count: uniqueExercises.size,
        set_count: transformedLogs.length,
        logs: transformedLogs,
      };

      console.log('Setting selected session:', sessionWithLogs.name);
      setSelectedSession(sessionWithLogs);
    } catch (error) {
      console.error('Error loading session details:', error);
      // Show error to user
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

        {/* Sessions List */}
        <View style={{ gap: spacing.md }}>
          {sessions.map((session) => (
            <GlassCard
              key={session.id}
              style={{ padding: spacing.lg }}
              onPress={() => {
                console.log('Session card pressed:', session.id);
                loadSessionDetails(session.id);
              }}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                      {session.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Calendar size={12} color={colors.muted} />
                      <Text style={{ color: colors.muted, fontSize: 12 }}>
                        {formatDate(session.date)} • {formatTime(session.start_time)}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.muted} />
                </View>

                <View style={{ 
                  flexDirection: 'row', 
                  gap: spacing.lg, 
                  marginTop: spacing.md,
                  paddingTop: spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(255,255,255,0.08)'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <Dumbbell size={14} color={colors.primary} />
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {session.exercise_count} exercises
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <Target size={14} color={colors.primary} />
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {session.set_count} sets
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <Clock size={14} color={colors.primary} />
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {formatDuration(session.duration_seconds)}
                    </Text>
                  </View>
                </View>

                {session.volume_load > 0 && (
                  <View style={{ 
                    marginTop: spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs
                  }}>
                    <TrendingUp size={14} color={colors.success} />
                    <Text style={{ color: colors.success, fontSize: 12, fontWeight: 'bold' }}>
                      {Math.round(session.volume_load).toLocaleString()} lbs total volume
                    </Text>
                  </View>
                )}
              </GlassCard>
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

