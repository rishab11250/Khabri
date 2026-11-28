/**
 * Polls device network reachability via `expo-network` for offline banner and queue replay triggers.
 */
import * as Network from 'expo-network';
import { useEffect, useState } from 'react';

/**
 * Tracks whether the device has an active reachable internet connection (`true` fallback on check failure).
 *
 * @returns {boolean} True when connected and reachable.
 */
export function useOnline() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkNetwork() {
      try {
        const state = await Network.getNetworkStateAsync();
        if (mounted) {
          setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
        }
      } catch {
        // Fallback: assume online
      }
    }

    checkNetwork();
    const interval = setInterval(checkNetwork, 4000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return isOnline;
}
