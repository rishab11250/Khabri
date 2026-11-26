import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

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
