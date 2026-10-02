import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredAccessToken,
  getCurrentUser,
  getStoredAccessToken,
  loginRequest,
  storeAccessToken,
} from "./auth.service";
import { AuthContext, type AuthContextValue } from "./auth-context";
import type { AuthUser, LoginRequest } from "./auth.types";
import { onApiUnauthorized, setApiClientAuthToken } from "../lib/api-client";

type AuthProviderProps = {
  children: ReactNode;
};

function redirectToLoginPage() {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Initialised from storage (instead of inside the restore effect) so the effect
  // only performs async work. isLoading is true only when there is a session to restore.
  const [token, setToken] = useState<string | null>(() => getStoredAccessToken());
  const [isLoading, setIsLoading] = useState(() => getStoredAccessToken() !== null);
  const isHandlingUnauthorizedRef = useRef(false);

  const clearSession = useCallback(() => {
    clearStoredAccessToken();
    setApiClientAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    redirectToLoginPage();
  }, [clearSession]);

  const login = useCallback(async (payload: LoginRequest) => {
    const authResponse = await loginRequest(payload);
    const nextToken = authResponse.accessToken;

    storeAccessToken(nextToken);
    setApiClientAuthToken(nextToken);

    setToken(nextToken);
    setUser(authResponse.user);
  }, []);

  useEffect(() => {
    const unsubscribe = onApiUnauthorized(() => {
      if (isHandlingUnauthorizedRef.current) {
        return;
      }

      isHandlingUnauthorizedRef.current = true;
      clearSession();
      redirectToLoginPage();
      isHandlingUnauthorizedRef.current = false;
    });

    return unsubscribe;
  }, [clearSession]);

  useEffect(() => {
    const storedToken = getStoredAccessToken();

    if (!storedToken) {
      return;
    }

    setApiClientAuthToken(storedToken);

    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
