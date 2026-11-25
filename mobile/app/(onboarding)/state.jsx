import { useState } from 'react';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { INDIAN_STATES, matchIndianState } from '../../src/constants/india';
import { useSessionStore } from '../../src/store/session';
import { useSettingsStore } from '../../src/store/settings';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function OnboardingStateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);
  const { onboardingDraft, updateOnboardingDraft } = useSessionStore();
  const [detecting, setDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const selectedState = onboardingDraft.state ?? 'All India';

  const detectLocation = async () => {
    setDetecting(true);
    setStatusMessage('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStatusMessage(t('onboarding.locationUnavailable'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const matched = matchIndianState(places[0]?.region);
      if (matched) {
        updateOnboardingDraft({ state: matched });
        setStatusMessage(t('onboarding.locationSuccess', { state: matched }));
      } else {
        setStatusMessage(t('onboarding.locationUnavailable'));
      }
    } catch {
      setStatusMessage(t('onboarding.locationUnavailable'));
    } finally {
      setDetecting(false);
    }
  };

  return (
    <ScreenShell>
      <Text
        style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.bodyMedium }]}
      >
        {t('onboarding.stepIndicator', { step: 2 })}
      </Text>
      <Text
        style={[
          typeScale.masthead,
          { color: theme.colors.ink, fontFamily: fonts.headline, marginTop: theme.spacing.xs },
        ]}
      >
        {t('onboarding.stateTitle')}
      </Text>
      <Text
        style={[
          typeScale.body,
          {
            color: theme.colors.muted,
            fontFamily: fonts.body,
            marginTop: theme.spacing.sm,
            marginBottom: theme.spacing.md,
          },
        ]}
      >
        {t('onboarding.stateSubtitle')}
      </Text>

      <NewspaperButton
        variant="secondary"
        disabled={detecting}
        label={detecting ? t('onboarding.detectingLocation') : t('onboarding.detectLocation')}
        onPress={detectLocation}
      />

      {statusMessage ? (
        <Text
          style={[
            typeScale.caption,
            { color: theme.colors.neel, fontFamily: fonts.bodyMedium, marginTop: theme.spacing.sm },
          ]}
        >
          {statusMessage}
        </Text>
      ) : null}

      <FlatList
        data={INDIAN_STATES}
        keyExtractor={(item) => item}
        style={{ flex: 1, marginVertical: theme.spacing.md }}
        renderItem={({ item }) => {
          const active = selectedState === item;
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => updateOnboardingDraft({ state: item })}
              style={{
                backgroundColor: active ? theme.colors.accent : theme.colors.card,
                borderColor: theme.colors.ruleSubtle,
                borderWidth: theme.borders.hairline,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.md,
                marginBottom: theme.spacing.xs,
              }}
            >
              <Text
                style={[
                  typeScale.body,
                  {
                    color: active ? theme.colors.onAccent : theme.colors.ink,
                    fontFamily: active ? fonts.bodyBold : fonts.body,
                  },
                ]}
              >
                {item === 'All India' ? t('onboarding.allIndia') : item}
              </Text>
            </Pressable>
          );
        }}
      />

      <View
        style={{ flexDirection: 'row', gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}
      >
        <View style={{ flex: 1 }}>
          <NewspaperButton
            variant="secondary"
            label={t('common.back')}
            onPress={() => router.back()}
          />
        </View>
        <View style={{ flex: 2 }}>
          <NewspaperButton
            label={t('common.continue')}
            onPress={() => router.push('/(onboarding)/interests')}
          />
        </View>
      </View>
    </ScreenShell>
  );
}
