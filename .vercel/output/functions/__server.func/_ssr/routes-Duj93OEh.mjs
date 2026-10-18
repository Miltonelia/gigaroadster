import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Leaf, n as VolumeX, o as Hexagon, r as Volume2, s as Gauge, t as Wallet } from "../_libs/lucide-react.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Duj93OEh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Tiny Web Audio mixer. Resume only from a user gesture. */
var Mixer = class {
	ctx = null;
	master = null;
	engine = null;
	engineGain = null;
	sfx = null;
	muted = false;
	hooked = false;
	unlock() {
		if (!this.ctx) {
			const ctx = new AudioContext({ latencyHint: "interactive" });
			const master = ctx.createGain();
			master.gain.value = .85;
			master.connect(ctx.destination);
			const sfx = ctx.createGain();
			sfx.gain.value = .7;
			sfx.connect(master);
			const engineGain = ctx.createGain();
			engineGain.gain.value = 0;
			engineGain.connect(master);
			const osc = ctx.createOscillator();
			osc.type = "sawtooth";
			osc.frequency.value = 52;
			const filter = ctx.createBiquadFilter();
			filter.type = "lowpass";
			filter.frequency.value = 420;
			osc.connect(filter);
			filter.connect(engineGain);
			osc.start();
			this.ctx = ctx;
			this.master = master;
			this.sfx = sfx;
			this.engine = osc;
			this.engineGain = engineGain;
		}
		if (this.ctx.state === "suspended") this.ctx.resume();
		if (!this.hooked && typeof document !== "undefined") {
			this.hooked = true;
			document.addEventListener("visibilitychange", () => {
				if (document.visibilityState === "visible") this.unlock();
			});
		}
	}
	toggleMute() {
		this.muted = !this.muted;
		if (!this.ctx || !this.master) return this.muted;
		this.master.gain.setTargetAtTime(this.muted ? 0 : .85, this.ctx.currentTime, .03);
		return this.muted;
	}
	setDrive(speed, boost) {
		if (!this.ctx || !this.engine || !this.engineGain) return;
		const now = this.ctx.currentTime;
		const freq = 46 + Math.min(160, speed * 1.15) + (boost ? 36 : 0);
		this.engine.frequency.setTargetAtTime(freq, now, .08);
		const gain = this.muted ? 0 : Math.min(.045, .01 + speed * 28e-5);
		this.engineGain.gain.setTargetAtTime(speed <= .5 ? 0 : gain, now, .06);
	}
	play(kind) {
		if (!this.ctx || !this.sfx || this.muted) return;
		const ctx = this.ctx;
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(this.sfx);
		let dur = .18;
		if (kind === "orb") {
			osc.type = "triangle";
			osc.frequency.setValueAtTime(660 + Math.random() * 80, now);
			osc.frequency.exponentialRampToValueAtTime(1180, now + .12);
			dur = .16;
		} else if (kind === "boost") {
			osc.type = "sawtooth";
			osc.frequency.setValueAtTime(180, now);
			osc.frequency.exponentialRampToValueAtTime(640, now + .28);
			dur = .32;
		} else if (kind === "suction") {
			osc.type = "sine";
			osc.frequency.setValueAtTime(420, now);
			osc.frequency.exponentialRampToValueAtTime(90, now + .28);
			dur = .3;
		} else if (kind === "rocket") {
			osc.type = "square";
			osc.frequency.setValueAtTime(140, now);
			osc.frequency.exponentialRampToValueAtTime(880, now + .4);
			dur = .42;
		} else if (kind === "crash") {
			osc.type = "sawtooth";
			osc.frequency.setValueAtTime(220, now);
			osc.frequency.exponentialRampToValueAtTime(40, now + .4);
			dur = .45;
		} else if (kind === "buy") {
			osc.type = "triangle";
			osc.frequency.setValueAtTime(520, now);
			osc.frequency.exponentialRampToValueAtTime(780, now + .1);
			dur = .14;
		} else {
			osc.type = "sine";
			osc.frequency.value = 300;
		}
		gain.gain.setValueAtTime(1e-4, now);
		gain.gain.exponentialRampToValueAtTime(kind === "crash" ? .35 : .18, now + .02);
		gain.gain.exponentialRampToValueAtTime(1e-4, now + dur);
		osc.start(now);
		osc.stop(now + dur + .02);
		osc.onended = () => {
			osc.disconnect();
			gain.disconnect();
		};
	}
};
var audio = new Mixer();
var BASE = {
	thruster: 300,
	aero: 200,
	rocketMode: 500
};
var MINT_COST = {
	performance: 0,
	thrust: 450,
	rocket: 900
};
var useSave = create()(persist((set, get) => ({
	giga: 1e3,
	pending: 0,
	wallet: null,
	thruster: 0,
	aero: 0,
	rocketMode: false,
	cars: {
		performance: true,
		thrust: false,
		rocket: false
	},
	active: "performance",
	best: 0,
	connect: () => {
		if (get().wallet) return;
		const bytes = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(3));
		set({ wallet: `Giga…${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}` });
	},
	claim: () => {
		const pending = get().pending;
		if (pending <= 0) return;
		set({
			giga: get().giga + pending,
			pending: 0
		});
	},
	cost: (id) => {
		const s = get();
		if (id === "rocketMode") return s.rocketMode ? null : BASE.rocketMode;
		const level = s[id];
		if (level >= 3) return null;
		return BASE[id] * (level + 1);
	},
	buy: (id) => {
		const cost = get().cost(id);
		if (cost == null || get().giga < cost) return false;
		if (id === "rocketMode") {
			set({
				giga: get().giga - cost,
				rocketMode: true
			});
			return true;
		}
		set({
			giga: get().giga - cost,
			[id]: get()[id] + 1
		});
		return true;
	},
	mint: (id) => {
		if (id === "performance" || get().cars[id]) return false;
		const cost = MINT_COST[id];
		if (get().giga < cost) return false;
		set({
			giga: get().giga - cost,
			cars: {
				...get().cars,
				[id]: true
			},
			active: id
		});
		return true;
	},
	select: (id) => {
		if (!get().cars[id]) return;
		set({ active: id });
	},
	bank: (earned, distance) => {
		set({
			pending: get().pending + Math.max(0, Math.floor(earned)),
			best: Math.max(get().best, Math.floor(distance))
		});
	}
}), {
	name: "gigaroadster-save-v1",
	skipHydration: true
}));
/** Brand colors sampled from the Gigaroadster plates. Canvas twin of the CSS tokens. */
var PALETTE = {
	void: "#07060f",
	ink: "#120e1e",
	panel: "#1a152b",
	violet: "#9945ff",
	violetDeep: "#3b1570",
	mint: "#14f195",
	gold: "#d4b15a",
	ivory: "#f6f3ec",
	muted: "#a89bbd",
	road: "#0c0a14",
	rock: "#1b1730"
};
var STARS = Array.from({ length: 160 }, () => ({
	x: Math.random(),
	y: Math.random() * .52,
	r: Math.random() < .88 ? .7 : 1.6,
	a: .28 + Math.random() * .72,
	tw: Math.random() * Math.PI * 2
}));
var visibleScratch = [];
function stage(w, h) {
	const controls = w < 720 ? Math.min(230, h * .34) : 28;
	const ground = h - controls;
	return {
		controls,
		ground,
		horizon: Math.min(h * .34, ground - 80)
	};
}
function project(w, h, z, x) {
	const { ground, horizon } = stage(w, h);
	const s = 3 / (z + 3);
	const y = horizon + (ground - horizon) * Math.min(1.05, s);
	const half = w * .46 * Math.min(1.05, s);
	return {
		x: w * .5 + x * half,
		y,
		s,
		half
	};
}
var PAINT = {
	performance: {
		body: "#7c3aed",
		body2: "#2e1065",
		trim: PALETTE.mint,
		glow: PALETTE.mint,
		glass: "#140c24"
	},
	thrust: {
		body: "#0f766e",
		body2: "#042f2e",
		trim: PALETTE.gold,
		glow: PALETTE.mint,
		glass: "#041816"
	},
	rocket: {
		body: "#e3c56a",
		body2: "#7a5410",
		trim: PALETTE.violet,
		glow: PALETTE.violet,
		glass: "#1a1030"
	}
};
function drawSky(ctx, w, h, sim) {
	const g = ctx.createLinearGradient(0, 0, 0, h);
	g.addColorStop(0, "#050314");
	g.addColorStop(.42, "#14082c");
	g.addColorStop(.62, "#1a0b22");
	g.addColorStop(1, PALETTE.void);
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, w, h);
	ctx.save();
	ctx.translate(w * .55, h * .12);
	ctx.rotate(-.45);
	const neb = ctx.createRadialGradient(0, 0, 10, 0, 0, w * .42);
	neb.addColorStop(0, "rgba(153,69,255,0.28)");
	neb.addColorStop(1, "rgba(153,69,255,0)");
	ctx.fillStyle = neb;
	ctx.fillRect(-w, -h * .4, w * 2, h);
	ctx.restore();
	const aurora = ctx.createLinearGradient(0, h * .28, 0, h * .46);
	aurora.addColorStop(0, "rgba(20,241,149,0)");
	aurora.addColorStop(.5, "rgba(20,241,149,0.16)");
	aurora.addColorStop(1, "rgba(20,241,149,0)");
	ctx.fillStyle = aurora;
	ctx.fillRect(0, h * .28, w, h * .2);
	for (const s of STARS) {
		const tw = .55 + Math.sin(sim.t * 1.7 + s.tw) * .45;
		ctx.globalAlpha = s.a * tw;
		ctx.fillStyle = PALETTE.ivory;
		ctx.beginPath();
		ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalAlpha = 1;
	const drift = sim.distance * .015 % (w + 200);
	drawPlanet(ctx, w * .12 - drift * .05, h * .2, Math.min(w, h) * .11, "jupiter");
	drawPlanet(ctx, w * .86 + drift * .03, h * .16, Math.min(w, h) * .055, "mars");
	drawPlanet(ctx, w * .42, h * .1 + Math.sin(sim.t * .3) * 4, 7, "moon");
}
function drawPlanet(ctx, x, y, r, kind) {
	ctx.save();
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2);
	ctx.clip();
	if (kind === "jupiter") {
		const bands = [
			"#c4a36a",
			"#8d6b45",
			"#e6d2a8",
			"#6d4c32",
			"#b08958",
			"#d9c29a"
		];
		for (let i = 0; i < bands.length; i++) {
			ctx.fillStyle = bands[i];
			ctx.fillRect(x - r, y - r + i * r * 2 / bands.length, r * 2, r * .38);
		}
	} else if (kind === "mars") {
		const g = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r);
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
function drawRoad(ctx, w, h, sim) {
	const farL = project(w, h, 90, -1);
	const farR = project(w, h, 90, 1);
	const nearR = project(w, h, 0, 1);
	const nearL = project(w, h, 0, -1);
	ctx.beginPath();
	ctx.moveTo(farL.x, farL.y);
	ctx.lineTo(farR.x, farR.y);
	ctx.lineTo(nearR.x, nearR.y);
	ctx.lineTo(nearL.x, nearL.y);
	ctx.closePath();
	const road = ctx.createLinearGradient(0, farL.y, 0, nearL.y);
	road.addColorStop(0, "#24143f");
	road.addColorStop(.35, "#100c1c");
	road.addColorStop(1, "#07060d");
	ctx.fillStyle = road;
	ctx.fill();
	const span = 5.5;
	const off = sim.scroll % span;
	for (let i = 16; i >= 0; i--) {
		const z1 = off + i * span;
		const z2 = z1 + span * .92;
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
	ctx.strokeStyle = "rgba(20,241,149,0.75)";
	ctx.lineWidth = 2;
	const period = 6.4;
	const dash = 2.6;
	const shift = sim.scroll % period;
	for (const lane of [
		-.66,
		0,
		.66
	]) for (let i = 0; i < 16; i++) {
		const z1 = shift + i * period;
		const z2 = z1 + dash;
		const a = project(w, h, z1, lane);
		const b = project(w, h, z2, lane);
		ctx.globalAlpha = Math.max(.2, Math.min(1, 1.1 - z1 / 70));
		ctx.beginPath();
		ctx.moveTo(a.x, a.y);
		ctx.lineTo(b.x, b.y);
		ctx.stroke();
	}
	ctx.globalAlpha = 1;
	if (sim.scrape > 0) {
		ctx.fillStyle = "rgba(212,177,90,0.18)";
		ctx.fillRect(0, h * .7, w, h * .3);
	}
}
function drawEntities(ctx, w, h, sim) {
	visibleScratch.length = 0;
	for (const e of sim.entities) if (e.active && e.z > -2 && e.z < 100) visibleScratch.push(e);
	visibleScratch.sort((a, b) => b.z - a.z);
	for (const e of visibleScratch) {
		const p = project(w, h, e.z, e.x);
		if (e.kind === "orb") {
			const rad = Math.max(4, p.s * w * .045);
			ctx.save();
			ctx.shadowColor = PALETTE.mint;
			ctx.shadowBlur = 16;
			const g = ctx.createRadialGradient(p.x, p.y, rad * .2, p.x, p.y, rad);
			g.addColorStop(0, PALETTE.ivory);
			g.addColorStop(.5, PALETTE.mint);
			g.addColorStop(1, "rgba(20,241,149,0.05)");
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
			continue;
		}
		const rad = Math.max(8, p.s * w * .09);
		ctx.save();
		ctx.translate(p.x, p.y);
		ctx.beginPath();
		const n = 7;
		for (let i = 0; i < n; i++) {
			const a = i / n * Math.PI * 2 - .4;
			const rr = rad * (i % 2 === 0 ? 1 : .68);
			const x = Math.cos(a) * rr;
			const y = Math.sin(a) * rr * .72;
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
		ctx.globalAlpha = Math.max(0, p.life / p.max);
		ctx.fillStyle = p.hue === 1 ? PALETTE.mint : p.hue === 2 ? PALETTE.gold : "#c4b6e0";
		ctx.beginPath();
		ctx.arc(at.x, at.y, Math.max(1.5, at.s * 18), 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalAlpha = 1;
}
function drawCar(ctx, w, h, sim, car) {
	const paint = PAINT[car];
	const { ground } = stage(w, h);
	const anchor = project(w, h, .15, sim.lateral);
	const scale = Math.max(.72, Math.min(1.55, w / 760));
	const bw = 108 * scale;
	const bh = 168 * scale;
	const bank = Math.max(-.32, Math.min(.32, -sim.latVel * .18));
	ctx.save();
	ctx.translate(anchor.x, ground - bh * .2);
	ctx.rotate(bank);
	ctx.save();
	ctx.globalAlpha = .55 + (sim.boostT > 0 ? .3 : 0);
	ctx.fillStyle = paint.glow;
	ctx.shadowColor = paint.glow;
	ctx.shadowBlur = 28;
	ctx.beginPath();
	ctx.ellipse(0, bh * .08, bw * .62, bh * .1, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
	if (sim.boostT > 0 || sim.rocketT > 0) {
		ctx.fillStyle = sim.rocketT > 0 ? PALETTE.gold : PALETTE.mint;
		ctx.globalAlpha = .85;
		ctx.beginPath();
		ctx.moveTo(-bw * .18, bh * .22);
		ctx.lineTo(0, bh * (.42 + Math.sin(sim.t * 30) * .06));
		ctx.lineTo(bw * .18, bh * .22);
		ctx.fill();
		ctx.globalAlpha = 1;
	}
	ctx.fillStyle = "#07070b";
	round(ctx, -bw * .56, -bh * .02, bw * .18, bh * .42, 8);
	ctx.fill();
	round(ctx, bw * .38, -bh * .02, bw * .18, bh * .42, 8);
	ctx.fill();
	ctx.strokeStyle = paint.trim;
	ctx.lineWidth = 2;
	round(ctx, -bw * .56, -bh * .02, bw * .18, bh * .42, 8);
	ctx.stroke();
	round(ctx, bw * .38, -bh * .02, bw * .18, bh * .42, 8);
	ctx.stroke();
	const body = ctx.createLinearGradient(0, -bh * .48, 0, bh * .28);
	body.addColorStop(0, paint.body);
	body.addColorStop(1, paint.body2);
	ctx.fillStyle = body;
	ctx.beginPath();
	ctx.moveTo(-bw * .4, bh * .26);
	ctx.lineTo(-bw * .48, -bh * .02);
	ctx.quadraticCurveTo(-bw * .5, -bh * .36, -bw * .22, -bh * .46);
	ctx.lineTo(bw * .22, -bh * .46);
	ctx.quadraticCurveTo(bw * .5, -bh * .36, bw * .48, -bh * .02);
	ctx.lineTo(bw * .4, bh * .26);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = paint.glass;
	ctx.beginPath();
	ctx.moveTo(-bw * .18, -bh * .4);
	ctx.lineTo(-bw * .28, -bh * .08);
	ctx.lineTo(bw * .28, -bh * .08);
	ctx.lineTo(bw * .18, -bh * .4);
	ctx.closePath();
	ctx.fill();
	ctx.shadowColor = paint.trim;
	ctx.shadowBlur = 12;
	ctx.fillStyle = paint.trim;
	round(ctx, -bw * .36, bh * .02, bw * .22, bh * .045, 4);
	ctx.fill();
	round(ctx, bw * .14, bh * .02, bw * .22, bh * .045, 4);
	ctx.fill();
	ctx.shadowBlur = 0;
	ctx.fillStyle = "#0b0b10";
	round(ctx, -bw * .16, bh * .12, bw * .32, bh * .07, 3);
	ctx.fill();
	ctx.fillStyle = PALETTE.ivory;
	ctx.font = `600 ${Math.max(8, 9 * scale)}px Oswald, sans-serif`;
	ctx.textAlign = "center";
	ctx.fillText("GIGA", 0, bh * .165);
	ctx.strokeStyle = paint.trim;
	ctx.globalAlpha = .8;
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.moveTo(-bw * .34, -bh * .12);
	ctx.lineTo(-bw * .22, -bh * .34);
	ctx.moveTo(bw * .34, -bh * .12);
	ctx.lineTo(bw * .22, -bh * .34);
	ctx.stroke();
	ctx.restore();
}
function round(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, r);
}
function drawFrame(ctx, w, h, sim, car, reduceMotion) {
	ctx.save();
	if (sim.shake > 0 && !reduceMotion) {
		const mag = sim.shake * 12;
		ctx.translate((Math.random() - .5) * mag, (Math.random() - .5) * mag);
	}
	drawSky(ctx, w, h, sim);
	drawRoad(ctx, w, h, sim);
	drawEntities(ctx, w, h, sim);
	drawCar(ctx, w, h, sim, car);
	if (sim.boostT > 0 || sim.rocketT > 0) {
		ctx.strokeStyle = sim.rocketT > 0 ? "rgba(212,177,90,0.35)" : "rgba(20,241,149,0.28)";
		ctx.lineWidth = 1;
		for (let i = 0; i < 10; i++) {
			const x = (i + .5) / 10 * w;
			ctx.beginPath();
			ctx.moveTo(x, h * .36);
			ctx.lineTo(w * .5 + (x - w * .5) * 1.15, h);
			ctx.stroke();
		}
	}
	if (sim.suctionT > 0) {
		ctx.strokeStyle = "rgba(20,241,149,0.45)";
		ctx.lineWidth = 2;
		const c = project(w, h, .4, sim.lateral);
		ctx.beginPath();
		ctx.arc(c.x, Math.min(h * .8, c.y - 10), 70 + Math.sin(sim.t * 18) * 6, 0, Math.PI * 2);
		ctx.stroke();
	}
	const vg = ctx.createRadialGradient(w / 2, h * .55, w * .2, w / 2, h * .55, w * .75);
	vg.addColorStop(0, "rgba(0,0,0,0)");
	vg.addColorStop(1, "rgba(0,0,0,0.45)");
	ctx.fillStyle = vg;
	ctx.fillRect(0, 0, w, h);
	if (sim.flash > 0) {
		ctx.fillStyle = `rgba(20,241,149,${sim.flash * .22})`;
		ctx.fillRect(0, 0, w, h);
	}
	if (sim.bannerT > 0 && sim.banner) {
		ctx.globalAlpha = Math.min(1, sim.bannerT * 2);
		ctx.fillStyle = PALETTE.ivory;
		ctx.font = `600 ${Math.max(28, w * .06)}px Oswald, sans-serif`;
		ctx.textAlign = "center";
		ctx.fillText(sim.banner, w / 2, h * .3);
		ctx.globalAlpha = 1;
	}
	ctx.restore();
}
var POOL = 36;
var PARTICLES = 90;
var LANES = [
	-.66,
	0,
	.66
];
var CARS$1 = {
	performance: {
		accel: 2.1,
		handling: 1,
		top: 76
	},
	thrust: {
		accel: 3.1,
		handling: 1.12,
		top: 72
	},
	rocket: {
		accel: 1.9,
		handling: .9,
		top: 92
	}
};
function createSim(config) {
	return {
		phase: "racing",
		t: 0,
		distance: 0,
		speed: 34,
		yaw: 0,
		lateral: 0,
		latVel: 0,
		boostT: 0,
		boostCd: 0,
		suctionT: 0,
		suctionCd: 0,
		shieldT: 0,
		rocketT: 0,
		rocketLeft: config.rocketMode ? 1 : 0,
		shake: 0,
		scrape: 0,
		orbs: 0,
		nearMiss: 0,
		combo: 0,
		comboT: 0,
		sector: 0,
		banner: "A RODAR",
		bannerT: 1.15,
		flash: 0,
		spawnAcc: .85,
		lastOpen: 1,
		scroll: 0,
		crashT: 0,
		sfx: null,
		entities: Array.from({ length: POOL }, () => ({
			active: false,
			kind: "rock",
			x: 0,
			z: 0,
			resolved: false
		})),
		particles: Array.from({ length: PARTICLES }, () => ({
			active: false,
			x: 0,
			z: 0,
			vx: 0,
			vz: 0,
			life: 0,
			max: 1,
			hue: 0
		})),
		config
	};
}
function payout(sim) {
	return Math.floor(sim.distance / 22) + sim.orbs * 18 + sim.nearMiss * 4;
}
function acquire(sim) {
	for (const e of sim.entities) if (!e.active) return e;
	return null;
}
function burst(sim, x, z, hue, n) {
	let left = n;
	for (const p of sim.particles) {
		if (p.active) continue;
		p.active = true;
		p.x = x + (Math.random() - .5) * .2;
		p.z = z;
		p.vx = (Math.random() - .5) * 2.2;
		p.vz = (Math.random() - .5) * 10;
		p.max = .28 + Math.random() * .35;
		p.life = p.max;
		p.hue = hue;
		left -= 1;
		if (left <= 0) break;
	}
}
function neighbor(open) {
	if (open === 0) return 1;
	if (open === 2) return 1;
	return Math.random() < .5 ? 0 : 2;
}
function spawnWave(sim) {
	const open = Math.random() < .58 ? sim.lastOpen : neighbor(sim.lastOpen);
	sim.lastOpen = open;
	const z0 = Math.max(50, sim.speed * 1.42);
	for (let i = 0; i < 3; i++) {
		if (i === open) continue;
		if (Math.random() < .18) continue;
		const e = acquire(sim);
		if (!e) return;
		e.active = true;
		e.kind = "rock";
		e.x = LANES[i];
		e.z = z0 + Math.random() * 2;
		e.resolved = false;
	}
	if (Math.random() < .72) {
		const orb = acquire(sim);
		if (!orb) return;
		orb.active = true;
		orb.kind = "orb";
		orb.x = LANES[open];
		orb.z = z0 + 7;
		orb.resolved = false;
	}
}
function crash(sim) {
	if (sim.phase !== "racing") return;
	sim.phase = "crashed";
	sim.shake = 1.25;
	sim.flash = .7;
	sim.banner = "GRAVITY FAIL";
	sim.bannerT = 2;
	sim.sfx = "crash";
	sim.latVel = 0;
	burst(sim, sim.lateral, 1.2, 2, 18);
}
function tickParticles(sim, dt) {
	for (const p of sim.particles) {
		if (!p.active) continue;
		p.life -= dt;
		p.x += p.vx * dt;
		p.z += p.vz * dt;
		if (p.life <= 0) p.active = false;
	}
}
function step(sim, input, dt) {
	sim.t += dt;
	sim.shake = Math.max(0, sim.shake - dt * 1.7);
	sim.scrape = Math.max(0, sim.scrape - dt);
	sim.flash = Math.max(0, sim.flash - dt * 1.4);
	sim.bannerT = Math.max(0, sim.bannerT - dt);
	sim.comboT = Math.max(0, sim.comboT - dt);
	if (sim.comboT === 0) sim.combo = 0;
	sim.boostCd = Math.max(0, sim.boostCd - dt);
	sim.suctionCd = Math.max(0, sim.suctionCd - dt);
	sim.boostT = Math.max(0, sim.boostT - dt);
	sim.suctionT = Math.max(0, sim.suctionT - dt);
	sim.shieldT = Math.max(0, sim.shieldT - dt);
	sim.rocketT = Math.max(0, sim.rocketT - dt);
	tickParticles(sim, dt);
	if (sim.phase !== "racing") {
		sim.speed = Math.max(0, sim.speed - dt * 40);
		return;
	}
	const car = CARS$1[sim.config.car];
	const handling = car.handling * (1 + sim.config.aeroLevel * .2);
	const steer = Math.max(-1, Math.min(1, input.steer));
	sim.yaw += steer * 2.5 * dt;
	const targetVel = -steer * 1.55 * handling;
	const follow = sim.suctionT > 0 ? 14 : 7 + sim.config.aeroLevel;
	sim.latVel += (targetVel - sim.latVel) * (1 - Math.exp(-follow * dt));
	if (sim.suctionT > 0) sim.latVel += -sim.lateral * 9 * dt;
	sim.lateral += sim.latVel * dt;
	if (Math.abs(sim.lateral) > .98) {
		sim.lateral = Math.sign(sim.lateral) * .98;
		if (Math.sign(sim.latVel) === Math.sign(sim.lateral)) sim.latVel = 0;
		sim.scrape = .12;
		sim.shake = Math.max(sim.shake, .12);
	}
	const top = car.top + sim.config.thrusterLevel * 5 + Math.min(10, sim.distance / 1800);
	let desired = 32 + (top - 32) * Math.min(1, sim.distance / 4800);
	if (sim.boostT > 0) desired = top * (1.12 + sim.config.thrusterLevel * .03);
	if (sim.rocketT > 0) desired = top * 1.38;
	if (input.throttle) desired += 5;
	if (sim.scrape > 0) desired *= .8;
	sim.speed += (desired - sim.speed) * (1 - Math.exp(-car.accel * dt));
	sim.distance += sim.speed * dt;
	sim.scroll += sim.speed * dt;
	const sector = Math.floor(sim.distance / 1e3);
	if (sector > sim.sector) {
		sim.sector = sector;
		sim.banner = `SECTOR ${sector}`;
		sim.bannerT = 1.3;
		sim.flash = Math.max(sim.flash, .25);
	}
	if (input.boostEdge && sim.boostCd <= 0) {
		sim.boostT = 1.35 + sim.config.thrusterLevel * .38;
		sim.boostCd = 5.1;
		sim.sfx = "boost";
		sim.flash = Math.max(sim.flash, .3);
	}
	if (input.suctionEdge && sim.suctionCd <= 0) {
		sim.suctionT = .7;
		sim.suctionCd = Math.max(4.2, 6.4 - sim.config.aeroLevel * .35);
		sim.shieldT = Math.max(sim.shieldT, .42);
		sim.speed *= .9;
		sim.sfx = "suction";
		for (const e of sim.entities) {
			if (!e.active || e.kind !== "rock") continue;
			if (e.z < 0 || e.z > 26) continue;
			if (Math.abs(e.x - sim.lateral) > .5) continue;
			const dir = e.x >= sim.lateral ? 1 : -1;
			e.x = Math.max(-1.35, Math.min(1.35, e.x + dir * .9));
		}
		burst(sim, sim.lateral, 2, 1, 10);
	}
	if (input.rocketEdge && sim.rocketLeft > 0) {
		sim.rocketLeft = 0;
		sim.rocketT = 2.2;
		sim.shieldT = 2.2;
		sim.sfx = "rocket";
		sim.flash = .55;
		for (const e of sim.entities) {
			if (!e.active || e.kind !== "rock") continue;
			if (e.z > 0 && e.z < 42 && Math.abs(e.x - sim.lateral) < .75) {
				e.active = false;
				burst(sim, e.x, e.z, 2, 6);
			}
		}
	}
	if (sim.boostT > 0 && Math.random() < .6) burst(sim, sim.lateral + (Math.random() - .5) * .3, .4, 1, 1);
	sim.spawnAcc += dt;
	const interval = Math.max(.64, 1.28 - sim.speed / 95);
	if (sim.spawnAcc >= interval) {
		sim.spawnAcc = 0;
		spawnWave(sim);
	}
	for (const e of sim.entities) {
		if (!e.active) continue;
		const prevZ = e.z;
		e.z -= sim.speed * dt;
		if (e.z < -8) {
			e.active = false;
			continue;
		}
		if (e.resolved) continue;
		if (!(prevZ > -.4 && e.z < 2.4)) continue;
		const dx = Math.abs(sim.lateral - e.x);
		if (e.kind === "orb") {
			if (dx < .36 && prevZ > 0 && e.z < 2) {
				e.resolved = true;
				e.active = false;
				sim.orbs += 1;
				sim.sfx = sim.sfx ?? "orb";
				sim.flash = Math.max(sim.flash, .18);
				burst(sim, e.x, 1, 1, 8);
			} else if (e.z < 0) e.resolved = true;
			continue;
		}
		if (prevZ > 0 && e.z < 1.8) {
			e.resolved = true;
			if (dx < .31) {
				if (sim.shieldT > 0) {
					e.active = false;
					burst(sim, e.x, 1.2, 0, 8);
					sim.shake = Math.max(sim.shake, .2);
				} else crash(sim);
			} else if (dx < .5) {
				sim.nearMiss += 1;
				sim.combo += 1;
				sim.comboT = 1.6;
				sim.banner = sim.combo > 1 ? `CERCA ×${sim.combo}` : "CERCA";
				sim.bannerT = .7;
				sim.shake = Math.max(sim.shake, .18);
			}
		}
	}
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-full font-display uppercase tracking-wide transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-40", {
	variants: {
		variant: {
			primary: "bg-mint text-void hover:bg-fg",
			gold: "border border-gold bg-transparent text-gold hover:bg-ink",
			ghost: "border border-line bg-ink text-fg hover:border-violet"
		},
		size: {
			sm: "min-h-11 px-4 text-sm",
			md: "min-h-12 px-6 text-base",
			lg: "min-h-14 px-8 text-lg"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function snapshot(sim) {
	return {
		phase: sim.phase,
		speed: sim.speed,
		distance: sim.distance,
		orbs: sim.orbs,
		nearMiss: sim.nearMiss,
		payout: payout(sim),
		boostCd: sim.boostCd,
		suctionCd: sim.suctionCd,
		rocketLeft: sim.rocketLeft,
		shield: sim.shieldT > 0
	};
}
function RaceView({ car, thruster, aero, rocketMode, onExit }) {
	const canvasRef = (0, import_react.useRef)(null);
	const simRef = (0, import_react.useRef)(null);
	const touchRef = (0, import_react.useRef)({
		left: false,
		right: false,
		boost: false,
		suction: false,
		rocket: false
	});
	const keysRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const qaKeysRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const qaSteerRef = (0, import_react.useRef)(null);
	const [hud, setHud] = (0, import_react.useState)(null);
	const [muted, setMuted] = (0, import_react.useState)(audio.muted);
	const exited = (0, import_react.useRef)(false);
	(0, import_react.useLayoutEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const sim = createSim({
			car,
			thrusterLevel: thruster,
			aeroLevel: aero,
			rocketMode
		});
		simRef.current = sim;
		setHud(snapshot(sim));
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const keys = keysRef.current;
		const onKeyDown = (e) => {
			keys.add(e.code);
			if ([
				"ArrowLeft",
				"ArrowRight",
				"ArrowUp",
				"ArrowDown",
				"Space"
			].includes(e.code)) e.preventDefault();
		};
		const onKeyUp = (e) => {
			keys.delete(e.code);
		};
		const onBlur = () => keys.clear();
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		window.addEventListener("blur", onBlur);
		window.__controlsTest = {
			getYaw: () => sim.yaw,
			getSpeed: () => sim.speed,
			setSteer: (v) => {
				qaSteerRef.current = v;
			},
			setKeys: (codes) => {
				qaKeysRef.current = new Set(codes);
			}
		};
		let raf = 0;
		let last = performance.now();
		let hudAcc = 0;
		let prevBoost = false;
		let prevSuction = false;
		let prevRocket = false;
		const frame = (now) => {
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			const down = (code) => keys.has(code) || qaKeysRef.current.has(code);
			const touch = touchRef.current;
			let steer = 0;
			if (down("KeyA") || down("ArrowLeft") || touch.left) steer += 1;
			if (down("KeyD") || down("ArrowRight") || touch.right) steer -= 1;
			if (qaSteerRef.current != null) steer = qaSteerRef.current;
			const boostDown = down("ShiftLeft") || down("ShiftRight") || touch.boost;
			const suctionDown = down("Space") || down("KeyF") || touch.suction;
			const rocketDown = down("KeyR") || touch.rocket;
			const input = {
				steer: Math.max(-1, Math.min(1, steer)),
				throttle: down("KeyW") || down("ArrowUp"),
				boostEdge: boostDown && !prevBoost,
				suctionEdge: suctionDown && !prevSuction,
				rocketEdge: rocketDown && !prevRocket
			};
			prevBoost = boostDown;
			prevSuction = suctionDown;
			prevRocket = rocketDown;
			const before = sim.phase;
			let acc = dt;
			let first = true;
			while (acc > 1e-4) {
				const slice = Math.min(1 / 60, acc);
				step(sim, first ? input : {
					...input,
					boostEdge: false,
					suctionEdge: false,
					rocketEdge: false
				}, slice);
				first = false;
				acc -= slice;
			}
			if (sim.sfx) {
				audio.play(sim.sfx);
				sim.sfx = null;
			}
			audio.setDrive(sim.phase === "racing" ? sim.speed : 0, sim.boostT > 0 || sim.rocketT > 0);
			const rect = canvas.getBoundingClientRect();
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const bw = Math.max(1, Math.floor(rect.width * dpr));
			const bh = Math.max(1, Math.floor(rect.height * dpr));
			if (canvas.width !== bw || canvas.height !== bh) {
				canvas.width = bw;
				canvas.height = bh;
			}
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			drawFrame(ctx, rect.width, rect.height, sim, car, reduce);
			hudAcc += dt;
			if (hudAcc > .12 || sim.phase !== before) {
				hudAcc = 0;
				setHud(snapshot(sim));
			}
			raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			window.removeEventListener("blur", onBlur);
			delete window.__controlsTest;
			audio.setDrive(0, false);
		};
	}, [
		aero,
		car,
		rocketMode,
		thruster
	]);
	const leave = () => {
		if (exited.current) return;
		exited.current = true;
		const sim = simRef.current;
		onExit(sim ? payout(sim) : 0, sim ? sim.distance : 0);
	};
	const press = (key) => ({
		onPointerDown: (e) => {
			e.preventDefault();
			audio.unlock();
			e.currentTarget.setPointerCapture(e.pointerId);
			touchRef.current[key] = true;
		},
		onPointerUp: () => {
			touchRef.current[key] = false;
		},
		onPointerCancel: () => {
			touchRef.current[key] = false;
		}
	});
	const kmh = Math.round((hud?.speed ?? 34) * 3.6);
	const crashed = hud?.phase === "crashed";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "race-lock fixed inset-0 z-20 bg-void text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "absolute inset-0 h-full w-full"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-4 pt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-lg tracking-wide",
					children: "$GIGAROADSTER"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "A izquierda · D derecha · Shift impulso"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pr-14 text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-5xl leading-none tabular-nums",
						children: kmh
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm tracking-wide text-mint",
						children: "KM/H"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 top-20 flex flex-wrap justify-center gap-x-6 gap-y-1 px-4 text-sm tabular-nums",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Math.floor(hud?.distance ?? 0), " m"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-mint",
						children: [hud?.orbs ?? 0, " orbes"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-gold",
						children: [
							"+",
							hud?.payout ?? 0,
							" $GIGA"
						]
					}),
					hud?.shield ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-mint",
						children: "Escudo"
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "absolute top-4 right-4 flex size-11 items-center justify-center rounded-full border border-line bg-ink text-fg",
				"aria-label": muted ? "Activar sonido" : "Silenciar",
				onClick: () => {
					audio.unlock();
					setMuted(audio.toggleMute());
				},
				children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-5" })
			}),
			crashed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 flex items-center justify-center bg-void/80 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel w-full max-w-md p-6 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-sm tracking-widest text-gold",
							children: "GRAVITY FAIL"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 text-4xl",
							children: "Carrera cortada"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-pretty text-muted",
							children: [
								Math.floor(hud?.distance ?? 0),
								" metros · ",
								hud?.orbs ?? 0,
								" orbes · ",
								hud?.nearMiss ?? 0,
								" cerca"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 font-display text-3xl tabular-nums text-mint",
							children: [
								"+",
								hud?.payout ?? 0,
								" $GIGA"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "Quedan en pendientes hasta que los reclames."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-5 w-full",
							size: "lg",
							onClick: leave,
							children: "Guardar y volver"
						})
					]
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3 md:hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "lg",
								...press("left"),
								children: "Izquierda"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "gold",
								size: "lg",
								...press("suction"),
								children: ["Succión", (hud?.suctionCd ?? 0) > .2 ? ` ${Math.ceil(hud?.suctionCd ?? 0)}` : ""]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "primary",
								size: "lg",
								...press("boost"),
								children: ["Impulso", (hud?.boostCd ?? 0) > .2 ? ` ${Math.ceil(hud?.boostCd ?? 0)}` : ""]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "lg",
								...press("right"),
								children: "Derecha"
							})
						]
					}),
					rocketMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "gold",
						size: "lg",
						...press("rocket"),
						disabled: (hud?.rocketLeft ?? 1) === 0,
						children: (hud?.rocketLeft ?? 1) > 0 ? "Rocket mode" : "Rocket usado"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 text-sm text-muted",
						onClick: leave,
						children: "Retirarse y guardar"
					})
				]
			}),
			!crashed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "absolute bottom-4 left-4 hidden min-h-11 rounded-full border border-line bg-ink px-4 text-sm text-muted md:inline-flex",
				onClick: leave,
				children: "Retirarse"
			}) : null
		]
	});
}
var CARS = [
	{
		id: "performance",
		name: "Performance",
		blurb: "Violeta de fábrica. Equilibrio entre techo y dirección.",
		paint: ""
	},
	{
		id: "thrust",
		name: "Thrust",
		blurb: "Menta. Entra en velocidad antes y aguanta mejor el cambio de carril.",
		paint: "paint-thrust"
	},
	{
		id: "rocket",
		name: "Rocket",
		blurb: "Oro. El techo más alto. Pide aero si quieres girar fino.",
		paint: "paint-rocket"
	}
];
function GameApp() {
	const [view, setView] = (0, import_react.useState)("lobby");
	const [note, setNote] = (0, import_react.useState)(null);
	const save = useSave();
	(0, import_react.useEffect)(() => {
		useSave.persist.rehydrate();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!note) return;
		const id = window.setTimeout(() => setNote(null), 2400);
		return () => window.clearTimeout(id);
	}, [note]);
	const unlock = () => audio.unlock();
	if (view === "race") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RaceView, {
		car: save.active,
		thruster: save.thruster,
		aero: save.aero,
		rocketMode: save.rocketMode,
		onExit: (earned, distance) => {
			save.bank(earned, distance);
			setNote(earned > 0 ? `+${earned} $GIGA en pendientes. Reclámalos en el paddock.` : "Vuelta corta. El paddock sigue abierto.");
			setView("lobby");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "sky-wash relative min-h-dvh overflow-x-hidden text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/art/banner.jpg",
				alt: "",
				className: "pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-b from-void/70 via-void/80 to-void" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "gold-corners pointer-events-none absolute inset-3 sm:inset-4" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-6 sm:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xl tracking-wide sm:text-2xl",
							children: "$GIGAROADSTER"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-right text-sm leading-tight",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block tabular-nums text-mint",
									children: [save.giga, " $GIGA"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: save.wallet ?? "Sin wallet"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: save.wallet ? "ghost" : "gold",
								onClick: () => {
									unlock();
									save.connect();
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, {
									className: "size-4",
									"aria-hidden": true
								}), save.wallet ? "Lista" : "Conectar"]
							})]
						})]
					}),
					view === "lobby" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lobby, {
						best: save.best,
						pending: save.pending,
						onRace: () => {
							unlock();
							setView("race");
						},
						onGarage: () => setView("garage"),
						onShop: () => setView("shop"),
						onClaim: () => {
							unlock();
							if (save.pending <= 0) {
								setNote("No hay recompensas pendientes.");
								return;
							}
							audio.play("buy");
							save.claim();
							setNote("Recompensas en el saldo.");
						}
					}) : null,
					view === "garage" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Garage, {
						active: save.active,
						cars: save.cars,
						giga: save.giga,
						onBack: () => setView("lobby"),
						onSelect: (id) => {
							unlock();
							save.select(id);
						},
						onMint: (id) => {
							unlock();
							const ok = save.mint(id);
							audio.play(ok ? "buy" : "crash");
							setNote(ok ? `${label(id)} minteado en el garaje.` : "No alcanza el $GIGA.");
						}
					}) : null,
					view === "shop" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shop, {
						giga: save.giga,
						thruster: save.thruster,
						aero: save.aero,
						rocketMode: save.rocketMode,
						onBack: () => setView("lobby"),
						onBuy: (id) => {
							unlock();
							const ok = save.buy(id);
							audio.play(ok ? "buy" : "crash");
							setNote(ok ? "Repuesto instalado." : "No alcanza el $GIGA.");
						}
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
						className: "mt-auto flex flex-col items-center gap-3 pt-10 pb-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-center font-display text-sm tracking-widest text-gold",
								children: "FAST · DECENTRALIZED · LIMITLESS"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SolanaMark, {}),
							note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-center text-sm text-mint",
								role: "status",
								children: note
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "max-w-md text-center text-sm text-pretty text-muted",
								children: "Wallet de prueba. Nada se firma ni sale de este navegador."
							})
						]
					})
				]
			})
		]
	});
}
function Lobby({ best, pending, onRace, onGarage, onShop, onClaim }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "order-2 lg:order-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display tracking-widest text-gold",
					children: "CIRCUITO ESTELAR"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-5xl leading-none sm:text-7xl",
					children: "$GIGAROADSTER"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 max-w-xl font-display text-lg tracking-wide text-fg sm:text-2xl",
					children: [
						"BUILT FOR SPEED. ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-violet",
							children: "POWERED"
						}),
						" BY",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-mint",
							children: "SOLANA"
						}),
						"."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex gap-6 text-gold",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hexagon, { className: "size-6" }),
							label: "Chasis"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Leaf, { className: "size-6" }),
							label: "Empuje"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-6" }),
							label: "Sin límite"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 max-w-md text-pretty text-muted",
					children: [
						"Esquiva asteroides en el puente de cristal, recoge orbes y cobra $GIGA. Mejor distancia:",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular-nums text-fg",
							children: [best, " m"]
						}),
						"."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "lg",
							onClick: onRace,
							children: "Iniciar carrera"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "lg",
							variant: "gold",
							onClick: onGarage,
							children: "Garaje"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "lg",
							variant: "ghost",
							onClick: onShop,
							children: "Tienda"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Recompensas pendientes"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-display text-2xl tabular-nums text-mint",
						children: [pending, " $GIGA"]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "gold",
						onClick: onClaim,
						disabled: pending <= 0,
						children: "Reclamar"
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "order-1 flex justify-center lg:order-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative aspect-square w-full max-w-64 sm:max-w-sm lg:max-w-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "orbit-ring pointer-events-none absolute -inset-3 rounded-full border border-dashed border-gold" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/art/cosmos.png",
					alt: "Gigaroadster violeta sobre un puente de cristal, entre planetas",
					className: "gold-ring h-full w-full rounded-full object-cover",
					width: 900,
					height: 1200
				})]
			})
		})]
	});
}
function Stat({ icon, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-2",
		children: [icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm text-muted",
			children: label
		})]
	});
}
function Garage({ active, cars, giga, onBack, onSelect, onMint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 flex items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display tracking-widest text-gold",
				children: "GARAGE"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-4xl sm:text-5xl",
				children: "Mintear carros"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: onBack,
				children: "Volver"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 md:grid-cols-3",
			children: CARS.map((car) => {
				const owned = cars[car.id];
				const cost = MINT_COST[car.id];
				const selected = active === car.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "panel overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative aspect-[4/5] bg-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: car.id === "performance" ? "/art/emblem.jpg" : "/art/cosmos.png",
							alt: "",
							className: `h-full w-full object-cover ${car.paint}`
						}), selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute top-3 left-3 rounded-full bg-mint px-3 py-1 font-display text-sm text-void",
							children: "En pista"
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl",
								children: car.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-pretty text-muted",
								children: car.blurb
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4",
								children: owned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full",
									variant: selected ? "ghost" : "primary",
									onClick: () => onSelect(car.id),
									children: selected ? "Seleccionado" : "Elegir"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									className: "w-full",
									variant: "gold",
									disabled: giga < cost,
									onClick: () => onMint(car.id),
									children: [
										"Mintear · ",
										cost,
										" $GIGA"
									]
								})
							})
						]
					})]
				}, car.id);
			})
		})]
	});
}
function Shop({ giga, thruster, aero, rocketMode, onBack, onBuy }) {
	const cost = useSave.getState().cost;
	const rows = [
		{
			id: "thruster",
			name: "Thrusters",
			blurb: "Alarga el impulso y sube el techo de velocidad.",
			level: `${thruster}/3`
		},
		{
			id: "aero",
			name: "Active Aero",
			blurb: "Dirección más viva y succión con menos espera.",
			level: `${aero}/3`
		},
		{
			id: "rocketMode",
			name: "Rocket Mode",
			blurb: "Una vez por carrera: limpia el carril y rompe el límite.",
			level: rocketMode ? "Instalado" : "Sin instalar"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 flex items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display tracking-widest text-gold",
					children: "TIENDA"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-4xl sm:text-5xl",
					children: "Repuestos"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: onBack,
					children: "Volver"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid gap-3",
				children: rows.map((row) => {
					const price = cost(row.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl",
								children: row.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-pretty text-muted",
								children: row.blurb
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-gold",
								children: row.level
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "primary",
							disabled: price == null || giga < price,
							onClick: () => onBuy(row.id),
							children: price == null ? "Al máximo" : `Comprar · ${price}`
						})]
					}, row.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-sm text-muted",
				children: [
					"Saldo ",
					giga,
					" $GIGA. El impulso es Shift; la succión, espacio; rocket, R."
				]
			})
		]
	});
}
function SolanaMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "36",
		height: "28",
		viewBox: "0 0 36 28",
		"aria-hidden": true,
		className: "text-mint",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M4 6h22l-4-4H0l4 4z",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M4 16h22l-4-4H0l4 4z",
				fill: "#9945ff"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M4 26h22l-4-4H0l4 4z",
				fill: "currentColor"
			})
		]
	});
}
function label(id) {
	if (id === "thrust") return "Thrust";
	if (id === "rocket") return "Rocket";
	return "Performance";
}
var SplitComponent = GameApp;
//#endregion
export { SplitComponent as component };
