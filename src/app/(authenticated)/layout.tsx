"use client";

import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/bottom-nav";

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
      <main className="flex flex-1 flex-col p-4 gap-4 max-w-lg mx-auto w-full">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-lg items-center gap-2.5 px-4 py-2.5">
          <Image src="/icons/logo.svg" alt="" width={28} height={28} />
          <span className="text-sm font-bold text-gray-900">Ponto Casa</span>
        </div>
      </header>
      <div className="flex flex-1 flex-col pb-20 bg-gray-50">{children}</div>
      <BottomNav />
    </>
  );
}
