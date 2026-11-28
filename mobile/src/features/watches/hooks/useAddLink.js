/**
 * Manages pasted URL validation, `/v1/intake/link` probing, and watch creation on direct/SPA results.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { api } from '@/lib/api';

/**
 * Form and mutation hook powering the Add by Link screen (`add/link`).
 *
 * @param {string|string[]} paramUrl - Optional pre-populated URL from clipboard or Android share intent.
 * @returns {object} Form controls, probed link preview result, and confirmation mutation.
 */
export function useAddLink(paramUrl) {
  const { t } = useTranslation();
  const router = useRouter();
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

  return {
    control,
    errors,
    checked,
    errMsg,
    isChecking: checkMutation.isPending,
    isConfirming: confirmMutation.isPending,
    submitCheck: handleSubmit((v) => checkMutation.mutate(v)),
    confirmWatch: () => confirmMutation.mutate(),
  };
}
