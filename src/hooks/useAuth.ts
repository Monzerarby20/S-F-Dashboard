import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  MockUser as MockUser 
} from '../services/mockAuth';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  branchId: number | null;
}

interface AuthContextType {
  user: User | null;
  mockUser: MockUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mockUser, setMockUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(null, (mockUser) => {
      console.log('Auth state changed:', mockUser?.email);
      setMockUser(mockUser);
      
      if (mockUser) {
        // Set user data from mock auth service
        setUser({
          id: mockUser.uid,
          email: mockUser.email!,
          name: mockUser.displayName || mockUser.email?.split('@')[0] || 'مستخدم',
          role: mockUser.role || 'user',
          permissions: mockUser.permissions || ['basic'],
          branchId: mockUser.branchId || 1
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      
      await signInWithEmailAndPassword(email, password);
      
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'فشل في تسجيل الدخول');
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword( email, password);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'فشل في إنشاء الحساب');
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await signOut();
      setUser(null);
      setMockUser(null);
      console.log('Logout successful');
      // Force page reload to clear any cached data
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if signOut fails, clear user state
      setUser(null);
      setMockUser(null);
      window.location.href = '/';
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const authValue = {
    user,
    mockUser,
    loading,
    login,
    register,
    logout,
    updateUser
  };

  return React.createElement(
    AuthContext.Provider,
    { value: authValue },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return {
    ...context,
    isAuthenticated: !!context.user,
    isLoading: context.loading
  };
}