import { Router, type IRouter } from "express";
import { playerStats, onlinePlayers } from "../lib/store";
import {
  GetOnlinePlayersResponse,
  GetPlayerStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/players/online", async (_req, res): Promise<void> => {
  res.json(GetOnlinePlayersResponse.parse(onlinePlayers));
});

router.get("/players/stats", async (_req, res): Promise<void> => {
  const sorted = [...playerStats].sort((a, b) => b.kills - a.kills);
  res.json(GetPlayerStatsResponse.parse(sorted));
});

export default router;
