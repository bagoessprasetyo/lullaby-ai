"use client";

import { UpgradeModalProvider } from "@/components/upgrade-modal-providers";
import { SessionProvider } from "next-auth/react";


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      session={null}
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <UpgradeModalProvider>
        {children}
      </UpgradeModalProvider>
    </SessionProvider>
  );
}