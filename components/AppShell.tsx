'use client';
import { useAppStore } from '@/store/app-store';
import { DevSprintTemplate } from './templates/dev-sprint/DevSprintTemplate';
import { GenericTableTemplate } from './templates/generic/GenericTableTemplate';

export function AppShell() {
  const { config, fileName, reset } = useAppStore();

  if (!config) return null;

  const DEV_SPRINT_DOMAINS = ['dev_sprint'];

  if (DEV_SPRINT_DOMAINS.includes(config.domain)) {
    return <DevSprintTemplate config={config} fileName={fileName} onReset={reset} />;
  }

  return <GenericTableTemplate config={config} fileName={fileName} onReset={reset} />;
}
