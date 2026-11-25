import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { FormField } from '../../src/components/FormField';
import { NewspaperButton } from '../../src/components/NewspaperButton';
import { ScreenShell } from '../../src/components/ScreenShell';
import { api } from '../../src/lib/api';
import { getFontFamilies, typeScale } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

export default function JoinCircleScreen() {
  const { code: paramCode } = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const fonts = getFontFamilies(i18n.language);
  const queryClient = useQueryClient();

  const [code, setCode] = useState(typeof paramCode === 'string' ? paramCode : '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof paramCode === 'string' && paramCode) {
      setCode(paramCode);
    }
  }, [paramCode]);

  const joinMutation = useMutation({
    mutationFn: () => api.joinCircle(code.trim().toUpperCase()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      router.replace(`/circles/${data.circle.id}`);
    },
    onError: (err) => setError(err?.message || t('common.errorGeneric')),
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
      <Text
        style={[
          typeScale.title,
          { color: theme.colors.ink, fontFamily: fonts.headline, marginBottom: theme.spacing.lg },
        ]}
      >
        {t('circles.joinTitle')}
      </Text>

      <FormField
        label={t('circles.codeLabel')}
        placeholder={t('circles.codePlaceholder')}
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
        error={error}
      />

      <NewspaperButton
        disabled={joinMutation.isPending || code.trim().length < 4}
        label={joinMutation.isPending ? t('common.loading') : t('circles.joinBtn')}
        onPress={() => joinMutation.mutate()}
      />
    </ScreenShell>
  );
}
