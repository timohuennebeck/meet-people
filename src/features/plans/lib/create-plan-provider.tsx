import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { AgeRange } from '@shared/components/age-range-control';
import type { JoinMode, Place } from '@shared/data/schemas';
import { inAnHour } from '@shared/lib/datetime';

/**
 * Everything the seven create steps collect, before any of it is a row.
 *
 * Each step used to hold its own answer in `useState`, which meant the answers
 * did not survive a step — the "when" screen could not name the place chosen
 * one screen earlier, and nothing reached the end to be published. This is the
 * one place a plan under construction lives.
 */
export interface PlanDraft {
  title: string;
  /** The whole place, not its id: the "when" step names it in its subtitle. */
  place: Place | null;
  startsAt: Date;
  /** Null is "Sem hora de fim" — a plan with a start and no end. */
  durationMinutes: number | null;
  joinMode: JoinMode;
  languages: string[];
  /** Null is an uncapped event: no seat grid, no waitlist, open join only. */
  seats: number | null;
  /** Null leaves the plan open to every age the host's own filter allows. */
  ageRange: AgeRange | null;
}

interface CreatePlanValue {
  draft: PlanDraft;
  /** Merges one step's answer into the draft. */
  set: (patch: Partial<PlanDraft>) => void;
  /** Empties the draft, so the next "+" starts a plan rather than resuming one. */
  reset: () => void;
}

function emptyDraft(): PlanDraft {
  return {
    title: '',
    place: null,
    startsAt: inAnHour(),
    durationMinutes: 120,
    joinMode: 'open',
    // What a plan is held in unless the host says otherwise — the shortlist on
    // step 5 opens on these, so they have to be the draft's value too, or an
    // untouched step would publish a plan in no language at all.
    languages: [...DEFAULT_LANGUAGES],
    seats: 4,
    ageRange: null,
  };
}

/** The languages a new plan is held in until its host changes them. */
export const DEFAULT_LANGUAGES = ['pt', 'en'] as const;

const CreatePlanContext = createContext<CreatePlanValue | null>(null);

export function CreatePlanProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<PlanDraft>(emptyDraft);

  const set = useCallback(
    (patch: Partial<PlanDraft>) => setDraft((current) => ({ ...current, ...patch })),
    [],
  );
  const reset = useCallback(() => setDraft(emptyDraft()), []);

  const value = useMemo<CreatePlanValue>(() => ({ draft, set, reset }), [draft, set, reset]);

  return <CreatePlanContext.Provider value={value}>{children}</CreatePlanContext.Provider>;
}

export function useCreatePlan(): CreatePlanValue {
  const context = useContext(CreatePlanContext);
  if (!context) throw new Error('useCreatePlan must be used inside a CreatePlanProvider');
  return context;
}
