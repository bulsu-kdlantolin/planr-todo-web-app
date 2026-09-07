import { PriorityLevel } from '../types';

export interface PriorityMeta {
  weight: number;
  label: string;
  code: string;
  badgeClass: string;
  textClass: string;
  dotClass: string;
  ariaLabel: string;
  iconSymbol: string;
  description: string;
}

export const PRIORITY_CONFIG: Record<PriorityLevel, PriorityMeta> = {
  urgent: {
    weight: 4,
    label: 'Urgent',
    code: 'P1',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30',
    textClass: 'text-rose-600 dark:text-rose-400',
    dotClass: 'bg-rose-500',
    ariaLabel: 'Priority: Urgent (Immediate action required)',
    iconSymbol: '⚡',
    description: 'Immediate action required'
  },
  high: {
    weight: 3,
    label: 'High',
    code: 'P2',
    badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30',
    textClass: 'text-amber-600 dark:text-amber-400',
    dotClass: 'bg-amber-500',
    ariaLabel: 'Priority: High (Important • Schedule today)',
    iconSymbol: '▲',
    description: 'Important • Schedule today'
  },
  medium: {
    weight: 2,
    label: 'Medium',
    code: 'P3',
    badgeClass: 'bg-sky-500/15 text-sky-800 dark:text-sky-200 border border-sky-500/30',
    textClass: 'text-sky-600 dark:text-sky-400',
    dotClass: 'bg-sky-500',
    ariaLabel: 'Priority: Medium (Standard priority)',
    iconSymbol: '◆',
    description: 'Standard priority'
  },
  low: {
    weight: 1,
    label: 'Low',
    code: 'P4',
    badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30',
    textClass: 'text-slate-600 dark:text-slate-400',
    dotClass: 'bg-slate-400 dark:bg-slate-500',
    ariaLabel: 'Priority: Low (When time permits)',
    iconSymbol: '▼',
    description: 'When time permits'
  }
};

export function getPriorityWeight(priority: PriorityLevel): number {
  return PRIORITY_CONFIG[priority]?.weight ?? 1;
}

export function getPriorityMeta(priority: PriorityLevel): PriorityMeta {
  return PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
}

export function getPriorityLabel(priority: PriorityLevel): string {
  return PRIORITY_CONFIG[priority]?.label ?? 'Medium';
}

export function getPriorityBadgeClasses(priority: PriorityLevel): string {
  return PRIORITY_CONFIG[priority]?.badgeClass ?? PRIORITY_CONFIG.medium.badgeClass;
}

export function weightToPriority(weight: number): PriorityLevel {
  switch (weight) {
    case 4:
      return 'urgent';
    case 3:
      return 'high';
    case 2:
      return 'medium';
    case 1:
    default:
      return 'low';
  }
}

