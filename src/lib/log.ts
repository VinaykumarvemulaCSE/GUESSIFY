/**
 * Development-only logging. Production builds stay silent so we never ship
 * debug chatter or leak internal state into logcat.
 */
function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export const log = {
  info(tag: string, ...args: unknown[]): void {
    if (isDev()) console.log(`[${tag}]`, ...args);
  },
  warn(tag: string, ...args: unknown[]): void {
    if (isDev()) console.warn(`[${tag}]`, ...args);
  },
};
