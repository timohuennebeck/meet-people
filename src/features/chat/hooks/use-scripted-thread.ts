import { useCallback, useEffect, useRef, useState } from 'react';

import { hasSupabase } from '@shared/lib/env';

import { useReceiveMessage, useSendMessage } from '../data/use-chat';
import type { ScriptedReply } from '../lib/scripted-replies';

export interface ScriptedThread {
  draft: string;
  setDraft: (value: string) => void;
  /** The author currently typing, or null. */
  typingAuthorId: string | null;
  /** Sends the draft, or the given text when a quick reply is tapped. */
  send: (text?: string) => void;
}

/**
 * Drives one conversation: sends the user's message, then plays the scripted
 * reply back with a typing pause in between.
 *
 * The playback is the fixture source's alone. Against a real project
 * `useReceiveMessage` writes nothing — a reply arrives on the `messages`
 * Realtime publication, not from the recipient's own client — so scheduling it
 * there would raise a typing indicator for someone who is not in the
 * conversation and then deliver nothing. Sending still works either way; only
 * the scripted half is skipped.
 *
 * Timers are cleared on unmount so a reply cannot land after the screen is
 * gone, and the reply index lives in a ref so each send advances the script
 * without re-rendering.
 */
export function useScriptedThread(
  conversationId: string,
  nextReply: (index: number) => ScriptedReply,
): ScriptedThread {
  const [draft, setDraft] = useState('');
  // Tagged with the conversation it belongs to, so switching threads in place
  // derives an empty indicator during render rather than clearing it in an
  // effect a frame later.
  const [typing, setTyping] = useState<{ conversationId: string; authorId: string } | null>(null);
  const typingAuthorId = typing?.conversationId === conversationId ? typing.authorId : null;

  const replyIndex = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  /** Replies still in flight; the indicator clears only when the last one lands. */
  const pending = useRef(0);

  const { mutate: sendMessage } = useSendMessage(conversationId);
  const { mutate: receiveMessage } = useReceiveMessage(conversationId);

  // Keyed on the conversation, so switching threads in place starts its script
  // from the top rather than inheriting the previous thread's position.
  useEffect(() => {
    const scheduled = timers.current;
    replyIndex.current = 0;
    pending.current = 0;
    return () => {
      scheduled.forEach(clearTimeout);
      scheduled.clear();
    };
  }, [conversationId]);

  const schedule = useCallback((delay: number, run: () => void) => {
    const handle = setTimeout(() => {
      timers.current.delete(handle);
      run();
    }, delay);
    timers.current.add(handle);
  }, []);

  const send = useCallback(
    (text?: string) => {
      const body = (text ?? draft).trim();
      if (!body) return;

      sendMessage(body);
      setDraft('');

      if (hasSupabase) return;

      const reply = nextReply(replyIndex.current);
      replyIndex.current += 1;
      pending.current += 1;

      schedule(reply.typingAfter, () => setTyping({ conversationId, authorId: reply.authorId }));
      schedule(reply.replyAfter, () => {
        pending.current -= 1;
        // Only the last reply in flight clears the indicator, so a second send
        // does not switch it off while its own reply is still coming.
        if (pending.current === 0) setTyping(null);
        receiveMessage({ authorId: reply.authorId, body: reply.body });
      });
    },
    [conversationId, draft, nextReply, receiveMessage, schedule, sendMessage],
  );

  return { draft, setDraft, typingAuthorId, send };
}
