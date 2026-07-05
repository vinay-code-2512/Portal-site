"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    const target = oobCode ? `/login?oobCode=${encodeURIComponent(oobCode)}` : "/login";
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#07070b] flex items-center justify-center">
      <p className="text-zinc-500 text-sm">Redirecting to login...</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070b]" />}>
      <ResetPasswordRedirect />
    </Suspense>
  );
}
