import { useCallback, useState } from 'react';

import { useSendMessage } from '@shared/data/queries/use-chat';

export interface Composer {
  draft: string;
  setDraft: (value: string) => void;
  /** Sends the draft, or the given text when a quick reply is tapped. */
  send: (text?: string) => void;
}

/**
 * The composer's own state for one thread.
 *
 * Sending is optimistic in `useSendMessage`, so the field is cleared as soon as
 * the bubble is on screen rather than when the insert returns. Whitespace is
 * not a message.
 */
export function useComposer(conversationId: string): Composer {
  const [draft, setDraft] = useState('');
  const { mutate: sendMessage } = useSendMessage(conversationId);

  const send = useCallback(
    (text?: string) => {
      const body = (text ?? draft).trim();
      if (!body) return;
      sendMessage(body);
      setDraft('');
    },
    [draft, sendMessage],
  );

  return { draft, setDraft, send };
}
