"use client";

import { create } from 'zustand';

interface UpgradeModalState {
  isOpen: boolean;
  highlightedFeature: string | undefined;
  openModal: (feature?: string) => void;
  closeModal: () => void;
}

export const useUpgradeModal = create<UpgradeModalState>((set) => ({
  isOpen: false,
  highlightedFeature: undefined,
  openModal: (feature) => set({ isOpen: true, highlightedFeature: feature }),
  closeModal: () => set({ isOpen: false })
}));