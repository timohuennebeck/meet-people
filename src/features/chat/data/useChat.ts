import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { VIEWER } from '@shared/data/fixtures';
import { chatKeys } from '@shared/data/queryKeys';
import type { Message } from '@shared/data/schemas';
import { dataSource } from '@shared/data/source';

/** The conversations list shown on the Chats tab. */
export function useConversations() {
  return useQuery({
    ...chatKeys.conversations(),
    queryFn: () => dataSource.chats.conversations(),
  });
}

/** Messages in one thread. */
export function useThread(conversationId: string) {
  return useQuery({
    ...chatKeys.thread(conversationId),
    queryFn: () => dataSource.chats.thread(conversationId),
  });
}

/**
 * Sends a message. The bubble appears the instant it is sent, marked `pending`,
 * and is reconciled when the write lands — a dropped send rolls the thread back
 * rather than leaving a bubble that was never delivered.
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const key = chatKeys.thread(conversationId).queryKey;

  return useMutation({
    mutationFn: (body: string) => dataSource.chats.send(conversationId, body),
    onMutate: async (body: string) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Message[]>(key) ?? [];
      const optimistic: Message = {
        id: `pending-${Date.now()}`,
        conversationId,
        authorId: VIEWER.id,
        body,
        createdAt: new Date().toISOString(),
        receipt: 'Enviada',
        pending: true,
      };
      // The design only shows a receipt under the newest own message.
      queryClient.setQueryData<Message[]>(key, [
        ...previous.map((message) => ({ ...message, receipt: undefined })),
        optimistic,
      ]);
      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations().queryKey });
    },
  });
}

/**
 * Appends an incoming message. Stands in for the realtime subscription that
 * will replace it once Supabase channels are wired up.
 */
export function useReceiveMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ authorId, body }: { authorId: string; body: string }) =>
      dataSource.chats.receive(conversationId, authorId, body),
    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(chatKeys.thread(conversationId).queryKey, (previous) => [
        ...(previous ?? []),
        message,
      ]);
    },
  });
}
