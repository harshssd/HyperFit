import React from 'react';
import CalendarView from '../features/calendar/CalendarView';
import { ScreenLayout } from '../components/ScreenLayout';

export const CalendarScreen = () => (
  // Calendar is the dedicated forward-looking tab. CalendarView renders its
  // own scroller and chrome; no modal close header needed here.
  <ScreenLayout scroll={false} errorLabel="Error in Calendar">
    <CalendarView />
  </ScreenLayout>
);
