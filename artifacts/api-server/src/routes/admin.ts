import { Router, type IRouter } from "express";
import { validateAdmin } from "../lib/adminAuth";
import { serverSettings, playerStats, staffTeam } from "../lib/store";
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
  AddPlayerBody,
  AddPlayerResponse,
  DeletePlayerParams,
  DeletePlayerResponse,
  GetAdminStaffResponse,
  AddStaffMemberBody,
  AddStaffMemberResponse,
  DeleteStaffMemberParams,
  DeleteStaffMemberResponse,
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
  "/admin/players",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = AddPlayerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const existing = playerStats.find(
      (p) => p.username.toLowerCase() === parsed.data.username.toLowerCase()
    );
    if (existing) {
      res.status(409).json({ error: "Player already exists" });
      return;
    }

    const newPlayer = {
      username: parsed.data.username,
      kills: parsed.data.kills,
      deaths: parsed.data.deaths,
      playtimeMinutes: parsed.data.playtimeMinutes,
      featured: false,
      avatarUrl: `https://mc-heads.net/avatar/${parsed.data.username}`,
    };
    playerStats.push(newPlayer);

    res.json(AddPlayerResponse.parse(newPlayer));
  }
);

router.delete(
  "/admin/players/:username",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeletePlayerParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const idx = playerStats.findIndex(
      (p) => p.username === params.data.username
    );
    if (idx === -1) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    playerStats.splice(idx, 1);
    serverSettings.featuredPlayers = serverSettings.featuredPlayers.filter(
      (u) => u !== params.data.username
    );

    res.json(DeletePlayerResponse.parse({ success: true }));
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

router.get(
  "/admin/staff",
  requireAdmin,
  async (_req, res): Promise<void> => {
    res.json(GetAdminStaffResponse.parse(staffTeam));
  }
);

router.post(
  "/admin/staff",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = AddStaffMemberBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const existing = staffTeam.find(
      (s) => s.username.toLowerCase() === parsed.data.username.toLowerCase()
    );
    if (existing) {
      existing.role = parsed.data.role;
      res.json(AddStaffMemberResponse.parse(existing));
      return;
    }

    const newMember = {
      username: parsed.data.username,
      role: parsed.data.role,
      avatarUrl: `https://mc-heads.net/avatar/${parsed.data.username}`,
    };
    staffTeam.push(newMember);

    res.json(AddStaffMemberResponse.parse(newMember));
  }
);

router.delete(
  "/admin/staff/:username",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteStaffMemberParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const idx = staffTeam.findIndex(
      (s) => s.username === params.data.username
    );
    if (idx === -1) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

    staffTeam.splice(idx, 1);
    res.json(DeleteStaffMemberResponse.parse({ success: true }));
  }
);

export default router;
