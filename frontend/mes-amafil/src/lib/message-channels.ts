import type { LucideIcon } from 'lucide-react';
import {
  Terminal,
  Wrench,
  Package,
  ShieldAlert,
  Monitor,
  Cpu,
  MessageSquare,
  Headphones,
  Radio,
} from 'lucide-react';

export const MESSAGE_CHANNELS_STORAGE_KEY = 'mes-amafil-message-channels-v1';

export const MESSAGE_CHANNELS_CHANGED_EVENT = 'mes-message-channels-changed';

/** Canal agregador fixo — não entra no CRUD */
export const GENERAL_CHANNEL_ID = 'all' as const;

export const CHANNEL_ICON_KEYS = [
  'terminal',
  'wrench',
  'package',
  'shield-alert',
  'monitor',
  'cpu',
  'message-square',
  'headphones',
  'radio',
] as const;

export type MessageChannelIconKey = (typeof CHANNEL_ICON_KEYS)[number];

export interface PersistedMessageChannel {
  id: string;
  label: string;
  description: string;
  iconKey: MessageChannelIconKey;
  /** Classes Tailwind para texto + fundo do ícone, ex.: text-violet-600 bg-violet-50 */
  color: string;
}

export const CHANNEL_ICON_COMPONENTS: Record<MessageChannelIconKey, LucideIcon> = {
  terminal: Terminal,
  wrench: Wrench,
  package: Package,
  'shield-alert': ShieldAlert,
  monitor: Monitor,
  cpu: Cpu,
  'message-square': MessageSquare,
  headphones: Headphones,
  radio: Radio,
};

export const CHANNEL_COLOR_PRESETS: { label: string; value: string }[] = [
  { label: 'Azul', value: 'text-amafil-blue bg-blue-50' },
  { label: 'Vermelho', value: 'text-red-500 bg-red-50' },
  { label: 'Verde', value: 'text-amafil-green bg-green-50' },
  { label: 'Laranja', value: 'text-orange-500 bg-orange-50' },
  { label: 'Violeta', value: 'text-violet-600 bg-violet-50' },
  { label: 'Ciano', value: 'text-cyan-600 bg-cyan-50' },
  { label: 'Âmbar', value: 'text-amber-600 bg-amber-50' },
];

export function getDefaultPersistedChannels(): PersistedMessageChannel[] {
  return [
    {
      id: 'MNT',
      label: 'Manutenção (MNT)',
      description: 'Chamados e alertas técnicos',
      iconKey: 'wrench',
      color: 'text-red-500 bg-red-50',
    },
    {
      id: 'PCP',
      label: 'PCP / Produção',
      description: 'Planejamento e ordens',
      iconKey: 'package',
      color: 'text-amafil-green bg-green-50',
    },
    {
      id: 'urgent',
      label: 'Avisos',
      description: 'Alertas críticos de segurança',
      iconKey: 'shield-alert',
      color: 'text-orange-500 bg-orange-50',
    },
    {
      id: 'TI',
      label: 'TI',
      description: 'Suporte técnico, rede e sistemas',
      iconKey: 'monitor',
      color: 'text-violet-600 bg-violet-50',
    },
  ];
}

export function loadPersistedMessageChannels(): PersistedMessageChannel[] {
  if (typeof window === 'undefined') return getDefaultPersistedChannels();
  try {
    const raw = localStorage.getItem(MESSAGE_CHANNELS_STORAGE_KEY);
    if (!raw) return getDefaultPersistedChannels();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return getDefaultPersistedChannels();
    const cleaned = parsed.filter(isValidChannel);
    return cleaned.length > 0 ? cleaned : getDefaultPersistedChannels();
  } catch {
    return getDefaultPersistedChannels();
  }
}

function isValidChannel(row: unknown): row is PersistedMessageChannel {
  if (!row || typeof row !== 'object') return false;
  const o = row as Record<string, unknown>;
  if (typeof o.id !== 'string' || o.id === GENERAL_CHANNEL_ID) return false;
  if (typeof o.label !== 'string' || typeof o.description !== 'string') return false;
  if (typeof o.color !== 'string') return false;
  return CHANNEL_ICON_KEYS.includes(o.iconKey as MessageChannelIconKey);
}

export function savePersistedMessageChannels(channels: PersistedMessageChannel[]) {
  if (typeof window === 'undefined') return;
  const normalized = channels.filter((c) => c.id !== GENERAL_CHANNEL_ID);
  localStorage.setItem(MESSAGE_CHANNELS_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(MESSAGE_CHANNELS_CHANGED_EVENT));
}

export function subscribeMessageChannelsChanged(handler: () => void) {
  if (typeof window === 'undefined') return () => {};
  const onCustom = () => handler();
  const onStorage = (e: StorageEvent) => {
    if (e.key === MESSAGE_CHANNELS_STORAGE_KEY) handler();
  };
  window.addEventListener(MESSAGE_CHANNELS_CHANGED_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(MESSAGE_CHANNELS_CHANGED_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

export function slugChannelId(label: string, existingIds: Set<string>): string {
  const base =
    label
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 28) || 'canal';
  let id = base === GENERAL_CHANNEL_ID || base.toUpperCase() === 'ALL' ? 'canal' : base;
  let n = 0;
  while (existingIds.has(id) || id === GENERAL_CHANNEL_ID) {
    n += 1;
    id = `${base}-${n}`;
  }
  return id;
}

export function getGeneralChannelMeta(): Omit<PersistedMessageChannel, 'id'> & { id: typeof GENERAL_CHANNEL_ID } {
  return {
    id: GENERAL_CHANNEL_ID,
    label: 'Geral - Fábrica',
    description: 'Canal principal de avisos',
    iconKey: 'terminal',
    color: 'text-amafil-blue bg-blue-50',
  };
}
