import { PEOPLE, VIEWER } from '@shared/data/fixtures';
import { hasSupabase } from '@shared/lib/env';

/**
 * How well a language covers the people around the viewer.
 *
 * "Falado por 8 de 10 por perto" is the only reason the create step's language
 * list is more than a set of flags: it says what picking English actually costs
 * or buys. The number therefore has to come from the same people the rest of
 * the app shows, never from a constant that would quietly stop being true.
 *
 * Nearby is modelled as the people directory minus the viewer — "por perto" is
 * other people, and counting yourself would inflate every row by one.
 *
 * Against a real project there is no query for this yet: `nearby_plans` finds
 * plans within the radius, and nothing finds *people* within it. So this
 * answers `null` there rather than reporting the fixture cast as if it were the
 * neighbourhood, and the row simply carries no detail line. The shape is what a
 * `nearby_language_reach` function would return, so wiring one up is a change
 * to this function and to nothing else.
 */
const NEARBY = Object.values(PEOPLE).filter((person) => person.id !== VIEWER.id);

export interface LanguageReach {
  /** How many people nearby list this language among the ones they speak. */
  speakers: number;
  /** How many people are near enough to count, i.e. the "de M" in the line. */
  total: number;
}

export function nearbyLanguageReach(code: string): LanguageReach | null {
  if (hasSupabase) return null;
  return {
    speakers: NEARBY.filter((person) => person.languages.some((spoken) => spoken.code === code))
      .length,
    total: NEARBY.length,
  };
}
