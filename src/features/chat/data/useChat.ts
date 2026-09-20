import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { chatKeys } from '@shared/data/queryKeys';
import type { Message } from '@shared/data/schemas';
import { dataSource } from '@shared/data/source';
import { useViewerId } from '@shared/data/useViewer';
import { i18n } from '@shared/i18n';

/** The conversations list shown on the Chats tab. */
export function useConversations() {
  return useQuery({
    ...chatKeys.conversations(),
    queryFn: () => dataSource.chats.conversations(),
  });
}

/** Unread messages across every conversation — the tab badge and "3 novas". */
export function useUnreadCount(): number {
  const { data: conversations } = useConversations();
  return (conversations ?? []).reduce((total, conversation) => total + conversation.unreadCount, 0);
}

/** Messages in one thread. */
export function useThread(conversationId: string) {
  return useQuery({
    ...chatKeys.thread(conversationId),
    queryFn: () => dataSource.chats.thread(conversationId),
  });
}

/**
 * Opens the direct thread with one person and resolves to its conversation id.
 *
 * Nothing is optimistic here: the id is the server's to give, and the profile
 * only navigates once it has one. A refused open comes back as a `DataError`
 * — `PLUS_REQUIRED` when the two have never sat in a plan together and the
 * viewer is not on Plus, which the profile answers with the paywall.
 */
export function useOpenDirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => dataSource.chats.openDirect(userId),
    onSuccess: () => {
      // A newly opened thread has to show up on the Chats tab.
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations().queryKey });
    },
  });
}

/** Marks an optimistic bubble, so the reconciliation below can find it again. */
const PENDING_PREFIX = 'pending-';

/**
 * Sends a message.
 *
 * The bubble appears the instant it is sent, under a temporary id, and is
 * swapped for the server's row the moment the insert returns — the id, the
 * timestamp and anything else the database decided. A dropped send rolls the
 * thread back to the snapshot rather than leaving a bubble that was never
 * delivered. This is the most visible optimistic update in the app: typing into
 * a chat and waiting for a round trip before seeing your own words is the one
 * latency nobody forgives.
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const key = chatKeys.thread(conversationId).queryKey;
  const viewerId = useViewerId();

  return useMutation({
    mutationFn: (body: string) => dataSource.chats.send(conversationId, body),
    onMutate: async (body: string) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Message[]>(key) ?? [];
      const pendingId = `${PENDING_PREFIX}${Date.now()}`;
      const optimistic: Message = {
        id: pendingId,
        conversationId,
        // Before the profile has loaded the bubble is still the viewer's; it is
        // the only message this screen can produce.
        authorId: viewerId ?? '',
        body,
        createdAt: new Date().toISOString(),
        receipt: i18n.t('chat.sent'),
      };
      // The design only shows a receipt under the newest own message.
      queryClient.setQueryData<Message[]>(key, [
        ...previous.map((message) => ({ ...message, receipt: undefined })),
        optimistic,
      ]);
      return { previous, pendingId };
    },
    onSuccess: (sent, _body, context) => {
      // Replace in place rather than appending: the refetch below is a network
      // round trip away, and until it lands the thread would show the message
      // twice.
      queryClient.setQueryData<Message[]>(key, (current) =>
        (current ?? []).map((message) => (message.id === context.pendingId ? sent : message)),
      );
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
 * Appends an incoming message.
 *
 * This plays back the design's scripted reply and exists only on the fixture
 * source; against Supabase the method writes nothing and resolves to `null`,
 * because a real reply arrives on the `messages` Realtime publication rather
 * than being invented by the recipient's own client.
 */
export function useReceiveMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ authorId, body }: { authorId: string; body: string }) =>
      dataSource.chats.receive(conversationId, authorId, body),
    onSuccess: (message) => {
      if (!message) return;
      queryClient.setQueryData<Message[]>(chatKeys.thread(conversationId).queryKey, (previous) => [
        ...(previous ?? []),
        message,
      ]);
    },
  });
}
