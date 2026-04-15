'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { authApi } from '@/lib/api';
import { ROUTES } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  getDashboardRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'blockcert_token';
const USER_KEY = 'blockcert_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start with empty state - load from localStorage in useEffect
  const [authState, setAuthState] = useState<{
    user: User | null;
    token: string | null;
    initialized: boolean;
  }>({
    user: null,
    token: null,
    initialized: false,
  });

  // Load auth state from localStorage AFTER mount (client-side only)
  // This is intentional - we need to sync localStorage state with React state
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAuthState({ user: parsedUser, token: storedToken, initialized: true });
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAuthState(prev => ({ ...prev, initialized: true }));
      }
    } catch (error) {
      // Clear invalid data
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthState(prev => ({ ...prev, initialized: true }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      console.log('Login response:', response);

      if (response.success && response.data) {
        // Handle both response structures:
        // 1. { data: { user, token } } - expected
        // 2. { data: {...userData}, token } - actual backend response
        const responseData = response.data as { user?: User; token?: string };
        const userData = responseData.user || (response as unknown as { data: User }).data;
        const userToken = responseData.token || (response as unknown as { token: string }).token;
        
        if (!userToken) {
          console.error('No token in response:', response);
          return { success: false, error: 'No token received from server' };
        }

        console.log('Saving token:', userToken);
        console.log('Saving user:', userData);
        
        setAuthState({ user: userData as User, token: userToken, initialized: true });
        localStorage.setItem(TOKEN_KEY, userToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        return { success: true };
      }

      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  }, []);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    // Institute creation for admin
    instituteName?: string;
    instituteCode?: string;
    instituteDomain?: string;
    // Institute selection for student/faculty
    instituteId?: string;
  }): Promise<{ success: boolean; error?: string; requiresApproval?: boolean }> => {
    try {
      const response = await authApi.register(data);
      console.log('Register response:', response);

      // Check if registration requires approval (students/faculty)
      const requiresApproval = (response as unknown as { requiresApproval?: boolean }).requiresApproval;
      
      if (requiresApproval) {
        // For pending users, return success but indicate approval is needed
        return { success: true, requiresApproval: true };
      }

      if (response.success && response.data) {
        // Handle both response structures:
        // 1. { data: { user, token } } - expected
        // 2. { data: {...userData}, token } - actual backend response
        const responseData = response.data as { user?: User; token?: string };
        const userData = responseData.user || (response as unknown as { data: User }).data;
        const userToken = responseData.token || (response as unknown as { token: string }).token;
        
        if (!userToken) {
          console.error('No token in response:', response);
          return { success: false, error: 'No token received from server' };
        }

        console.log('Saving token:', userToken);
        console.log('Saving user:', userData);
        
        setAuthState({ user: userData as User, token: userToken, initialized: true });
        localStorage.setItem(TOKEN_KEY, userToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        return { success: true };
      }

      return { success: false, error: response.error || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An error occurred during registration' };
    }
  }, []);

  const logout = useCallback(() => {
    setAuthState({ user: null, token: null, initialized: true });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState(prev => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...userData };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return { ...prev, user: updatedUser };
    });
  }, []);

  const getDashboardRoute = useCallback(() => {
    if (!authState.user) return ROUTES.LOGIN;

    switch (authState.user.role) {
      case 'student':
        return ROUTES.DASHBOARD.STUDENT;
      case 'faculty':
        return ROUTES.DASHBOARD.FACULTY;
      case 'admin':
        return ROUTES.DASHBOARD.ADMIN;
      case 'employer':
        return ROUTES.DASHBOARD.EMPLOYER;
      default:
        return ROUTES.LOGIN;
    }
  }, [authState.user]);

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        token: authState.token,
        isLoading: !authState.initialized,
        isAuthenticated: !!authState.user && !!authState.token,
        login,
        register,
        logout,
        updateUser,
        getDashboardRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}