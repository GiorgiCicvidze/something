import { Router, type IRouter } from "express";
import { validateAdmin } from "../lib/adminAuth";
import { serverSettings, playerStats } from "../lib/store";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminLogoutResponse,
  GetAdminMeResponse,
  GetAdminSettingsResponse,
  UpdateAdminSettingsBody,
  UpdateAdminSettingsResponse,
  GetAdminPlayersResponse,
  FeaturePlayerParams,
  FeaturePlayerResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAdmin(
  req: Parameters<Parameters<typeof router.use>[0]>[0],
  res: Parameters<Parameters<typeof router.use>[0]>[1],
  next: Parameters<Parameters<typeof router.use>[0]>[2]
): void {
  const session = (req as unknown as { session: Record<string, unknown> })
    .session;
  if (!session?.adminUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const admin = validateAdmin(parsed.data.username, parsed.data.password);
  if (!admin) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const session = (req as unknown as { session: Record<string, unknown> })
    .session;
  session.adminUser = admin;

  res.json(
    AdminLoginResponse.parse({
      success: true,
      username: admin.username,
      role: admin.role,
    })
  );
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  const sessionReq = req as unknown as {
    session: { destroy: (cb: (err: unknown) => void) => void };
  };
  sessionReq.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Error destroying session");
    }
  });
  res.json(AdminLogoutResponse.parse({ success: true }));
});

router.get("/admin/me", requireAdmin, async (req, res): Promise<void> => {
  const session = (req as unknown as { session: Record<string, unknown> })
    .session;
  const admin = session.adminUser as { username: string; role: string };
  res.json(GetAdminMeResponse.parse(admin));
});

router.get(
  "/admin/settings",
  requireAdmin,
  async (_req, res): Promise<void> => {
    res.json(GetAdminSettingsResponse.parse(serverSettings));
  }
);

router.put(
  "/admin/settings",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = UpdateAdminSettingsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    if (parsed.data.motd !== undefined) {
      serverSettings.motd = parsed.data.motd;
    }
    if (parsed.data.statusOverride !== undefined) {
      serverSettings.statusOverride = parsed.data.statusOverride ?? null;
    }
    if (parsed.data.featuredPlayers !== undefined) {
      serverSettings.featuredPlayers = parsed.data.featuredPlayers;
      for (const p of playerStats) {
        p.featured = parsed.data.featuredPlayers.includes(p.username);
      }
    }

    res.json(UpdateAdminSettingsResponse.parse(serverSettings));
  }
);

router.get(
  "/admin/players",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const sorted = [...playerStats].sort((a, b) => b.kills - a.kills);
    res.json(GetAdminPlayersResponse.parse(sorted));
  }
);

router.post(
  "/admin/players/:username/feature",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = FeaturePlayerParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const player = playerStats.find(
      (p) => p.username === params.data.username
    );
    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    player.featured = !player.featured;

    if (player.featured) {
      if (!serverSettings.featuredPlayers.includes(player.username)) {
        serverSettings.featuredPlayers.push(player.username);
      }
    } else {
      serverSettings.featuredPlayers = serverSettings.featuredPlayers.filter(
        (u) => u !== player.username
      );
    }

    res.json(FeaturePlayerResponse.parse({ success: true }));
  }
);

export default router;
