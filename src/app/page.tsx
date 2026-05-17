"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const verified = sessionStorage.getItem("veil.identityVerified") === "true";
    router.replace(verified ? "/dashboard" : "/home");
  }, [mounted, router]);

  return (
    <main className="flex min-h-screen items-center justify-center text-[color:var(--ink-soft)]">
      <p className="text-sm font-semibold">Redirecting…</p>
    </main>
  );
}
