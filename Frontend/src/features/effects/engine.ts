import type { SceneEffect } from './effects.ts';

/**
 * Canvas particle scenes for the animated background effects.
 * Each scene draws its own backdrop tint + particles every frame.
 * `emit` fires for moments the sound layer can follow (firework burst, thunder).
 */

export type SceneEvent = 'burst' | 'thunder';

export interface Scene {
  resize(w: number, h: number): void;
  step(ctx: CanvasRenderingContext2D, dt: number, t: number): void;
}

interface Opts {
  reducedMotion: boolean;
  emit: (e: SceneEvent) => void;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function linear(ctx: CanvasRenderingContext2D, h: number, top: string, bottom: string) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
}

// ── Snow ──────────────────────────────────────────────────────────────────────

interface Flake { x: number; y: number; r: number; vy: number; phase: number; }

function makeFlakes(n: number, w: number, h: number): Flake[] {
  return Array.from({ length: n }, () => ({
    x: rand(0, w), y: rand(-h, h), r: rand(1.5, 4), vy: rand(20, 60), phase: rand(0, Math.PI * 2),
  }));
}

function stepFlakes(ctx: CanvasRenderingContext2D, flakes: Flake[], w: number, h: number, dt: number, t: number) {
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.strokeStyle = 'rgba(140,165,210,0.55)';
  ctx.lineWidth = 0.8;
  for (const f of flakes) {
    f.y += f.vy * dt;
    f.x += Math.sin(t * 0.8 + f.phase) * 18 * dt;
    if (f.y > h + 5) { f.y = -5; f.x = rand(0, w); }
    if (f.x > w + 5) f.x = -5;
    if (f.x < -5) f.x = w + 5;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function snowScene(o: Opts): Scene {
  let w = 0, h = 0, flakes: Flake[] = [];
  const n = o.reducedMotion ? 40 : 130;
  return {
    resize(nw, nh) { w = nw; h = nh; flakes = makeFlakes(n, w, h); },
    step(ctx, dt, t) {
      // Wintry blue sky so white flakes stand out on light themes.
      ctx.fillStyle = linear(ctx, h, 'rgba(96,135,200,0.75)', 'rgba(170,196,235,0.55)');
      ctx.fillRect(0, 0, w, h);
      stepFlakes(ctx, flakes, w, h, dt, t);
    },
  };
}

// ── Christmas: spiral sparkle tree + snow ─────────────────────────────────────

function christmasScene(o: Opts): Scene {
  let w = 0, h = 0, flakes: Flake[] = [];
  const lights = o.reducedMotion ? 120 : 260;
  return {
    resize(nw, nh) { w = nw; h = nh; flakes = makeFlakes(o.reducedMotion ? 30 : 80, w, h); },
    step(ctx, dt, t) {
      const g = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.3, h * 0.3, Math.max(w, h));
      g.addColorStop(0, 'rgba(185,28,28,0.92)');
      g.addColorStop(1, 'rgba(90,6,14,0.95)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Tree in the left gutter on wide screens, centred on small ones.
      const cx = w > 1100 ? w * 0.11 : w * 0.5;
      const top = h * 0.12, treeH = h * 0.72, maxR = Math.min(w * 0.09, treeH * 0.3) + 30;
      const spin = o.reducedMotion ? 0 : t * 0.6;
      for (let i = 0; i < lights; i++) {
        const k = i / lights;
        const a = k * Math.PI * 2 * 7 + spin;
        const depth = (Math.sin(a) + 1) / 2;
        const x = cx + Math.cos(a) * k * maxR;
        const y = top + k * treeH;
        const tw = 0.55 + 0.45 * Math.sin(t * 3 + i);
        ctx.fillStyle = i % 9 === 0 ? `rgba(255,215,120,${0.4 + depth * 0.6 * tw})` : `rgba(255,240,240,${0.2 + depth * 0.7 * tw})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + depth * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // Star on top
      const star = ctx.createRadialGradient(cx, top, 0, cx, top, 26);
      star.addColorStop(0, 'rgba(255,255,255,1)');
      star.addColorStop(0.3, 'rgba(255,200,200,0.8)');
      star.addColorStop(1, 'rgba(255,120,120,0)');
      ctx.fillStyle = star;
      ctx.beginPath();
      ctx.arc(cx, top, 26, 0, Math.PI * 2);
      ctx.fill();

      stepFlakes(ctx, flakes, w, h, dt, t);
    },
  };
}

// ── Rain ──────────────────────────────────────────────────────────────────────

interface Drop { x: number; y: number; len: number; vy: number; }

function makeDrops(n: number, w: number, h: number): Drop[] {
  return Array.from({ length: n }, () => ({ x: rand(0, w), y: rand(-h, h), len: rand(10, 20), vy: rand(600, 900) }));
}

function stepDrops(ctx: CanvasRenderingContext2D, drops: Drop[], w: number, h: number, dt: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const d of drops) {
    d.y += d.vy * dt;
    d.x -= d.vy * 0.12 * dt;
    if (d.y > h) { d.y = rand(-40, 0); d.x = rand(0, w * 1.1); }
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + d.len * 0.12, d.y - d.len);
  }
  ctx.stroke();
}

function rainScene(o: Opts): Scene {
  let w = 0, h = 0, drops: Drop[] = [];
  return {
    resize(nw, nh) { w = nw; h = nh; drops = makeDrops(o.reducedMotion ? 50 : 170, w, h); },
    step(ctx, dt) {
      ctx.fillStyle = linear(ctx, h, 'rgba(100,116,139,0.38)', 'rgba(148,163,184,0.15)');
      ctx.fillRect(0, 0, w, h);
      stepDrops(ctx, drops, w, h, dt, 'rgba(120,145,190,0.6)');
    },
  };
}

// ── Sunny ─────────────────────────────────────────────────────────────────────

interface Mote { x: number; y: number; r: number; vy: number; phase: number; }

function sunnyScene(o: Opts): Scene {
  let w = 0, h = 0, motes: Mote[] = [];
  return {
    resize(nw, nh) {
      w = nw; h = nh;
      motes = Array.from({ length: o.reducedMotion ? 10 : 35 }, () => ({
        x: rand(0, w), y: rand(0, h), r: rand(1.5, 4), vy: rand(6, 18), phase: rand(0, 6),
      }));
    },
    step(ctx, dt, t) {
      const sx = w - 90, sy = 90;
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(w, h) * 0.8);
      glow.addColorStop(0, 'rgba(255,214,102,0.6)');
      glow.addColorStop(0.35, 'rgba(255,228,150,0.22)');
      glow.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Rotating rays
      const rot = o.reducedMotion ? 0 : t * 0.05;
      const len = Math.max(w, h) * 0.9;
      ctx.fillStyle = 'rgba(255,220,120,0.12)';
      for (let i = 0; i < 12; i++) {
        const a = rot + (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(a - 0.06) * len, sy + Math.sin(a - 0.06) * len);
        ctx.lineTo(sx + Math.cos(a + 0.06) * len, sy + Math.sin(a + 0.06) * len);
        ctx.closePath();
        ctx.fill();
      }
      // Sun disc
      ctx.fillStyle = 'rgba(255,200,60,0.95)';
      ctx.beginPath();
      ctx.arc(sx, sy, 38, 0, Math.PI * 2);
      ctx.fill();

      for (const m of motes) {
        m.y -= m.vy * dt;
        m.x += Math.sin(t + m.phase) * 6 * dt;
        if (m.y < -5) { m.y = h + 5; m.x = rand(0, w); }
        ctx.fillStyle = `rgba(255,200,80,${0.25 + 0.25 * Math.sin(t * 2 + m.phase)})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}

// ── Autumn leaves ─────────────────────────────────────────────────────────────

interface Leaf { x: number; y: number; size: number; vy: number; rot: number; vr: number; phase: number; color: string; }
const LEAF_COLORS = ['#ea580c', '#c2410c', '#d97706', '#b45309', '#dc2626', '#a16207'];

function autumnScene(o: Opts): Scene {
  let w = 0, h = 0, leaves: Leaf[] = [];
  const newLeaf = (y: number): Leaf => ({
    x: rand(0, w), y, size: rand(8, 16), vy: rand(30, 70), rot: rand(0, 6), vr: rand(-2, 2), phase: rand(0, 6), color: pick(LEAF_COLORS),
  });
  return {
    resize(nw, nh) { w = nw; h = nh; leaves = Array.from({ length: o.reducedMotion ? 12 : 38 }, () => newLeaf(rand(-h, h))); },
    step(ctx, dt, t) {
      ctx.fillStyle = linear(ctx, h, 'rgba(251,191,36,0.2)', 'rgba(194,65,12,0.2)');
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < leaves.length; i++) {
        const l = leaves[i];
        l.y += l.vy * dt;
        l.x += Math.sin(t * 1.2 + l.phase) * 40 * dt;
        l.rot += l.vr * dt;
        if (l.y > h + 20) leaves[i] = newLeaf(-20);
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.fillStyle = l.color;
        ctx.beginPath();
        ctx.moveTo(0, -l.size);
        ctx.quadraticCurveTo(l.size * 0.8, 0, 0, l.size);
        ctx.quadraticCurveTo(-l.size * 0.8, 0, 0, -l.size);
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,30,0,0.5)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -l.size);
        ctx.lineTo(0, l.size * 1.2);
        ctx.stroke();
        ctx.restore();
      }
    },
  };
}

// ── Fireworks ─────────────────────────────────────────────────────────────────

interface Rocket { x: number; y: number; vy: number; targetY: number; hue: number; }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number; hue: number; }

function fireworksScene(o: Opts): Scene {
  let w = 0, h = 0, next = 0;
  let rockets: Rocket[] = [], sparks: Spark[] = [];
  const stars: { x: number; y: number; r: number }[] = [];
  return {
    resize(nw, nh) {
      w = nw; h = nh;
      stars.length = 0;
      for (let i = 0; i < 70; i++) stars.push({ x: rand(0, w), y: rand(0, h * 0.7), r: rand(0.4, 1.3) });
    },
    step(ctx, dt) {
      ctx.fillStyle = linear(ctx, h, 'rgba(15,23,42,0.94)', 'rgba(49,46,129,0.9)');
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (const s of stars) { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }

      next -= dt;
      if (next <= 0) {
        next = o.reducedMotion ? rand(2.5, 4) : rand(0.6, 1.6);
        rockets.push({ x: rand(w * 0.1, w * 0.9), y: h, vy: rand(-650, -480), targetY: rand(h * 0.12, h * 0.45), hue: rand(0, 360) });
      }
      ctx.lineWidth = 2;
      rockets = rockets.filter(r => {
        r.y += r.vy * dt;
        ctx.strokeStyle = `hsla(${r.hue},100%,80%,0.9)`;
        ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x, r.y + 14); ctx.stroke();
        if (r.y <= r.targetY) {
          const count = o.reducedMotion ? 30 : 70;
          for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2, sp = rand(80, 240);
            sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rand(1, 1.8), hue: r.hue + rand(-20, 20) });
          }
          o.emit('burst');
          return false;
        }
        return true;
      });
      sparks = sparks.filter(s => {
        s.life += dt;
        s.vy += 120 * dt;
        s.vx *= 0.985; s.vy *= 0.985;
        const px = s.x, py = s.y;
        s.x += s.vx * dt; s.y += s.vy * dt;
        const a = 1 - s.life / s.max;
        ctx.strokeStyle = `hsla(${s.hue},100%,65%,${a})`;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(s.x, s.y); ctx.stroke();
        return s.life < s.max;
      });
    },
  };
}

// ── Fireflies ─────────────────────────────────────────────────────────────────

interface Fly { x: number; y: number; vx: number; vy: number; phase: number; }

function firefliesScene(o: Opts): Scene {
  let w = 0, h = 0, flies: Fly[] = [];
  return {
    resize(nw, nh) {
      w = nw; h = nh;
      flies = Array.from({ length: o.reducedMotion ? 15 : 45 }, () => ({ x: rand(0, w), y: rand(0, h), vx: rand(-20, 20), vy: rand(-20, 20), phase: rand(0, 6) }));
    },
    step(ctx, dt, t) {
      ctx.fillStyle = linear(ctx, h, 'rgba(6,24,30,0.92)', 'rgba(16,44,30,0.92)');
      ctx.fillRect(0, 0, w, h);
      for (const f of flies) {
        f.vx += rand(-30, 30) * dt; f.vy += rand(-30, 30) * dt;
        f.vx = Math.max(-25, Math.min(25, f.vx)); f.vy = Math.max(-25, Math.min(25, f.vy));
        f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.x < 0) f.x = w; if (f.x > w) f.x = 0;
        if (f.y < 0) f.y = h; if (f.y > h) f.y = 0;
        const glow = Math.max(0, Math.sin(t * 1.6 + f.phase));
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 12);
        g.addColorStop(0, `rgba(217,249,157,${0.9 * glow})`);
        g.addColorStop(1, 'rgba(217,249,157,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(f.x, f.y, 12, 0, Math.PI * 2); ctx.fill();
      }
    },
  };
}

// ── Thunder: storm + yellow electric bolts ────────────────────────────────────

function makeBolt(x: number, h: number): [number, number][][] {
  const main: [number, number][] = [[x, 0]];
  let cx = x, cy = 0;
  const end = rand(h * 0.5, h * 0.85);
  const branches: [number, number][][] = [];
  while (cy < end) {
    cx += rand(-40, 40); cy += rand(20, 45);
    main.push([cx, cy]);
    if (Math.random() < 0.18) {
      const br: [number, number][] = [[cx, cy]];
      let bx = cx, by = cy;
      for (let i = 0; i < 4; i++) { bx += rand(-50, 50); by += rand(15, 35); br.push([bx, by]); }
      branches.push(br);
    }
  }
  return [main, ...branches];
}

function thunderScene(o: Opts): Scene {
  let w = 0, h = 0, drops: Drop[] = [];
  let next = rand(1.5, 3), boltAge = 99;
  let bolt: [number, number][][] = [];
  return {
    resize(nw, nh) { w = nw; h = nh; drops = makeDrops(o.reducedMotion ? 40 : 120, w, h); },
    step(ctx, dt) {
      ctx.fillStyle = linear(ctx, h, 'rgba(30,41,59,0.88)', 'rgba(71,85,105,0.82)');
      ctx.fillRect(0, 0, w, h);
      stepDrops(ctx, drops, w, h, dt, 'rgba(203,213,225,0.45)');

      next -= dt;
      if (next <= 0) {
        next = rand(3, 7);
        bolt = makeBolt(rand(w * 0.1, w * 0.9), h);
        boltAge = 0;
        o.emit('thunder');
      }
      boltAge += dt;
      if (boltAge < 0.45) {
        const a = 1 - boltAge / 0.45;
        // One soft flash per strike — never strobing.
        if (!o.reducedMotion) {
          ctx.fillStyle = `rgba(254,249,195,${0.25 * a})`;
          ctx.fillRect(0, 0, w, h);
        }
        for (const [i, path] of bolt.entries()) {
          for (const [lw, color] of [[i === 0 ? 7 : 4, `rgba(250,204,21,${0.5 * a})`], [i === 0 ? 2.5 : 1.2, `rgba(255,255,255,${a})`]] as const) {
            ctx.strokeStyle = color;
            ctx.lineWidth = lw;
            ctx.beginPath();
            path.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.stroke();
          }
        }
      }
    },
  };
}

// ── Dragon: warm ember backdrop (the dragon itself is a DOM element) ──────────

interface Ember { x: number; y: number; vy: number; r: number; phase: number; }

function dragonScene(o: Opts): Scene {
  let w = 0, h = 0, embers: Ember[] = [];
  return {
    resize(nw, nh) {
      w = nw; h = nh;
      embers = Array.from({ length: o.reducedMotion ? 12 : 40 }, () => ({ x: rand(0, w), y: rand(0, h), vy: rand(20, 60), r: rand(1, 2.5), phase: rand(0, 6) }));
    },
    step(ctx, dt, t) {
      ctx.fillStyle = linear(ctx, h, 'rgba(120,20,20,0.12)', 'rgba(234,88,12,0.25)');
      ctx.fillRect(0, 0, w, h);
      for (const e of embers) {
        e.y -= e.vy * dt;
        e.x += Math.sin(t * 2 + e.phase) * 15 * dt;
        if (e.y < -5) { e.y = h + 5; e.x = rand(0, w); }
        ctx.fillStyle = `rgba(251,146,60,${0.4 + 0.4 * Math.sin(t * 5 + e.phase)})`;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
      }
    },
  };
}

export function createScene(effect: SceneEffect, opts: Opts): Scene | null {
  switch (effect) {
    case 'snow':      return snowScene(opts);
    case 'christmas': return christmasScene(opts);
    case 'rain':      return rainScene(opts);
    case 'sunny':     return sunnyScene(opts);
    case 'autumn':    return autumnScene(opts);
    case 'fireworks': return fireworksScene(opts);
    case 'fireflies': return firefliesScene(opts);
    case 'thunder':   return thunderScene(opts);
    case 'dragon':    return dragonScene(opts);
    default:          return null;
  }
}
