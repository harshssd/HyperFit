import React, { createContext, useContext, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({
  children,
  user,
  setUser,
}: {
  children: ReactNode;
  user: User | null;
  setUser: (user: User | null) => void;
}) => (
  <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>
);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
