"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#05060f] flex items-center justify-center">
      <div className="text-white text-xs font-mono animate-pulse">Redirecting to terminal...</div>
    </div>
  );
}



