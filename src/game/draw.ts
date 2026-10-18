import { PALETTE } from "@/game/palette";
import type { CarId, Sim } from "@/game/sim";

const STARS = Array.from({ length: 160 }, () => ({
  x: Math.random(),
  y: Math.random() * 0.52,
  r: Math.random() < 0.88 ? 0.7 : 1.6,
  a: 0.28 + Math.random() * 0.72,
  tw: Math.random() * Math.PI * 2,
}));

const visibleScratch: Sim["entities"] = [];

type Proj = { x: number; y: number; s: number; half: number };

function stage(w: number, h: number) {
  const controls = Math.min(220, Math.max(156, h * 0.3));
  const ground = h - controls;
  const horizon = Math.min(h * 0.22, ground - 100);
  return { controls, ground, horizon };
}

function project(w: number, h: number, z: number, x: number): Proj {
  const { ground, horizon } = stage(w, h);
  const depth = z + 2.2;
  const s = 2.2 / depth;
  const y = horizon + (ground - horizon) * Math.min(1.05, s);
  const half = w * 0.92 * Math.min(1.05, s);
  return { x: w * 0.5 + x * half, y, s, half };
}

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, sim: Sim) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#050314");
  g.addColorStop(0.42, "#14082c");
  g.addColorStop(0.62, "#1a0b22");
  g.addColorStop(1, PALETTE.void);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w * 0.55, h * 0.12);
  ctx.rotate(-0.45);
  const neb = ctx.createRadialGradient(0, 0, 10, 0, 0, w * 0.42);
  neb.addColorStop(0, "rgba(153,69,255,0.28)");
  neb.addColorStop(1, "rgba(153,69,255,0)");
  ctx.fillStyle = neb;
  ctx.fillRect(-w, -h * 0.4, w * 2, h);
  ctx.restore();

  const aurora = ctx.createLinearGradient(0, h * 0.28, 0, h * 0.46);
  aurora.addColorStop(0, "rgba(20,241,149,0)");
  aurora.addColorStop(0.5, "rgba(20,241,149,0.16)");
  aurora.addColorStop(1, "rgba(20,241,149,0)");
  ctx.fillStyle = aurora;
  ctx.fillRect(0, h * 0.28, w, h * 0.2);

  for (const s of STARS) {
    const tw = 0.55 + Math.sin(sim.t * 1.7 + s.tw) * 0.45;
    ctx.globalAlpha = s.a * tw;
    ctx.fillStyle = PALETTE.ivory;
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const drift = (sim.distance * 0.015) % (w + 200);
  drawPlanet(ctx, w * 0.12 - drift * 0.05, h * 0.2, Math.min(w, h) * 0.11, "jupiter");
  drawPlanet(ctx, w * 0.86 + drift * 0.03, h * 0.16, Math.min(w, h) * 0.055, "mars");
  drawPlanet(ctx, w * 0.42, h * 0.1 + Math.sin(sim.t * 0.3) * 4, 7, "moon");
}

function drawPlanet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  kind: "jupiter" | "mars" | "moon",
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  if (kind === "jupiter") {
    const bands = ["#c4a36a", "#8d6b45", "#e6d2a8", "#6d4c32", "#b08958", "#d9c29a"];
    for (let i = 0; i < bands.length; i++) {
      ctx.fillStyle = bands[i];
      ctx.fillRect(x - r, y - r + (i * r * 2) / bands.length, r * 2, r * 0.38);
    }
  } else if (kind === "mars") {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, "#e7b089");
    g.addColorStop(1, "#8a4632");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = "#d9d3c7";
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(246,243,236,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawRoad(ctx: CanvasRenderingContext2D, w: number, h: number, sim: Sim) {
  const farL = project(w, h, 90, -1.05);
  const farR = project(w, h, 90, 1.05);
  const nearR = project(w, h, 0, 1.05);
  const nearL = project(w, h, 0, -1.05);
  ctx.beginPath();
  ctx.moveTo(farL.x, farL.y);
  ctx.lineTo(farR.x, farR.y);
  ctx.lineTo(nearR.x, nearR.y);
  ctx.lineTo(nearL.x, nearL.y);
  ctx.closePath();
  const road = ctx.createLinearGradient(0, farL.y, 0, nearL.y);
  road.addColorStop(0, "#24143f");
  road.addColorStop(0.35, "#100c1c");
  road.addColorStop(1, "#07060d");
  ctx.fillStyle = road;
  ctx.fill();

  const span = 5.5;
  const off = sim.scroll % span;
  for (let i = 16; i >= 0; i--) {
    const z1 = off + i * span;
    const z2 = z1 + span * 0.92;
    for (const side of [-1, 1]) {
      const a = project(w, h, z1, side * 1.02);
      const b = project(w, h, z2, side * 1.02);
      const c = project(w, h, z2, side * 1.42);
      const d = project(w, h, z1, side * 1.42);
      const alt = (i + Math.floor(sim.scroll / span)) % 2 === 0;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(d.x, d.y);
      ctx.closePath();
      ctx.fillStyle = alt ? "rgba(212,177,90,0.88)" : "rgba(198,220,230,0.38)";
      ctx.fill();
      ctx.strokeStyle = "rgba(246,243,236,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.moveTo(farL.x, farL.y);
  ctx.lineTo(nearL.x, nearL.y);
  ctx.moveTo(farR.x, farR.y);
  ctx.lineTo(nearR.x, nearR.y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(20,241,149,0.9)";
  ctx.lineWidth = Math.max(3, w * 0.008);
  const period = 7.2;
  const dash = 3.1;
  const shift = sim.scroll % period;
  for (let i = 0; i < 14; i++) {
    const z1 = shift + i * period;
    const z2 = z1 + dash;
    const a = project(w, h, z1, 0);
    const b = project(w, h, z2, 0);
    ctx.globalAlpha = Math.max(0.35, Math.min(1, 1.15 - z1 / 80));
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(212,177,90,0.35)";
  for (const edge of [-0.52, 0.52]) {
    ctx.beginPath();
    const a = project(w, h, 2, edge);
    const b = project(w, h, 80, edge);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  if (sim.scrape > 0) {
    ctx.fillStyle = "rgba(212,177,90,0.18)";
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
  }
}

function drawEntities(ctx: CanvasRenderingContext2D, w: number, h: number, sim: Sim) {
  visibleScratch.length = 0;
  for (const e of sim.entities) {
    if (e.active && e.z > -2 && e.z < 100) visibleScratch.push(e);
  }
  visibleScratch.sort((a, b) => b.z - a.z);
  for (const e of visibleScratch) {
    const p = project(w, h, e.z, e.x);
    if (e.kind === "orb") {
      const rad = Math.max(4, p.s * w * 0.045);
      ctx.save();
      ctx.shadowColor = PALETTE.mint;
      ctx.shadowBlur = 16;
      const g = ctx.createRadialGradient(p.x, p.y, rad * 0.2, p.x, p.y, rad);
      g.addColorStop(0, PALETTE.ivory);
      g.addColorStop(0.5, PALETTE.mint);
      g.addColorStop(1, "rgba(20,241,149,0.05)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }
    const rad = Math.max(8, p.s * w * 0.09);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - 0.4;
      const rr = rad * (i % 2 === 0 ? 1 : 0.68);
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr * 0.72;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const rg = ctx.createLinearGradient(-rad, -rad, rad, rad);
    rg.addColorStop(0, "#3a3358");
    rg.addColorStop(1, "#100c18");
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.strokeStyle = PALETTE.violet;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  for (const p of sim.particles) {
    if (!p.active) continue;
    const at = project(w, h, Math.max(0, p.z), p.x);
    const alpha = Math.max(0, p.life / p.max);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.hue === 1 ? PALETTE.mint : p.hue === 2 ? PALETTE.gold : "#c4b6e0";
    ctx.beginPath();
    ctx.arc(at.x, at.y, Math.max(1.5, at.s * 18), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sim: Sim,
  car: CarId,
) {
  const paint =
    car === "rocket"
      ? { body: "#e3c56a", body2: "#7a5410", glass: "#1a1030", seam: PALETTE.violet }
      : car === "thrust"
        ? { body: "#5ee0b5", body2: "#0c3b34", glass: "#041816", seam: PALETTE.gold }
        : { body: "#9b5cff", body2: "#2a0d55", glass: "#140c24", seam: PALETTE.gold };
  const p = project(w, h, 1.15, sim.lateral);
  const bw = Math.max(78, p.half * 0.34);
  const bh = bw * 0.78;
  const bank = Math.max(-0.18, Math.min(0.18, -sim.latVel * 0.12));
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(bank);

  ctx.save();
  ctx.globalAlpha = 0.7 + (sim.throttleOn ? 0.25 : 0);
  ctx.fillStyle = PALETTE.mint;
  ctx.shadowColor = PALETTE.mint;
  ctx.shadowBlur = 28;
  ctx.beginPath();
  ctx.ellipse(0, bh * 0.08, bw * 0.62, bh * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#07070c";
  round(ctx, -bw * 0.62, -bh * 0.02, bw * 0.2, bh * 0.34, 6);
  ctx.fill();
  round(ctx, bw * 0.42, -bh * 0.02, bw * 0.2, bh * 0.34, 6);
  ctx.fill();

  const body = ctx.createLinearGradient(0, -bh * 0.62, 0, bh * 0.2);
  body.addColorStop(0, paint.body);
  body.addColorStop(1, paint.body2);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(0, -bh * 0.58);
  ctx.lineTo(bw * 0.46, -bh * 0.18);
  ctx.lineTo(bw * 0.62, bh * 0.16);
  ctx.lineTo(bw * 0.28, bh * 0.28);
  ctx.lineTo(-bw * 0.28, bh * 0.28);
  ctx.lineTo(-bw * 0.62, bh * 0.16);
  ctx.lineTo(-bw * 0.46, -bh * 0.18);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = paint.seam;
  ctx.lineWidth = Math.max(1.5, bw * 0.018);
  ctx.beginPath();
  ctx.moveTo(0, -bh * 0.5);
  ctx.lineTo(-bw * 0.34, bh * 0.02);
  ctx.moveTo(0, -bh * 0.5);
  ctx.lineTo(bw * 0.34, bh * 0.02);
  ctx.moveTo(-bw * 0.16, -bh * 0.34);
  ctx.lineTo(bw * 0.16, -bh * 0.34);
  ctx.stroke();

  ctx.fillStyle = paint.glass;
  ctx.beginPath();
  ctx.moveTo(0, -bh * 0.5);
  ctx.lineTo(bw * 0.2, -bh * 0.22);
  ctx.lineTo(-bw * 0.2, -bh * 0.22);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = sim.braking ? PALETTE.gold : PALETTE.mint;
  ctx.shadowBlur = sim.braking ? 16 : 8;
  ctx.fillStyle = sim.braking ? PALETTE.ivory : PALETTE.mint;
  round(ctx, -bw * 0.5, bh * 0.02, bw * 0.16, bh * 0.045, 3);
  ctx.fill();
  round(ctx, bw * 0.34, bh * 0.02, bw * 0.16, bh * 0.045, 3);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(246,243,236,0.85)";
  ctx.font = `600 ${Math.max(8, bw * 0.09)}px Oswald, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("GIRO", 0, bh * 0.2);
  ctx.restore();
}

function round(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sim: Sim,
  car: CarId,
  reduceMotion: boolean,
) {
  ctx.save();
  if (sim.shake > 0 && !reduceMotion) {
    const mag = sim.shake * 12;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  drawSky(ctx, w, h, sim);
  drawRoad(ctx, w, h, sim);
  drawEntities(ctx, w, h, sim);
  drawCar(ctx, w, h, sim, car);

  if (sim.throttleOn || sim.boostT > 0 || sim.rocketT > 0) {
    ctx.strokeStyle = sim.rocketT > 0 ? "rgba(212,177,90,0.35)" : "rgba(20,241,149,0.28)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const x = ((i + 0.5) / 10) * w;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.36);
      ctx.lineTo(w * 0.5 + (x - w * 0.5) * 1.15, h);
      ctx.stroke();
    }
  }

  if (sim.suctionT > 0) {
    ctx.strokeStyle = "rgba(20,241,149,0.45)";
    ctx.lineWidth = 2;
    const c = project(w, h, 0.4, sim.lateral);
    ctx.beginPath();
    ctx.arc(c.x, Math.min(h * 0.8, c.y - 10), 70 + Math.sin(sim.t * 18) * 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  const vg = ctx.createRadialGradient(w / 2, h * 0.55, w * 0.2, w / 2, h * 0.55, w * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  if (sim.flash > 0) {
    ctx.fillStyle = `rgba(20,241,149,${sim.flash * 0.22})`;
    ctx.fillRect(0, 0, w, h);
  }

  if (sim.bannerT > 0 && sim.banner) {
    ctx.globalAlpha = Math.min(1, sim.bannerT * 2);
    ctx.fillStyle = PALETTE.ivory;
    ctx.font = `600 ${Math.max(28, w * 0.06)}px Oswald, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(sim.banner, w / 2, h * 0.3);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
