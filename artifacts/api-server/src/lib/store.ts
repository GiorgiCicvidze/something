export interface PlayerStatRecord {
  username: string;
  kills: number;
  deaths: number;
  playtimeMinutes: number;
  featured: boolean;
  avatarUrl: string;
}

export interface ServerSettingsRecord {
  motd: string;
  statusOverride: string | null;
  featuredPlayers: string[];
}

export const serverSettings: ServerSettingsRecord = {
  motd: "Welcome to EternalHardcore — One life. No mercy.",
  statusOverride: null,
  featuredPlayers: ["critz_1", "ItzZaDucky"],
};

export const playerStats: PlayerStatRecord[] = [
  {
    username: "critz_1",
    kills: 347,
    deaths: 2,
    playtimeMinutes: 14820,
    featured: true,
    avatarUrl: "https://mc-heads.net/avatar/critz_1",
  },
  {
    username: "ItzZaDucky",
    kills: 289,
    deaths: 5,
    playtimeMinutes: 12400,
    featured: true,
    avatarUrl: "https://mc-heads.net/avatar/ItzZaDucky",
  },
  {
    username: "VoidWalker99",
    kills: 203,
    deaths: 18,
    playtimeMinutes: 8900,
    featured: false,
    avatarUrl: "https://mc-heads.net/avatar/VoidWalker99",
  },
  {
    username: "NightBlade_X",
    kills: 178,
    deaths: 23,
    playtimeMinutes: 7200,
    featured: false,
    avatarUrl: "https://mc-heads.net/avatar/NightBlade_X",
  },
  {
    username: "ObsidianFury",
    kills: 154,
    deaths: 31,
    playtimeMinutes: 6540,
    featured: false,
    avatarUrl: "https://mc-heads.net/avatar/ObsidianFury",
  },
  {
    username: "ShadowReaper",
    kills: 122,
    deaths: 47,
    playtimeMinutes: 5800,
    featured: false,
    avatarUrl: "https://mc-heads.net/avatar/ShadowReaper",
  },
  {
    username: "IronVeil",
    kills: 95,
    deaths: 62,
    playtimeMinutes: 4320,
    featured: false,
    avatarUrl: "https://mc-heads.net/avatar/IronVeil",
  },
  {
    username: "LavaBorn",
    kills: 67,
    deaths: 89,
    playtimeMinutes: 3100,
    featured: false,
    avatarUrl: "https://mc-heads.net/avatar/LavaBorn",
  },
];

export const onlinePlayers = [
  {
    username: "critz_1",
    uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    avatarUrl: "https://mc-heads.net/avatar/critz_1",
  },
  {
    username: "ItzZaDucky",
    uuid: "b2c3d4e5-f6a7-8901-bcde-f01234567891",
    avatarUrl: "https://mc-heads.net/avatar/ItzZaDucky",
  },
  {
    username: "VoidWalker99",
    uuid: "c3d4e5f6-a7b8-9012-cdef-012345678902",
    avatarUrl: "https://mc-heads.net/avatar/VoidWalker99",
  },
];
