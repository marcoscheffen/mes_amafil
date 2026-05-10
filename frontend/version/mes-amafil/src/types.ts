import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

export interface KPIProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  status: 'success' | 'warning' | 'danger' | 'info';
}

export interface Machine {
  id: string;
  codigo: string;
  nome: string;
  status: 'OPERANDO' | 'PARADA' | 'MANUTENCAO' | 'OFFLINE';
  lastOP?: string;
}
