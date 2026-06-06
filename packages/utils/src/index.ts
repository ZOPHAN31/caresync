import { format as formatDateFn, parseISO, isValid } from 'date-fns';

export function formatDate(date: Date | string, fmt = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? formatDateFn(d, fmt) : 'Invalid date';
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'MMM d, yyyy h:mm a');
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatRoleName(role: string): string {
  return role.split('_').map(capitalize).join(' ');
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce(
    (result, key) => {
      if (key in obj) result[key] = obj[key];
      return result;
    },
    {} as Pick<T, K>
  );
}
