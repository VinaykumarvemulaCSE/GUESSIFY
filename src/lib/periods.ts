export type LeaderboardPeriod = 'weekly' | 'monthly' | 'allTime';

/** ISO-8601 week number (2026-W43). */
export function isoWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** The three documents a match award writes to. */
export function periodKeys(date: Date = new Date()): { period: LeaderboardPeriod; key: string }[] {
  return [
    { period: 'weekly', key: isoWeekKey(date) },
    { period: 'monthly', key: monthKey(date) },
    { period: 'allTime', key: 'allTime' },
  ];
}

export function periodKey(period: LeaderboardPeriod, date: Date = new Date()): string {
  if (period === 'weekly') return isoWeekKey(date);
  if (period === 'monthly') return monthKey(date);
  return 'allTime';
}
