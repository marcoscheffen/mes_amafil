import { createClient } from '@supabase/supabase-js';

// ─── Configurações por ambiente ───────────────────────────────────────────────
const ENVS = {
  prod: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://tfkvgkkqpmafvczodnco.supabase.co',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma3Zna2txcG1hZnZjem9kbmNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTYxOTYsImV4cCI6MjA4OTk3MjE5Nn0.ObQgZ38Mqhmr4fDCvt01Xu81pJMQBz38ekE-aiCciSs',
  },
  dev: {
    url: 'https://jiwepyzvfzekftywwkxt.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd2VweXp2Znpla2Z0eXd3a3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzOTY0MDksImV4cCI6MjA4OTk3MjQwOX0.p3OLO3aRsbhhLHfeIZpmGa84ypRTodgzg4cpLjWFrNs',
  },
};

// ─── Seleção de ambiente ──────────────────────────────────────────────────────
// Prioridade: override de runtime (global_admin) > variável de ambiente (build)
const STORAGE_KEY = 'AYVI_ENV';

export type AyviEnv = 'prod' | 'dev';

export function getActiveEnv(): AyviEnv {
  return (localStorage.getItem(STORAGE_KEY) as AyviEnv) || 'prod';
}

export function setActiveEnv(env: AyviEnv): void {
  localStorage.setItem(STORAGE_KEY, env);
  window.location.reload();
}

export function clearEnvOverride(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

const activeConfig = ENVS[getActiveEnv()];

// ─── Cliente Supabase ─────────────────────────────────────────────────────────
export const ACTIVE_URL      = activeConfig.url;
export const ACTIVE_ANON_KEY = activeConfig.key;

export const supabase = createClient(activeConfig.url, activeConfig.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type { User, Session } from '@supabase/supabase-js';
