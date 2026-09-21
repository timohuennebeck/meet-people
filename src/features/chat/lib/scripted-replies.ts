import { LEA, PHIL, SARA } from '@shared/data/fixtures';

/**
 * The canned replies the design plays back after the user sends a message, so
 * the prototype's conversations stay demonstrable. They are replaced by the
 * realtime subscription once Supabase channels are wired up.
 */

export interface ScriptedReply {
  authorId: string;
  body: string;
  /** Delay before the typing indicator appears, in ms. */
  typingAfter: number;
  /** Delay before the reply lands, in ms. */
  replyAfter: number;
}

const DIRECT_BODIES = ['Combinado.', 'Levo água extra caso precise.', 'Até amanhã na ponte!'];

const GROUP_REPLIES = [
  { authorId: LEA.id, body: 'Anotado aqui.' },
  { authorId: PHIL.id, body: 'Eu vou de bike, posso levar as mochilas.' },
  { authorId: 'u-mara-other', body: 'Se chover a gente corre mesmo assim, né?' },
];

/** The next reply in the 1:1 thread, cycling through the script. */
export function nextDirectReply(index: number): ScriptedReply {
  return {
    authorId: SARA.id,
    body: DIRECT_BODIES[index % DIRECT_BODIES.length]!,
    typingAfter: 650,
    replyAfter: 1900,
  };
}

/** The next reply in the group thread, cycling through the script. */
export function nextGroupReply(index: number): ScriptedReply {
  const reply = GROUP_REPLIES[index % GROUP_REPLIES.length]!;
  return { ...reply, typingAfter: 700, replyAfter: 2100 };
}
