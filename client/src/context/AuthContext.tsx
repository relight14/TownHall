import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { trackEvent, identifyUser, resetUser } from '../lib/analytics';

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const bufferSeconds = 60;
    return now >= (payload.exp - bufferSeconds);
  } catch {
    return true;
  }
}

// Also export for use in other contexts
export { isTokenExpired };

import type { ApiUser as User } from '@shared/types';
export type { User };

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<string>;
  signup: (email: string, password: string, name: string) => Promise<string>;
  loginWithGoogle: (credential: string) => Promise<string>;
  logout: () => void;
  ledewireToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ledewireToken, setLedewireToken] = useState<string | null>(null);

  const userRef = useRef<User | null>(null);
  const tokenRef = useRef<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep refs in sync with state for interval callback
  useEffect(() => {
    userRef.current = user;
    tokenRef.current = ledewireToken;
  }, [user, ledewireToken]);

  const clearSession = useCallback(() => {
    console.log('[AUTH] Clearing stale session');
    setUser(null);
    setLedewireToken(null);
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const ssoResponse = await fetch('/api/auth/session', { credentials: 'include' });
      if (ssoResponse.ok) {
        const ssoData = await ssoResponse.json();
        if (ssoData.authenticated && ssoData.ledewireToken) {
          console.log('[SSO] Session refreshed successfully');
          if (ssoData.user) {
            setUser({
              id: ssoData.user.id,
              email: ssoData.user.email || '',
              name: ssoData.user.name || ssoData.user.email || 'User',
            });
          } else if (ssoData.ledewireUserId) {
            setUser({
              id: ssoData.ledewireUserId,
              email: '',
              name: 'User',
            });
          }
          setLedewireToken(ssoData.ledewireToken);
          return true;
        }
      }
    } catch (error) {
      console.log('[SSO] Session refresh failed:', error);
    }
    return false;
  }, []);

  // Check for cross-subdomain SSO session first, then local session
  useEffect(() => {
    const checkSSOSession = async () => {
      // First, try the cross-subdomain SSO session (uses shared cookie)
      try {
        const ssoResponse = await fetch('/api/auth/session', { credentials: 'include' });
        if (ssoResponse.ok) {
          const ssoData = await ssoResponse.json();
          if (ssoData.authenticated && ssoData.ledewireToken) {
            // Validate token is not expired before using it
            if (!isTokenExpired(ssoData.ledewireToken)) {
              console.log('[SSO] Cross-site session restored with valid token');
              if (ssoData.user) {
                setUser({
                  id: ssoData.user.id,
                  email: ssoData.user.email || '',
                  name: ssoData.user.name || ssoData.user.email || 'User',
                });
              } else if (ssoData.ledewireUserId) {
                setUser({
                  id: ssoData.ledewireUserId,
                  email: '',
                  name: 'User',
                });
              }
              setLedewireToken(ssoData.ledewireToken);
              return;
            } else {
              console.log('[SSO] Cross-site session token is expired, trying fallback');
            }
          }
        }
      } catch (error) {
        console.log('[SSO] No cross-site session found');
      }

      // Fall back to local session check (Google OAuth session)
      try {
        const response = await fetch('/api/auth/user', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          
          if (data.ledewireToken && !isTokenExpired(data.ledewireToken)) {
            setUser({
              id: data.id,
              email: data.email || '',
              name: data.name || data.email || 'User',
            });
            setLedewireToken(data.ledewireToken);
          } else {
            console.log('[AUTH] Token missing or expired in /api/auth/user response, not setting user');
          }
        } else {
          console.log('[AUTH] /api/auth/user returned non-OK status:', response.status);
        }
      } catch (error) {
        console.log('[AUTH] Error checking /api/auth/user:', error);
      }
    };
    checkSSOSession();

    // Set up periodic session refresh every 5 minutes
    refreshIntervalRef.current = setInterval(() => {
      const currentUser = userRef.current;
      const currentToken = tokenRef.current;
      
      if (currentUser && currentToken) {
        if (isTokenExpired(currentToken)) {
          console.log('[AUTH] Token expired, attempting refresh...');
          refreshSession().then(success => {
            if (!success) {
              clearSession();
            }
          });
        }
      }
    }, 5 * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signup failed');
      }

      const data = await response.json();
      setUser(data.user);
      setLedewireToken(data.ledewireToken);
      identifyUser(data.user);
      trackEvent('user_signed_up', { method: 'email' });
      return data.ledewireToken;
    } catch (error) {
      console.error('Signup failed:', error);
      trackEvent('signup_failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      setLedewireToken(data.ledewireToken);
      identifyUser(data.user);
      trackEvent('user_logged_in', { method: 'email' });
      return data.ledewireToken;
    } catch (error) {
      console.error('Login failed:', error);
      trackEvent('login_failed', { method: 'email', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await fetch('/api/auth/google/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Google login failed');
      }

      const data = await response.json();
      setUser(data.user);
      setLedewireToken(data.ledewireToken);
      identifyUser(data.user);
      trackEvent('user_logged_in', { method: 'google' });
      return data.ledewireToken;
    } catch (error) {
      console.error('Google login failed:', error);
      trackEvent('login_failed', { method: 'google', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  };

  const logout = () => {
    trackEvent('user_logged_out');
    resetUser();
    setUser(null);
    setLedewireToken(null);
    // Also logout from Replit Auth (SSO)
    window.location.href = '/api/logout';
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      loginWithGoogle,
      logout,
      ledewireToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
