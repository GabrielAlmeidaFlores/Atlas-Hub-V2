import { create } from "zustand";
import type { AuthUser, Perfil } from "@/types";
import { VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID } from "@/lib/env";

interface AuthState {
  readonly user: AuthUser | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly login: (email: string, password: string) => Promise<void>;
  readonly logout: () => void;
  readonly restoreSession: () => Promise<void>;
  readonly handleNewPasswordRequired: (newPassword: string) => Promise<void>;
  readonly pendingChallenge: { readonly type: "NEW_PASSWORD_REQUIRED" } | null;
}

const isCognitoConfigured = VITE_COGNITO_USER_POOL_ID !== "" && VITE_COGNITO_CLIENT_ID !== "";

function extractPerfil(groups: string[]): Perfil {
  if (groups.includes("ADMIN_MASTER")) return "ADMIN_MASTER";
  if (groups.includes("ANALISTA")) return "ANALISTA";
  return "INCORPORADORA";
}

function extractPerfilFromEmail(email: string): Perfil {
  const lower = email.toLowerCase();
  if (lower.includes("master") || lower.includes("admin@atlashub")) return "ADMIN_MASTER";
  if (lower.includes("analista") || lower.includes("@atlashub")) return "ANALISTA";
  return "INCORPORADORA";
}

function extractGroupsFromToken(idToken: string): string[] {
  try {
    const payload = idToken.split(".")[1];
    if (payload === undefined) return [];
    const decoded = JSON.parse(atob(payload)) as Record<string, unknown>;
    const groups = decoded["cognito:groups"];
    if (Array.isArray(groups)) return groups as string[];
    return [];
  } catch {
    return [];
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  pendingChallenge: null,

  login: async (email, password) => {
    if (!isCognitoConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const normalizedEmail = email.trim().toLowerCase();
      const perfil = extractPerfilFromEmail(normalizedEmail);
      const mockId = `mock-${Math.random().toString(36).slice(2, 11)}`;
      set({
        user: { id: mockId, email: normalizedEmail, perfil },
        isAuthenticated: true,
        isLoading: false,
        pendingChallenge: null,
      });
      console.log(`🎭 Mock login: ${normalizedEmail} como ${perfil}`);
      return;
    }

    const { signIn, signOut, fetchAuthSession } = await import("@aws-amplify/auth");
    try {
      await signOut({ global: false });
    } catch {}

    const result = await signIn({ username: email.trim().toLowerCase(), password });

    if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
      set({ pendingChallenge: { type: "NEW_PASSWORD_REQUIRED" } });
      return;
    }

    if (result.nextStep.signInStep !== "DONE" && result.isSignedIn !== true) {
      throw new Error(`Login incompleto: ${result.nextStep.signInStep}`);
    }

    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString() ?? "";
    const groups = extractGroupsFromToken(idToken);
    const perfil = extractPerfil(groups);
    const normalizedEmail = email.trim().toLowerCase();

    set({
      user: { id: session.tokens?.idToken?.payload["sub"] as string ?? "", email: normalizedEmail, perfil },
      isAuthenticated: true,
      isLoading: false,
      pendingChallenge: null,
    });
  },

  handleNewPasswordRequired: async (newPassword) => {
    const { confirmSignIn, fetchAuthSession } = await import("@aws-amplify/auth");
    await confirmSignIn({ challengeResponse: newPassword });
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString() ?? "";
    const email = (session.tokens?.idToken?.payload["email"] as string | undefined) ?? "";
    const groups = extractGroupsFromToken(idToken);
    const perfil = extractPerfil(groups);
    set({
      user: { id: session.tokens?.idToken?.payload["sub"] as string ?? "", email, perfil },
      isAuthenticated: true,
      isLoading: false,
      pendingChallenge: null,
    });
  },

  logout: () => {
    void import("@/lib/analytics").then(({ analytics }) => {
      analytics.track("logout");
      void analytics.flush();
    });
    void import("@aws-amplify/auth").then(({ signOut }) => { void signOut(); });
    set({ user: null, isAuthenticated: false, isLoading: false, pendingChallenge: null });
  },

  restoreSession: async () => {
    if (!isCognitoConfigured) {
      set({ isLoading: false });
      console.log("🎭 Mock mode: sem sessão persistente");
      return;
    }

    try {
      const { fetchAuthSession } = await import("@aws-amplify/auth");
      const session = await fetchAuthSession();
      if (session.tokens?.idToken === undefined) {
        set({ isLoading: false });
        return;
      }
      const idToken = session.tokens.idToken.toString();
      const email = (session.tokens.idToken.payload["email"] as string | undefined) ?? "";
      const sub = (session.tokens.idToken.payload["sub"] as string | undefined) ?? "";
      const groups = extractGroupsFromToken(idToken);
      const perfil = extractPerfil(groups);
      set({ user: { id: sub, email, perfil }, isAuthenticated: true, isLoading: false });
      if (sub !== "") {
        void import("@/lib/analytics").then(({ analytics }) => { analytics.identify(sub); });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
