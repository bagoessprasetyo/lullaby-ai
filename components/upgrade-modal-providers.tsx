"use client";

import { ReactNode } from "react";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { UpgradeModal } from "./upgrade-modal";


export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const { isOpen, closeModal, highlightedFeature } = useUpgradeModal();
  
  return (
    <>
      {children}
      <UpgradeModal 
        isOpen={isOpen}
        onOpenChange={closeModal}
        highlightedFeature={highlightedFeature}
      />
    </>
  );
}