import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { z } from 'zod';
import { FormField } from '../../src/components/FormField';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function AddLinkScreen() {
  const { url: paramUrl } = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const queryClient = useQueryClient();
  const [checked, setChecked] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const schema = z.object({
    url: z.string().trim().url(t('add.invalidUrl')),
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { url: typeof paramUrl === 'string' ? paramUrl : '' },
  });

  useEffect(() => {
    if (typeof paramUrl === 'string' && paramUrl) {
      setValue('url', paramUrl);
    }
  }, [paramUrl, setValue]);

  const checkMutation = useMutation({
    mutationFn: (values) => api.intakeLink({ url: values.url }),
    onSuccess: (data) => {
      setErrMsg('');
      setChecked(data);
    },
    onError: (err) => setErrMsg(err?.message || t('common.errorGeneric')),
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      checked.supported
        ? api.createWatch({ sourceId: checked.source.id, createdVia: 'link' })
        : api.createWatch({
            searchQuery: checked.suggestedQuery,
            title: checked.source.name,
            createdVia: 'search',
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      router.replace('/(tabs)/watching');
    },
    onError: (err) => setErrMsg(err?.message || t('common.errorGeneric')),
  });

  return (
    <ScreenShell>
      <View style={{ marginBottom: theme.spacing.md }}>
        <NewspaperButton
          variant="secondary"
          label={t('common.back')}
          onPress={() => router.back()}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
        <Text
          style={[
            typeScale.title,
            { color: theme.colors.ink, fontFamily: fonts.headline, marginBottom: theme.spacing.lg },
          ]}
        >
          {t('add.linkTitle')}
        </Text>

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
          disabled={checkMutation.isPending}
          label={checkMutation.isPending ? t('common.loading') : t('add.checkUrl')}
          onPress={handleSubmit((v) => checkMutation.mutate(v))}
        />

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

        {checked ? (
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.rule,
              borderWidth: theme.borders.hairline,
              padding: theme.spacing.lg,
              marginTop: theme.spacing.lg,
              gap: theme.spacing.sm,
            }}
          >
            <Text
              style={[typeScale.section, { color: theme.colors.ink, fontFamily: fonts.bodyBold }]}
            >
              {checked.source.name}
            </Text>
            <Text
              style={[typeScale.caption, { color: theme.colors.muted, fontFamily: fonts.body }]}
            >
              {checked.supported
                ? `${checked.source.type} · ${checked.source.trust}`
                : t('add.jsUnsupported')}
            </Text>
            {checked.preview ? (
              <Text
                numberOfLines={4}
                style={[typeScale.caption, { color: theme.colors.ink, fontFamily: fonts.body }]}
              >
                {checked.preview}
              </Text>
            ) : null}
            <NewspaperButton
              disabled={confirmMutation.isPending}
              label={checked.supported ? t('add.confirmWatch') : t('add.confirmSearchWatch')}
              onPress={() => confirmMutation.mutate()}
            />
          </View>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}
