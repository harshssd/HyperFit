import React from 'react';
import HistoryAnalyticsView from '../features/history/HistoryAnalyticsView';
import { ScreenLayout } from '../components/ScreenLayout';

export const HistoryScreen = () => (
  // HistoryAnalyticsView has its own scrolling/refresh control.
  <ScreenLayout scroll={false} errorLabel="Error in History">
    <HistoryAnalyticsView />
  </ScreenLayout>
);
