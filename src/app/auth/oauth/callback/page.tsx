"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken || !refreshToken) {
        setError("OAuth callback is missing required tokens.");
        return;
      }

      try {
        const response = await authApi.oauthFinalizeSession(accessToken, refreshToken);
        const orgs = await authApi.myOrganizations(accessToken);
        const org = orgs[0];
        setAuth(response.user, org, accessToken, refreshToken);
        router.replace("/dashboard");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to finalize OAuth login.");
      }
    };

    run();
  }, [router, setAuth]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-800/60 bg-slate-900 p-6 text-center">
        {error ? (
          <>
            <h1 className="text-lg font-semibold text-white">OpenAI OAuth failed</h1>
            <p className="text-sm text-red-400 mt-2">{error}</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-white">Completing sign in…</h1>
            <p className="text-sm text-slate-400 mt-2">Setting up your DocuBot session.</p>
          </>
        )}
      </div>
    </div>
  );
}
