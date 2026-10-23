import { useCallback, useEffect } from 'react';
import { Alert, BackHandler } from 'react-native';

/**
 * Intercepts Android hardware back while `when` is true.
 *
 * Expo Router's stack normally pops on back; this handler is registered after
 * the navigator mounts, so it runs first and asks before the screen is lost.
 */
export function useLeaveGuard(
  when: boolean,
  title: string,
  message: string,
  onLeave: () => void
) {
  const handler = useCallback(() => {
    if (!when) return false;
    Alert.alert(title, message, [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: onLeave },
    ]);
    return true;
  }, [when, title, message, onLeave]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [handler]);
}
