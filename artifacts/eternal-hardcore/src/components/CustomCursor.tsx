import { useEffect, useRef, useState } from "react";

const CRIMSON = "hsl(348 83% 47%)";
const CRIMSON_BRIGHT = "hsl(348 100% 60%)";

export function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const mouse = useRef({ x: -200, y: -200 });
  const smooth = useRef({ x: -200, y: -200 });
  const rotAngle = useRef(0);
  const hoveringRef = useRef(false);
  const pulseRef = useRef(0);

  const trailRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; size: number;
  }>>([]);

  useEffect(() => {
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;
    setIsVisible(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    let lastX = -200, lastY = -200;

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const speed = Math.sqrt(dx * dx + dy * dy);

      if (speed > 2 && lastX > 0) {
        const count = Math.min(Math.floor(speed * 0.4), 6);
        for (let i = 0; i < count; i++) {
          const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2;
          const mag = Math.random() * 1.5 + 0.3;
          trailRef.current.push({
            x: e.clientX,
            y: e.clientY,
            vx: Math.cos(angle) * mag * -0.4,
            vy: Math.sin(angle) * mag * -0.4,
            life: 1,
            maxLife: 0.6 + Math.random() * 0.4,
            size: Math.random() * 2.5 + 0.8,
          });
        }
      }

      lastX = e.clientX;
      lastY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const h = !!target.closest('a, button, input, select, [role="button"], [data-interactive="true"]');
      hoveringRef.current = h;
      setIsHovering(h);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });

    let rafId: number;

    const render = () => {
      const lerp = hoveringRef.current ? 0.28 : 0.2;
      const dx = mouse.current.x - smooth.current.x;
      const dy = mouse.current.y - smooth.current.y;
      smooth.current.x += dx * lerp;
      smooth.current.y += dy * lerp;

      rotAngle.current += hoveringRef.current ? 2.2 : 0.8;
      pulseRef.current += 0.06;

      const sx = smooth.current.x;
      const sy = smooth.current.y;

      if (crosshairRef.current) {
        const scale = hoveringRef.current ? 1.5 : 1;
        crosshairRef.current.style.transform =
          `translate3d(${sx}px, ${sy}px, 0) rotate(${rotAngle.current}deg) scale(${scale})`;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = trailRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        p.vx *= 0.92;
        p.vy *= 0.92;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const t = p.life / p.maxLife;
        const alpha = Math.min(t * 1.8, 1) * 0.7;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = CRIMSON;
        ctx.fillStyle = t > 0.5 ? CRIMSON_BRIGHT : CRIMSON;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  if (!isVisible) return null;

  const ringSize = isHovering ? 38 : 30;
  const gap = isHovering ? 7 : 5;
  const lineLen = isHovering ? 7 : 6;
  const lineThick = 1.5;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9990 }}
      />

      {/* Sharp inner dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{
          zIndex: 9999,
          width: 4,
          height: 4,
          marginLeft: -2,
          marginTop: -2,
          borderRadius: "50%",
          background: isHovering ? "white" : CRIMSON_BRIGHT,
          boxShadow: isHovering
            ? `0 0 8px 3px white, 0 0 16px 6px ${CRIMSON}`
            : `0 0 6px 2px ${CRIMSON}`,
          willChange: "transform",
          transition: "background 0.15s, box-shadow 0.15s",
        }}
      />

      {/* Rotating crosshair ring */}
      <div
        ref={crosshairRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{
          zIndex: 9998,
          width: ringSize,
          height: ringSize,
          marginLeft: -ringSize / 2,
          marginTop: -ringSize / 2,
          willChange: "transform",
          transition: "width 0.15s, height 0.15s, margin 0.15s",
        }}
      >
        {/* Outer ring — four arc segments with gaps */}
        <svg
          width={ringSize}
          height={ringSize}
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {[0, 90, 180, 270].map((startDeg) => {
            const r = ringSize / 2 - 1;
            const cx = ringSize / 2;
            const cy = ringSize / 2;
            const gapAngle = (gap / (Math.PI * r)) * 180;
            const arcStart = startDeg + gapAngle;
            const arcEnd = startDeg + 90 - gapAngle;

            const toRad = (d: number) => (d * Math.PI) / 180;
            const x1 = cx + r * Math.cos(toRad(arcStart));
            const y1 = cy + r * Math.sin(toRad(arcStart));
            const x2 = cx + r * Math.cos(toRad(arcEnd));
            const y2 = cy + r * Math.sin(toRad(arcEnd));

            return (
              <path
                key={startDeg}
                d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                stroke={isHovering ? "white" : CRIMSON}
                strokeWidth={isHovering ? 2 : lineThick}
                fill="none"
                filter="url(#glow)"
                style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
              />
            );
          })}
        </svg>

        {/* Four crosshair tick marks */}
        {[
          { top: 0, left: "50%", width: lineThick, height: lineLen, ml: -lineThick / 2, mt: -(ringSize / 2 + lineLen + 2) },
          { top: "50%", left: 0, width: lineLen, height: lineThick, mt: -lineThick / 2, ml: -(ringSize / 2 + lineLen + 2) },
          { top: "100%", left: "50%", width: lineThick, height: lineLen, ml: -lineThick / 2, mt: 2 },
          { top: "50%", left: "100%", width: lineLen, height: lineThick, mt: -lineThick / 2, ml: 2 },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: s.top,
              left: s.left,
              width: s.width,
              height: s.height,
              marginLeft: s.ml,
              marginTop: s.mt,
              background: isHovering ? "white" : CRIMSON,
              boxShadow: `0 0 4px 1px ${isHovering ? "white" : CRIMSON}`,
              transition: "background 0.15s, box-shadow 0.15s",
            }}
          />
        ))}
      </div>
    </>
  );
}
