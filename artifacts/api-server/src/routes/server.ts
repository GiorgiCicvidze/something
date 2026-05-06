import { Router, type IRouter } from "express";
import { queryMinecraftServer } from "../lib/minecraft";
import { serverSettings } from "../lib/store";
import { GetServerStatusResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const SERVER_HOST = "play.eternalhardcore.xyz";

router.get("/server/status", async (req, res): Promise<void> => {
  const status = await queryMinecraftServer(SERVER_HOST);

  const payload = {
    online: status.online,
    playerCount: status.playerCount,
    maxPlayers: status.maxPlayers,
    latencyMs: status.latencyMs,
    motd: serverSettings.motd || status.motd,
    statusOverride: serverSettings.statusOverride,
  };

  res.json(GetServerStatusResponse.parse(payload));
});

export default router;
