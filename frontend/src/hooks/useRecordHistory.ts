import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recordHistory, type RecordHistoryPayload } from '@/api/history';

/**
 * Fire-and-forget record of "the user opened this article".
 * Errors are intentionally swallowed — failing to record history
 * shouldn't block the user from reading the article.
 */
export function useRecordHistory() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, RecordHistoryPayload>({
    mutationFn: recordHistory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['history'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
