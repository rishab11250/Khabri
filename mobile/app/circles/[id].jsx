import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Contacts from 'expo-contacts';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Share, Text, View } from 'react-native';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const queryClient = useQueryClient();

  const [copied, setCopied] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState('');

  const circleQuery = useQuery({
    queryKey: ['circle', id],
    queryFn: () => api.getCircle(String(id)),
    enabled: Boolean(id),
  });

  const watchesQuery = useQuery({
    queryKey: ['watches'],
    queryFn: api.getWatches,
  });

  const addWatchMutation = useMutation({
    mutationFn: (sourceId) => api.addCircleWatch(String(id), sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle', id] });
      queryClient.invalidateQueries({ queryKey: ['watches'] });
    },
    onError: (err) => setError(err?.message || t('common.errorGeneric')),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => api.removeCircleMember(String(id), userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circle', id] }),
    onError: (err) => setError(err?.message || t('common.errorGeneric')),
  });

  const circle = circleQuery.data?.circle;
  const userWatches = watchesQuery.data?.watches ?? [];

  const copyInviteCode = async () => {
    if (!circle?.inviteCode) return;
    await Clipboard.setStringAsync(circle.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareInvite = async () => {
    if (!circle) return;
    await Share.share({
      message: `Join my Khabri Circle "${circle.name}" with code ${circle.inviteCode} (khabri://circles/join?code=${circle.inviteCode})`,
    });
  };

  const pickContacts = async () => {
    setError('');
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') return;
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        pageSize: 15,
      });
      setContacts(data.filter((c) => c.name));
    } catch (err) {
      setError(err?.message || t('common.errorGeneric'));
    }
  };

  return (
    <ScreenShell>
      <View style={{ marginBottom: theme.spacing.md }}>
        <NewspaperButton
          variant="secondary"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>

      {circleQuery.isLoading || !circle ? (
        <Text style={[typeScale.body, { color: theme.colors.muted, fontFamily: fonts.body }]}>
          {circleQuery.error?.message || t('common.loading')}
        </Text>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: theme.spacing.xxl, gap: theme.spacing.md }}
        >
          <Text style={[typeScale.title, { color: theme.colors.ink, fontFamily: fonts.headline }]}>
            {circle.name}
          </Text>
          <Text
            style={[
              typeScale.section,
              typeScale.tabular,
              { color: theme.colors.accent, fontFamily: fonts.bodyBold },
            ]}
          >
            {t('circles.inviteCode', { code: circle.inviteCode })}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <NewspaperButton
              variant="secondary"
              label={copied ? t('circles.copied') : t('circles.copyCode')}
              onPress={copyInviteCode}
            />
            <NewspaperButton label={t('circles.shareInvite')} onPress={shareInvite} />
            <NewspaperButton
              variant="secondary"
              label={t('circles.inviteContact')}
              onPress={pickContacts}
            />
          </View>

          {contacts.length > 0 ? (
            <View
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.rule,
                borderWidth: theme.borders.hairline,
                padding: theme.spacing.md,
                gap: theme.spacing.xs,
              }}
            >
              {contacts.slice(0, 6).map((c) => (
                <NewspaperButton
                  key={c.id}
                  variant="secondary"
                  label={`${c.name} -> ${t('circles.shareInvite')}`}
                  onPress={shareInvite}
                />
              ))}
            </View>
          ) : null}

          {error ? (
            <Text
              style={[
                typeScale.caption,
                { color: theme.colors.accent, fontFamily: fonts.bodyMedium },
              ]}
            >
              {error}
            </Text>
          ) : null}

          <Text
            style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
          >
            {t('circles.sharedWatches')}
          </Text>
          {circle.watches.map((w) => (
            <View
              key={w.id}
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.rule,
                borderWidth: theme.borders.hairline,
                padding: theme.spacing.md,
              }}
            >
              <Text
                style={[typeScale.body, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
              >
                {w.name}
              </Text>
              <Text
                style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
              >
                {w.category} · {w.state}
              </Text>
            </View>
          ))}

          {userWatches.length > 0 ? (
            <View style={{ gap: theme.spacing.xs }}>
              <Text
                style={[
                  typeScale.caption,
                  { color: theme.colors.muted, fontFamily: fonts.bodyBold },
                ]}
              >
                {t('circles.addFromWatching')}
              </Text>
              {userWatches
                .filter((uw) => !circle.watches.some((cw) => cw.id === uw.sourceId))
                .slice(0, 5)
                .map((uw) => (
                  <NewspaperButton
                    key={uw.id}
                    variant="secondary"
                    disabled={addWatchMutation.isPending}
                    label={`+ ${uw.title}`}
                    onPress={() => addWatchMutation.mutate(uw.sourceId)}
                  />
                ))}
            </View>
          ) : null}

          <Text
            style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
          >
            {t('circles.membersTitle', { count: circle.memberCount })}
          </Text>
          {circle.members.map((m) => (
            <View
              key={m.userId}
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.rule,
                borderWidth: theme.borders.hairline,
                padding: theme.spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text
                  style={[
                    typeScale.body,
                    { color: theme.colors.ink, fontFamily: fonts.bodyMedium },
                  ]}
                >
                  {m.name}
                </Text>
                <Text
                  style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
                >
                  {m.role}
                </Text>
              </View>
              {circle.role === 'owner' && m.role !== 'owner' ? (
                <NewspaperButton
                  variant="secondary"
                  label={t('watching.remove')}
                  onPress={() => removeMemberMutation.mutate(m.userId)}
                />
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </ScreenShell>
  );
}
