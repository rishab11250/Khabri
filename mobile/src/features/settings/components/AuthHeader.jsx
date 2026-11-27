import { Text, View } from 'react-native';
import { Kabootar } from '@/components/Kabootar';
import { SegmentedOptionBar } from '@/features/settings/components/SegmentedOptionBar';
import { SETTINGS_LANGUAGES } from '@/features/settings/constants';
import { typeScale } from '@/theme/typography';

export function AuthHeader({ language, onSelectLanguage, theme, fonts, t }) {
  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.lg,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[typeScale.masthead, { color: theme.colors.ink, fontFamily: fonts.headline }]}
          >
            {t('app.name')}
          </Text>
          <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
            {t('auth.subtitle')}
          </Text>
        </View>
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: theme.colors.card,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Kabootar size={40} flap />
        </View>
      </View>

      <SegmentedOptionBar
        options={SETTINGS_LANGUAGES.map((l) => ({ key: l.code, label: l.label }))}
        value={language}
        onSelect={onSelectLanguage}
        theme={theme}
        fonts={fonts}
        minHeight={40}
        marginBottom={theme.spacing.lg}
      />
    </>
  );
}
