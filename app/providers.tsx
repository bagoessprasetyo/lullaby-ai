"use client";

import { UpgradeModalProvider } from "@/components/upgrade-modal-providers";
import { SessionProvider } from "next-auth/react";


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      // Don't set session to null - let NextAuth manage the session
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refresh when window gets focus
    >
      <UpgradeModalProvider>
        {children}
      </UpgradeModalProvider>
    </SessionProvider>
  );
}