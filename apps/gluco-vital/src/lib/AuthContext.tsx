import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { appClient } from '@/api/appClient';

type AuthError = {
  type: string;
  message: string;
} | null;

type AuthContextValue = {
  user: any;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError: AuthError;
  appPublicSettings: Record<string, unknown> | null;
  logout: (shouldRedirect?: boolean) => Promise<void>;
  navigateToLogin: () => void;
  checkAppState: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState<AuthError>(null);
  const [appPublicSettings] = useState<Record<string, unknown> | null>(null);

  const checkAppState = async (): Promise<void> => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const currentUser = await appClient.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    void checkAppState();
  }, []);

  const logout = async (shouldRedirect = true): Promise<void> => {
    setUser(null);
    setIsAuthenticated(false);
    await appClient.auth.logout(shouldRedirect ? window.location.href : undefined);
  };

  const navigateToLogin = (): void => {
    appClient.auth.redirectToLogin(window.location.href);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
    }),
    [user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, appPublicSettings],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};