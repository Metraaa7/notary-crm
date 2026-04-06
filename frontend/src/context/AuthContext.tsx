'use client';

import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { AuthUser, LoginPayload } from '@/types/auth.types';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN'; payload: { user: AuthUser; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'HYDRATE'; payload: { user: AuthUser; token: string } | null };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
    case 'HYDRATE':
      if (!action.payload) return { user: null, token: null, isLoading: false };
      return { user: action.payload.user, token: action.payload.token, isLoading: false };
    case 'LOGOUT':
      return { user: null, token: null, isLoading: false };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  isNotary: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isLoading: true,
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr) as AuthUser;
        dispatch({ type: 'HYDRATE', payload: { user, token } });
      } else {
        dispatch({ type: 'HYDRATE', payload: null });
      }
    } catch {
      dispatch({ type: 'HYDRATE', payload: null });
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    localStorage.setItem('token', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    dispatch({ type: 'LOGIN', payload: { user: response.user, token: response.accessToken } });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isNotary: state.user?.role === 'NOTARY',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
