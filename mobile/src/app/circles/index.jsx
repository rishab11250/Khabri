import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { CircleRow } from '@/features/circles/components/CircleRow';
import { CreateCircleCard } from '@/features/circles/components/CreateCircleCard';
import { useCirclesList } from '@/features/circles/hooks/useCirclesList';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function CirclesIndexScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const {
    name,
    setName,
    error,
    circles,
    isLoading,
    isRefetching,
    refetch,
    isCreating,
    createCircle,
  } = useCirclesList();

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

      <Masthead title={t('circles.title')} subtitle={t('circles.subtitle')} />

      <CreateCircleCard
        theme={theme}
        t={t}
        name={name}
        onChangeName={setName}
        error={error}
        isCreating={isCreating}
        onCreate={createCircle}
        onOpenJoin={() => router.push('/circles/join')}
      />

      <FlatList
        data={circles}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={theme.colors.accent}
          />
        }
        renderItem={({ item }) => (
          <CircleRow
            item={item}
            theme={theme}
            fonts={fonts}
            t={t}
            onPress={() => router.push(`/circles/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.ruleSubtle,
              borderWidth: theme.borders.hairline,
              borderRadius: theme.radii.md,
              padding: theme.spacing.lg,
            }}
          >
            <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
              {isLoading ? t('common.loading') : t('circles.empty')}
            </Text>
          </View>
        }
      />
    </ScreenShell>
  );
}
