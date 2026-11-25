import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

export async function shareKhabarCardImage(viewShotRef, card) {
  const sourceUrl = card?.evidence?.[0]?.url || card?.source?.url || '';
  const fallbackText =
    `${card?.source?.name || 'Khabri'}\n${card?.after || ''}\n${sourceUrl}`.trim();

  if (Platform.OS !== 'web' && viewShotRef?.current?.capture) {
    const uri = await viewShotRef.current.capture();
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: card?.source?.name || 'Khabri Card',
      });
      return;
    }
  }

  await Share.share({ message: fallbackText });
}
