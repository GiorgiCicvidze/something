import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminMe,
  useGetAdminPlayers,
  useGetAdminSettings,
  useGetServerStatus,
  useAdminLogout,
  useUpdateAdminSettings,
  useFeaturePlayer,
  useAddPlayer,
  useDeletePlayer,
  useGetAdminStaff,
  useAddStaffMember,
  useDeleteStaffMember,
  getGetAdminMeQueryKey,
  getGetAdminPlayersQueryKey,
  getGetAdminSettingsQueryKey,
  getGetServerStatusQueryKey,
  getGetAdminStaffQueryKey,
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Skull, Users, Wifi, WifiOff, Star, LogOut, Swords, Clock,
  Shield, UserPlus, Trash2, Crown, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatPlaytime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}

function AdminBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; color: string; pulse: number; pulseSpeed: number;
    }> = [];

    const colors = ["hsl(348 83% 47%)", "hsl(0 0% 100%)", "hsl(120 100% 30%)"];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.35 + 0.05,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.01,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const grad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.3, 0,
        canvas.width * 0.5, canvas.height * 0.3, canvas.width * 0.7
      );
      grad.addColorStop(0, "hsl(348 60% 8% / 0.6)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        const currentOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.save();
        ctx.globalAlpha = currentOpacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

const settingsSchema = z.object({
  motd: z.string().min(1),
  statusOverride: z.string(),
});
type SettingsForm = z.infer<typeof settingsSchema>;

const addPlayerSchema = z.object({
  username: z.string().min(1).max(32),
  kills: z.coerce.number().int().min(0),
  deaths: z.coerce.number().int().min(0),
  playtimeMinutes: z.coerce.number().int().min(0),
});
type AddPlayerForm = z.infer<typeof addPlayerSchema>;

const addStaffSchema = z.object({
  username: z.string().min(1).max(32),
  role: z.string().min(1),
});
type AddStaffForm = z.infer<typeof addStaffSchema>;

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  dev: "Dev",
  admin: "Admin",
  mod: "Mod",
};

function roleColor(role: string) {
  if (role === "owner") return "text-yellow-400";
  if (role === "dev") return "text-secondary";
  return "text-primary";
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);

  const { data: adminMe, isError: meError, isLoading: meLoading } = useGetAdminMe({
    query: { queryKey: getGetAdminMeQueryKey(), retry: false },
  });
  const { data: serverStatus } = useGetServerStatus({
    query: { queryKey: getGetServerStatusQueryKey(), refetchInterval: 15000 },
  });
  const { data: players } = useGetAdminPlayers({
    query: { queryKey: getGetAdminPlayersQueryKey() },
  });
  const { data: settings } = useGetAdminSettings({
    query: { queryKey: getGetAdminSettingsQueryKey() },
  });
  const { data: staff } = useGetAdminStaff({
    query: { queryKey: getGetAdminStaffQueryKey() },
  });

  const logoutMutation = useAdminLogout();
  const updateSettingsMutation = useUpdateAdminSettings();
  const featurePlayerMutation = useFeaturePlayer();
  const addPlayerMutation = useAddPlayer();
  const deletePlayerMutation = useDeletePlayer();
  const addStaffMutation = useAddStaffMember();
  const deleteStaffMutation = useDeleteStaffMember();

  const settingsForm = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { motd: "", statusOverride: "auto" },
  });
  const addPlayerForm = useForm<AddPlayerForm>({
    resolver: zodResolver(addPlayerSchema),
    defaultValues: { username: "", kills: 0, deaths: 0, playtimeMinutes: 0 },
  });
  const addStaffForm = useForm<AddStaffForm>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: { username: "", role: "Dev" },
  });

  useEffect(() => {
    if (settings) {
      settingsForm.reset({
        motd: settings.motd,
        statusOverride: settings.statusOverride ?? "auto",
      });
    }
  }, [settings, settingsForm]);

  useEffect(() => {
    if (meError) setLocation("/admin");
  }, [meError, setLocation]);

  const handleLogout = () => {
    logoutMutation.mutate({}, {
      onSuccess: () => { queryClient.clear(); setLocation("/admin"); },
    });
  };

  const onSaveSettings = (data: SettingsForm) => {
    updateSettingsMutation.mutate(
      { data: { motd: data.motd, statusOverride: data.statusOverride === "auto" ? null : data.statusOverride } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdminSettingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetServerStatusQueryKey() });
          toast({ title: "Settings saved" });
        },
        onError: () => toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" }),
      }
    );
  };

  const handleFeatureToggle = (username: string) => {
    featurePlayerMutation.mutate({ username }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminPlayersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminSettingsQueryKey() });
      },
    });
  };

  const onAddPlayer = (data: AddPlayerForm) => {
    addPlayerMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminPlayersQueryKey() });
        addPlayerForm.reset();
        setShowAddPlayer(false);
        toast({ title: "Player added", description: `${data.username} added to leaderboard.` });
      },
      onError: () => toast({ title: "Error", description: "Player may already exist.", variant: "destructive" }),
    });
  };

  const handleDeletePlayer = (username: string) => {
    deletePlayerMutation.mutate({ username }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminPlayersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminSettingsQueryKey() });
        toast({ title: "Player removed", description: `${username} removed from leaderboard.` });
      },
    });
  };

  const onAddStaff = (data: AddStaffForm) => {
    addStaffMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminStaffQueryKey() });
        addStaffForm.reset();
        setShowAddStaff(false);
        toast({ title: "Staff added", description: `${data.username} added to staff team.` });
      },
      onError: () => toast({ title: "Error", description: "Failed to add staff member.", variant: "destructive" }),
    });
  };

  const handleDeleteStaff = (username: string) => {
    deleteStaffMutation.mutate({ username }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminStaffQueryKey() });
        toast({ title: "Staff removed", description: `${username} removed from staff team.` });
      },
    });
  };

  if (meLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AdminBackground />
        <div className="text-center relative z-10">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!adminMe) return null;

  const isOnline = serverStatus?.statusOverride
    ? serverStatus.statusOverride === "online"
    : serverStatus?.online ?? false;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const roleLabel = ROLE_LABELS[adminMe.role.toLowerCase()] ?? adminMe.role.toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <AdminBackground />

      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skull className="w-5 h-5 text-primary" />
            <span className="font-black tracking-tight text-sm">
              ETERNAL<span className="text-primary">HARDCORE</span>
            </span>
            <span className="text-xs font-mono text-muted-foreground/50 border border-white/10 px-2 py-0.5 rounded">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">
                {adminMe.username}
                <span className={`ml-1 uppercase font-bold ${roleColor(adminMe.role.toLowerCase())}`}>
                  [{roleLabel}]
                </span>
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">

          {/* Stats overview */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-5 rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  {isOnline ? <Wifi className="w-4 h-4 text-secondary" /> : <WifiOff className="w-4 h-4 text-destructive" />}
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Server</span>
                </div>
                <p className={`text-xl font-black font-mono ${isOnline ? "text-secondary" : "text-destructive"}`}>
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </p>
                {serverStatus?.latencyMs && <p className="text-xs text-muted-foreground font-mono mt-1">{serverStatus.latencyMs}ms</p>}
              </div>
              <div className="p-5 rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Players</span>
                </div>
                <p className="text-xl font-black font-mono text-foreground">
                  {serverStatus?.playerCount ?? "—"}
                  <span className="text-muted-foreground text-base font-normal"> / {serverStatus?.maxPlayers ?? "—"}</span>
                </p>
              </div>
              <div className="p-5 rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Featured</span>
                </div>
                <p className="text-xl font-black font-mono text-foreground">
                  {settings?.featuredPlayers.length ?? 0}
                  <span className="text-muted-foreground text-base font-normal"> players</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Server settings */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Control Panel</h2>
            <div className="p-6 rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm">
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSaveSettings)} className="space-y-5">
                  <FormField
                    control={settingsForm.control}
                    name="motd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Server MOTD</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-white/5 border-white/10 font-mono text-sm focus:border-primary/40" placeholder="Server message of the day..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={settingsForm.control}
                    name="statusOverride"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Status Override</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 font-mono text-sm focus:border-primary/40 w-48">
                              <SelectValue placeholder="Auto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-white/10 font-mono">
                            <SelectItem value="auto">Auto (real status)</SelectItem>
                            <SelectItem value="online">Force Online</SelectItem>
                            <SelectItem value="offline">Force Offline</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    className="font-mono uppercase tracking-widest text-xs bg-primary hover:bg-primary/90"
                    style={{ boxShadow: "0 0 16px hsl(348 83% 47% / 0.2)" }}
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </form>
              </Form>
            </div>
          </motion.div>

          {/* Players section */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Players</h2>
              <button
                onClick={() => setShowAddPlayer((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-mono text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/60 px-3 py-1.5 rounded-lg transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Player
                {showAddPlayer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Add player form */}
            <AnimatePresence>
              {showAddPlayer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm mb-3">
                    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">New Player</p>
                    <Form {...addPlayerForm}>
                      <form onSubmit={addPlayerForm.handleSubmit(onAddPlayer)} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <FormField
                          control={addPlayerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem className="col-span-2 md:col-span-1">
                              <FormLabel className="text-xs font-mono text-muted-foreground">Username</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-white/5 border-white/10 font-mono text-sm h-9" placeholder="PlayerName" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addPlayerForm.control}
                          name="kills"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-mono text-muted-foreground">Kills</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" min={0} className="bg-white/5 border-white/10 font-mono text-sm h-9" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addPlayerForm.control}
                          name="deaths"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-mono text-muted-foreground">Deaths</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" min={0} className="bg-white/5 border-white/10 font-mono text-sm h-9" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addPlayerForm.control}
                          name="playtimeMinutes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-mono text-muted-foreground">Playtime (min)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" min={0} className="bg-white/5 border-white/10 font-mono text-sm h-9" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="col-span-2 md:col-span-4 flex justify-end">
                          <Button
                            type="submit"
                            disabled={addPlayerMutation.isPending}
                            size="sm"
                            className="font-mono uppercase tracking-widest text-xs bg-primary hover:bg-primary/90"
                          >
                            {addPlayerMutation.isPending ? "Adding..." : "Add Player"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-6 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Player</th>
                      <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        <div className="flex items-center justify-end gap-1"><Swords className="w-3 h-3" /> Kills</div>
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        <div className="flex items-center justify-end gap-1"><Skull className="w-3 h-3" /> Deaths</div>
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        <div className="flex items-center justify-end gap-1"><Clock className="w-3 h-3" /> Playtime</div>
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Featured</th>
                      <th className="text-right px-6 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {players?.map((player) => (
                      <tr key={player.username} className={`group hover:bg-white/2 transition-colors ${player.featured ? "bg-primary/3" : ""}`}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <img src={player.avatarUrl} alt={player.username} className="w-8 h-8 rounded" style={{ imageRendering: "pixelated" }} />
                            <span className="font-mono text-sm text-foreground">{player.username}</span>
                            {player.featured && <Star className="w-3 h-3 text-primary" />}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-primary">{player.kills}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">{player.deaths}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">{formatPlaytime(player.playtimeMinutes)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleFeatureToggle(player.username)}
                            disabled={featurePlayerMutation.isPending}
                            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all duration-200 ${player.featured ? "border-primary/40 text-primary bg-primary/10 hover:bg-primary/5" : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"}`}
                          >
                            {player.featured ? "Unfeature" : "Feature"}
                          </button>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleDeletePlayer(player.username)}
                            disabled={deletePlayerMutation.isPending}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded hover:bg-destructive/10"
                            title="Remove player"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!players || players.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-xs font-mono text-muted-foreground">
                          No players yet — add one above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Staff team section */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Staff Team</h2>
              <button
                onClick={() => setShowAddStaff((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-mono text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/60 px-3 py-1.5 rounded-lg transition-all"
              >
                <Crown className="w-3.5 h-3.5" />
                Add Staff
                {showAddStaff ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Add staff form */}
            <AnimatePresence>
              {showAddStaff && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm mb-3">
                    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">New Staff Member</p>
                    <Form {...addStaffForm}>
                      <form onSubmit={addStaffForm.handleSubmit(onAddStaff)} className="flex flex-wrap gap-3 items-end">
                        <FormField
                          control={addStaffForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem className="flex-1 min-w-[160px]">
                              <FormLabel className="text-xs font-mono text-muted-foreground">Username</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-white/5 border-white/10 font-mono text-sm h-9" placeholder="PlayerName" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addStaffForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem className="w-36">
                              <FormLabel className="text-xs font-mono text-muted-foreground">Role</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-white/5 border-white/10 font-mono text-sm h-9" placeholder="e.g. Mod" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          disabled={addStaffMutation.isPending}
                          size="sm"
                          className="font-mono uppercase tracking-widest text-xs bg-primary hover:bg-primary/90 h-9"
                        >
                          {addStaffMutation.isPending ? "Adding..." : "Add"}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {staff?.map((member) => (
                <div
                  key={member.username}
                  className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm group"
                >
                  <img
                    src={member.avatarUrl}
                    alt={member.username}
                    className="w-12 h-12 rounded"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-bold text-foreground truncate">{member.username}</p>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{member.role}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteStaff(member.username)}
                    disabled={deleteStaffMutation.isPending}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1.5 rounded hover:bg-destructive/10"
                    title="Remove staff"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(!staff || staff.length === 0) && (
                <div className="col-span-full py-8 text-center text-xs font-mono text-muted-foreground">
                  No staff members yet — add one above.
                </div>
              )}
            </div>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
