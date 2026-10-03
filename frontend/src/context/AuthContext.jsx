import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import apiClient, { setUnauthorizedHandler, tokenStorage } from '../api/apiClient.js';
import { applyLanguage, getVisitorLanguage } from '../i18n/index.js';
import { connectSocket, disconnectSocket } from '../socket/socketClient.js';

const AuthContext = createContext(null);

async function fetchCurrentUser() {
  const { data } = await apiClient.get('/users/me');
  return data;
}

/** A 401 is handled by the unauthorized handler, which ends the session. */
async function checkStoredSession() {
  try {
    return { user: await fetchCurrentUser() };
  } catch (error) {
    return { error };
  }
}

/**
 * Session status:
 * - "loading": a stored token is being checked with GET /users/me
 * - "authenticated": the current user is known
 * - "anonymous": no valid session
 * - "error": the session couldn't be checked (API unreachable); it can be retried
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (tokenStorage.get() ? 'loading' : 'anonymous'));
  const [sessionError, setSessionError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setSessionError(null);
    setSessionExpired(false);
    setStatus('anonymous');
    applyLanguage(getVisitorLanguage());
  }, []);

  const applySessionCheck = useCallback(({ user: currentUser, error }) => {
    if (currentUser) {
      setUser(currentUser);
      setStatus('authenticated');
    } else if (error.status !== 401) {
      setSessionError(error);
      setStatus('error');
    }
  }, []);

  const retrySession = useCallback(() => {
    if (!tokenStorage.get()) {
      setStatus('anonymous');
      return;
    }
    setStatus('loading');
    setSessionError(null);
    checkStoredSession().then(applySessionCheck);
  }, [applySessionCheck]);

  const startSession = useCallback(
    async (token) => {
      tokenStorage.set(token);
      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        setSessionExpired(false);
        setStatus('authenticated');
        return currentUser;
      } catch (error) {
        clearSession();
        throw error;
      }
    },
    [clearSession],
  );

  const login = useCallback(
    async ({ email, password }) => {
      const { data } = await apiClient.post('/auth/login', { email, password });
      return startSession(data.token);
    },
    [startSession],
  );

  const register = useCallback(
    async ({ name, email, password, acceptPrivacy }) => {
      const { data } = await apiClient.post('/auth/register', {
        name,
        email,
        password,
        acceptPrivacy,
      });
      return startSession(data.token);
    },
    [startSession],
  );

  const logout = useCallback(() => {
    clearSession();
    navigate('/login', { replace: true });
  }, [clearSession, navigate]);

  const refreshUser = useCallback(async () => {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearSession();
    setSessionExpired(true);
    navigate('/login', { replace: true });
  }, [clearSession, navigate]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  useEffect(() => {
    if (!tokenStorage.get()) return undefined;
    let cancelled = false;
    checkStoredSession().then((result) => {
      if (!cancelled) applySessionCheck(result);
    });
    return () => {
      cancelled = true;
    };
  }, [applySessionCheck]);

  useEffect(() => {
    if (user?.language) applyLanguage(user.language);
  }, [user?.language]);

  const householdId = status === 'authenticated' ? user?.householdId : null;

  useEffect(() => {
    if (!householdId) return undefined;
    connectSocket(tokenStorage.get(), { onUnauthorized: handleUnauthorized });
    return () => disconnectSocket();
  }, [householdId, handleUnauthorized]);

  const value = useMemo(
    () => ({
      status,
      user,
      sessionError,
      sessionExpired,
      login,
      register,
      logout,
      refreshUser,
      applyUser,
      retrySession,
    }),
    [
      status,
      user,
      sessionError,
      sessionExpired,
      login,
      register,
      logout,
      refreshUser,
      applyUser,
      retrySession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
