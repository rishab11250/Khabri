import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { StepBar } from '@/components/StepBar';
import { INDIAN_STATES } from '@/constants/india';
import { useOnboardingState } from '@/features/settings/hooks/useOnboarding';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function OnboardingStateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const {
    language,
    selectedState,
    selectState,
    detecting,
    statusMessage,
    detectLocation,
    handleContinue,
  } = useOnboardingState();
  const fonts = getFontFamilies(language);

  return (
    <ScreenShell>
      <StepBar step={2} />

      <Text style={[typeScale.masthead, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
        {t('onboarding.stateTitle')}
      </Text>
      <Text
        style={[
          typeScale.body,
          {
            color: theme.colors.muted,
            fontFamily: fonts.body,
            marginTop: theme.spacing.xs,
            marginBottom: theme.spacing.md,
          },
        ]}
      >
        {t('onboarding.stateSubtitle')}
      </Text>

      <NewspaperButton
        variant="card"
        icon="locate-outline"
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
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, marginVertical: theme.spacing.md }}
        renderItem={({ item }) => {
          const active = selectedState === item;
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => selectState(item)}
              style={{
                backgroundColor: theme.colors.card,
                borderColor: active ? theme.colors.accent : theme.colors.ruleSubtle,
                borderWidth: active ? theme.borders.double : theme.borders.hairline,
                borderRadius: theme.radii.sm,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
                marginBottom: theme.spacing.xs,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 50,
              }}
            >
              <Text
                style={[
                  typeScale.body,
                  { color: theme.colors.ink, fontFamily: active ? fonts.bodyBold : fonts.body },
                ]}
              >
                {item === 'All India' ? t('onboarding.allIndia') : item}
              </Text>
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={active ? theme.colors.accent : theme.colors.muted}
              />
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
          <NewspaperButton label={t('common.continue')} onPress={handleContinue} />
        </View>
      </View>
    </ScreenShell>
  );
}
