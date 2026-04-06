import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import * as axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Configure axios baseURL
axios.default.defaults.baseURL = 'http://localhost:3001';

interface AuthContextType {
  login: (access_token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserData | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type UserData = {
  id: string;
  companyId: string;
  email: string;
  name: string;
  exp: number;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    try {
      const storedAccessToken = localStorage.getItem('access_token');
      if (storedAccessToken) {
        const decoded = jwtDecode<UserData>(storedAccessToken);
        setUser(decoded);
        const isExpired = decoded.exp * 1000 < Date.now();
        if (isExpired) {
          localStorage.removeItem('access_token');
          return;
        }

        setAccessToken(storedAccessToken);
        axios.default.defaults.headers.common['Authorization'] =
          `Bearer ${storedAccessToken}`;
      }
    } catch (e) {
      localStorage.removeItem('access_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (access_token: string) => {
    setAccessToken(access_token);
    localStorage.setItem('access_token', access_token);
    axios.default.defaults.headers.common['Authorization'] =
      `Bearer ${access_token}`;
  };

  const logout = () => {
    setAccessToken(null);
    localStorage.removeItem('access_token');

    delete axios.default.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{ login, logout, isAuthenticated: !!accessToken, isLoading, user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
