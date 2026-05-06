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
  playerCount: number;
  maxPlayers: number;
  featuredPlayers: string[];
}

export const serverSettings: ServerSettingsRecord = {
  motd: "Welcome to EternalHardcore — One life. No mercy.",
  statusOverride: "online",
  playerCount: 0,
  maxPlayers: 100,
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
];

export const onlinePlayers: Array<{ username: string; uuid: string; avatarUrl: string }> = [
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
];
