import type { SceneEffect } from './effects.ts';

/**
 * Canvas scenes for the theme effects. The canvas is a transparent overlay
 * drawn ABOVE the page content (pointer-events: none), so scenes never paint
 * a backdrop — the user's own background stays exactly as it is.
 * `emit` fires for moments the sound layer can follow (firework burst, thunder, dragon).
 */

export type SceneEvent = 'burst' | 'thunder' | 'dragon';

/** Live mouse position, kept up to date by SceneEffects. */
export interface Pointer { x: number; y: number; active: boolean; }

export interface Scene {
  resize(w: number, h: number): void;
  step(ctx: CanvasRenderingContext2D, dt: number, t: number): void;
}

interface Opts {
  reducedMotion: boolean;
  emit: (e: SceneEvent) => void;
  pointer: Pointer;
}

const TAU = Math.PI * 2;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Particle count scaled to screen area, so phones and big monitors look equally full. */
function density(w: number, h: number, base: number, reduced: boolean): number {
  const k = clamp((w * h) / (1440 * 900), 0.35, 1.6);
  return Math.max(4, Math.round(base * k * (reduced ? 0.35 : 1)));
}

function makeSprite(size: number, draw: (c: CanvasRenderingContext2D, s: number) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  return c;
}

/** Soft round glow: solid core fading out. Colours are [stop, rgba] pairs. */
function glowSprite(stops: [number, string][], size = 64): HTMLCanvasElement {
  return makeSprite(size, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    for (const [at, col] of stops) g.addColorStop(at, col);
    c.fillStyle = g;
    c.fillRect(0, 0, s, s);
  });
}

/** Slow, layered wind so particles drift together like real weather. */
function wind(t: number): number {
  return Math.sin(t * 0.13) * 0.6 + Math.sin(t * 0.41 + 1.3) * 0.3 + Math.sin(t * 1.7) * 0.1;
}

/** Height of the sticky desktop navbar, so things hanging from the top start below it. */
function topInset(): number {
  const header = document.querySelector('header.sticky');
  return header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
}

// ── Snow ──────────────────────────────────────────────────────────────────────

interface Flake { x: number; y: number; z: number; r: number; vy: number; sway: number; phase: number; }

/**
 * Soft white flake with a faint blue-grey drop shadow underneath, so it reads
 * as a puffy flake in front of white/pastel pages (not a hollow ring).
 */
let flakeSprite: HTMLCanvasElement | null = null;
function getFlakeSprite() {
  flakeSprite ??= makeSprite(64, (c, s) => {
    const shadow = c.createRadialGradient(s * 0.54, s * 0.58, 0, s * 0.54, s * 0.58, s * 0.42);
    shadow.addColorStop(0, 'rgba(90,110,150,0.42)');
    shadow.addColorStop(1, 'rgba(90,110,150,0)');
    c.fillStyle = shadow;
    c.fillRect(0, 0, s, s);
    const flake = c.createRadialGradient(s * 0.47, s * 0.45, 0, s / 2, s / 2, s * 0.3);
    flake.addColorStop(0, 'rgba(255,255,255,1)');
    flake.addColorStop(0.6, 'rgba(250,252,255,0.95)');
    flake.addColorStop(1, 'rgba(235,242,252,0)');
    c.fillStyle = flake;
    c.beginPath(); c.arc(s / 2, s / 2, s * 0.3, 0, TAU); c.fill();
  });
  return flakeSprite;
}

function newFlake(w: number, y: number): Flake {
  const z = Math.random() ** 1.4; // most flakes far away, a few close
  return { x: rand(-40, w + 40), y, z, r: 1.6 + z * z * 5.5, vy: 22 + z * 75, sway: rand(0.6, 1.6), phase: rand(0, TAU) };
}

class SnowField {
  flakes: Flake[] = [];
  /** Snow settling along the bottom edge, one column every 8px. */
  drift: Float32Array = new Float32Array(0);
  private base: number;
  private reduced: boolean;
  private settle: boolean;
  constructor(base: number, reduced: boolean, settle: boolean) {
    this.base = base; this.reduced = reduced; this.settle = settle;
  }

  resize(w: number, h: number) {
    const n = density(w, h, this.base, this.reduced);
    this.flakes = Array.from({ length: n }, () => newFlake(w, rand(-h, h)));
    this.drift = new Float32Array(Math.ceil(w / 8) + 2);
  }

  step(ctx: CanvasRenderingContext2D, w: number, h: number, dt: number, t: number) {
    const sprite = getFlakeSprite();
    const gust = wind(t) * 45;
    for (let i = 0; i < this.flakes.length; i++) {
      const f = this.flakes[i];
      f.y += f.vy * dt;
      f.x += (gust * (0.35 + f.z) + Math.sin(t * f.sway + f.phase) * 14 * (0.4 + f.z)) * dt;
      const col = Math.floor(f.x / 8);
      const ground = h - (this.settle && col >= 0 && col < this.drift.length ? this.drift[col] : 0);
      if (f.y > ground) {
        if (this.settle && f.z > 0.35 && col >= 0 && col < this.drift.length) {
          for (let k = -2; k <= 2; k++) {
            const c = col + k;
            if (c >= 0 && c < this.drift.length) this.drift[c] = Math.min(16, this.drift[c] + 0.35 * (1 - Math.abs(k) * 0.3));
          }
        }
        this.flakes[i] = newFlake(w, rand(-60, -10));
        continue;
      }
      if (f.x > w + 50) f.x = -40;
      else if (f.x < -50) f.x = w + 40;
      const s = f.r * 3.6;
      ctx.globalAlpha = 0.6 + f.z * 0.4;
      ctx.drawImage(sprite, f.x - s / 2, f.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    if (this.settle) this.drawDrift(ctx, h);
  }

  private drawDrift(ctx: CanvasRenderingContext2D, h: number) {
    const d = this.drift;
    ctx.beginPath();
    ctx.moveTo(-8, h);
    for (let i = 0; i < d.length; i++) {
      const smooth = ((d[i - 1] ?? d[i]) + d[i] * 2 + (d[i + 1] ?? d[i])) / 4;
      ctx.lineTo(i * 8, h - smooth);
    }
    ctx.lineTo(d.length * 8, h);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, h - 18, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(226,234,246,0.95)');
    ctx.fillStyle = g;
    ctx.shadowColor = 'rgba(120,145,190,0.45)';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function snowScene(o: Opts): Scene {
  let w = 0, h = 0;
  const field = new SnowField(230, o.reducedMotion, true);
  return {
    resize(nw, nh) { w = nw; h = nh; field.resize(w, h); },
    step(ctx, dt, t) { field.step(ctx, w, h, dt, t); },
  };
}

// ── Christmas: fairy-light garland along the top + light snow ─────────────────

interface Bulb { x: number; y: number; color: string; phase: number; }
const BULB_COLORS = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#ec4899', '#f97316'];

function christmasScene(o: Opts): Scene {
  let w = 0, h = 0, top = 0;
  let bulbs: Bulb[] = [];
  let wires: [number, number, number, number, number, number][] = []; // x0,y0,cx,cy,x1,y1
  const field = new SnowField(90, o.reducedMotion, false);
  const halo = new Map<string, HTMLCanvasElement>();
  const haloFor = (c: string) => {
    let s = halo.get(c);
    if (!s) {
      s = glowSprite([[0, c + 'cc'], [0.35, c + '55'], [1, c + '00']]);
      halo.set(c, s);
    }
    return s;
  };

  return {
    resize(nw, nh) {
      w = nw; h = nh; top = topInset();
      field.resize(w, h);
      // Garland hangs in sagging loops between hooks.
      const span = clamp(w / 5, 180, 320);
      const loops = Math.ceil(w / span);
      bulbs = []; wires = [];
      let ci = 0;
      for (let i = 0; i < loops; i++) {
        const x0 = i * span, x1 = x0 + span, sag = rand(34, 52);
        const y0 = top + 4;
        wires.push([x0, y0, (x0 + x1) / 2, y0 + sag * 2, x1, y0]);
        const count = Math.round(span / 30);
        for (let k = 1; k < count; k++) {
          const u = k / count;
          const x = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * ((x0 + x1) / 2) + u * u * x1;
          const y = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * (y0 + sag * 2) + u * u * y0;
          bulbs.push({ x, y, color: BULB_COLORS[ci++ % BULB_COLORS.length], phase: rand(0, TAU) });
        }
      }
    },
    step(ctx, dt, t) {
      field.step(ctx, w, h, dt, t);

      ctx.strokeStyle = 'rgba(21,83,45,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const [x0, y0, cx, cy, x1, y1] of wires) { ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); }
      ctx.stroke();

      for (const b of bulbs) {
        const on = o.reducedMotion ? 0.85 : 0.55 + 0.45 * Math.sin(t * 2.2 + b.phase) ** 2;
        ctx.globalAlpha = on;
        ctx.drawImage(haloFor(b.color), b.x - 22, b.y - 14, 44, 44);
        ctx.globalAlpha = 1;
        // Socket + glass bulb hanging below the wire
        ctx.fillStyle = '#14532d';
        ctx.fillRect(b.x - 2.5, b.y - 1, 5, 5);
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + 9, 4.2, 6.5, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.4 * on})`;
        ctx.beginPath();
        ctx.ellipse(b.x - 1.3, b.y + 7, 1.2, 2.4, 0, 0, TAU);
        ctx.fill();
      }
    },
  };
}

// ── Rain ──────────────────────────────────────────────────────────────────────

interface Drop { x: number; y: number; z: number; len: number; vy: number; }
interface Splash { x: number; y: number; vx: number; vy: number; life: number; }
interface Ripple { x: number; y: number; age: number; }

class RainField {
  drops: Drop[] = [];
  splashes: Splash[] = [];
  ripples: Ripple[] = [];
  private base: number;
  private reduced: boolean;
  private tint: [number, number, number];
  constructor(base: number, reduced: boolean, tint: [number, number, number]) {
    this.base = base; this.reduced = reduced; this.tint = tint;
  }

  private newDrop(w: number, y: number): Drop {
    const z = Math.random() ** 1.3;
    return { x: rand(-100, w + 100), y, z, len: 12 + z * 26, vy: 750 + z * 650 };
  }

  resize(w: number, h: number) {
    this.drops = Array.from({ length: density(w, h, this.base, this.reduced) }, () => this.newDrop(w, rand(-h, h)));
    this.splashes = [];
    this.ripples = [];
  }

  step(ctx: CanvasRenderingContext2D, w: number, h: number, dt: number, t: number) {
    const slant = 0.12 + wind(t) * 0.1;
    const [r, g, b] = this.tint;
    ctx.lineCap = 'round';
    // Draw far → near in three batches so each depth gets its own width/alpha.
    for (const [lo, hi] of [[0, 0.33], [0.33, 0.66], [0.66, 1.01]] as const) {
      const z = (lo + hi) / 2;
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.18 + z * 0.4})`;
      ctx.lineWidth = 0.6 + z * 1.1;
      ctx.beginPath();
      for (let i = 0; i < this.drops.length; i++) {
        const d = this.drops[i];
        if (d.z < lo || d.z >= hi) continue;
        d.y += d.vy * dt;
        d.x += d.vy * slant * dt;
        if (d.y > h) {
          if (d.z > 0.55 && !this.reduced) this.splash(d.x, h - rand(0, 6));
          this.drops[i] = this.newDrop(w, rand(-80, -10));
          continue;
        }
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * slant, d.y - d.len);
      }
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(${r},${g},${b},0.55)`;
    this.splashes = this.splashes.filter(s => {
      s.life += dt;
      s.vy += 900 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      ctx.globalAlpha = 1 - s.life / 0.35;
      ctx.fillRect(s.x, s.y, 1.6, 1.6);
      return s.life < 0.35;
    });
    ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
    ctx.lineWidth = 1;
    this.ripples = this.ripples.filter(p => {
      p.age += dt;
      ctx.globalAlpha = 0.6 * (1 - p.age / 0.5);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 2 + p.age * 26, 0.6 + p.age * 5, 0, 0, TAU);
      ctx.stroke();
      return p.age < 0.5;
    });
    ctx.globalAlpha = 1;
  }

  private splash(x: number, y: number) {
    this.ripples.push({ x, y, age: 0 });
    for (let k = 0; k < 3; k++) this.splashes.push({ x, y, vx: rand(-70, 70), vy: rand(-220, -110), life: 0 });
  }
}

function rainScene(o: Opts): Scene {
  let w = 0, h = 0;
  const field = new RainField(260, o.reducedMotion, [96, 122, 168]);
  return {
    resize(nw, nh) { w = nw; h = nh; field.resize(w, h); },
    step(ctx, dt, t) { field.step(ctx, w, h, dt, t); },
  };
}

// ── Sunny: warm light from the corner, soft beams, lens flare, floating dust ──

interface Mote { x: number; y: number; r: number; vx: number; vy: number; phase: number; }

function sunnyScene(o: Opts): Scene {
  let w = 0, h = 0, motes: Mote[] = [];
  const dust = glowSprite([[0, 'rgba(255,236,170,0.95)'], [0.4, 'rgba(255,214,120,0.5)'], [1, 'rgba(255,214,120,0)']], 32);
  return {
    resize(nw, nh) {
      w = nw; h = nh;
      motes = Array.from({ length: density(w, h, 55, o.reducedMotion) }, () => ({
        x: rand(0, w), y: rand(0, h), r: rand(1.5, 4.5), vx: rand(-6, 6), vy: rand(-10, -2), phase: rand(0, TAU),
      }));
    },
    step(ctx, dt, t) {
      const sx = w - 40, sy = 30;
      const breathe = o.reducedMotion ? 1 : 0.9 + 0.1 * Math.sin(t * 0.6);
      const reach = Math.max(w, h);

      // Warm wash only near the sun; the rest of the page stays untouched.
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, reach * 0.55);
      glow.addColorStop(0, `rgba(255,226,140,${0.55 * breathe})`);
      glow.addColorStop(0.18, `rgba(255,214,120,${0.22 * breathe})`);
      glow.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Soft god-rays fanning down-left, each fading along its length.
      ctx.save();
      ctx.translate(sx, sy);
      const rot = o.reducedMotion ? 0 : Math.sin(t * 0.07) * 0.05;
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * 0.55 + i * 0.11 + rot + Math.sin(t * 0.3 + i) * 0.01;
        const spread = 0.025 + (i % 3) * 0.012;
        const g = ctx.createLinearGradient(0, 0, Math.cos(a) * reach, Math.sin(a) * reach);
        g.addColorStop(0, `rgba(255,236,170,${0.16 * breathe})`);
        g.addColorStop(1, 'rgba(255,236,170,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - spread) * reach, Math.sin(a - spread) * reach);
        ctx.lineTo(Math.cos(a + spread) * reach, Math.sin(a + spread) * reach);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Lens flare: rings along the line from the sun through the screen centre.
      const cx = w / 2, cy = h / 2;
      for (const [k, r, a, col] of [[0.35, 26, 0.10, '255,200,120'], [0.62, 12, 0.14, '180,220,255'], [0.9, 40, 0.06, '255,170,200'], [1.25, 18, 0.09, '200,255,200']] as const) {
        const fx = sx + (cx - sx) * k * 2, fy = sy + (cy - sy) * k * 2;
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
        g.addColorStop(0, `rgba(${col},${a * breathe})`);
        g.addColorStop(0.7, `rgba(${col},${a * 0.6 * breathe})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(fx, fy, r, 0, TAU); ctx.fill();
      }

      // Sun core
      const core = ctx.createRadialGradient(sx, sy, 0, sx, sy, 70);
      core.addColorStop(0, 'rgba(255,255,240,1)');
      core.addColorStop(0.3, 'rgba(255,236,160,0.9)');
      core.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(sx, sy, 70, 0, TAU); ctx.fill();

      // Dust catching the light
      for (const m of motes) {
        m.x += (m.vx + Math.sin(t * 0.7 + m.phase) * 5) * dt;
        m.y += m.vy * dt;
        if (m.y < -8) { m.y = h + 8; m.x = rand(0, w); }
        if (m.x < -8) m.x = w + 8; else if (m.x > w + 8) m.x = -8;
        ctx.globalAlpha = 0.25 + 0.6 * Math.max(0, Math.sin(t * 1.3 + m.phase));
        const s = m.r * 4;
        ctx.drawImage(dust, m.x - s / 2, m.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    },
  };
}

// ── Autumn: tumbling maple + oval leaves ──────────────────────────────────────

interface Leaf {
  x: number; y: number; size: number; vy: number;
  swing: number; swingSpeed: number; phase: number;
  spin: number; flip: number; flipSpeed: number; sprite: HTMLCanvasElement;
}
const LEAF_TONES: [string, string][] = [
  ['#f97316', '#9a3412'], ['#ef4444', '#7f1d1d'], ['#f59e0b', '#92400e'],
  ['#ca8a04', '#713f12'], ['#dc2626', '#9a3412'], ['#b45309', '#451a03'],
];

function mapleLeafPath(c: CanvasRenderingContext2D, s: number) {
  // Lobed outline from a polar curve; the stem points down.
  const cx = s / 2, cy = s * 0.55, R = s * 0.42;
  c.beginPath();
  for (let i = 0; i <= 120; i++) {
    const a = -Math.PI / 2 + (i / 120) * TAU;
    const lobes = Math.abs(Math.cos((a + Math.PI / 2) * 2.5));
    const notch = 0.55 + 0.45 * lobes ** 0.55;
    const bottomCut = Math.sin(a) > 0.75 ? 0.45 : 1; // flatter base around the stem
    const r = R * notch * bottomCut;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.95;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.closePath();
}

function ovalLeafPath(c: CanvasRenderingContext2D, s: number) {
  c.beginPath();
  c.moveTo(s / 2, s * 0.08);
  c.bezierCurveTo(s * 0.9, s * 0.3, s * 0.82, s * 0.72, s / 2, s * 0.86);
  c.bezierCurveTo(s * 0.18, s * 0.72, s * 0.1, s * 0.3, s / 2, s * 0.08);
  c.closePath();
}

function makeLeafSprite(kind: 'maple' | 'oval', [light, dark]: [string, string]): HTMLCanvasElement {
  return makeSprite(64, (c, s) => {
    (kind === 'maple' ? mapleLeafPath : ovalLeafPath)(c, s);
    const g = c.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, light);
    g.addColorStop(1, dark);
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = 'rgba(60,20,0,0.35)';
    c.lineWidth = 1;
    c.stroke();
    // Veins
    c.strokeStyle = 'rgba(60,20,0,0.45)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(s / 2, s * 0.98); c.lineTo(s / 2, s * 0.16);
    for (const [y, dx, dy] of [[0.62, 0.22, -0.16], [0.48, 0.18, -0.14], [0.34, 0.12, -0.1]]) {
      c.moveTo(s / 2, s * y); c.lineTo(s * (0.5 - dx), s * (y + dy));
      c.moveTo(s / 2, s * y); c.lineTo(s * (0.5 + dx), s * (y + dy));
    }
    c.stroke();
  });
}

function autumnScene(o: Opts): Scene {
  let w = 0, h = 0, leaves: Leaf[] = [];
  const sprites = LEAF_TONES.flatMap(tone => [makeLeafSprite('maple', tone), makeLeafSprite('oval', tone)]);
  const newLeaf = (y: number): Leaf => ({
    x: rand(-40, w + 40), y, size: rand(24, 46), vy: rand(35, 75),
    swing: rand(25, 70), swingSpeed: rand(0.8, 1.6), phase: rand(0, TAU),
    spin: rand(-1.2, 1.2), flip: rand(0, TAU), flipSpeed: rand(1.5, 4), sprite: pick(sprites),
  });
  return {
    resize(nw, nh) { w = nw; h = nh; leaves = Array.from({ length: density(w, h, 44, o.reducedMotion) }, () => newLeaf(rand(-h, h))); },
    step(ctx, dt, t) {
      const gust = wind(t) * 60;
      for (let i = 0; i < leaves.length; i++) {
        const l = leaves[i];
        const sw = Math.sin(t * l.swingSpeed + l.phase);
        // Pendulum flutter: drifts side to side, falls faster at the bottom of each swing.
        l.y += l.vy * (0.75 + 0.35 * Math.abs(Math.cos(t * l.swingSpeed + l.phase))) * dt;
        l.x += (gust + Math.cos(t * l.swingSpeed + l.phase) * l.swing) * dt;
        l.flip += l.flipSpeed * dt;
        if (l.y > h + 40 || l.x > w + 80 || l.x < -80) { leaves[i] = newLeaf(rand(-60, -20)); continue; }
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(sw * 0.7 + l.spin * t * 0.3);
        ctx.scale(Math.cos(l.flip), 1); // tumbling: leaf turns edge-on and over
        ctx.globalAlpha = 0.95;
        ctx.drawImage(l.sprite, -l.size / 2, -l.size / 2, l.size, l.size);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    },
  };
}

// ── Fireworks ─────────────────────────────────────────────────────────────────

interface Rocket { x: number; y: number; vx: number; vy: number; targetY: number; hue: number; }
interface Spark {
  x: number; y: number; px: number; py: number; vx: number; vy: number;
  life: number; max: number; hue: number; light: number; drag: number; gravity: number; twinkle: boolean;
}
interface Flash { x: number; y: number; age: number; hue: number; }

function fireworksScene(o: Opts): Scene {
  let w = 0, h = 0, next = 0.3;
  let rockets: Rocket[] = [], sparks: Spark[] = [], flashes: Flash[] = [];

  function explode(r: Rocket) {
    const kind = pick(['peony', 'peony', 'ring', 'willow', 'crackle'] as const);
    const count = (o.reducedMotion ? 0.4 : 1) * (kind === 'ring' ? 60 : kind === 'willow' ? 90 : 110);
    const power = rand(160, 260);
    for (let i = 0; i < count; i++) {
      const a = kind === 'ring' ? (i / count) * TAU : rand(0, TAU);
      const sp = kind === 'ring' ? power : power * Math.cbrt(Math.random()); // even fill of a sphere
      const willow = kind === 'willow';
      sparks.push({
        x: r.x, y: r.y, px: r.x, py: r.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * (kind === 'ring' ? 0.55 : 1),
        life: 0, max: willow ? rand(2.2, 3) : rand(1.1, 1.8),
        hue: willow ? 40 : r.hue + rand(-15, 15), light: willow ? 55 : rand(50, 62),
        drag: willow ? 0.965 : 0.978, gravity: willow ? 70 : 110, twinkle: kind === 'crackle',
      });
    }
    flashes.push({ x: r.x, y: r.y, age: 0, hue: r.hue });
    o.emit('burst');
  }

  return {
    resize(nw, nh) { w = nw; h = nh; },
    step(ctx, dt) {
      next -= dt;
      if (next <= 0) {
        next = o.reducedMotion ? rand(2.5, 4) : rand(0.7, 1.8);
        const x = rand(w * 0.12, w * 0.88);
        rockets.push({ x, y: h + 10, vx: rand(-40, 40), vy: rand(-760, -600), targetY: rand(h * 0.12, h * 0.42), hue: rand(0, 360) });
      }

      flashes = flashes.filter(f => {
        f.age += dt;
        const a = 0.22 * (1 - f.age / 0.35);
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 160);
        g.addColorStop(0, `hsla(${f.hue},100%,75%,${a})`);
        g.addColorStop(1, `hsla(${f.hue},100%,75%,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(f.x - 160, f.y - 160, 320, 320);
        return f.age < 0.35;
      });

      ctx.lineCap = 'round';
      rockets = rockets.filter(r => {
        const px = r.x, py = r.y;
        r.vy += 260 * dt; // slows as it climbs
        r.x += r.vx * dt; r.y += r.vy * dt;
        ctx.strokeStyle = 'rgba(255,214,150,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, py + 18); ctx.lineTo(r.x, r.y); ctx.stroke();
        if (!o.reducedMotion && Math.random() < 0.6) {
          sparks.push({ x: r.x, y: r.y + 6, px: r.x, py: r.y + 6, vx: rand(-20, 20), vy: rand(20, 60), life: 0, max: 0.5, hue: 35, light: 70, drag: 0.95, gravity: 60, twinkle: false });
        }
        if (r.y <= r.targetY || r.vy >= -80) { explode(r); return false; }
        return true;
      });

      sparks = sparks.filter(s => {
        s.life += dt;
        s.px = s.x; s.py = s.y;
        s.vx *= s.drag; s.vy = s.vy * s.drag + s.gravity * dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
        let a = 1 - s.life / s.max;
        if (s.twinkle && s.life > s.max * 0.5) a *= Math.random() < 0.5 ? 1 : 0.15;
        // Bright head + coloured trail, drawn as a short streak from last position.
        ctx.strokeStyle = `hsla(${s.hue},100%,${s.light}%,${a})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(s.px - s.vx * 0.04, s.py - s.vy * 0.04); ctx.lineTo(s.x, s.y); ctx.stroke();
        ctx.fillStyle = `hsla(${s.hue},100%,85%,${a})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, 1.8, 0, TAU); ctx.fill();
        return s.life < s.max;
      });
    },
  };
}

// ── Fireflies ─────────────────────────────────────────────────────────────────

interface Fly { x: number; y: number; heading: number; speed: number; turn: number; blink: number; period: number; }

function firefliesScene(o: Opts): Scene {
  let w = 0, h = 0, flies: Fly[] = [];
  const glow = glowSprite([
    [0, 'rgba(255,255,200,1)'],
    [0.14, 'rgba(225,250,80,1)'],
    [0.38, 'rgba(160,210,20,0.55)'],
    [1, 'rgba(120,180,10,0)'],
  ]);
  return {
    resize(nw, nh) {
      w = nw; h = nh;
      flies = Array.from({ length: density(w, h, 40, o.reducedMotion) }, () => ({
        x: rand(0, w), y: rand(h * 0.15, h), heading: rand(0, TAU), speed: rand(14, 34), turn: 0,
        blink: rand(0, 4), period: rand(2.5, 5),
      }));
    },
    step(ctx, dt) {
      for (const f of flies) {
        // Smooth wandering: turn rate drifts, so paths curve instead of jitter.
        f.turn = clamp(f.turn + rand(-3, 3) * dt, -1.4, 1.4);
        f.heading += f.turn * dt;
        f.x += Math.cos(f.heading) * f.speed * dt;
        f.y += Math.sin(f.heading) * f.speed * dt - 3 * dt;
        if (f.x < -20) f.x = w + 20; else if (f.x > w + 20) f.x = -20;
        if (f.y < -20) f.y = h + 20; else if (f.y > h + 20) f.y = -20;

        // Real fireflies flash: quick rise, slow fade, then dark.
        f.blink = (f.blink + dt) % f.period;
        const p = f.blink;
        const lit = p < 0.25 ? p / 0.25 : p < 1.2 ? 1 - (p - 0.25) / 0.95 : 0;
        const s = 12 + lit * 44;
        ctx.globalAlpha = 0.18 + lit * 0.82;
        ctx.drawImage(glow, f.x - s / 2, f.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    },
  };
}

// ── Thunder: storm rain + yellow electric lightning ───────────────────────────

type Path = [number, number][];

/** Midpoint-displacement bolt with forking branches. */
function makeBolt(x0: number, y0: number, x1: number, y1: number, rough: number, depth: number, out: { path: Path; main: boolean }[], main: boolean) {
  let pts: Path = [[x0, y0], [x1, y1]];
  let off = rough;
  for (let i = 0; i < 6; i++) {
    const nextPts: Path = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[k + 1];
      const mx = (ax + bx) / 2 + rand(-off, off), my = (ay + by) / 2 + rand(-off, off) * 0.3;
      nextPts.push([ax, ay], [mx, my]);
      if (depth > 0 && i === 3 && Math.random() < 0.25) {
        const len = Math.hypot(bx - x0, by - y0) * rand(0.25, 0.5);
        const a = Math.atan2(by - ay, bx - ax) + rand(-0.9, 0.9);
        makeBolt(mx, my, mx + Math.cos(a) * len, my + Math.abs(Math.sin(a)) * len, off * 0.8, depth - 1, out, false);
      }
    }
    nextPts.push(pts[pts.length - 1]);
    pts = nextPts;
    off /= 2;
  }
  out.push({ path: pts, main });
}

function thunderScene(o: Opts): Scene {
  let w = 0, h = 0, next = rand(1.5, 3), age = 99;
  let bolts: { path: Path; main: boolean }[] = [];
  const rain = new RainField(240, o.reducedMotion, [75, 90, 120]);
  // Flicker timeline (seconds → brightness): strike, dip, restrike, fade.
  const flicker = (a: number) => (a < 0.06 ? 1 : a < 0.11 ? 0.15 : a < 0.2 ? 0.9 : a < 0.6 ? 0.9 * (1 - (a - 0.2) / 0.4) : 0);

  return {
    resize(nw, nh) { w = nw; h = nh; rain.resize(w, h); },
    step(ctx, dt, t) {
      rain.step(ctx, w, h, dt, t);
      next -= dt;
      if (next <= 0) {
        next = rand(3.5, 8);
        bolts = [];
        const x = rand(w * 0.1, w * 0.9);
        makeBolt(x, -10, x + rand(-w * 0.15, w * 0.15), rand(h * 0.55, h * 0.95), 90, 2, bolts, true);
        age = 0;
        o.emit('thunder');
      }
      age += dt;
      const b = o.reducedMotion ? Math.max(0, 1 - age / 0.6) * 0.8 : flicker(age);
      if (b <= 0) return;

      // Gentle sky flash — tinted, never a full white strobe.
      ctx.fillStyle = `rgba(254,249,195,${0.1 * b})`;
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const { path, main } of bolts) {
        for (const [lw, col] of [
          [main ? 16 : 7, `rgba(234,179,8,${0.22 * b})`],
          [main ? 7 : 3.5, `rgba(250,204,21,${0.95 * b})`],
          [main ? 2.4 : 1.2, `rgba(255,255,235,${b})`],
        ] as const) {
          ctx.strokeStyle = col;
          ctx.lineWidth = lw;
          ctx.beginPath();
          path.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.stroke();
        }
      }
    },
  };
}

// ── Dragon: a serpentine dragon flying over the page ──────────────────────────
//
// Roams between random waypoints, eyes on the mouse. If the pointer comes
// close it flees off the nearest edge, waits, then sneaks back in from the
// side farthest from the pointer. Occasionally breathes a puff of fire.

interface Fire { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; }

const SEGMENTS = 36;
const SEG_GAP = 7;
const HEAD_SCALE = 1.45;

function dragonScene(o: Opts): Scene {
  let w = 0, h = 0, scale = 1;
  let x = -200, y = 200, vx = 0, vy = 0;
  let tx = 0, ty = 0;
  let mode: 'roam' | 'flee' | 'away' = 'away';
  let awayFor = 0.6, breathIn = rand(5, 9), breathing = 0;
  let trail: Path = [];
  let fire: Fire[] = [];
  let look = 0; // head turn towards the pointer, radians
  let flap = 0;
  const fireGlow = glowSprite([[0, 'rgba(255,250,200,1)'], [0.25, 'rgba(255,190,60,0.9)'], [0.6, 'rgba(240,80,20,0.45)'], [1, 'rgba(160,30,10,0)']]);

  const margin = () => 80 * scale;
  function newWaypoint() {
    tx = rand(margin(), w - margin());
    ty = rand(margin() + topInset(), h - margin());
  }

  function enter() {
    // Come back from the edge farthest from the pointer.
    const p = o.pointer;
    const px = p.active ? p.x : w / 2, py = p.active ? p.y : h / 2;
    const edges = [
      { x: -120, y: rand(h * 0.2, h * 0.8), d: px },
      { x: w + 120, y: rand(h * 0.2, h * 0.8), d: w - px },
      { x: rand(w * 0.2, w * 0.8), y: h + 120, d: h - py },
    ];
    const e = edges.reduce((a, b) => (b.d > a.d ? b : a));
    x = e.x; y = e.y; vx = 0; vy = 0;
    trail = Array.from({ length: SEGMENTS * 2 }, () => [x, y] as [number, number]);
    newWaypoint();
    mode = 'roam';
  }

  function fleeFrom(px: number, py: number) {
    mode = 'flee';
    const dx = x - px, dy = y - py;
    const len = Math.hypot(dx, dy) || 1;
    tx = x + (dx / len) * Math.max(w, h);
    ty = y + (dy / len) * Math.max(w, h);
    breathing = 0;
    o.emit('dragon');
  }

  /** Point `d` px back along the trail from the head. */
  function along(d: number): [number, number] {
    let left = d;
    for (let i = trail.length - 1; i > 0; i--) {
      const [ax, ay] = trail[i], [bx, by] = trail[i - 1];
      const seg = Math.hypot(ax - bx, ay - by);
      if (seg >= left) { const k = seg ? left / seg : 0; return [ax + (bx - ax) * k, ay + (by - ay) * k]; }
      left -= seg;
    }
    return trail[0];
  }

  function drawWing(ctx: CanvasRenderingContext2D, side: 1 | -1, open: number) {
    // Local frame: +x = towards head, +y = side. Bat-like membrane with ribs.
    const span = 100 * open, sweep = -26;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(14, side * span * 0.55, sweep + 6, side * span);
    ctx.quadraticCurveTo(sweep - 4, side * span * 0.62, sweep - 14, side * span * 0.78);
    ctx.quadraticCurveTo(sweep - 16, side * span * 0.42, sweep - 30, side * span * 0.5);
    ctx.quadraticCurveTo(-24, side * span * 0.2, -22, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, side * span);
    g.addColorStop(0, 'rgba(13,148,136,0.9)');
    g.addColorStop(1, 'rgba(94,234,212,0.55)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(17,94,89,0.9)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, 0); ctx.lineTo(sweep + 6, side * span);
    ctx.moveTo(8, 0); ctx.lineTo(sweep - 14, side * span * 0.78);
    ctx.moveTo(8, 0); ctx.lineTo(sweep - 30, side * span * 0.5);
    ctx.stroke();
  }

  function drawHead(ctx: CanvasRenderingContext2D, hx: number, hy: number, angle: number, t: number) {
    const facingLeft = Math.cos(angle) < 0;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle + look);
    const hs = scale * HEAD_SCALE;
    ctx.scale(hs, facingLeft ? -hs : hs); // keep the eye on top whichever way it flies
    const jaw = breathing > 0 ? 0.35 : 0.06;

    // Whiskers trailing back
    ctx.strokeStyle = 'rgba(251,191,36,0.9)';
    ctx.lineWidth = 1.5;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(26, s * 3);
      ctx.bezierCurveTo(10, s * 18 + Math.sin(t * 3) * 4, -20, s * 10 + Math.sin(t * 3 + 1) * 8, -46, s * 22 + Math.sin(t * 2.4 + s) * 8);
      ctx.stroke();
    }
    // Mane
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#f97316' : '#dc2626';
      ctx.beginPath();
      const bx = -4 - i * 5;
      ctx.moveTo(bx + 6, -9);
      ctx.quadraticCurveTo(bx - 8, -22 - i * 2 + Math.sin(t * 4 + i) * 3, bx - 18, -14 + Math.sin(t * 4 + i) * 4);
      ctx.quadraticCurveTo(bx - 6, -12, bx, -6);
      ctx.fill();
    }
    // Horns
    ctx.fillStyle = '#fde68a';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1;
    for (const [ox, len] of [[0, 30], [-6, 24]]) {
      ctx.beginPath();
      ctx.moveTo(ox + 4, -9);
      ctx.quadraticCurveTo(ox - 10, -22, ox - len, -24);
      ctx.quadraticCurveTo(ox - 8, -16, ox - 2, -6);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    // Lower jaw
    ctx.save();
    ctx.rotate(jaw);
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.moveTo(-8, 4);
    ctx.quadraticCurveTo(14, 12, 30, 6);
    ctx.lineTo(28, 2);
    ctx.quadraticCurveTo(10, 4, -8, 0);
    ctx.fill();
    ctx.restore();
    // Skull + snout
    const g = ctx.createLinearGradient(0, -14, 0, 8);
    g.addColorStop(0, '#0f766e');
    g.addColorStop(1, '#14b8a6');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-14, -2);
    ctx.bezierCurveTo(-14, -16, 4, -16, 10, -9);
    ctx.quadraticCurveTo(22, -8, 32, -2);
    ctx.quadraticCurveTo(36, 1, 31, 4);
    ctx.quadraticCurveTo(14, 5, -10, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#134e4a';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Teeth when the mouth opens
    if (jaw > 0.1) {
      ctx.fillStyle = '#fff';
      for (let k = 0; k < 4; k++) {
        ctx.beginPath(); ctx.moveTo(14 + k * 4, 4); ctx.lineTo(16 + k * 4, 8); ctx.lineTo(18 + k * 4, 4); ctx.fill();
      }
    }
    // Nostril + brow
    ctx.fillStyle = '#134e4a';
    ctx.beginPath(); ctx.ellipse(29, -2, 1.8, 1.1, 0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#134e4a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-2, -12); ctx.quadraticCurveTo(5, -15, 12, -10); ctx.stroke();
    // Eye — slit pupil looks at the pointer
    const ex = 4, ey = -7;
    const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 5);
    eg.addColorStop(0, '#fef9c3');
    eg.addColorStop(1, '#f59e0b');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.ellipse(ex, ey, 5, 3.6, 0, 0, TAU); ctx.fill();
    let pdx = 0, pdy = 0;
    if (o.pointer.active) {
      const a = Math.atan2(o.pointer.y - hy, o.pointer.x - hx) - (angle + look);
      pdx = Math.cos(a) * 2;
      pdy = Math.sin(a) * 1.4 * (facingLeft ? -1 : 1);
    }
    ctx.fillStyle = '#1c1917';
    ctx.beginPath(); ctx.ellipse(ex + pdx, ey + pdy, 1.1, 3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(ex + 1.6, ey - 1.4, 0.9, 0, TAU); ctx.fill();
    ctx.restore();
  }

  return {
    resize(nw, nh) {
      w = nw; h = nh;
      scale = clamp(Math.min(w, h) / 900, 0.6, 1.05);
      if (mode !== 'away') newWaypoint();
    },
    step(ctx, dt, t) {
      const p = o.pointer;
      const speed = (mode === 'flee' ? 520 : o.reducedMotion ? 70 : 150) * scale;

      if (mode === 'away') {
        awayFor -= dt;
        if (awayFor <= 0) enter();
        else return drawFire(ctx, dt);
      }

      // Steering towards the target, with a serpentine side-to-side wiggle.
      const dx = tx - x, dy = ty - y;
      const dist = Math.hypot(dx, dy) || 1;
      const steer = mode === 'flee' ? 6 : 1.4;
      vx += ((dx / dist) * speed - vx) * steer * dt;
      vy += ((dy / dist) * speed - vy) * steer * dt;
      const sp = Math.hypot(vx, vy) || 1;
      const wig = o.reducedMotion ? 0 : Math.sin(t * 3.2) * 55 * scale;
      x += (vx + (-vy / sp) * wig) * dt;
      y += (vy + (vx / sp) * wig) * dt;

      if (mode === 'roam' && dist < 60 * scale) newWaypoint();
      if (mode === 'flee' && (x < -250 || x > w + 250 || y < -250 || y > h + 250)) {
        mode = 'away';
        awayFor = rand(1.4, 2.6);
        return drawFire(ctx, dt);
      }

      // Trail of head positions; the body follows it like a ribbon.
      const last = trail[trail.length - 1];
      if (!last || Math.hypot(x - last[0], y - last[1]) > 2) {
        trail.push([x, y]);
        if (trail.length > SEGMENTS * SEG_GAP) trail.shift();
      }

      const heading = Math.atan2(vy, vx);
      // Turn head a little towards the pointer — it's watching you.
      let wantLook = 0;
      if (p.active && mode === 'roam') {
        const a = Math.atan2(p.y - y, p.x - x) - heading;
        wantLook = clamp(Math.atan2(Math.sin(a), Math.cos(a)), -0.6, 0.6);
      }
      look += (wantLook - look) * Math.min(1, dt * 4);

      // Flee if the pointer gets close to the head or front of the body.
      if (mode === 'roam' && p.active) {
        const near = 170 * scale;
        let hit = Math.hypot(p.x - x, p.y - y) < near;
        for (let i = 6; !hit && i < SEGMENTS * 0.5; i += 6) {
          const [bx, by] = along(i * SEG_GAP * scale);
          hit = Math.hypot(p.x - bx, p.y - by) < near * 0.6;
        }
        if (hit) fleeFrom(p.x, p.y);
      }

      // Fire breath now and then while roaming.
      if (mode === 'roam' && !o.reducedMotion) {
        breathIn -= dt;
        if (breathIn <= 0) { breathing = 0.9; breathIn = rand(7, 13); }
      }
      if (breathing > 0) {
        breathing -= dt;
        const a = heading + look;
        const mx = x + Math.cos(a) * 46 * scale, my = y + Math.sin(a) * 46 * scale;
        for (let k = 0; k < 3; k++) {
          const s = rand(200, 300) * scale, sa = a + rand(-0.15, 0.15);
          fire.push({ x: mx, y: my, vx: Math.cos(sa) * s + vx * 0.5, vy: Math.sin(sa) * s + vy * 0.5, life: 0, max: rand(0.4, 0.7), size: rand(7, 12) * scale });
        }
      }

      flap += dt * (mode === 'flee' ? 14 : 6);
      drawBody(ctx, t);
      drawHead(ctx, x, y, heading, t);
      drawFire(ctx, dt);
    },
  };

  function drawBody(ctx: CanvasRenderingContext2D, t: number) {
    // Sample the spine, then build left/right edges for a tapered ribbon.
    const spine: [number, number][] = [];
    for (let i = 0; i < SEGMENTS; i++) spine.push(along((i + 1.5) * SEG_GAP * scale));
    const radius = (i: number) => {
      const k = i / SEGMENTS;
      return scale * (2.5 + 13 * (1 - k) ** 0.9 + 5 * Math.exp(-((k - 0.14) ** 2) / 0.008));
    };
    const left: [number, number][] = [], right: [number, number][] = [], normals: [number, number][] = [];
    for (let i = 0; i < spine.length; i++) {
      const [ax, ay] = spine[Math.max(0, i - 1)], [bx, by] = spine[Math.min(spine.length - 1, i + 1)];
      const tlen = Math.hypot(bx - ax, by - ay) || 1;
      const nx = -(by - ay) / tlen, ny = (bx - ax) / tlen;
      normals.push([nx, ny]);
      const r = radius(i);
      left.push([spine[i][0] + nx * r, spine[i][1] + ny * r]);
      right.push([spine[i][0] - nx * r, spine[i][1] - ny * r]);
    }

    // Wings sit just behind the shoulders; the far wing is drawn first.
    const wi = 5;
    const [wx, wy] = spine[wi];
    const wa = Math.atan2(spine[wi - 1][1] - spine[wi + 1][1], spine[wi - 1][0] - spine[wi + 1][0]);
    const open = o.reducedMotion ? 0.8 : 0.45 + 0.55 * Math.abs(Math.sin(flap));
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(wa);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.75;
    drawWing(ctx, 1, open * 0.85);
    ctx.globalAlpha = 1;
    ctx.restore();

    // Legs (front and back pair), clawed and paddling.
    ctx.strokeStyle = '#115e59';
    ctx.lineCap = 'round';
    for (const li of [9, 26]) {
      const [lx, ly] = spine[li], [nx, ny] = normals[li];
      for (const s of [1, -1]) {
        const swing = Math.sin(t * 5 + li + s) * 5 * scale;
        const kx = lx + nx * s * radius(li) * 1.9 + ny * swing, ky = ly + ny * s * radius(li) * 1.9 - nx * swing;
        ctx.lineWidth = 4.5 * scale;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(kx, ky); ctx.stroke();
        ctx.lineWidth = 1.5 * scale;
        ctx.strokeStyle = '#fde68a';
        for (const c of [-0.5, 0, 0.5]) {
          ctx.beginPath(); ctx.moveTo(kx, ky);
          ctx.lineTo(kx + (nx * s + ny * c) * 5 * scale, ky + (ny * s - nx * c) * 5 * scale);
          ctx.stroke();
        }
        ctx.strokeStyle = '#115e59';
      }
    }

    // Body ribbon with soft shadow
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (const [px, py] of left) ctx.lineTo(px, py);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    ctx.shadowColor = 'rgba(15,23,42,0.25)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#0d9488';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#134e4a';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Belly plates on the lower side, scales + dorsal spikes on the upper side.
    for (let i = 1; i < spine.length - 2; i++) {
      const [sx, sy] = spine[i], [nx, ny] = normals[i];
      const r = radius(i);
      const up = ny < 0 ? 1 : -1; // whichever normal points up the screen is the back
      const bx = sx - nx * up * r * 0.55, by = sy - ny * up * r * 0.55;
      ctx.fillStyle = i % 2 ? '#fcd34d' : '#fbbf24';
      ctx.beginPath(); ctx.ellipse(bx, by, r * 0.55, r * 0.3, Math.atan2(ny, nx), 0, TAU); ctx.fill();
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(19,78,74,0.35)';
        ctx.beginPath(); ctx.arc(sx + nx * up * r * 0.25, sy + ny * up * r * 0.25, r * 0.38, 0, TAU); ctx.fill();
      }
      if (i % 3 === 0) {
        const ex = sx + nx * up * r, ey = sy + ny * up * r;
        const tipLen = (5 + r * 0.6) * (i < 8 ? 1.3 : 1);
        const [tx2, ty2] = spine[i - 1];
        ctx.fillStyle = i % 6 === 0 ? '#ef4444' : '#f97316';
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + nx * up * tipLen + (tx2 - sx) * 0.6, ey + ny * up * tipLen + (ty2 - sy) * 0.6);
        ctx.lineTo(sx + (tx2 - sx) * 1.2 + nx * up * r, sy + (ty2 - sy) * 1.2 + ny * up * r);
        ctx.fill();
      }
    }

    // Flame-like tail tuft
    const [ex, ey] = spine[spine.length - 1], [px2, py2] = spine[spine.length - 4];
    const ta = Math.atan2(ey - py2, ex - px2);
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(ta + Math.sin(t * 4) * 0.25);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(10, -14, 26, -6);
    ctx.quadraticCurveTo(14, -2, 28, 6);
    ctx.quadraticCurveTo(10, 12, 0, 0);
    ctx.fill();
    ctx.restore();

    // Near wing on top of the body
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(wa);
    ctx.scale(scale, scale);
    drawWing(ctx, -1, open);
    ctx.restore();
  }

  function drawFire(ctx: CanvasRenderingContext2D, dt: number) {
    fire = fire.filter(f => {
      f.life += dt;
      f.vx *= 0.93; f.vy = f.vy * 0.93 - 40 * dt;
      f.x += f.vx * dt; f.y += f.vy * dt;
      const k = f.life / f.max;
      const s = f.size * (1 + k * 2.2);
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.drawImage(fireGlow, f.x - s / 2, f.y - s / 2, s, s);
      return k < 1;
    });
    ctx.globalAlpha = 1;
  }
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
