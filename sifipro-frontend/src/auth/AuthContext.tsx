import {
  createContext,
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
import type { AuthUser, LoginRequest, TenantSummary } from "./auth.types";
import { onApiUnauthorized, setApiClientAuthToken } from "../lib/api-client";

type AuthContextValue = {
  user: AuthUser | null;
  tenant: TenantSummary | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    setApiClientAuthToken(storedToken);

    const restoreSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      tenant: user?.tenant ?? null,
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
