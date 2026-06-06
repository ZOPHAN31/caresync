/**
 * Web-app local types. Shared domain types are re-exported from
 * `@caresync/types` once cross-package wiring is enabled in later phases.
 */

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
}

export interface DashboardStat {
  label: string;
  value: number | string;
  hint?: string;
}
