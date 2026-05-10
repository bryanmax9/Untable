'use client';
import { create } from 'zustand';
import type { AppConfig } from '@/lib/types';

interface AppStore {
  config: AppConfig | null;
  fileName: string | null;
  isProcessing: boolean;
  error: string | null;
  setConfig: (config: AppConfig, fileName: string) => void;
  setProcessing: (v: boolean) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  config: null,
  fileName: null,
  isProcessing: false,
  error: null,
  setConfig: (config, fileName) => set({ config, fileName, error: null, isProcessing: false }),
  setProcessing: (v) => set({ isProcessing: v, error: null }),
  setError: (msg) => set({ error: msg, isProcessing: false }),
  reset: () => set({ config: null, fileName: null, error: null, isProcessing: false }),
}));
