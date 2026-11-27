import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Contacts from 'expo-contacts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';
import { api } from '@/lib/api';

export function useCircleDetail(id) {
  const { t } = useTranslation();
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

  return {
    circle,
    userWatches,
    isLoading: circleQuery.isLoading,
    queryError: circleQuery.error?.message,
    copied,
    contacts,
    error,
    copyInviteCode,
    shareInvite,
    pickContacts,
    isAddingWatch: addWatchMutation.isPending,
    addWatch: (sourceId) => addWatchMutation.mutate(sourceId),
    removeMember: (userId) => removeMemberMutation.mutate(userId),
  };
}
