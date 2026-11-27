import { Controller } from 'react-hook-form';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { FormField } from '@/components/FormField';
import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { CheckedLinkCard } from '@/features/watches/components/CheckedLinkCard';
import { useAddLink } from '@/features/watches/hooks/useAddLink';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function AddLinkScreen() {
  const { url: paramUrl } = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const { control, errors, checked, errMsg, isChecking, isConfirming, submitCheck, confirmWatch } =
    useAddLink(paramUrl);

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
      >
        <Masthead title={t('add.linkTitle')} />

        <View
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.ruleSubtle,
            borderWidth: theme.borders.hairline,
            borderRadius: theme.radii.md,
            padding: theme.spacing.lg,
          }}
        >
          <Controller
            control={control}
            name="url"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label={t('add.urlLabel')}
                placeholder={t('add.urlPlaceholder')}
                keyboardType="url"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.url?.message}
              />
            )}
          />

          <NewspaperButton
            disabled={isChecking}
            icon="search-outline"
            label={isChecking ? t('common.loading') : t('add.checkUrl')}
            onPress={submitCheck}
          />
        </View>

        {errMsg ? (
          <Text
            style={[
              typeScale.caption,
              {
                color: theme.colors.accent,
                fontFamily: fonts.bodyMedium,
                marginTop: theme.spacing.md,
              },
            ]}
          >
            {errMsg}
          </Text>
        ) : null}

        <CheckedLinkCard
          checked={checked}
          theme={theme}
          fonts={fonts}
          t={t}
          isConfirming={isConfirming}
          onConfirm={confirmWatch}
        />
      </ScrollView>
    </ScreenShell>
  );
}
