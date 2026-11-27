import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSettingsStore } from '@/store/settings';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

const SAMJHAO_LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'gu', label: 'ગુજરાતી' },
];

export function SamjhaoSelector({ explainLang, disabled, onSelect }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fonts = getFontFamilies(language);

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text
        style={[
          typeScale.caption,
          {
            color: theme.colors.muted,
            fontFamily: fonts.bodyBold,
            marginBottom: theme.spacing.xs,
          },
        ]}
      >
        {t('card.explainIn')}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.ruleSubtle,
          borderWidth: theme.borders.hairline,
          borderRadius: theme.radii.sm,
          padding: 4,
          gap: 4,
        }}
      >
        {SAMJHAO_LANGS.map((l) => {
          const active = explainLang === l.code;
          return (
            <Pressable
              key={l.code}
              accessibilityRole="button"
              disabled={disabled}
              onPress={() => onSelect(l.code)}
              style={{
                flex: 1,
                minHeight: 40,
                borderRadius: theme.radii.xs,
                backgroundColor: active ? theme.colors.accent : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={[
                  typeScale.caption,
                  {
                    color: active ? theme.colors.onAccent : theme.colors.ink,
                    fontFamily: active ? fonts.bodyBold : fonts.bodyMedium,
                  },
                ]}
              >
                {l.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
