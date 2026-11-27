import { Text, View } from 'react-native';
import { NewspaperButton } from '@/components/NewspaperButton';
import { getCategoryColor } from '@/features/watches/categoryColor';
import { typeScale } from '@/theme/typography';

export function CatalogSourceRow({ item, existingWatch, theme, fonts, t, isToggling, onToggle }) {
  const catColor = getCategoryColor(item.category, theme);

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: existingWatch ? theme.colors.neem : theme.colors.ruleSubtle,
        borderWidth: theme.borders.hairline,
        borderRadius: theme.radii.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: theme.spacing.xs,
          }}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: catColor,
            }}
          />
          <Text style={[typeScale.caption, { color: catColor, fontFamily: fonts.bodyBold }]}>
            {item.category || 'notice'}
          </Text>
          <Text style={[typeScale.caption, { color: theme.colors.muted }]}>· {item.state}</Text>
          {item.isDemo ? (
            <View
              style={{
                backgroundColor: theme.colors.haldiSoft,
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: theme.radii.xs,
              }}
            >
              <Text
                style={[
                  typeScale.caption,
                  { color: theme.colors.haldi, fontFamily: fonts.bodyBold },
                ]}
              >
                {t('discover.demoBadge')}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.headlineSemi }]}
        >
          {item.name}
        </Text>
      </View>
      <NewspaperButton
        size="sm"
        variant={existingWatch ? 'secondary' : 'primary'}
        icon={existingWatch ? 'checkmark' : 'add'}
        disabled={isToggling}
        label={existingWatch ? t('discover.following') : t('discover.follow')}
        onPress={() => onToggle(item, existingWatch)}
      />
    </View>
  );
}
