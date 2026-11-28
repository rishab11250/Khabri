/**
 * @file Notice/circular camera & gallery scanner screen feeding Gemini Vision source discovery.
 */
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useAddPhoto } from '@/features/watches/hooks/useAddPhoto';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';

const createStyles = (theme, fonts) => ({
  backWrap: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  previewBox: {
    flex: 1,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  permissionBox: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  permissionText: {
    ...typeScale.body,
    color: theme.colors.ink,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  errorText: {
    ...typeScale.caption,
    color: theme.colors.accent,
    fontFamily: fonts.bodyMedium,
    marginBottom: theme.spacing.sm,
  },
  actions: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
});

/**
 * Captures or selects an exam/notice image and submits it to `/v1/intake/photo`.
 *
 * @returns {JSX.Element} Photo intake screen.
 */
export default function AddPhotoScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useStyles(createStyles);
  const { cameraRef, permission, requestPermission, busy, error, capturePhoto, pickFromGallery } =
    useAddPhoto();

  return (
    <ScreenShell>
      <View style={styles.backWrap}>
        <NewspaperButton
          size="sm"
          variant="card"
          icon="arrow-back"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>

      <Masthead title={t('add.photoTitle')} subtitle={t('add.photoSubtitle')} />

      <View style={styles.previewBox}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        ) : (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionText}>{t('add.cameraPermissionText')}</Text>
            <NewspaperButton
              icon="camera-outline"
              label={t('add.allowCamera')}
              onPress={requestPermission}
            />
          </View>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actions}>
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
