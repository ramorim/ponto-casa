"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { OfflineBanner } from "@/components/offline-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OfflineBanner />
      {children}
      <Toaster position="top-center" />
    </AuthProvider>
  );
}
