import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';

export function useAskKhabri() {
  const { t } = useTranslation();
  const [scope, setScope] = useState('all');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [remaining, setRemaining] = useState(10);
  const [error, setError] = useState('');

  const watchesQuery = useQuery({
    queryKey: ['watches'],
    queryFn: api.getWatches,
  });

  const askMutation = useMutation({
    mutationFn: (q) => api.askKhabri({ scope, question: q }),
    onSuccess: (data, q) => {
      setError('');
      setRemaining(data.remainingToday ?? 0);
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', text: q },
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: data.answer,
          citations: data.citations || [],
        },
      ]);
      setQuestion('');
    },
    onError: (err) => setError(err?.message || t('common.errorGeneric')),
  });

  return {
    scope,
    setScope,
    question,
    setQuestion,
    messages,
    remaining,
    error,
    watches: watchesQuery.data?.watches ?? [],
    isSending: askMutation.isPending,
    sendQuestion: () => askMutation.mutate(question.trim()),
  };
}
