/**
 * The faces the design draws on the two screens that illustrate rather than
 * report.
 *
 * The welcome screen's plan cards and avatar stack, and the radius map's
 * "people near you" dots, show sample people: nobody is signed in on the first,
 * and the second is a diagram of a distance, not a list of neighbours. The
 * design sources them from picsum with stable seeds, so keeping the seeds keeps
 * the faces identical to the export.
 *
 * Everywhere else a face belongs to somebody, and comes from their profile.
 */
const portrait = (seed: string, size = 300) => `https://picsum.photos/seed/${seed}/${size}/${size}`;

export const PORTRAITS = {
  lea: portrait('chat-lea'),
  phil: portrait('host-jonas'),
  sara: portrait('p-sara'),
  noah: portrait('req-noah'),
  pinRun: portrait('pin-lauf', 600),
  pinCoffee: portrait('pin-kaffee', 600),
} as const;
