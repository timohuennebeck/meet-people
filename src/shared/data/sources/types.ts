import type {
  Conversation,
  Membership,
  Message,
  Place,
  Plan,
  Preferences,
  ProfileView,
  SearchResults,
  User,
} from '../schemas';

/**
 * The seam the whole app reads through.
 *
 * Both sources — the design's fixtures and Supabase — are declared as this
 * type rather than inferred from their own object literals, so neither can
 * quietly grow a method the other lacks or change a signature under a screen.
 * A new method is added here first; both files then stop compiling until they
 * have it.
 */
export interface DataSource {
  plans: {
    /** Every plan the viewer may see, soonest first. */
    list(): Promise<Plan[]>;
    /** One plan, with its participants, its requests and its waitlist. */
    detail(planId: string): Promise<Plan>;
    /**
     * Moves the viewer between guest / requested / joined on a plan. `note` is
     * the message to the host that goes with a request, and means nothing on
     * any other move.
     *
     * Resolves to the plan as it now reads, or to `null` when the write landed
     * on a plan the viewer can no longer see — a refusal throws, so `null` is
     * success with nothing left to show.
     */
    setMembership(planId: string, membership: Membership, note?: string): Promise<Plan | null>;
    /** Host accepts a pending request; the applicant takes the next open seat. */
    acceptRequest(planId: string, requestId: string): Promise<Plan | null>;
    /**
     * Host turns a pending request down. This is what refunds the applicant's
     * weekly request credit — `private.request_quota_spent()` counts every row
     * that is not `declined` — so a request left to rot costs them one for good.
     */
    declineRequest(planId: string, requestId: string): Promise<Plan | null>;
  };

  users: {
    /** The signed-in user. */
    me(): Promise<User>;
    /** Somebody else's profile. */
    detail(userId: string): Promise<User>;
    /** People whose name matches the term. */
    search(term: string): Promise<SearchResults>;
    /** Recently viewed profiles, listed under the search results. */
    recent(): Promise<SearchResults>;
    /**
     * How many people looked at the viewer's own profile this week. Free to
     * everyone — it is the number the paywall is selling the names behind.
     */
    viewCount(): Promise<number>;
    /**
     * Who they were, newest first. Plus only: a free account is refused with
     * `PLUS_REQUIRED`, which is an answer the viewers screen renders as the
     * paywall rather than as an error.
     */
    viewers(): Promise<ProfileView[]>;
    /**
     * Records that the viewer opened somebody's profile.
     *
     * The server decides whether the look counts — its own profile, a blocked
     * person or a half-finished one are dropped silently — so a caller never
     * has to ask first, and never has anything to show when it resolves.
     */
    recordView(userId: string): Promise<void>;
  };

  chats: {
    /** The conversations list. */
    conversations(): Promise<Conversation[]>;
    /**
     * Marks everything in one conversation as read, up to now.
     *
     * `conversation_list.unread_count` counts messages newer than the viewer's
     * `last_read_at`, so nothing clears a badge except writing this.
     */
    markRead(conversationId: string): Promise<void>;
    /**
     * The direct thread with one person, opened if the two have none yet, as
     * its conversation id. The server decides whether the viewer may: a thread
     * with someone they have never sat in a plan with is a Plus feature and
     * refuses with `PLUS_REQUIRED`.
     */
    openDirect(userId: string): Promise<string>;
    /** Messages in one thread, oldest first. */
    thread(conversationId: string): Promise<Message[]>;
    /** Sends a message as the viewer. */
    send(conversationId: string, body: string): Promise<Message>;
    /**
     * Plays back the design's scripted reply.
     *
     * Fixtures only: against Supabase an incoming message arrives over
     * Realtime, so the method resolves to `null` and writes nothing.
     */
    receive(conversationId: string, authorId: string, body: string): Promise<Message | null>;
  };

  places: {
    /** Places the viewer has met at before, offered first in the create flow. */
    recent(): Promise<Place[]>;
    /** Suggested places near the viewer. */
    nearby(): Promise<Place[]>;
  };

  preferences: {
    /** The viewer's discovery and app preferences. */
    get(): Promise<Preferences>;
    /** Applies a patch and returns the whole record as it now stands. */
    update(patch: Partial<Preferences>): Promise<Preferences>;
  };
}
