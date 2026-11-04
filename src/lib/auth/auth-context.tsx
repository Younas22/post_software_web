"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/auth.service";
import { configService } from "@/services/config.service";
import { subscriptionService } from "@/services/subscription.service";
import { getToken, registerUnauthorizedHandler, setToken } from "@/lib/api/client";
import { setDisplayTimeZone } from "@/lib/utils";
import { loginPath } from "@/lib/branding";
import type { AuthUser, ConfigBootstrap, SubscriptionInfo } from "@/types";

interface AuthState {
  user: AuthUser | null;
  config: ConfigBootstrap | null;
  subscription: SubscriptionInfo | null;
  /** Still resolving the initial session on first load. */
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasPermission: (slug: string) => boolean;
  hasFeature: (slug: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const initialState: AuthState = {
  user: null,
  config: null,
  subscription: null,
  isLoading: true,
  isAuthenticated: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  // Applied during render (not in an effect) so the very first paint after
  // the config arrives already formats dates in the business's timezone.
  setDisplayTimeZone(state.config?.business?.timezone);

  const loadSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ ...initialState, isLoading: false });
      return;
    }

    try {
      const [{ user }, config] = await Promise.all([authService.me(), configService.get()]);
      // Subscription visibility is best-effort — a Super Admin has no
      // client_id, so this call 404s for them by design; never block
      // session load on it.
      const subscription = await subscriptionService.get().catch(() => null);
      setState({ user, config, subscription, isLoading: false, isAuthenticated: true });
    } catch {
      setToken(null);
      setState({ ...initialState, isLoading: false });
    }
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setToken(null);
      setState({ ...initialState, isLoading: false });
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        // A hard navigation, not router.push() — deliberately drops every
        // in-memory store/query-cache after an auth failure rather than
        // risk stale tenant data surviving into the next session.
        // Lands on this business type's own branded login page, if known.
        window.location.assign(loginPath());
      }
    });
    // Bootstraps the session once on mount from a persisted token, if any.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSession();
    return () => registerUnauthorizedHandler(null);
  }, [loadSession]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await authService.login(email, password);
    setToken(token);
    const config = await configService.get();
    const subscription = await subscriptionService.get().catch(() => null);
    setState({ user, config, subscription, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setToken(null);
      setState({ ...initialState, isLoading: false });
    }
  }, []);

  const hasPermission = useCallback(
    (slug: string) => Boolean(state.user?.is_super_admin || state.user?.permissions.includes(slug)),
    [state.user]
  );

  const hasFeature = useCallback((slug: string) => Boolean(state.config?.features.includes(slug)), [state.config]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, refresh: loadSession, hasPermission, hasFeature }),
    [state, login, logout, loadSession, hasPermission, hasFeature]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
