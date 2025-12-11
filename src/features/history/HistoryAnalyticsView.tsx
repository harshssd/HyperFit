import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, RefreshControl, SafeAreaView } from 'react-native';
import { 
  ChevronRight, Calendar, Dumbbell, X, Clock, Target, TrendingUp, 
  BarChart2, History, Filter, ChevronDown, CheckCircle
} from 'lucide-react-native';
import GlassCard from '../../components/GlassCard';
import NeonButton from '../../components/NeonButton';
import { colors, spacing, radii } from '../../styles/theme';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../services/supabase';

type ViewMode = 'history' | 'analytics';

type WorkoutSession = {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  volume_load: number;
  status: string;
  notes?: string;
  exercise_count?: number;
  set_count?: number;
};

type WorkoutLog = {
  id: string;
  session_id: string;
  exercise_id: string | null;
  order_index: number;
  set_number: number;
  weight: number;
  reps: number;
  completed: boolean;
  notes?: string;
  exercise_name?: string; // Added from join with exercises table
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

      // Build query
      let query = supabase
        .from('session_log')
        .select('*, workout_log(id)', { count: 'exact' })
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false });

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data and count exercises and sets
      const transformedSessions = (data || []).map((session: any) => {
        const logs = session.workout_log || [];
        const uniqueExercises = new Set(logs.map((l: any) => l.order_index));
        
        return {
          id: session.id,
          name: session.name,
          date: session.date,
          start_time: session.start_time,
          end_time: session.end_time,
          duration_seconds: session.duration_seconds,
          volume_load: session.volume_load,
          status: session.status,
          notes: session.notes,
          exercise_count: uniqueExercises.size,
          set_count: logs.length,
        };
      });

      console.log('Loaded sessions:', transformedSessions.length, 'Total:', count);
      setSessions(transformedSessions);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading sessions:', error);
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
      // Fetch session with all workout logs
      const { data: sessionData, error: sessionError } = await supabase
        .from('session_log')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        throw sessionError;
      }

      console.log('Session data loaded:', sessionData);

      // Fetch workout logs with exercise names (join with exercises table)
      const { data: logsData, error: logsError } = await supabase
        .from('workout_log')
        .select(`
          *,
          exercises (
            id,
            name
          )
        `)
        .eq('session_id', sessionId)
        .order('order_index')
        .order('set_number');

      if (logsError) {
        console.error('Error fetching logs:', logsError);
        throw logsError;
      }

      console.log('Logs loaded:', logsData?.length, 'logs');

      // Transform logs to include exercise names
      const transformedLogs = (logsData || []).map((log: any) => ({
        ...log,
        exercise_name: log.exercises?.name || 'Unknown Exercise',
      }));

      const uniqueExercises = new Set(transformedLogs.map((l: any) => l.order_index));

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

  const formatDuration = (seconds: number) => {
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

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderHistoryView = () => {
    console.log('Rendering history view. Loading:', loading, 'Refreshing:', refreshing, 'Sessions:', sessions.length);
    
    if (loading && !refreshing) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: spacing.md }}>Loading sessions...</Text>
        </View>
      );
    }

    if (sessions.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <Dumbbell size={64} color={colors.muted} style={{ opacity: 0.5 }} />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: spacing.lg }}>
            No Workout History
          </Text>
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: spacing.sm }}>
            Your completed workouts will appear here
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: spacing.md }}>
            User ID: {user?.id?.substring(0, 8)}... | Filter: {filterStatus}
          </Text>
        </View>
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
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl }}>
          <BarChart2 size={64} color={colors.muted} style={{ opacity: 0.5 }} />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: spacing.lg }}>
            Analytics Coming Soon
          </Text>
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: spacing.sm }}>
            Detailed workout analytics and progress tracking will be available here
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

