import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminMe,
  useGetAdminPlayers,
  useGetAdminSettings,
  useGetServerStatus,
  useAdminLogout,
  useUpdateAdminSettings,
  useFeaturePlayer,
  getGetAdminMeQueryKey,
  getGetAdminPlayersQueryKey,
  getGetAdminSettingsQueryKey,
  getGetServerStatusQueryKey,
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skull, Users, Wifi, WifiOff, Star, LogOut, Swords, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatPlaytime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}

const settingsSchema = z.object({
  motd: z.string().min(1),
  statusOverride: z.string(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const logoutMutation = useAdminLogout();
  const updateSettingsMutation = useUpdateAdminSettings();
  const featurePlayerMutation = useFeaturePlayer();

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { motd: "", statusOverride: "auto" },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        motd: settings.motd,
        statusOverride: settings.statusOverride ?? "auto",
      });
    }
  }, [settings, form]);

  useEffect(() => {
    if (meError) {
      setLocation("/admin");
    }
  }, [meError, setLocation]);

  const handleLogout = () => {
    logoutMutation.mutate(
      {},
      {
        onSuccess: () => {
          queryClient.clear();
          setLocation("/admin");
        },
      }
    );
  };

  const onSaveSettings = (data: SettingsForm) => {
    updateSettingsMutation.mutate(
      {
        data: {
          motd: data.motd,
          statusOverride: data.statusOverride === "auto" ? null : data.statusOverride,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdminSettingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetServerStatusQueryKey() });
          toast({ title: "Settings saved", description: "Server settings updated." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
        },
      }
    );
  };

  const handleFeatureToggle = (username: string) => {
    featurePlayerMutation.mutate(
      { username },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdminPlayersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminSettingsQueryKey() });
        },
      }
    );
  };

  if (meLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
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
                <span className="text-primary ml-1 uppercase">[{adminMe.role}]</span>
              </span>
            </div>
            <button
              onClick={handleLogout}
              data-testid="button-logout"
              className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">

          {/* Stats overview */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-5 rounded-xl border border-white/5 bg-card/40 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  {isOnline ? <Wifi className="w-4 h-4 text-secondary" /> : <WifiOff className="w-4 h-4 text-destructive" />}
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Server</span>
                </div>
                <p className={`text-xl font-black font-mono ${isOnline ? "text-secondary" : "text-destructive"}`}>
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </p>
                {serverStatus?.latencyMs && <p className="text-xs text-muted-foreground font-mono mt-1">{serverStatus.latencyMs}ms</p>}
              </div>

              <div className="p-5 rounded-xl border border-white/5 bg-card/40 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Players</span>
                </div>
                <p className="text-xl font-black font-mono text-foreground">
                  {serverStatus?.playerCount ?? "—"} <span className="text-muted-foreground text-base font-normal">/ {serverStatus?.maxPlayers ?? "—"}</span>
                </p>
              </div>

              <div className="p-5 rounded-xl border border-white/5 bg-card/40 backdrop-blur-sm">
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
            <div className="p-6 rounded-xl border border-white/5 bg-card/40 backdrop-blur-sm">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSaveSettings)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="motd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                          Server MOTD
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-motd"
                            className="bg-white/5 border-white/10 font-mono text-sm focus:border-primary/40"
                            placeholder="Server message of the day..."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="statusOverride"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                          Status Override
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger
                              data-testid="select-status-override"
                              className="bg-white/5 border-white/10 font-mono text-sm focus:border-primary/40 w-48"
                            >
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
                    data-testid="button-save-settings"
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

          {/* Player table */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Players</h2>
            <div className="rounded-xl border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden">
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
                      <th className="text-right px-6 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Featured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {players?.map((player) => (
                      <tr
                        key={player.username}
                        className={`group hover:bg-white/2 transition-colors ${player.featured ? "bg-primary/3" : ""}`}
                        data-testid={`row-admin-player-${player.username}`}
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={player.avatarUrl}
                              alt={player.username}
                              className="w-8 h-8 rounded"
                              style={{ imageRendering: "pixelated" }}
                            />
                            <span className="font-mono text-sm text-foreground">{player.username}</span>
                            {player.featured && <Star className="w-3 h-3 text-primary" />}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-primary">{player.kills}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">{player.deaths}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">{formatPlaytime(player.playtimeMinutes)}</td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleFeatureToggle(player.username)}
                            data-testid={`button-feature-${player.username}`}
                            disabled={featurePlayerMutation.isPending}
                            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all duration-200 ${player.featured ? "border-primary/40 text-primary bg-primary/10 hover:bg-primary/5" : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"}`}
                          >
                            {player.featured ? "Unfeature" : "Feature"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
