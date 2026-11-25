import { useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { useSessionStore } from '../../src/store/session';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function AddPhotoScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const setPhotoResult = useSessionStore((s) => s.setPhotoResult);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const scanAsset = async (asset) => {
    setBusy(true);
    setError('');
    try {
      const data = await api.intakePhoto(asset);
      setPhotoResult(data);
      router.push('/add/result');
    } catch (err) {
      setError(err?.message || t('common.errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) {
      await scanAsset({ uri: photo.uri, mimeType: 'image/jpeg', fileName: 'notice.jpg' });
    }
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]) {
      await scanAsset(res.assets[0]);
    }
  };

  return (
    <ScreenShell>
      <View style={{ marginBottom: theme.spacing.md }}>
        <NewspaperButton
          variant="secondary"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>

      <Text style={[typeScale.title, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
        {t('add.photoTitle')}
      </Text>
      <Text
        style={[
          typeScale.caption,
          { color: theme.colors.muted, fontFamily: fonts.body, marginBottom: theme.spacing.md },
        ]}
      >
        {t('add.photoSubtitle')}
      </Text>

      <View
        style={{
          flex: 1,
          borderColor: theme.colors.rule,
          borderWidth: theme.borders.hairline,
          backgroundColor: theme.colors.card,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}
      >
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={{ width: '100%', height: '100%' }} facing="back" />
        ) : (
          <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
            <Text style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.body }]}>
              {t('add.cameraPermissionText')}
            </Text>
            <NewspaperButton label={t('add.allowCamera')} onPress={requestPermission} />
          </View>
        )}
      </View>

      {error ? (
        <Text
          style={[
            typeScale.caption,
            {
              color: theme.colors.accent,
              fontFamily: fonts.bodyMedium,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}

      <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}>
        {permission?.granted ? (
          <NewspaperButton
            disabled={busy}
            label={busy ? t('add.scanningPhoto') : t('add.capturePhoto')}
            onPress={capturePhoto}
          />
        ) : null}
        <NewspaperButton
          variant="secondary"
          disabled={busy}
          label={t('add.pickGallery')}
          onPress={pickFromGallery}
        />
      </View>
    </ScreenShell>
  );
}
