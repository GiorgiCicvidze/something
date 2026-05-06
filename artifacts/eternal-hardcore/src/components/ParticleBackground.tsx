import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  type: "ember" | "spark" | "drift";
  life: number;
  maxLife: number;
  hue: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let particles: Particle[] = [];
    let t = 0;

    const spawnParticle = (forceX?: number): Particle => {
      const roll = Math.random();
      const type: Particle["type"] = roll < 0.15 ? "spark" : roll < 0.45 ? "ember" : "drift";
      const x = forceX ?? Math.random() * canvas.width;
      const y = canvas.height + 10;
      const hue = 340 + Math.random() * 30; // 340-370 → deep crimson to orange-red

      if (type === "spark") {
        const life = 60 + Math.random() * 80;
        return { x, y, vx: (Math.random() - 0.5) * 1.5, vy: -(3 + Math.random() * 4), size: 1 + Math.random(), alpha: 0, maxAlpha: 0.9, type, life, maxLife: life, hue };
      }
      if (type === "ember") {
        const life = 120 + Math.random() * 160;
        return { x, y, vx: (Math.random() - 0.5) * 0.8, vy: -(1.2 + Math.random() * 1.8), size: 1.5 + Math.random() * 2, alpha: 0, maxAlpha: 0.55, type, life, maxLife: life, hue };
      }
      // drift
      const life = 200 + Math.random() * 300;
      return { x, y, vx: (Math.random() - 0.5) * 0.3, vy: -(0.3 + Math.random() * 0.6), size: 2 + Math.random() * 3, alpha: 0, maxAlpha: 0.18, type, life, maxLife: life, hue };
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 7000), 180);
      for (let i = 0; i < count; i++) {
        const p = spawnParticle();
        p.y = Math.random() * canvas.height;
        p.life = Math.random() * p.maxLife;
        p.alpha = p.maxAlpha * Math.random();
        particles.push(p);
      }
    };

    const drawBackground = () => {
      // Deep animated gradient — shifts between near-black and a subtle dark crimson pulse
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.008);

      // Base fill
      ctx.fillStyle = `hsl(0, 0%, 4%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bottom warm glow
      const bottomGrad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 1.1, 0,
        canvas.width * 0.5, canvas.height * 1.1, canvas.height * 0.85
      );
      bottomGrad.addColorStop(0, `hsla(348, 80%, 18%, ${0.18 + pulse * 0.07})`);
      bottomGrad.addColorStop(0.5, `hsla(348, 60%, 8%, ${0.12})`);
      bottomGrad.addColorStop(1, "transparent");
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floating volumetric orbs
      const orbs = [
        { x: 0.2, y: 0.65, r: 0.35, phase: 0 },
        { x: 0.78, y: 0.55, r: 0.28, phase: Math.PI * 0.6 },
        { x: 0.5, y: 0.8, r: 0.22, phase: Math.PI * 1.2 },
      ];
      for (const orb of orbs) {
        const breathe = 0.5 + 0.5 * Math.sin(t * 0.005 + orb.phase);
        const cx = canvas.width * orb.x + Math.sin(t * 0.003 + orb.phase) * 40;
        const cy = canvas.height * orb.y + Math.cos(t * 0.004 + orb.phase) * 25;
        const r = canvas.width * orb.r;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `hsla(348, 75%, 22%, ${0.09 + breathe * 0.06})`);
        g.addColorStop(0.4, `hsla(348, 60%, 12%, ${0.04})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Subtle grid
      ctx.save();
      ctx.globalAlpha = 0.025 + pulse * 0.01;
      ctx.strokeStyle = "hsl(348, 40%, 50%)";
      ctx.lineWidth = 0.5;
      const gridSize = 80;
      for (let gx = 0; gx < canvas.width; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, canvas.height);
        ctx.stroke();
      }
      for (let gy = 0; gy < canvas.height; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(canvas.width, gy);
        ctx.stroke();
      }
      ctx.restore();

      // Top vignette
      const topGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.3);
      topGrad.addColorStop(0, "hsla(0, 0%, 3%, 0.7)");
      topGrad.addColorStop(1, "transparent");
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.3);
    };

    const render = () => {
      t++;

      drawBackground();

      // Spawn new particles
      const targetCount = Math.min(Math.floor((canvas.width * canvas.height) / 7000), 180);
      if (particles.length < targetCount) {
        particles.push(spawnParticle());
      }

      // Update + draw particles
      particles = particles.filter((p) => {
        p.life--;
        if (p.life <= 0) return false;

        p.x += p.vx;
        p.y += p.vy;

        // Gentle waver
        p.vx += Math.sin(t * 0.05 + p.y * 0.01) * 0.01;

        // Fade in / fade out envelope
        const progress = 1 - p.life / p.maxLife;
        if (progress < 0.15) {
          p.alpha = p.maxAlpha * (progress / 0.15);
        } else if (progress > 0.75) {
          p.alpha = p.maxAlpha * (1 - (progress - 0.75) / 0.25);
        } else {
          p.alpha = p.maxAlpha;
        }

        if (p.type === "spark") {
          // Tail
          ctx.save();
          ctx.globalAlpha = p.alpha * 0.3;
          ctx.strokeStyle = `hsla(${p.hue}, 90%, 65%, 1)`;
          ctx.lineWidth = p.size * 0.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + p.size * 3);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = p.alpha;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.5);
          g.addColorStop(0, `hsla(${p.hue}, 100%, 80%, 1)`);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          g.addColorStop(0, `hsla(${p.hue}, 80%, 60%, 1)`);
          g.addColorStop(0.5, `hsla(${p.hue}, 70%, 45%, 0.6)`);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        return true;
      });

      rafId = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize, { passive: true });
    resize();
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  );
}
