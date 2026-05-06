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

export const playerStats: PlayerStatRecord[] = [];

export const onlinePlayers: Array<{ username: string; uuid: string; avatarUrl: string }> = [];
