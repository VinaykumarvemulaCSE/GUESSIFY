/**
 * Every navigable path in the app. Keeping them here means a typo is a
 * TypeScript error at the call site instead of a 404 at runtime.
 */
export const ROUTES = {
  splash: '/',
  onboarding: '/onboarding',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',

  dashboard: '/dashboard',
  leaderboard: '/leaderboard',
  history: '/history',
  profile: '/profile',
  settings: '/settings',

  difficulty: '/solo/difficulty',
  solo: '/solo/play',
  soloResult: '/solo/result',
  gameOver: '/solo/game-over',

  duel: '/duel',
  duelRoom: '/duel/room',

  rules: '/rules',
  about: '/about',
} as const;

export function duelJoinPath(code: string): `/duel/${string}` {
  return `/duel/${encodeURIComponent(code.trim().toUpperCase())}`;
}
