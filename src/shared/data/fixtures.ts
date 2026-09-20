import type {
  Conversation,
  Message,
  Place,
  Plan,
  Preferences,
  SpokenLanguage,
  User,
} from './schemas';

/**
 * Sample content, transcribed from the design export so every screen renders
 * the same names, copy and imagery as the mockups.
 *
 * The design sources its placeholder portraits from picsum with stable seeds;
 * keeping those seeds means the faces match the export exactly. They are
 * replaced by real uploads once plans and profiles carry storage.
 */
const portrait = (seed: string, size = 300) => `https://picsum.photos/seed/${seed}/${size}/${size}`;

export const AVATARS = {
  viewer: portrait('me-avatar'),
  phil: portrait('host-jonas'),
  sara: portrait('p-sara'),
  mara: portrait('chat-mara'),
  maraProfile: portrait('p-mara'),
  lea: portrait('chat-lea'),
  jonas: portrait('chat-jonas'),
  ana: portrait('chat-lea-2'),
  noah: portrait('req-noah'),
  elif: portrait('req-elif'),
  tom: portrait('req-tom'),
  pinRun: portrait('pin-lauf', 600),
  pinCoffee: portrait('pin-kaffee', 600),
} as const;

const GERMAN: SpokenLanguage = { code: 'de', flag: 'de' };
const ENGLISH: SpokenLanguage = { code: 'en', flag: 'gb' };

export const VIEWER: User = {
  id: 'u-viewer',
  name: 'Mara',
  age: 24,
  avatarUrl: AVATARS.viewer,
  verified: true,
  neighbourhood: 'Lissabon',
  countryCode: 'es',
  pronouns: 'she',
  interests: ['Corrida', 'Cinema', 'Café'],
  languages: [GERMAN, ENGLISH],
  joinedAt: '2026-03-01T00:00:00.000Z',
};

export const PHIL: User = {
  id: 'u-phil',
  name: 'Phil',
  age: 23,
  avatarUrl: AVATARS.phil,
  verified: true,
  neighbourhood: 'Kreuzberg',
  interests: ['Jogos', 'Café'],
  languages: [GERMAN, ENGLISH],
  joinedAt: '2026-03-01T00:00:00.000Z',
};

export const SARA: User = {
  id: 'u-sara',
  name: 'Sara',
  age: 24,
  avatarUrl: AVATARS.sara,
  verified: true,
  neighbourhood: 'Kreuzberg',
  countryCode: 'es',
  bio: 'Faço xadrez ruim e corro devagar, mas apareço sempre. Prefiro planos de semana à noite.',
  interests: ['Corrida', 'Cinema', 'Café'],
  languages: [GERMAN, ENGLISH],
  joinedAt: '2026-03-01T00:00:00.000Z',
  attendanceRate: 98,
  plansCount: 14,
  sharedPlansCount: 2,
};

export const LEA: User = {
  id: 'u-lea',
  name: 'Lea',
  age: 27,
  avatarUrl: AVATARS.lea,
  verified: true,
  neighbourhood: 'Friedrichshain',
  interests: ['Corrida'],
  languages: [GERMAN],
  joinedAt: '2026-02-01T00:00:00.000Z',
};

export const NOAH: User = {
  id: 'u-noah',
  name: 'Noah',
  age: 21,
  avatarUrl: AVATARS.noah,
  verified: true,
  neighbourhood: 'Mitte',
  interests: ['Jogos'],
  languages: [GERMAN],
  joinedAt: '2026-04-01T00:00:00.000Z',
};

export const ELIF: User = {
  id: 'u-elif',
  name: 'Elif',
  age: 24,
  avatarUrl: AVATARS.elif,
  verified: true,
  neighbourhood: 'Neukölln',
  interests: ['Jogos', 'Café'],
  languages: [GERMAN, ENGLISH],
  joinedAt: '2026-01-01T00:00:00.000Z',
};

export const TOM: User = {
  id: 'u-tom',
  name: 'Tom',
  age: 19,
  avatarUrl: AVATARS.tom,
  verified: false,
  neighbourhood: 'Neukölln',
  interests: ['Jogos'],
  languages: [GERMAN],
  joinedAt: '2026-05-01T00:00:00.000Z',
};

export const CAFE_KOTTI: Place = {
  id: 'p-kotti',
  name: 'Café Kotti',
  address: 'Blutenburgstr. 96',
  distanceLabel: '400 m',
};

export const RECENT_PLACES: Place[] = [
  CAFE_KOTTI,
  {
    id: 'p-tempelhof',
    name: 'Tempelhofer Feld',
    address: 'Portão Oderstr.',
    distanceLabel: '1,1 mi',
  },
];

export const NEARBY_PLACES: Place[] = [
  {
    id: 'p-goerlitzer',
    name: 'Parque Görlitzer',
    address: 'Entrada norte',
    distanceLabel: '900 m',
  },
  {
    id: 'p-kottbusser',
    name: 'Kottbusser Tor (metrô)',
    address: 'Estação',
    distanceLabel: '450 m',
  },
];

/**
 * The games plan at Café Kotti. It is the plan every guest and host sheet in
 * the design walks through, so the fixture carries requests and a waitlist even
 * though a given state only shows some of them.
 */
export const GAME_PLAN: Plan = {
  id: 'plan-kotti',
  title: 'Tarde de jogos no Café Kotti',
  description: 'Partidas tranquilas, todos os níveis são bem-vindos. Levo dois tabuleiros.',
  joinMode: 'approval',
  membership: 'guest',
  host: PHIL,
  place: CAFE_KOTTI,
  whenLabel: 'Hoje 19:00–21:00 · Blutenburgstr. 96',
  startsAt: '2026-09-20T19:00:00.000Z',
  durationMinutes: 120,
  capacity: 4,
  participants: [
    { user: PHIL, isHost: true, isViewer: false },
    { user: SARA, isHost: false, isViewer: false },
  ],
  requests: [
    {
      id: 'r-noah',
      planId: 'plan-kotti',
      user: NOAH,
      message: 'Jogo há 2 anos, sou nova em Berlim',
      status: 'pending',
      createdAt: '2026-09-20T09:10:00.000Z',
    },
    {
      id: 'r-elif',
      planId: 'plan-kotti',
      user: ELIF,
      note: 'Já participou de 3 planos',
      status: 'pending',
      createdAt: '2026-09-20T09:20:00.000Z',
    },
    {
      id: 'r-tom',
      planId: 'plan-kotti',
      user: TOM,
      note: 'Ainda não verificado',
      status: 'pending',
      createdAt: '2026-09-20T09:30:00.000Z',
    },
  ],
  waitlist: [
    {
      id: 'w-tom',
      planId: 'plan-kotti',
      user: TOM,
      note: 'Entra se alguém desistir',
      status: 'pending',
      createdAt: '2026-09-20T10:00:00.000Z',
    },
  ],
  ageRange: null,
  pin: { x: 236, y: 365 },
};

export const RUN_PLAN: Plan = {
  id: 'plan-run',
  title: 'Corrida leve de 3 mi no canal',
  joinMode: 'approval',
  membership: 'guest',
  host: LEA,
  place: {
    id: 'p-koenigsplatz',
    name: 'Königsplatz',
    address: 'Königsplatz',
    distanceLabel: '0,5 mi',
  },
  whenLabel: 'Hoje, 18:30',
  startsAt: '2026-09-20T18:30:00.000Z',
  durationMinutes: 60,
  capacity: 6,
  participants: [
    { user: LEA, isHost: true, isViewer: false },
    { user: SARA, isHost: false, isViewer: false },
    { user: NOAH, isHost: false, isViewer: false },
  ],
  requests: [],
  waitlist: [],
  ageRange: null,
  pin: { x: 88, y: 250 },
  pinLabel: 'Corrida 3 mi',
};

/** The host's own walk, used for the freshly-published host sheet. */
export const WALK_PLAN: Plan = {
  id: 'plan-walk',
  title: 'Caminhada em volta do Schlachtensee',
  joinMode: 'approval',
  membership: 'host',
  host: VIEWER,
  place: {
    id: 'p-schlachtensee',
    name: 'S Schlachtensee',
    address: 'S Schlachtensee',
    distanceLabel: '2,4 mi',
  },
  whenLabel: 'Sáb, 12 de set · 10:00 · S Schlachtensee',
  startsAt: '2026-09-12T10:00:00.000Z',
  durationMinutes: 120,
  capacity: 5,
  participants: [{ user: VIEWER, isHost: true, isViewer: true }],
  requests: [],
  waitlist: [],
  ageRange: null,
  pin: { x: 40, y: 372 },
};

export const COFFEE_PLAN: Plan = {
  id: 'plan-coffee',
  title: 'Café no domingo',
  joinMode: 'open',
  membership: 'guest',
  host: ELIF,
  place: { id: 'p-cafe', name: 'Café Luzia', address: 'Oranienstr. 34', distanceLabel: '600 m' },
  whenLabel: 'Domingo, 10:00',
  startsAt: '2026-09-21T10:00:00.000Z',
  durationMinutes: 90,
  capacity: 4,
  participants: [{ user: ELIF, isHost: true, isViewer: false }],
  requests: [],
  waitlist: [],
  ageRange: null,
  pin: { x: 318, y: 190 },
};

export const PLANS: Plan[] = [RUN_PLAN, GAME_PLAN, WALK_PLAN, COFFEE_PLAN];

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'c-run',
    kind: 'group',
    title: 'Corrida 3 mi · Kanal',
    avatarUrls: [AVATARS.lea, AVATARS.phil],
    extraMembers: 4,
    preview: 'Lea: Encontro na ponte às 18h50',
    timeLabel: '9:24',
    unreadCount: 2,
    memberCount: 6,
    onlineCount: 3,
  },
  {
    id: 'c-mara',
    kind: 'direct',
    title: 'Tarde de jogos no Café Kotti',
    avatarUrls: [AVATARS.mara],
    preview: 'Mara enviou uma foto',
    timeLabel: '8:10',
    unreadCount: 1,
    memberCount: 2,
    onlineCount: 1,
    online: true,
  },
  {
    id: 'c-volei',
    kind: 'group',
    title: 'Vôlei no Tempelhof',
    avatarUrls: [AVATARS.jonas, AVATARS.noah],
    extraMembers: 5,
    preview: 'Você: Levo a bola',
    timeLabel: 'Ontem',
    unreadCount: 0,
    memberCount: 7,
    onlineCount: 1,
  },
  {
    id: 'c-cinema',
    kind: 'direct',
    title: 'Cinema ao ar livre',
    avatarUrls: [AVATARS.phil],
    preview: 'Tom: Alguém pega cobertor?',
    timeLabel: 'Seg',
    unreadCount: 0,
    memberCount: 2,
    onlineCount: 0,
  },
  {
    id: 'c-breakfast',
    kind: 'direct',
    title: 'Café da manhã domingo',
    avatarUrls: [AVATARS.ana],
    preview: 'Ana: Bora às 10?',
    timeLabel: 'Seg',
    unreadCount: 0,
    memberCount: 2,
    onlineCount: 0,
  },
  {
    id: 'c-lake',
    kind: 'group',
    title: 'Caminhada no lago',
    avatarUrls: [AVATARS.tom, AVATARS.elif],
    extraMembers: 3,
    preview: 'Você: Até sábado!',
    timeLabel: 'Dom',
    unreadCount: 0,
    memberCount: 5,
    onlineCount: 0,
  },
];

/** The 1:1 thread with Sara, exactly as scripted in the design. */
export const DIRECT_MESSAGES: Message[] = [
  {
    id: 'm1',
    conversationId: 'c-mara',
    authorId: SARA.id,
    body: 'Oi! Vi que você entrou na corrida de amanhã.',
    createdAt: '2026-09-20T09:20:00.000Z',
  },
  {
    id: 'm2',
    conversationId: 'c-mara',
    authorId: VIEWER.id,
    body: 'Entrei sim. Você vai desde o começo?',
    createdAt: '2026-09-20T09:21:00.000Z',
  },
  {
    id: 'm3',
    conversationId: 'c-mara',
    authorId: SARA.id,
    body: 'Vou. Encontro na ponte às 18h50?',
    createdAt: '2026-09-20T09:23:00.000Z',
  },
  {
    id: 'm4',
    conversationId: 'c-mara',
    authorId: VIEWER.id,
    body: 'Perfeito, te vejo lá.',
    createdAt: '2026-09-20T09:24:00.000Z',
    receipt: 'Visto 9:24',
  },
];

/** The group thread for the run, exactly as scripted in the design. */
export const GROUP_MESSAGES: Message[] = [
  {
    id: 'g1',
    conversationId: 'c-run',
    authorId: LEA.id,
    body: 'Rota nova hoje: ponte, canal e volta pelo parque.',
    createdAt: '2026-09-20T09:00:00.000Z',
  },
  {
    id: 'g2',
    conversationId: 'c-run',
    authorId: PHIL.id,
    body: 'Boa. Ritmo tranquilo?',
    createdAt: '2026-09-20T09:02:00.000Z',
  },
  {
    id: 'g3',
    conversationId: 'c-run',
    authorId: LEA.id,
    body: 'Uns 6 min/km, ninguém fica para trás.',
    createdAt: '2026-09-20T09:04:00.000Z',
  },
  {
    id: 'g4',
    conversationId: 'c-run',
    authorId: VIEWER.id,
    body: 'Fechado, levo a bola pro depois.',
    createdAt: '2026-09-20T09:06:00.000Z',
    receipt: 'Visto por 4',
  },
  {
    id: 'g5',
    conversationId: 'c-run',
    authorId: 'u-mara-other',
    body: 'Chego direto do trabalho, 18h55 no máximo.',
    createdAt: '2026-09-20T09:08:00.000Z',
  },
];

/** Everyone who can author a message, keyed by id for quick bubble lookups. */
export const PEOPLE: Record<string, User> = {
  [VIEWER.id]: VIEWER,
  [PHIL.id]: PHIL,
  [SARA.id]: SARA,
  [LEA.id]: LEA,
  [NOAH.id]: NOAH,
  [ELIF.id]: ELIF,
  [TOM.id]: TOM,
  'u-mara-other': { ...VIEWER, id: 'u-mara-other', name: 'Mara', avatarUrl: AVATARS.mara },
};

export const DEFAULT_PREFERENCES: Preferences = {
  radius: 2,
  distanceUnit: 'mi',
  ageRange: [21, 34],
  audienceGender: 'everyone',
  interests: ['Corrida', 'Cinema', 'Café'],
  spokenLanguages: [GERMAN, ENGLISH],
  appLanguage: 'pt-BR',
  notificationsEnabled: true,
};

/** People search results for the query "sara", as shown in the design. */
export const SEARCH_RESULTS: { user: User; detail: string }[] = [
  { user: SARA, detail: 'Kreuzberg · 2 planos em comum' },
  {
    user: { ...ELIF, id: 'u-sara-m', name: 'Sara M.', age: 29 },
    detail: 'Neukölln · 1 plano em comum',
  },
  {
    user: { ...NOAH, id: 'u-sarah', name: 'Sarah', age: 21, verified: false },
    detail: 'Mitte · sem planos em comum',
  },
];

export const RECENT_SEARCHES: { user: User; detail: string }[] = [
  { user: LEA, detail: 'Friedrichshain · 3 planos em comum' },
  { user: PHIL, detail: 'Kreuzberg · anfitrião de 2 planos' },
  { user: TOM, detail: 'Neukölln · 1 plano em comum' },
];
