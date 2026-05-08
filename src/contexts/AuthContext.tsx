import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import * as axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';
import type { LoginResponseDto } from '@/api/model';
import { refresh as refreshTokenApi, authListMemberships, logout as logoutApi } from '@/api/auth/auth';

// Configure axios baseURL
axios.default.defaults.baseURL = 'http://localhost:3001';
axios.default.defaults.withCredentials = true;

export type UserData = {
  id: string;
  email: string;
  name: string;
  exp: number;
};

interface AuthContextType {
  login: (response: LoginResponseDto) => Promise<void>;
  logout: () => void;
  refreshActiveCompany: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserData | null;
  activeCompanyId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(
    () => localStorage.getItem('active_company_id'),
  );
  const isRefreshingRef = useRef(false);
  const pendingRequestsRef = useRef<Array<(token: string | null) => void>>([]);

  const applyCompany = async () => {
    try {
      const res = await authListMemberships();
      const companyId = res.data[0]?.companyId ?? null;
      if (companyId) {
        axios.default.defaults.headers.common['X-Company-Id'] = companyId;
        localStorage.setItem('active_company_id', companyId);
      } else {
        delete axios.default.defaults.headers.common['X-Company-Id'];
        localStorage.removeItem('active_company_id');
      }
      setActiveCompanyId(companyId);
    } catch {
      delete axios.default.defaults.headers.common['X-Company-Id'];
      localStorage.removeItem('active_company_id');
      setActiveCompanyId(null);
    }
  };

  const applyToken = async (token: string, expiresAt: string) => {
    setAccessToken(token);
    localStorage.setItem('access_token', token);
    localStorage.setItem('access_token_expires_at', expiresAt);
    axios.default.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(jwtDecode<UserData>(token));
    await applyCompany();
  };

  const clearAuth = () => {
    setAccessToken(null);
    setUser(null);
    setActiveCompanyId(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('access_token_expires_at');
    localStorage.removeItem('active_company_id');
    delete axios.default.defaults.headers.common['Authorization'];
    delete axios.default.defaults.headers.common['X-Company-Id'];
  };

  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = localStorage.getItem('access_token');
        const storedExpiresAt = localStorage.getItem('access_token_expires_at');
        const storedCompanyId = localStorage.getItem('active_company_id');

        if (storedCompanyId) {
          axios.default.defaults.headers.common['X-Company-Id'] = storedCompanyId;
        }

        if (storedToken) {
          const isExpired = storedExpiresAt
            ? new Date(storedExpiresAt) <= new Date()
            : jwtDecode<UserData>(storedToken).exp * 1000 < Date.now();

          if (isExpired) {
            try {
              const res = await refreshTokenApi();
              await applyToken(res.data.accessToken, res.data.expiresAt);
            } catch {
              clearAuth();
            }
          } else {
            setAccessToken(storedToken);
            axios.default.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            setUser(jwtDecode<UserData>(storedToken));
            await applyCompany();
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

        if (error.response?.status === 403) {
          const data = error.response?.data as Record<string, unknown> | undefined;
          if (data?.message === 'Company context missing') {
            window.location.href = '/onboarding';
          }
          return Promise.reject(error);
        }

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
            const res = await refreshTokenApi();
            const newToken = res.data.accessToken;
            await applyToken(newToken, res.data.expiresAt);
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

  const login = async (response: LoginResponseDto) => {
    setIsLoading(true);
    try {
      await applyToken(response.accessToken, response.expiresAt);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutApi().catch(() => {});
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        refreshActiveCompany: applyCompany,
        isAuthenticated: !!accessToken,
        isLoading,
        user,
        activeCompanyId,
      }}
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
