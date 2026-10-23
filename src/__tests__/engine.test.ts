import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_CONFIGS,
  calculateGuessFeedback,
  calculateSoloScore,
  firstGuesserFor,
  refereeFor,
} from '../constants/gameRules';
import { cleanupPeriodKeys, isoWeekKey, monthKey, periodKeys } from '../lib/periods';
import { duelMatchId, soloMatchId } from '../lib/ids';

describe('solo scoring', () => {
  it('discounts each extra attempt by 25', () => {
    expect(calculateSoloScore('easy', 1, 0)).toBe(500);
    expect(calculateSoloScore('easy', 2, 0)).toBe(475);
    expect(calculateSoloScore('medium', 4, 0)).toBe(725);
  });

  it('discounts each hint by 50', () => {
    expect(calculateSoloScore('medium', 1, 1)).toBe(750);
    expect(calculateSoloScore('medium', 1, 2)).toBe(700);
  });

  it('never drops below the 50 point floor', () => {
    expect(calculateSoloScore('easy', 40, 2)).toBe(50);
    expect(calculateSoloScore('hard', 60, 2)).toBe(50);
  });

  it('uses the PRD base scores', () => {
    expect(DIFFICULTY_CONFIGS.easy.baseScore).toBe(500);
    expect(DIFFICULTY_CONFIGS.medium.baseScore).toBe(800);
    expect(DIFFICULTY_CONFIGS.hard.baseScore).toBe(1200);
  });
});

describe('guess feedback', () => {
  it('detects an exact hit', () => {
    expect(calculateGuessFeedback(42, 42, 1, 100)).toBe('CORRECT');
  });

  it('marks near misses as warm', () => {
    // 12% of 99 = ~12 points either side of the target
    expect(calculateGuessFeedback(55, 45, 1, 100)).toBe('HIGH');
    expect(calculateGuessFeedback(35, 45, 1, 100)).toBe('LOW');
  });

  it('marks far misses as cold', () => {
    expect(calculateGuessFeedback(90, 45, 1, 100)).toBe('TOO_HIGH');
    expect(calculateGuessFeedback(10, 45, 1, 100)).toBe('TOO_LOW');
  });

  it('keeps a minimum warm window on tiny ranges', () => {
    expect(calculateGuessFeedback(6, 10, 1, 10)).toBe('LOW');
    expect(calculateGuessFeedback(5, 10, 1, 10)).toBe('TOO_LOW');
    expect(calculateGuessFeedback(14, 10, 1, 10)).toBe('HIGH');
    expect(calculateGuessFeedback(15, 10, 1, 10)).toBe('TOO_HIGH');
  });
});

describe('duel roles', () => {
  it('makes the host referee when both guess', () => {
    expect(refereeFor('BOTH_TOGETHER', 'host', 'guest')).toBe('host');
    expect(firstGuesserFor('BOTH_TOGETHER', 'host', 'guest')).toBe('host');
  });

  it('makes the guest referee when the host guesses', () => {
    expect(refereeFor('HOST_GUESSES', 'host', 'guest')).toBe('guest');
    expect(firstGuesserFor('HOST_GUESSES', 'host', 'guest')).toBe('host');
  });

  it('keeps the host as referee when the guest guesses', () => {
    expect(refereeFor('FRIEND_GUESSES', 'host', 'guest')).toBe('host');
    expect(firstGuesserFor('FRIEND_GUESSES', 'host', 'guest')).toBe('guest');
  });

  it('falls back to the host when nobody joined yet', () => {
    expect(refereeFor('HOST_GUESSES', 'host')).toBe('host');
    expect(firstGuesserFor('FRIEND_GUESSES', 'host')).toBe('host');
  });
});

describe('leaderboard periods', () => {
  it('builds ISO week keys', () => {
    expect(isoWeekKey(new Date('2026-10-23T12:00:00Z'))).toBe('2026-W43');
    expect(isoWeekKey(new Date('2026-01-01T12:00:00Z'))).toBe('2026-W01');
  });

  it('builds month keys with zero padding', () => {
    expect(monthKey(new Date('2026-10-23T12:00:00Z'))).toBe('2026-10');
    expect(monthKey(new Date('2026-03-02T12:00:00Z'))).toBe('2026-03');
  });

  it('rolls over on UTC boundaries, not device-local midnight', () => {
    expect(isoWeekKey(new Date('2026-10-25T23:59:59Z'))).toBe('2026-W43');
    expect(isoWeekKey(new Date('2026-10-26T00:00:00Z'))).toBe('2026-W44');
    expect(monthKey(new Date('2026-10-31T23:59:59Z'))).toBe('2026-10');
    expect(monthKey(new Date('2026-11-01T00:00:00Z'))).toBe('2026-11');
  });

  it('writes the same match to three boards', () => {
    const keys = periodKeys(new Date('2026-10-23T12:00:00Z'));
    expect(keys.map((k) => k.key)).toEqual(['2026-W43', '2026-10', 'allTime']);
  });

  it('covers current and recent boards when an account is deleted', () => {
    const keys = cleanupPeriodKeys(new Date('2026-10-23T12:00:00Z'), 4, 2);
    expect(keys).toContain('2026-W43');
    expect(keys).toContain('2026-W42');
    expect(keys).toContain('2026-10');
    expect(keys).toContain('2026-09');
    expect(keys).toContain('allTime');
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('idempotency keys', () => {
  it('is stable per solo round', () => {
    expect(soloMatchId('u1', 1234)).toBe(soloMatchId('u1', 1234));
    expect(soloMatchId('u1', 1234)).not.toBe(soloMatchId('u1', 1235));
  });

  it('is stable per duel round and player', () => {
    expect(duelMatchId('room_A', 'r1', 'u1')).toBe(duelMatchId('room_A', 'r1', 'u1'));
    expect(duelMatchId('room_A', 'r1', 'u1')).not.toBe(duelMatchId('room_A', 'r2', 'u1'));
  });
});
