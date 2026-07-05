"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

function AuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Verifying your session...");

  useEffect(() => {
    const token = searchParams.get("token");
    const redirect = searchParams.get("redirect") || "/admin";

    if (!token) {
      setStatus("No authentication token found. Redirecting to login...");
      setTimeout(() => router.replace("/login"), 1500);
      return;
    }

    async function exchangeToken(idToken: string) {
      try {
        const { getFunctions, httpsCallable } = await import("firebase/functions");
        const functions = getFunctions();
        const exchange = httpsCallable(functions, "exchangeToken");
        const result = await exchange({ idToken });
        const { customToken } = result.data as { customToken: string };

        await signInWithCustomToken(auth, customToken);
        router.replace(redirect);
      } catch (err) {
        console.error("Auth exchange failed:", err);
        setStatus("Session verification failed. Redirecting to login...");
        setTimeout(() => router.replace("/login"), 1500);
      }
    }

    exchangeToken(token);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#0B0B1A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[var(--neon-blue)] border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">{status}</p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0B1A] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[var(--neon-blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthHandler />
    </Suspense>
  );
}
