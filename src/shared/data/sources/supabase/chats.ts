import { i18n } from '@shared/i18n';
import { supabase } from '@shared/lib/supabase/client';
import { avatarUrlFor, conversationTimeLabel } from '@shared/lib/supabase/mapping';

import type { Conversation, Message } from '../../schemas';
import type { DataSource } from '../types';
import { planConversationId } from './plans';
import { client, unwrap, unwrapSingle, viewerId } from './shared';

/** Conversations, the messages in them, and the Realtime subscription. */

/**
 * How much of a conversation one read brings back. The screen scrolls to the
 * end on open, so this is the tail; older messages need a "load earlier" path
 * that does not exist yet.
 */
const THREAD_PAGE_SIZE = 100;

interface ConversationMemberJson {
  id: string;
  name: string | null;
  avatarStoragePath: string | null;
}

/**
 * A `conversation_list` row as the list renders it.
 *
 * `online` and `onlineCount` are absent from the view on purpose — presence
 * comes over Realtime and a stored boolean is wrong seconds after a connection
 * drops — so they read as nobody until that channel exists.
 */
function toConversation(row: {
  id: string | null;
  kind: string | null;
  title: string | null;
  members: unknown;
  member_count: number | null;
  preview: string | null;
  last_message_at: string | null;
  unread_count: number | null;
}): Conversation {
  const id = row.id ?? '';
  const members = (row.members ?? []) as ConversationMemberJson[];
  const avatarUrls = members.slice(0, 2).map((member) => avatarUrlFor(member.avatarStoragePath));
  const memberCount = row.member_count ?? 1;
  const extra = memberCount - avatarUrls.length;

  return {
    id,
    kind: row.kind === 'group' ? 'group' : 'direct',
    title: row.title ?? '',
    // A conversation with no other members still has to draw one avatar, and
    // there is nobody whose photo it could be — so it draws the no-photo state.
    avatarUrls: avatarUrls.length > 0 ? avatarUrls : [null],
    extraMembers: extra > 0 ? extra : undefined,
    members: members.map((member) => ({
      id: member.id,
      name: member.name ?? '',
      avatarUrl: avatarUrlFor(member.avatarStoragePath),
    })),
    preview: row.preview ?? '',
    timeLabel: conversationTimeLabel(row.last_message_at),
    unreadCount: row.unread_count ?? 0,
    memberCount,
    onlineCount: 0,
  };
}

/** A row of `messages`. */
interface MessageRow {
  id: string;
  conversation_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

/** A `messages` row as a bubble. */
function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    authorId: row.author_id,
    body: row.content,
    createdAt: row.created_at,
  };
}

/** The design puts a receipt under the newest own message and nowhere else. */
function withSentReceipt(messages: Message[], uid: string): Message[] {
  let newestOwn = -1;
  messages.forEach((message, index) => {
    if (message.authorId === uid) newestOwn = index;
  });
  if (newestOwn === -1) return messages;
  return messages.map((message, index) =>
    index === newestOwn ? { ...message, receipt: i18n.t('chat.sent') } : message,
  );
}

export const chatsSource: DataSource['chats'] = {
  conversations: async (): Promise<Conversation[]> => {
    const rows = unwrap(
      await client()
        .from('conversation_list')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false }),
    );
    return (rows ?? []).map(toConversation);
  },

  /**
   * One RPC finds or creates the thread and seats both people in it. The
   * Plus gate and the block check live in the function, so a screen only
   * has to read the `DataError` it comes back with.
   */
  openDirect: async (userId: string): Promise<string> =>
    unwrapSingle(
      await client().rpc('open_direct_conversation', { other: userId }),
      'Direct conversation',
    ),

  /**
   * Subscribes to the `messages` Realtime publication.
   *
   * `…000200_row_level_security` put `public.messages` in
   * `supabase_realtime`, and replication respects the table's read policy —
   * so this delivers only messages in conversations the viewer belongs to,
   * and needs no filter of its own. One channel covers the whole app.
   */
  subscribeToMessages: (onMessage: (message: Message) => void): (() => void) => {
    const db = supabase;
    if (!db) return () => undefined;

    const channel = db
      .channel('messages:inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) =>
        onMessage(toMessage(payload.new as MessageRow)),
      )
      .subscribe();

    return () => {
      void db.removeChannel(channel);
    };
  },

  planConversation: planConversationId,

  markRead: async (conversationId: string): Promise<void> => {
    const db = client();
    const uid = await viewerId();
    unwrap(
      await db
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('profile_id', uid),
    );
  },

  thread: async (conversationId: string): Promise<Message[]> => {
    const db = client();
    const uid = await viewerId();
    // Newest first so the limit keeps the end of the conversation rather
    // than its beginning, then reversed for the screen, which renders
    // oldest at the top. A months-old group chat would otherwise be fetched
    // whole every time it is opened.
    const rows = unwrap(
      await db
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(THREAD_PAGE_SIZE),
    );
    const messages = (rows ?? []).reverse().map(toMessage);
    return withSentReceipt(messages, uid);
  },

  send: async (conversationId: string, body: string): Promise<Message> => {
    const db = client();
    const uid = await viewerId();
    const row = unwrapSingle<MessageRow>(
      await db
        .from('messages')
        .insert({ conversation_id: conversationId, author_id: uid, content: body })
        .select('*')
        .single(),
      'Sent message',
    );
    return { ...toMessage(row), receipt: i18n.t('chat.sent') };
  },
};
