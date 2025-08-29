import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, apiClient } from '@/lib/api';
import { toast } from 'sonner';

// Define proper types for the context matching backend User model
interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signout: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

// Provide a properly typed default value for the context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  signin: async () => ({ success: false, error: 'Not implemented' }),
  signup: async () => ({ success: false, error: 'Not implemented' }),
  signout: () => {},
  clearError: () => {},
  isAuthenticated: false
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate authentication check on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simulate API call to check authentication
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Make API call to login endpoint
      const response = await authAPI.login({ email, password });

      // Store user data and token
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);

      toast.success('Successfully signed in!');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);

    try {
      // Make API call to register endpoint
      const response = await authAPI.register({
        email,
        password,
        confirmPassword: password,
        name
      });

      // Store user data and token
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);

      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('user');
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signin,
    signup,
    signout,
    clearError,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
