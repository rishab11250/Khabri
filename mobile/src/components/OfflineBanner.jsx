import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useOnline } from '@/hooks/useOnline';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export function OfflineBanner() {
  const isOnline = useOnline();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);

  if (isOnline) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: theme.colors.haldi,
        borderColor: theme.colors.rule,
        borderBottomWidth: theme.borders.hairline,
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          backgroundColor: theme.colors.accent,
        }}
      />
      <Text
        style={[
          typeScale.caption,
          {
            color: theme.colors.haldiInk,
            fontFamily: fonts.bodyBold,
          },
        ]}
      >
        {t('common.offlineBanner')}
      </Text>
    </View>
  );
}
