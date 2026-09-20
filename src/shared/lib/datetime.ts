/**
 * Dates and times, and the rules the pickers are bound by.
 *
 * Sign-up asks for a date of birth and the create flow asks when a plan starts,
 * so two features need the same arithmetic and the same locale-aware
 * formatting — which is why it lives here rather than inside either of them.
 *
 * Every `format*` helper takes the active locale (`i18n.language`) rather than
 * reading a default, so switching the interface language re-formats what is
 * already on screen.
 */

/**
 * The youngest the app accepts. The database enforces the same floor — the
 * `profiles` adult constraint checks `birthdate <= current_date - interval '18
 * years'` — so the picker must never offer a date a profile could not hold.
 */
export const MINIMUM_AGE = 18;

/** The far end of the birthday wheel; nobody signing up is older than this. */
const MAXIMUM_AGE = 100;

/**
 * The age the birthday picker opens on. The design centres its wheels on
 * 14 Mar 2002, which reads as the mid-twenties the flow is drawn for.
 */
const DEFAULT_AGE = 24;

/** The hour the create flow's second quick chip offers — `Hoje 19:00`. */
export const DEFAULT_START_HOUR = 19;

/** Midnight today, so an age never turns on the time of day. */
function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Shifts a date back by whole years, keeping the month and day. A 29 February
 * lands on 1 March in a non-leap year, which is the same rounding the age
 * arithmetic below applies.
 */
function yearsBefore(date: Date, years: number): Date {
  return new Date(date.getFullYear() - years, date.getMonth(), date.getDate());
}

/** The most recent birthdate that still clears the 18+ floor. */
export function latestBirthdate(): Date {
  return yearsBefore(startOfToday(), MINIMUM_AGE);
}

/** The oldest birthdate the picker offers. */
export function earliestBirthdate(): Date {
  return yearsBefore(startOfToday(), MAXIMUM_AGE);
}

/** The birthdate the picker starts on, before the user touches it. */
export function defaultBirthdate(): Date {
  return yearsBefore(startOfToday(), DEFAULT_AGE);
}

/** Whole years lived, counting this year's birthday only once it has passed. */
export function ageFromBirthdate(birthdate: Date): number {
  const today = startOfToday();
  const hadBirthday =
    today.getMonth() > birthdate.getMonth() ||
    (today.getMonth() === birthdate.getMonth() && today.getDate() >= birthdate.getDate());
  return today.getFullYear() - birthdate.getFullYear() - (hadBirthday ? 0 : 1);
}

/** An hour from now, on the minute — the create flow's first quick chip. */
export function inAnHour(): Date {
  const start = new Date();
  start.setHours(start.getHours() + 1, start.getMinutes(), 0, 0);
  return start;
}

/**
 * Today at the given hour. Once that hour has passed the same time tomorrow is
 * returned, so the chip never offers a start time in the past.
 */
export function todayAtHour(hour: number): Date {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0);
  if (start.getTime() <= now.getTime()) start.setDate(start.getDate() + 1);
  return start;
}

/** Whether a date falls on today's calendar day. */
export function isToday(date: Date): boolean {
  const today = startOfToday();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * How recently a date fell, as the "ontem 19:00" line under a finished plan
 * needs it. Anything older than yesterday is named by its date instead, which
 * is what `other` stands for.
 */
export function relativeDay(date: Date, now = new Date()): 'today' | 'yesterday' | 'other' {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return 'other';
}

/**
 * `2002-03-14` — what a Postgres `date` column takes.
 *
 * Built from the local parts rather than `toISOString()`, which converts to UTC
 * first and so hands back the day before for anyone west of Greenwich. A
 * birthday is a calendar day, not an instant.
 */
export function isoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `14 de março de 2002` in pt-BR, `March 14, 2002` in en. */
export function formatBirthdate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** `sex., 14 de mar.` — the day a plan starts, short enough for a row. */
export function formatPlanDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** `12 de set.` — a day without its weekday, for a plan already behind us. */
export function formatDayMonth(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

/** `19:00` where the locale is 24-hour, `7:00 PM` where it is not. */
export function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}
