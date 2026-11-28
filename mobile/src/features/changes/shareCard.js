/**
 * Captures a KhabarCard snapshot via `react-native-view-shot` on native devices or falls back to text share.
 */
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

function buildFallbackShareText(card) {
  const sourceUrl = card?.evidence?.[0]?.url || card?.source?.url || '';
  const sourceName = card?.source?.name || 'Khabri';
  const summary = card?.after || '';
  return `${sourceName}\n${summary}\n${sourceUrl}`.trim();
}

async function tryShareNativeSnapshot(viewShotRef, dialogTitle) {
  if (Platform.OS === 'web' || !viewShotRef?.current?.capture) {
    return false;
  }
  const uri = await viewShotRef.current.capture();
  if (!(await Sharing.isAvailableAsync())) {
    return false;
  }
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle });
  return true;
}

/**
 * Shares a PNG screenshot of `card` rendered inside `viewShotRef`, or shares formatted notice text on web.
 *
 * @param {import('react').RefObject} viewShotRef - Ref pointing to the mounted `ViewShot` wrapper.
 * @param {object} card - Change card object used for dialog title and text fallback.
 * @returns {Promise<void>}
 */
export async function shareKhabarCardImage(viewShotRef, card) {
  const dialogTitle = card?.source?.name || 'Khabri Card';
  if (await tryShareNativeSnapshot(viewShotRef, dialogTitle)) {
    return;
  }
  await Share.share({ message: buildFallbackShareText(card) });
}
