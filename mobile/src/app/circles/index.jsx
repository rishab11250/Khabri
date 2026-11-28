/**
 * @file Circles hub screen listing user's shared watch groups and Circle creation card.
 */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { CircleRow } from '@/features/circles/components/CircleRow';
import { CreateCircleCard } from '@/features/circles/components/CreateCircleCard';
import { useCirclesList } from '@/features/circles/hooks/useCirclesList';
import { typeScale } from '@/theme/typography';
import { useStyles } from '@/theme/useStyles';
import { useTheme } from '@/theme/useTheme';

const createStyles = (theme, fonts) => ({
  backWrap: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  emptyBox: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.ruleSubtle,
    borderWidth: theme.borders.hairline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
  },
  emptyText: {
    ...typeScale.body,
    color: theme.colors.muted,
    fontFamily: fonts.body,
  },
});

/**
 * Renders the user's Circles list alongside inline Circle creation and join navigation.
 *
 * @returns {JSX.Element} Circles list screen.
 */
export default function CirclesIndexScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles(createStyles);
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
      <View style={styles.backWrap}>
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
          <CircleRow item={item} t={t} onPress={() => router.push(`/circles/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {isLoading ? t('common.loading') : t('circles.empty')}
            </Text>
          </View>
        }
      />
    </ScreenShell>
  );
}
