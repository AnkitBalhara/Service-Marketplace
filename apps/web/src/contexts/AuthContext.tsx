import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { User } from '../types';

export interface PersonaInfo {
  key: string;
  name: string;
  email: string;
  role: string;
  description: string;
  badgeColor: string;
}

export const SEEDED_PERSONAS: PersonaInfo[] = [
  {
    key: 'superadmin',
    name: 'Sarah SuperAdmin',
    email: 'superadmin@marketplace.com',
    role: 'SUPER_ADMIN',
    description: 'Full platform superadmin with all bypasses',
    badgeColor: 'bg-purple-600 text-white',
  },
  {
    key: 'moderator',
    name: 'Mike Moderator',
    email: 'moderator@marketplace.com',
    role: 'CATALOGUE_MODERATOR',
    description: 'Sub-admin restricted to categories & service moderation',
    badgeColor: 'bg-blue-600 text-white',
  },
  {
    key: 'vendor_approved',
    name: 'Elena Rostova',
    email: 'vendor.approved@marketplace.com',
    role: 'VENDOR (Approved)',
    description: 'Active Salon Vendor with bookable slots',
    badgeColor: 'bg-emerald-600 text-white',
  },
  {
    key: 'vendor_pending',
    name: 'Rajesh Kumar',
    email: 'vendor.pending@marketplace.com',
    role: 'VENDOR (Pending)',
    description: 'New applicant awaiting onboarding verification',
    badgeColor: 'bg-amber-600 text-white',
  },
  {
    key: 'vendor_rejected',
    name: 'Vikram Singh',
    email: 'vendor.rejected@marketplace.com',
    role: 'VENDOR (Rejected)',
    description: 'Rejected applicant with reason explanation',
    badgeColor: 'bg-rose-600 text-white',
  },
  {
    key: 'customer1',
    name: 'Priya Sharma',
    email: 'customer1@marketplace.com',
    role: 'CUSTOMER (Active)',
    description: 'Customer with active & completed appointments',
    badgeColor: 'bg-indigo-600 text-white',
  },
  {
    key: 'customer2',
    name: 'Ananya Roy',
    email: 'customer2@marketplace.com',
    role: 'CUSTOMER (New)',
    description: 'New customer ready to book first slot',
    badgeColor: 'bg-teal-600 text-white',
  },
];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  quickLogin: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (slug: string) => boolean;
  isRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await apiClient.get('/auth/me');
      setUser(data.data);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, [fetchCurrentUser]);

  const login = async (email: string, password = 'Password123!') => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user: userData } = data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (email: string) => {
    await login(email, 'Password123!');
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const hasPermission = (slug: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions?.includes(slug) || false;
  };

  const isRole = (...roles: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickLogin,
        logout,
        refreshUser,
        hasPermission,
        isRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
