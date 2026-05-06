import { logger } from "./logger";

interface MinecraftServerStatus {
  online: boolean;
  playerCount: number;
  maxPlayers: number;
  latencyMs: number | null;
  motd: string;
}

export async function queryMinecraftServer(
  host: string
): Promise<MinecraftServerStatus> {
  try {
    const start = Date.now();
    const response = await fetch(`https://api.mcsrvstat.us/2/${host}`, {
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - start;

    if (!response.ok) {
      return {
        online: false,
        playerCount: 0,
        maxPlayers: 0,
        latencyMs: null,
        motd: "",
      };
    }

    const data = (await response.json()) as {
      online?: boolean;
      players?: { online?: number; max?: number };
      motd?: { clean?: string[] };
    };

    if (!data.online) {
      return {
        online: false,
        playerCount: 0,
        maxPlayers: 0,
        latencyMs: null,
        motd: "",
      };
    }

    const motdLines = data.motd?.clean ?? [];
    const motd = motdLines.join(" ").trim();

    return {
      online: true,
      playerCount: data.players?.online ?? 0,
      maxPlayers: data.players?.max ?? 20,
      latencyMs,
      motd,
    };
  } catch (err) {
    logger.warn({ err }, "Failed to query Minecraft server");
    return {
      online: false,
      playerCount: 0,
      maxPlayers: 0,
      latencyMs: null,
      motd: "",
    };
  }
}
