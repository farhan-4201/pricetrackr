import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, apiClient } from '@/lib/api';
import { toast } from 'sonner';

// Define proper types for the context matching backend User model
interface User {
  _id: string;
  emailAddress: string;
  fullName: string;
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
  profilePicture: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string[] | string | null;
  signin: (emailAddress: string, password: string) => Promise<{ success: boolean; error?: string | string[] }>;
  signup: (emailAddress: string, password: string, fullName: string, contactNumber: string) => Promise<{ success: boolean; error?: string | string[] }>;
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
  signout: () => Promise.resolve(),
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
  const [error, setError] = useState<string[] | string | null>(null);

  // Proper authentication check on mount with backend validation
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        // No token or user data stored, authentication not possible
        if (!token || !savedUser) {
          setLoading(false);
          return;
        }

        // Validate token with backend by making authenticated request
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Token is valid, get fresh user data from backend
          const freshUserData = await response.json();

          // Normalize user object to ensure all required fields exist
          const normalizedUser = {
            _id: freshUserData._id,
            fullName: freshUserData.fullName || '',
            emailAddress: freshUserData.emailAddress || '',
            createdAt: freshUserData.createdAt,
            lastLogin: freshUserData.lastLogin || null,
            isActive: freshUserData.isActive ?? true,
            profilePicture: freshUserData.profilePicture || 'default-avatar.svg'
          };

          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          setUser(normalizedUser);
        } else {
          // Token is invalid/expired, clear storage
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // On network error, consider authentication invalid to prevent stale state
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Helper function to validate and normalize user object
  const validateAndNormalizeUser = (userData: Partial<User> & { name?: string; email?: string; emailAddress?: string; fullName?: string }): User => {
    // Ensure required fields exist and have proper types
    const normalizedUser: User = {
      _id: userData._id || '',
      fullName: userData.fullName || userData.name || '',
      emailAddress: userData.emailAddress || userData.email || '',
      createdAt: userData.createdAt || new Date().toISOString(),
      lastLogin: userData.lastLogin || null,
      isActive: userData.isActive ?? true,
      profilePicture: userData.profilePicture || 'default-avatar.svg'
    };

    // Validate required fields are not empty strings
    if (!normalizedUser._id ||
        !normalizedUser.fullName ||
        !normalizedUser.emailAddress ||
        !normalizedUser.createdAt) {
      throw new Error('User profile is incomplete');
    }

    return normalizedUser;
  };

  const signin = async (emailAddress: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Make API call to login endpoint
      const response = await authAPI.login({ emailAddress, password });

      // Validate and normalize user object
      const normalizedUser = validateAndNormalizeUser(response.user);

      // Store user data and token
      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      localStorage.setItem('token', response.token);

      toast.success('Successfully signed in!');
      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Sign in failed');
      let errorMessage: string | string[] = 'Sign in failed';

      if (err.message.startsWith('HTTP 400:')) {
        const jsonPart = err.message.slice(10);
        try {
          const errorData = JSON.parse(jsonPart);
          if (errorData.errors) {
            errorMessage = errorData.errors.map((e: { msg: string }) => e.msg);
          }
        } catch {
          // If parsing fails, use default message
        }
      } else {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(typeof errorMessage === 'string' ? errorMessage : errorMessage.join(', '));
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (emailAddress: string, password: string, fullName: string, contactNumber: string) => {
    setLoading(true);
    setError(null);

    try {
      // Make API call to register endpoint
      const response = await authAPI.register({
        emailAddress,
        password,
        confirmPassword: password,
        fullName,
        contactNumber
      });

      // Validate and normalize user object
      const normalizedUser = validateAndNormalizeUser(response.user);

      // Store user data and token
      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      localStorage.setItem('token', response.token);

      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Registration failed');
      let errorMessage: string | string[] = 'Registration failed';

      if (err.message.startsWith('HTTP 400:')) {
        const jsonPart = err.message.slice(10);
        try {
          const errorData = JSON.parse(jsonPart);
          if (errorData.errors) {
            errorMessage = errorData.errors.map((e: { msg: string }) => e.msg);
          }
        } catch {
          // If parsing fails, use default message
        }
      } else {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(typeof errorMessage === 'string' ? errorMessage : errorMessage.join(', '));
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signout = async () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
