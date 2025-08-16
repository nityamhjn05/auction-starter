import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UserCtx = createContext(null);
const DEFAULT_USER = 'buyer-1';
export const ALL_USERS = ['buyer-1', 'buyer-2', 'buyer-3', 'seller-1'];

export function UserProvider({ children }) {
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || DEFAULT_USER);
  useEffect(() => { localStorage.setItem('userId', userId); }, [userId]);
  const value = useMemo(() => ({ userId, setUserId, ALL_USERS }), [userId]);
  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>;
}

export function useUser(){ return useContext(UserCtx); }
