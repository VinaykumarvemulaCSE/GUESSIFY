export type LeaderboardPeriod = 'weekly' | 'monthly' | 'allTime';

/**
 * Period keys use UTC calendar parts so every client rolls over at the same
 * instant. Using local date parts makes the weekly board change at local
 * midnight, which splits the board for several hours across timezones.
 */

/** ISO-8601 week number (2026-W43). */
export function isoWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function monthKey(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** The three documents a match award writes to. */
export function periodKeys(date: Date = new Date()): { period: LeaderboardPeriod; key: string }[] {
  return [
    { period: 'weekly', key: isoWeekKey(date) },
    { period: 'monthly', key: monthKey(date) },
    { period: 'allTime', key: 'allTime' },
  ];
}

/** Current plus historical keys that may hold an entry for this player. */
export function cleanupPeriodKeys(date: Date = new Date(), weeks = 26, months = 12): string[] {
  const keys = new Set<string>(['allTime']);
  for (let i = 0; i < weeks; i++) {
    keys.add(isoWeekKey(new Date(date.getTime() - i * 7 * 86400000)));
  }
  for (let i = 0; i < months; i++) {
    keys.add(monthKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - i, 1))));
  }
  return [...keys];
}

export function periodKey(period: LeaderboardPeriod, date: Date = new Date()): string {
  if (period === 'weekly') return isoWeekKey(date);
  if (period === 'monthly') return monthKey(date);
  return 'allTime';
}
