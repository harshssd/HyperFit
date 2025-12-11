import React, { createContext, useContext, ReactNode } from 'react';

type User = {
  id: string;
  email?: string;
  [key: string]: any;
} | null;

type UserContextType = {
  user: User;
  setUser: (user: User) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children, user, setUser }: { children: ReactNode; user: User; setUser: (user: User) => void }) => {
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

