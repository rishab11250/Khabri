/**
 * Consumes cached photo-scan proposals and subscribes users via catalog, probed link, or search watch.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '@/lib/api';
import { useSessionStore } from '@/store/session';

/**
 * Screen state hook powering proposal confirmation after scanning a notice photo (`add/result`).
 *
 * @returns {object} Extracted fields, watch proposals, confirmation mutation, and error message.
 */
export function usePhotoResult() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const photoResult = useSessionStore((s) => s.photoResult);
  const setPhotoResult = useSessionStore((s) => s.setPhotoResult);
  const [error, setError] = useState('');

  const confirmMutation = useMutation({
    mutationFn: async (proposal) => {
      if (proposal.kind === 'catalog') {
        return api.createWatch({
          sourceId: proposal.sourceId,
          title: proposal.title,
          createdVia: 'photo',
        });
      }
      if (proposal.kind === 'link') {
        const intake = await api.intakeLink({ url: proposal.url, title: proposal.title });
        if (intake.supported) {
          return api.createWatch({ sourceId: intake.source.id, createdVia: 'photo' });
        }
        return api.createWatch({
          searchQuery: intake.suggestedQuery || proposal.title,
          title: proposal.title,
          createdVia: 'search',
        });
      }
      return api.createWatch({
        searchQuery: proposal.query,
        title: proposal.title,
        createdVia: 'search',
      });
    },
    onSuccess: () => {
      setPhotoResult(null);
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      router.replace('/(tabs)/watching');
    },
    onError: (err) => setError(err?.message || t('common.errorGeneric')),
  });

  return {
    extracted: photoResult?.extracted,
    proposals: photoResult?.proposals ?? [],
    error,
    isConfirming: confirmMutation.isPending,
    confirmProposal: (proposal) => confirmMutation.mutate(proposal),
  };
}
