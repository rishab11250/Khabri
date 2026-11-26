import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Text, View } from 'react-native';
import { authenticateBiometrics } from '../lib/biometrics';
import { useSettingsStore } from '../store/settings';
import { getFontFamilies, typeScale } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import { NewspaperButton } from './NewspaperButton';

export function AppLockModal() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);
  const isLocked = useSettingsStore((s) => s.isLocked);
  const unlock = useSettingsStore((s) => s.unlock);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUnlock = useCallback(async () => {
    setErrorMsg('');
    const ok = await authenticateBiometrics(t('lock.prompt'));
    if (ok) {
      unlock();
    } else {
      setErrorMsg(t('lock.failed'));
    }
  }, [t, unlock]);

  useEffect(() => {
    if (appLockEnabled && isLocked) {
      handleUnlock();
    }
  }, [appLockEnabled, isLocked, handleUnlock]);

  if (!appLockEnabled || !isLocked) {
    return null;
  }

  return (
    <Modal visible transparent={false} animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing.xl,
        }}
      >
        <View
          style={{
            borderWidth: theme.borders.double,
            borderColor: theme.colors.rule,
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.card,
            width: '100%',
            maxWidth: 380,
            alignItems: 'center',
            gap: theme.spacing.md,
          }}
        >
          <View
            style={{
              borderWidth: theme.borders.hairline,
              borderColor: theme.colors.accent,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: 2,
            }}
          >
            <Text
              style={[
                typeScale.caption,
                { color: theme.colors.accent, fontFamily: fonts.bodyBold },
              ]}
            >
              {t('lock.badge')}
            </Text>
          </View>

          <Text
            style={[
              typeScale.masthead,
              { color: theme.colors.ink, fontFamily: fonts.headline, textAlign: 'center' },
            ]}
          >
            {t('app.name')}
          </Text>

          <Text
            style={[
              typeScale.body,
              { color: theme.colors.muted, fontFamily: fonts.body, textAlign: 'center' },
            ]}
          >
            {t('lock.subtitle')}
          </Text>

          {errorMsg ? (
            <Text
              style={[
                typeScale.caption,
                { color: theme.colors.accent, fontFamily: fonts.bodyMedium, textAlign: 'center' },
              ]}
            >
              {errorMsg}
            </Text>
          ) : null}

          <View style={{ width: '100%', marginTop: theme.spacing.sm }}>
            <NewspaperButton label={t('lock.unlockBtn')} onPress={handleUnlock} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
