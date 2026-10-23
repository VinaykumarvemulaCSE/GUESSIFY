/**
 * Client-generated match identifiers. Used as the Firestore document ID so a
 * retried award overwrites the same document instead of double-counting.
 */
export function soloMatchId(uid: string, startedAt: number): string {
  return `solo_${uid}_${startedAt}`;
}

export function duelMatchId(roomId: string, roundId: string, uid: string): string {
  return `duel_${roomId}_${roundId}_${uid}`;
}

export function newRoundId(): string {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
