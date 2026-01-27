import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

type AppRole = 'admin' | 'manager' | 'team_lead' | 'backend_developer' | 'frontend_developer' | 'mobile_developer' | 'testing_team';

interface Permission {
  permission_key: string;
  can_view: boolean;
  can_edit: boolean;
}

interface UserData {
  id: string;
  email: string;
  profile_id?: string;
  name?: string;
  avatar_url?: string | null;
  designation?: string | null;
  user_role?: AppRole;
}

interface AuthContextType {
  user: UserData | null;
  profile: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    designation: string | null;
  } | null;
  role: AppRole | null;
  permissions: Permission[];
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasPermission: (key: string, type: 'view' | 'edit') => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isTeamLead: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const { user: userData, permissions: userPermissions } = await api.auth.getUser();
      
      setUser(userData);
      setRole(userData.user_role || null);
      setPermissions(userPermissions || []);
      
      if (userData) {
        setProfile({
          id: userData.profile_id || userData.id,
          name: userData.name || '',
          email: userData.email,
          avatar_url: userData.avatar_url || null,
          designation: userData.designation || null,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Token might be invalid, clear it
      api.clearToken();
      setUser(null);
      setProfile(null);
      setRole(null);
      setPermissions([]);
    }
  };

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchUserData().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { user: userData, token } = await api.auth.signUp(email, password, name);
      api.setToken(token);
      
      setUser(userData);
      setRole(userData.user_role || null);
      
      if (userData) {
        setProfile({
          id: userData.profile_id || userData.id,
          name: userData.name || name,
          email: userData.email,
          avatar_url: userData.avatar_url || null,
          designation: userData.designation || null,
        });
      }

      // Fetch permissions
      await fetchUserData();
      
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Sign up failed') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user: userData, token } = await api.auth.signIn(email, password);
      api.setToken(token);
      
      setUser(userData);
      setRole(userData.user_role || null);
      
      if (userData) {
        setProfile({
          id: userData.profile_id || userData.id,
          name: userData.name || '',
          email: userData.email,
          avatar_url: userData.avatar_url || null,
          designation: userData.designation || null,
        });
      }

      // Fetch permissions
      await fetchUserData();
      
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Sign in failed') };
    }
  };

  const signOut = async () => {
    api.clearToken();
    setUser(null);
    setProfile(null);
    setRole(null);
    setPermissions([]);
  };

  const hasPermission = (key: string, type: 'view' | 'edit'): boolean => {
    const perm = permissions.find(p => p.permission_key === key);
    if (!perm) return false;
    return type === 'view' ? perm.can_view : perm.can_edit;
  };

  const value: AuthContextType = {
    user,
    profile,
    role,
    permissions,
    isLoading,
    signUp,
    signIn,
    signOut,
    hasPermission,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isTeamLead: role === 'team_lead',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
