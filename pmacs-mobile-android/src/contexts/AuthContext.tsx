'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  empId: string;
  name: string;
  role: 'Master' | 'Pharmacist' | 'Nurse';
  status: string;
}

interface AuthContextType {
  user: User | null;
  login: (empId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('pmacs_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse stored user:', e);
          localStorage.removeItem('pmacs_user');
        }
      }
    } catch (e) {
      console.error('Failed to access localStorage:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (empId: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const loginEndpoint = apiUrl ? `${apiUrl}/api/auth/login` : '/api/auth/login';

      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      // Store user data
      const userData: User = {
        empId: data.user.empId,
        name: data.user.name,
        role: data.user.role,
        status: data.user.status,
      };

      setUser(userData);
      localStorage.setItem('pmacs_user', JSON.stringify(userData));

      // Redirect based on role
      const redirectPath =
        userData.role === 'Master' ? '/admin' :
        userData.role === 'Pharmacist' ? '/pharmacist' :
        '/nurse';

      router.push(redirectPath);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pmacs_user');
    localStorage.removeItem('pmacs-chat-history'); // Clear chat history
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
