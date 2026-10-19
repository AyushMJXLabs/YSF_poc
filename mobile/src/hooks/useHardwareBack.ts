import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/**
 * Routes the Android hardware back button to a screen's own back logic
 * (e.g. detail view → list → home) instead of closing the app.
 *
 * The handler should return true when it handled the press. Listeners are
 * called newest-first, so a mounted screen runs before the app-level fallback.
 */
export function useHardwareBack(handler: () => boolean, enabled: boolean = true) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => ref.current());
    return () => sub.remove();
  }, [enabled]);
}
