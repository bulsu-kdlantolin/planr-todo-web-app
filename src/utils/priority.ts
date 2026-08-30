import { PriorityLevel } from '../types';

export interface PriorityMeta {
  weight: number;
  label: string;
  badgeClass: string;
  textClass: string;
  ariaLabel: string;
  iconSymbol: string;
}

export const PRIORITY_CONFIG: Record<PriorityLevel, PriorityMeta> = {
  urgent: {
    weight: 4,
    label: 'Urgent',
    badgeClass: 'bg-[#ffdad6] text-[#410002] dark:bg-[#93000a]/40 dark:text-[#ffdad6] border border-[#ffb4ab]/40',
    textClass: 'text-[#ba1a1a] dark:text-[#ffb4ab]',
    ariaLabel: 'Priority: Urgent (Highest)',
    iconSymbol: '▲'
  },
  high: {
    weight: 3,
    label: 'High',
    badgeClass: 'bg-[#ffddb9] text-[#2c1600] dark:bg-[#5c3000]/40 dark:text-[#ffddb9] border border-[#ffb877]/40',
    textClass: 'text-[#8c5000] dark:text-[#ffb877]',
    ariaLabel: 'Priority: High',
    iconSymbol: '●'
  },
  medium: {
    weight: 2,
    label: 'Medium',
    badgeClass: 'bg-surface-low text-secondary dark:bg-surface-container dark:text-secondary border border-outline-subtle',
    textClass: 'text-secondary',
    ariaLabel: 'Priority: Medium',
    iconSymbol: '■'
  },
  low: {
    weight: 1,
    label: 'Low',
    badgeClass: 'bg-surface-container-low text-secondary/80 dark:bg-surface-container-low dark:text-secondary/70 border border-outline-subtle/60',
    textClass: 'text-secondary/80',
    ariaLabel: 'Priority: Low',
    iconSymbol: '▽'
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
