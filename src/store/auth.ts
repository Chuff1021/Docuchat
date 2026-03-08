"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Organization } from "@/types";
import { DEMO_USER, DEMO_ORGANIZATION } from "@/lib/mock-data";

interface AuthState {
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (
    user: User,
    org: Organization,
    accessToken: string,
    refreshToken: string
  ) => void;
  setOrganization: (org: Organization) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Auto-login with demo user for preview
      user: DEMO_USER,
      organization: DEMO_ORGANIZATION,
      accessToken: "demo_access_token",
      refreshToken: "demo_refresh_token",
      isAuthenticated: true,

      setAuth: (user, org, accessToken, refreshToken) =>
        set({
          user,
          organization: org,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setOrganization: (org) => set({ organization: org }),

      logout: () =>
        set({
          user: null,
          organization: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "docubot-auth",
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
