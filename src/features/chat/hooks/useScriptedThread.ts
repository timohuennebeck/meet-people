import { useCallback, useEffect, useRef, useState } from 'react';

import { useReceiveMessage, useSendMessage } from '../data/useChat';
import type { ScriptedReply } from '../lib/scriptedReplies';

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
 * Timers are cleared on unmount so a reply cannot land after the screen is
 * gone, and the reply index lives in a ref so each send advances the script
 * without re-rendering.
 */
export function useScriptedThread(
  conversationId: string,
  nextReply: (index: number) => ScriptedReply,
): ScriptedThread {
  const [draft, setDraft] = useState('');
  const [typingAuthorId, setTypingAuthorId] = useState<string | null>(null);

  const replyIndex = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { mutate: sendMessage } = useSendMessage(conversationId);
  const { mutate: receiveMessage } = useReceiveMessage(conversationId);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  const schedule = useCallback((delay: number, run: () => void) => {
    timers.current.push(setTimeout(run, delay));
  }, []);

  const send = useCallback(
    (text?: string) => {
      const body = (text ?? draft).trim();
      if (!body) return;

      sendMessage(body);
      setDraft('');

      const reply = nextReply(replyIndex.current);
      replyIndex.current += 1;

      schedule(reply.typingAfter, () => setTypingAuthorId(reply.authorId));
      schedule(reply.replyAfter, () => {
        setTypingAuthorId(null);
        receiveMessage({ authorId: reply.authorId, body: reply.body });
      });
    },
    [draft, nextReply, receiveMessage, schedule, sendMessage],
  );

  return { draft, setDraft, typingAuthorId, send };
}
