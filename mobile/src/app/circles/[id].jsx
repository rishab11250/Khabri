import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { Masthead } from '@/components/Masthead';
import { NewspaperButton } from '@/components/NewspaperButton';
import { ScreenShell } from '@/components/ScreenShell';
import { CircleShareActions } from '@/features/circles/components/CircleShareActions';
import { CircleWatchesAndMembers } from '@/features/circles/components/CircleWatchesAndMembers';
import { useCircleDetail } from '@/features/circles/hooks/useCircleDetail';
import { getFontFamilies, typeScale } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const {
    circle,
    userWatches,
    isLoading,
    queryError,
    copied,
    contacts,
    error,
    copyInviteCode,
    shareInvite,
    pickContacts,
    isAddingWatch,
    addWatch,
    removeMember,
  } = useCircleDetail(id);

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

      {isLoading || !circle ? (
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
            {queryError || t('common.loading')}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: theme.spacing.xxl, gap: theme.spacing.md }}
        >
          <Masthead
            title={circle.name}
            subtitle={t('circles.inviteCode', { code: circle.inviteCode })}
            eyebrowRight={`${circle.memberCount}/30`}
          />

          <CircleShareActions
            theme={theme}
            fonts={fonts}
            t={t}
            copied={copied}
            contacts={contacts}
            error={error}
            onCopyCode={copyInviteCode}
            onShareInvite={shareInvite}
            onPickContacts={pickContacts}
          />

          <CircleWatchesAndMembers
            circle={circle}
            userWatches={userWatches}
            theme={theme}
            fonts={fonts}
            t={t}
            isAddingWatch={isAddingWatch}
            onAddWatch={addWatch}
            onRemoveMember={removeMember}
          />
        </ScrollView>
      )}
    </ScreenShell>
  );
}
