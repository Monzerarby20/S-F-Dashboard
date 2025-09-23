import React, { useState, useEffect, createContext, useContext } from 'react';
import { useQuery, useMutation,useQueryClient } from '@tanstack/react-query';
import { 
   
  auth,
  signOut, 
  
} from '../services/mockAuth';
import { 
  
  fetchAuthUser, 
  signInWithEmailAndPassword 
} from '../services/auth';
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
 
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  

    const {data: authUser  , isLoading:loading}  = useQuery({
      queryKey: ['authUser'],
      queryFn: fetchAuthUser,
    });
    
    
    useEffect(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser && !authUser) {
        setUser(JSON.parse(storedUser));
      }else{
        setUser(authUser ?? null);
      }
    }, [authUser]);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(null, (mockUser) => {
  //     console.log('Auth state changed:', mockUser?.email);
  //     setMockUser(mockUser);
      
  //     if (mockUser) {
  //       // Set user data from mock auth service
  //       setUser({
  //         id: mockUser.uid,
  //         email: mockUser.email!,
  //         name: mockUser.displayName || mockUser.email?.split('@')[0] || 'مستخدم',
  //         role: mockUser.role || 'user',
  //         permissions: mockUser.permissions || ['basic'],
  //         branchId: mockUser.branchId || 1
  //       });
  //     } else {
  //       setUser(null);
  //     }
  //     setLoading(false);
  //   });

  //   return () => unsubscribe();
  // }, []);
  const queryClient = useQueryClient();
  const login = async (email: string, password: string) => {
    try {
      
       const user = await signInWithEmailAndPassword(email, password);
      localStorage.setItem('user', JSON.stringify(user));
      await queryClient.invalidateQueries({ queryKey: ['authUser'] });
      
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'فشل في تسجيل الدخول');
    }
  };

  

  const logout = async () => {
    try {
      console.log('Logging out...');
      await signOut();
      localStorage.removeItem('user');
      setUser(null);
      
      console.log('Logout successful');
      // Force page reload to clear any cached data
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if signOut fails, clear user state
      setUser(null);
      window.location.href = '/';
    }
  };
  if (loading) {
    return <div>Loading...</div>;
  }

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const authValue = {
    user,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
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