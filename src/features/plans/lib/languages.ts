import { PEOPLE, VIEWER } from '@shared/data/fixtures';

/**
 * How well a language covers the people around the viewer.
 *
 * "Falado por 8 de 10 por perto" is the only reason the create step's language
 * list is more than a set of flags: it says what picking English actually costs
 * or buys. The number therefore has to come from the same people the rest of
 * the app shows, never from a constant that would quietly stop being true.
 *
 * Nearby is modelled as the people directory minus the viewer — "por perto" is
 * other people, and counting yourself would inflate every row by one. When this
 * reads from Supabase it becomes a query over `profile_languages` within the
 * viewer's radius; the two numbers this module exposes stay the same shape.
 */
const NEARBY = Object.values(PEOPLE).filter((person) => person.id !== VIEWER.id);

/** How many people are near enough to count, i.e. the "de M" in the line. */
export const NEARBY_PEOPLE = NEARBY.length;

/** How many of them list `code` among the languages they speak. */
export function nearbySpeakers(code: string): number {
  return NEARBY.filter((person) => person.languages.some((spoken) => spoken.code === code)).length;
}
