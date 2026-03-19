import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

/**
 * Simplified AuthContext for offline mode.
 * No backend authentication needed — the app works entirely locally.
 * We keep the context interface so existing components don't break.
 */

interface AuthContextType {
  authToken: string | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // No auth needed in offline mode — just mark as ready
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    // No-op in offline mode
  }, []);

  return (
    <AuthContext.Provider value={{ authToken: 'offline', isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
