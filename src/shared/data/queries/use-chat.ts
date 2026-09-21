import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { chats } from '@shared/data/api/chats';
import { useViewerId } from '@shared/data/queries/use-viewer';
import { chatKeys } from '@shared/data/query-keys';
import type { Message } from '@shared/data/schemas';
import { i18n } from '@shared/i18n';

/** The conversations list shown on the Chats tab. */
export function useConversations() {
  return useQuery({
    ...chatKeys.conversations(),
    queryFn: () => chats.conversations(),
  });
}

/** Unread messages across every conversation — the tab badge and "3 novas". */
export function useUnreadCount(): number {
  const { data: conversations } = useConversations();
  return (conversations ?? []).reduce((total, conversation) => total + conversation.unreadCount, 0);
}

/**
 * Opens a plan's group chat.
 *
 * The chat is made by `private.open_plan()` on the plan's own insert, so
 * this is a lookup rather than a create — and a plan that predates that
 * trigger answers `null`, which leaves the button doing nothing rather than
 * navigating to a thread that is not there.
 */
export function useOpenPlanChat() {
  return useMutation({
    mutationFn: (planId: string) => chats.planConversation(planId),
  });
}

/** Messages in one thread. */
export function useThread(conversationId: string) {
  return useQuery({
    ...chatKeys.thread(conversationId),
    queryFn: () => chats.thread(conversationId),
  });
}

/**
 * Delivers every message anybody sends to this person, wherever they are in
 * the app.
 *
 * `public.messages` is in the `supabase_realtime` publication and has been
 * since the schema was written; nothing was listening. Mounted once, at the
 * root — one channel rather than one per open thread, because the Chats badge
 * has to move whether or not the thread is on screen, and replication is
 * already filtered by the table's read policy.
 *
 * An arrival is appended into its thread's cache rather than invalidating it:
 * a refetch would drop an optimistic bubble that has not come back from its own
 * insert yet. The conversations list *is* invalidated, since the preview, the
 * ordering and the unread count all move with it.
 */
export function useChatInbox() {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      chats.subscribeToMessages((message) => {
        queryClient.setQueryData<Message[]>(
          chatKeys.thread(message.conversationId).queryKey,
          (previous) => {
            // Nothing cached means the thread has not been opened; there is no
            // list to add to, and opening it will fetch this message anyway.
            if (!previous) return previous;
            // The sender receives their own insert back. It is already in the
            // cache under the server's id by then, so this is the same message
            // arriving twice rather than two messages.
            if (previous.some((candidate) => candidate.id === message.id)) return previous;
            return [...previous, message];
          },
        );

        void queryClient.invalidateQueries({ queryKey: chatKeys.conversations().queryKey });
      }),
    [queryClient],
  );
}

/**
 * Marks a thread read once it is on screen.
 *
 * `conversation_list.unread_count` counts messages newer than the viewer's
 * `last_read_at`, and nothing was writing that column — so the tab badge and
 * "3 novas" only ever counted up, however much of the conversation had been
 * read. Fired on open and again whenever a new message lands while the thread
 * is the screen in front of the reader.
 */
export function useMarkRead(conversationId: string, messageCount: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    void chats
      .markRead(conversationId)
      .then(() => {
        if (cancelled) return;
        void queryClient.invalidateQueries({ queryKey: chatKeys.conversations().queryKey });
      })
      .catch((error: unknown) => console.warn('[chat] Could not mark the thread read:', error));

    return () => {
      cancelled = true;
    };
  }, [conversationId, messageCount, queryClient]);
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
    mutationFn: (userId: string) => chats.openDirect(userId),
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
    mutationFn: (body: string) => chats.send(conversationId, body),
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
