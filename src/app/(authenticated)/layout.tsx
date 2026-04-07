"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (profile && !profile.onboarding_completed) {
      router.replace("/onboarding");
      return;
    }

    // Check for pending invite token
    const pendingToken = sessionStorage.getItem("pending-invite-token");
    if (pendingToken) {
      sessionStorage.removeItem("pending-invite-token");
      router.replace(`/convite/${pendingToken}`);
    }
  }, [isAuthenticated, isLoading, profile, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return <>{children}</>;
}
