import React, { createContext, useContext, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';

type UserContextType = {
  user: User | null;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({
  children,
  user,
}: {
  children: ReactNode;
  user: User | null;
}) => <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>;

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
