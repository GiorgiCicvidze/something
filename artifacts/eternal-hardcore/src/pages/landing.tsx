import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetServerStatus,
  useGetOnlinePlayers,
  useGetPlayerStats,
  getGetServerStatusQueryKey,
  getGetOnlinePlayersQueryKey,
  getGetPlayerStatsQueryKey,
} from "@workspace/api-client-react";
import { ParticleBackground } from "@/components/ParticleBackground";
import { CustomCursor } from "@/components/CustomCursor";
import { Skull, Swords, Clock, Users, Wifi, WifiOff, Copy, Check, ChevronDown, Star } from "lucide-react";

const SERVER_IP = "play.eternalhardcore.xyz";

function formatPlaytime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}

function KDRatio({ kills, deaths }: { kills: number; deaths: number }) {
  const ratio = deaths === 0 ? kills : (kills / deaths).toFixed(2);
  return (
    <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${Number(ratio) >= 2 ? "text-secondary bg-secondary/10" : "text-muted-foreground bg-muted/50"}`}>
      {ratio} KDR
    </span>
  );
}

export default function LandingPage() {
  const [copied, setCopied] = useState(false);

  const { data: serverStatus } = useGetServerStatus({
    query: { refetchInterval: 15000, queryKey: getGetServerStatusQueryKey() },
  });
  const { data: onlinePlayers } = useGetOnlinePlayers({
    query: { refetchInterval: 15000, queryKey: getGetOnlinePlayersQueryKey() },
  });
  const { data: playerStats } = useGetPlayerStats({
    query: { refetchInterval: 30000, queryKey: getGetPlayerStatsQueryKey() },
  });

  const handleCopyIP = useCallback(() => {
    navigator.clipboard.writeText(SERVER_IP).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const isOnline = serverStatus?.statusOverride
    ? serverStatus.statusOverride === "online"
    : serverStatus?.online ?? false;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" style={{ cursor: "none" }}>
      <CustomCursor />

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <ParticleBackground />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,hsl(0,0%,4%)_80%)] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <motion.div
          className="relative z-10 text-center px-6 max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Status badge */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 mb-8">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono uppercase tracking-widest ${isOnline ? "border-secondary/40 text-secondary bg-secondary/10" : "border-destructive/40 text-destructive bg-destructive/10"}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOnline ? "bg-secondary" : "bg-destructive"}`} />
              {isOnline ? "Server Online" : "Server Offline"}
              {serverStatus?.latencyMs && isOnline && (
                <span className="text-muted-foreground ml-1">{serverStatus.latencyMs}ms</span>
              )}
            </div>
          </motion.div>

          {/* Server name */}
          <motion.div variants={itemVariants}>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none mb-2">
              <span className="text-foreground">ETERNAL</span>
              <br />
              <span className="text-primary" style={{ textShadow: "0 0 60px hsl(348 83% 47% / 0.5), 0 0 120px hsl(348 83% 47% / 0.2)" }}>
                HARDCORE
              </span>
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground font-mono mt-6 mb-10 tracking-widest uppercase"
          >
            One life. No mercy. No second chances.
          </motion.p>

          {/* IP Copy button */}
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
            <button
              onClick={handleCopyIP}
              data-interactive="true"
              data-testid="button-copy-ip"
              className="group relative flex items-center gap-3 px-8 py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-md hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 text-lg font-mono"
              style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
            >
              <span className="text-foreground tracking-wider">{SERVER_IP}</span>
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="w-4 h-4 text-secondary" />
                  </motion.span>
                ) : (
                  <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </motion.span>
                )}
              </AnimatePresence>
              {copied && (
                <motion.span
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: -32 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-1/2 -translate-x-1/2 text-xs text-secondary font-mono pointer-events-none whitespace-nowrap"
                >
                  Copied!
                </motion.span>
              )}
            </button>

            {/* Player count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span data-testid="text-player-count">
                {serverStatus ? (
                  <>
                    <span className="text-foreground">{serverStatus.playerCount}</span>
                    <span className="text-muted-foreground">/{serverStatus.maxPlayers} players online</span>
                  </>
                ) : (
                  "Loading..."
                )}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <span className="text-xs font-mono uppercase tracking-widest">Scroll</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* LIVE STATS SECTION */}
      <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Live Data</p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">Server Status</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status card */}
              <motion.div
                variants={itemVariants}
                className="relative p-6 rounded-xl border border-white/5 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    {isOnline ? (
                      <Wifi className="w-5 h-5 text-secondary" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-destructive" />
                    )}
                    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Status</span>
                  </div>
                  <p className={`text-2xl font-black font-mono ${isOnline ? "text-secondary" : "text-destructive"}`}>
                    {isOnline ? "ONLINE" : "OFFLINE"}
                  </p>
                  {serverStatus?.latencyMs && isOnline && (
                    <p className="text-xs text-muted-foreground font-mono mt-1">{serverStatus.latencyMs}ms ping</p>
                  )}
                </div>
              </motion.div>

              {/* Players card */}
              <motion.div
                variants={itemVariants}
                className="relative p-6 rounded-xl border border-white/5 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Players</span>
                  </div>
                  <p className="text-2xl font-black font-mono text-foreground">
                    {serverStatus?.playerCount ?? "—"}{" "}
                    <span className="text-muted-foreground text-lg font-normal">/ {serverStatus?.maxPlayers ?? "—"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">active survivors</p>
                </div>
              </motion.div>

              {/* MOTD card */}
              <motion.div
                variants={itemVariants}
                className="relative p-6 rounded-xl border border-white/5 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Skull className="w-5 h-5 text-primary" />
                    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">MOTD</span>
                  </div>
                  <p className="text-sm font-mono text-foreground leading-relaxed">
                    {serverStatus?.motd || "Welcome to EternalHardcore"}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ONLINE PLAYERS SECTION */}
      <section className="relative py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Now Playing</p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">Online Now</h2>
            </motion.div>

            {onlinePlayers && onlinePlayers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {onlinePlayers.map((player, i) => (
                  <motion.div
                    key={player.username}
                    variants={itemVariants}
                    custom={i}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 bg-card/30 backdrop-blur-sm hover:border-secondary/30 hover:bg-secondary/5 transition-all duration-300 group"
                    data-testid={`card-online-player-${player.username}`}
                  >
                    <div className="relative">
                      <img
                        src={player.avatarUrl}
                        alt={player.username}
                        className="w-12 h-12 rounded-lg pixelated"
                        style={{ imageRendering: "pixelated" }}
                      />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-background animate-pulse" />
                    </div>
                    <span className="text-xs font-mono text-center text-foreground truncate w-full text-center">
                      {player.username}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div variants={itemVariants} className="text-center py-12">
                <p className="text-muted-foreground font-mono text-sm">No players online right now</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* STAFF TEAM SECTION */}
      <section className="relative py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">The Team</p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">Staff Team</h2>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-8">
              {[
                { username: "ItzZaDucky", role: "Developer", color: "text-secondary" },
                { username: "critz_1", role: "Owner", color: "text-primary" },
              ].map((member, i) => (
                <motion.div
                  key={member.username}
                  variants={itemVariants}
                  custom={i}
                  className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-white/5 bg-card/30 backdrop-blur-sm hover:border-primary/20 hover:bg-card/50 transition-all duration-300 group w-56"
                >
                  <div className="relative">
                    <img
                      src={`https://mc-heads.net/avatar/${member.username}/80`}
                      alt={member.username}
                      className="w-20 h-20 rounded-xl group-hover:scale-105 transition-transform duration-300"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div className="absolute inset-0 rounded-xl ring-1 ring-white/10 group-hover:ring-primary/30 transition-all duration-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-mono font-bold text-foreground">{member.username}</p>
                    <p className={`text-xs font-mono uppercase tracking-widest mt-1 ${member.color}`}>{member.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* LEADERBOARD SECTION */}
      <section className="relative py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Hall of Blood</p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">Leaderboard</h2>
            </motion.div>

            <div className="space-y-2">
              {playerStats?.map((player, i) => (
                <motion.div
                  key={player.username}
                  variants={itemVariants}
                  custom={i}
                  className={`relative flex items-center gap-4 px-6 py-4 rounded-xl border transition-all duration-300 group ${player.featured ? "border-primary/30 bg-primary/5 hover:border-primary/50" : "border-white/5 bg-card/20 hover:border-white/10 hover:bg-card/40"}`}
                  data-testid={`row-player-${player.username}`}
                >
                  {player.featured && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                  )}

                  {/* Rank */}
                  <div className={`w-8 text-center font-black font-mono text-sm flex-shrink-0 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                    {i === 0 ? "#1" : i === 1 ? "#2" : i === 2 ? "#3" : `#${i + 1}`}
                  </div>

                  {/* Avatar */}
                  <img
                    src={player.avatarUrl}
                    alt={player.username}
                    className="w-10 h-10 rounded-lg flex-shrink-0"
                    style={{ imageRendering: "pixelated" }}
                  />

                  {/* Name + featured badge */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-foreground truncate">{player.username}</span>
                      {player.featured && <Star className="w-3 h-3 text-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {formatPlaytime(player.playtimeMinutes)} played
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm font-mono font-bold text-primary">
                        <Swords className="w-3 h-3" />
                        {player.kills}
                      </div>
                      <p className="text-xs text-muted-foreground">kills</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm font-mono font-bold text-muted-foreground">
                        <Skull className="w-3 h-3" />
                        {player.deaths}
                      </div>
                      <p className="text-xs text-muted-foreground">deaths</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm font-mono font-bold text-foreground">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {formatPlaytime(player.playtimeMinutes)}
                      </div>
                      <p className="text-xs text-muted-foreground">playtime</p>
                    </div>
                    <KDRatio kills={player.kills} deaths={player.deaths} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-white/5 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-xl font-black tracking-tight">
                ETERNAL<span className="text-primary">HARDCORE</span>
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1 tracking-widest uppercase">
                {SERVER_IP}
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-1">
              <p className="text-xs font-mono text-muted-foreground">
                Owner: <span className="text-foreground">critz_1</span>
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                Main Developer: <span className="text-foreground">ItzZaDucky</span>
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs font-mono text-muted-foreground/40">
              All rights reserved. EternalHardcore {new Date().getFullYear()}
            </p>
            <a
              href="/admin"
              className="text-xs font-mono text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
              data-testid="link-admin"
            >
              Admin
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
