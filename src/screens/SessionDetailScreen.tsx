import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ScreenLayout } from '../components/ScreenLayout';
import { LoadingState, ErrorState } from '../components/StateView';
import { useUser } from '../contexts/UserContext';
import {
  fetchSessionDetails,
  type SessionWithLogs,
} from '../services/historyService';
import { SessionDetailView } from '../features/history/components/SessionDetailView';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'SessionDetail'>;

/**
 * Modal route showing one logged session's stats + sets. Fed by Calendar
 * day taps; the same SessionDetailView is also rendered inline by
 * HistoryAnalyticsView's modal so the two surfaces stay in lockstep.
 */
export const SessionDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { user } = useUser();
  const [session, setSession] = useState<SessionWithLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = route.params?.sessionId;
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!sessionId || !userId) {
      setError('Missing session id or user.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSessionDetails(sessionId, userId)
      .then(s => {
        if (!cancelled) setSession(s);
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load session.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, userId]);

  const close = () => navigation.goBack();

  if (loading) {
    return (
      <ScreenLayout scroll={false} errorLabel="Error in Session Detail">
        <LoadingState label="Loading session…" />
      </ScreenLayout>
    );
  }

  if (error || !session) {
    return (
      <ScreenLayout scroll={false} errorLabel="Error in Session Detail">
        <ErrorState
          message={error ?? 'Session not found.'}
          onRetry={() => navigation.goBack()}
        />
      </ScreenLayout>
    );
  }

  return <SessionDetailView session={session} onClose={close} />;
};

export default SessionDetailScreen;
