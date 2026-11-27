import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useAddPhoto } from '@/features/watches/hooks/useAddPhoto';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function AddPhotoScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const { cameraRef, permission, requestPermission, busy, error, capturePhoto, pickFromGallery } =
    useAddPhoto();

  return (
    <ScreenShell>
      <View style={{ alignItems: 'flex-start', marginBottom: theme.spacing.md }}>
        <NewspaperButton
          size="sm"
          variant="card"
          icon="arrow-back"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>

      <Masthead title={t('add.photoTitle')} subtitle={t('add.photoSubtitle')} />

      <View
        style={{
          flex: 1,
          borderColor: theme.colors.ruleSubtle,
          borderWidth: theme.borders.hairline,
          borderRadius: theme.radii.lg,
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
          <View style={{ padding: theme.spacing.xl, gap: theme.spacing.md, alignItems: 'center' }}>
            <Text
              style={[
                typeScale.body,
                { color: theme.colors.ink, fontFamily: fonts.body, textAlign: 'center' },
              ]}
            >
              {t('add.cameraPermissionText')}
            </Text>
            <NewspaperButton
              icon="camera-outline"
              label={t('add.allowCamera')}
              onPress={requestPermission}
            />
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
            icon="camera"
            disabled={busy}
            label={busy ? t('add.scanningPhoto') : t('add.capturePhoto')}
            onPress={capturePhoto}
          />
        ) : null}
        <NewspaperButton
          variant="card"
          icon="images-outline"
          disabled={busy}
          label={t('add.pickGallery')}
          onPress={pickFromGallery}
        />
      </View>
    </ScreenShell>
  );
}
