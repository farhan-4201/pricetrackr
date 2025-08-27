import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define proper types for the context
interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  joinDate: string;
  subscription: string;
  watchlistCount: number;
  alertsCount: number;
  totalSaved: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signout: () => void;
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful login
      if (email && password) {
        const userData: User = {
          id: '1',
          email,
          name: email.split('@')[0],
          avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=22d3ee&color=fff`,
          joinDate: new Date().toISOString(),
          subscription: 'free',
          watchlistCount: 23,
          alertsCount: 47,
          totalSaved: 2847
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (email && password && name) {
        const userData: User = {
          id: Date.now().toString(),
          email,
          name,
          avatar: `https://ui-avatars.com/api/?name=${name}&background=22c55e&color=fff`,
          joinDate: new Date().toISOString(),
          subscription: 'free',
          watchlistCount: 0,
          alertsCount: 0,
          totalSaved: 0
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      } else {
        throw new Error('All fields are required');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
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