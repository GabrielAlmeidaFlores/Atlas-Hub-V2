import { create } from "zustand";
import type { AuthUser, Perfil } from "@/types";

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

function extractPerfil(groups: string[]): Perfil {
  if (groups.includes("ADMIN_MASTER")) return "ADMIN_MASTER";
  if (groups.includes("ANALISTA")) return "ANALISTA";
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
    const { signIn, fetchAuthSession } = await import("@aws-amplify/auth");
    const result = await signIn({ username: email, password });

    if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
      set({ pendingChallenge: { type: "NEW_PASSWORD_REQUIRED" } });
      return;
    }

    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString() ?? "";
    const groups = extractGroupsFromToken(idToken);
    const perfil = extractPerfil(groups);

    set({
      user: { id: session.tokens?.idToken?.payload["sub"] as string ?? "", email, perfil },
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
    void import("@aws-amplify/auth").then(({ signOut }) => { void signOut(); });
    set({ user: null, isAuthenticated: false, isLoading: false, pendingChallenge: null });
  },

  restoreSession: async () => {
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
    } catch {
      set({ isLoading: false });
    }
  },
}));
