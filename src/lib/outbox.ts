import AsyncStorage from '@react-native-async-storage/async-storage';
import { MatchHistoryItem, UserProfile } from '../types';

export interface PendingAward {
  clientMatchId: string;
  profile: UserProfile;
  match: MatchHistoryItem;
  hintsUsed: number;
  queuedAt: number;
}

const KEY = '@guessify_award_outbox';
const MAX_QUEUE = 50;

async function read(): Promise<PendingAward[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingAward[]) : [];
  } catch {
    return [];
  }
}

async function write(items: PendingAward[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

/**
 * Durable queue for match awards (FR-12). A round finished in airplane mode is
 * applied when the connection returns; ids make replays harmless.
 */
export const Outbox = {
  async add(award: Omit<PendingAward, 'queuedAt'>): Promise<void> {
    const items = await read();
    if (items.some((item) => item.clientMatchId === award.clientMatchId)) return;
    items.push({ ...award, queuedAt: Date.now() });
    await write(items.slice(-MAX_QUEUE));
  },

  async remove(clientMatchId: string): Promise<void> {
    const items = await read();
    await write(items.filter((item) => item.clientMatchId !== clientMatchId));
  },

  async list(): Promise<PendingAward[]> {
    return read();
  },

  /**
   * Send queued awards oldest-first. Stops at the first failure so a later,
   * higher score never lands before an earlier one.
   */
  async flush(send: (award: PendingAward) => Promise<void>): Promise<number> {
    const items = await read();
    if (items.length === 0) return 0;
    items.sort((a, b) => a.queuedAt - b.queuedAt);

    let sent = 0;
    const remaining: PendingAward[] = [];
    for (let i = 0; i < items.length; i++) {
      if (remaining.length > 0) {
        remaining.push(items[i]);
        continue;
      }
      try {
        await send(items[i]);
        sent++;
      } catch {
        remaining.push(items[i]);
      }
    }
    await write(remaining);
    return sent;
  },
};
