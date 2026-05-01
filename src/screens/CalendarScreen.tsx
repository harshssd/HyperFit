import React from 'react';
import CalendarView from '../features/calendar/CalendarView';
import { ScreenLayout } from '../components/ScreenLayout';

export const CalendarScreen = () => (
  <ScreenLayout scroll={false} errorLabel="Error in Calendar">
    <CalendarView />
  </ScreenLayout>
);
