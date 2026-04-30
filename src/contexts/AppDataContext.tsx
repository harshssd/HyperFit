import React, { createContext, useContext, ReactNode } from 'react';
import { UserData } from '../types/workout';

type AppDataContextType = {
  data: UserData;
  setData: (data: UserData) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: AppDataContextType;
}) => <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within an AppDataProvider');
  return ctx;
};
