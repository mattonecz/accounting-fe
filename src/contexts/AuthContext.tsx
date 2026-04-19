import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import * as axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';
import type { LoginResponseDto } from '@/api/model';
import { refresh as refreshTokenApi } from '@/api/auth/auth';

// Configure axios baseURL
axios.default.defaults.baseURL = 'http://localhost:3001';

interface AuthContextType {
  login: (response: LoginResponseDto) => void;
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
  const isRefreshingRef = useRef(false);
  const pendingRequestsRef = useRef<Array<(token: string | null) => void>>([]);

  const applyToken = (token: string, expiresAt: string) => {
    setAccessToken(token);
    localStorage.setItem('access_token', token);
    localStorage.setItem('access_token_expires_at', expiresAt);
    axios.default.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(jwtDecode<UserData>(token));
  };

  const clearAuth = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('access_token_expires_at');
    delete axios.default.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = localStorage.getItem('access_token');
        const storedExpiresAt = localStorage.getItem('access_token_expires_at');

        if (storedToken) {
          const isExpired = storedExpiresAt
            ? new Date(storedExpiresAt) <= new Date()
            : jwtDecode<UserData>(storedToken).exp * 1000 < Date.now();

          if (isExpired) {
            try {
              const res = await refreshTokenApi({ withCredentials: true });
              applyToken(res.data.accessToken, res.data.expiresAt);
            } catch {
              clearAuth();
            }
          } else {
            applyToken(storedToken, storedExpiresAt ?? '');
          }
        }
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const interceptor = axios.default.interceptors.response.use(
      (response) => response,
      async (error: axios.AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/refresh')
        ) {
          if (isRefreshingRef.current) {
            return new Promise((resolve, reject) => {
              pendingRequestsRef.current.push((token) => {
                if (token) {
                  originalRequest.headers['Authorization'] = `Bearer ${token}`;
                  resolve(axios.default(originalRequest));
                } else {
                  reject(error);
                }
              });
            });
          }

          originalRequest._retry = true;
          isRefreshingRef.current = true;

          try {
            const res = await refreshTokenApi({ withCredentials: true });
            const newToken = res.data.accessToken;
            applyToken(newToken, res.data.expiresAt);
            pendingRequestsRef.current.forEach((cb) => cb(newToken));
            pendingRequestsRef.current = [];
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios.default(originalRequest);
          } catch (refreshError) {
            clearAuth();
            pendingRequestsRef.current.forEach((cb) => cb(null));
            pendingRequestsRef.current = [];
            return Promise.reject(refreshError);
          } finally {
            isRefreshingRef.current = false;
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axios.default.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = (response: LoginResponseDto) => {
    applyToken(response.accessToken, response.expiresAt);
  };

  const logout = () => {
    clearAuth();
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
