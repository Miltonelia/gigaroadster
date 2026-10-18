export type CarId = "performance" | "thrust" | "rocket";

export type SimConfig = {
  car: CarId;
  thrusterLevel: number;
  aeroLevel: number;
  rocketMode: boolean;
};

export type EntityKind = "rock" | "orb";

export type Entity = {
  active: boolean;
  kind: EntityKind;
  x: number;
  z: number;
  resolved: boolean;
};

export type Particle = {
  active: boolean;
  x: number;
  z: number;
  vx: number;
  vz: number;
  life: number;
  max: number;
  hue: 0 | 1 | 2;
};

export type Phase = "racing" | "crashed";

export type Input = {
  /** +1 steers left on screen, -1 steers right. */
  steer: number;
  /** Held accelerator. */
  throttle: boolean;
  /** Held brake. Overrides the accelerator. */
  brake: boolean;
  boostEdge: boolean;
  suctionEdge: boolean;
  rocketEdge: boolean;
};

const POOL = 36;
const PARTICLES = 90;
const LANES = [-0.5, 0.5] as const;

const CARS: Record<CarId, { accel: number; handling: number; top: number }> = {
  performance: { accel: 0.7, handling: 1, top: 24 },
  thrust: { accel: 0.95, handling: 1.12, top: 22 },
  rocket: { accel: 0.6, handling: 0.9, top: 30 },
};

export type Sim = {
  phase: Phase;
  t: number;
  distance: number;
  speed: number;
  yaw: number;
  lateral: number;
  latVel: number;
  boostT: number;
  boostCd: number;
  suctionT: number;
  suctionCd: number;
  shieldT: number;
  rocketT: number;
  rocketLeft: number;
  shake: number;
  scrape: number;
  braking: boolean;
  throttleOn: boolean;
  orbs: number;
  nearMiss: number;
  combo: number;
  comboT: number;
  sector: number;
  banner: string;
  bannerT: number;
  flash: number;
  spawnAcc: number;
  lastOpen: number;
  scroll: number;
  crashT: number;
  sfx: string | null;
  entities: Entity[];
  particles: Particle[];
  config: SimConfig;
};

export function createSim(config: SimConfig): Sim {
  return {
    phase: "racing",
    t: 0,
    distance: 0,
    speed: 0,
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
    braking: false,
    throttleOn: false,
    orbs: 0,
    nearMiss: 0,
    combo: 0,
    comboT: 0,
    sector: 0,
    banner: "HOLD GAS",
    bannerT: 1.15,
    flash: 0,
    spawnAcc: 0.85,
    lastOpen: 1,
    scroll: 0,
    crashT: 0,
    sfx: null,
    entities: Array.from({ length: POOL }, () => ({
      active: false,
      kind: "rock" as const,
      x: 0,
      z: 0,
      resolved: false,
    })),
    particles: Array.from({ length: PARTICLES }, () => ({
      active: false,
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      life: 0,
      max: 1,
      hue: 0 as const,
    })),
    config,
  };
}

export function payout(sim: Sim): number {
  return Math.floor(sim.distance / 22) + sim.orbs * 18 + sim.nearMiss * 4;
}

function acquire(sim: Sim): Entity | null {
  for (const e of sim.entities) {
    if (!e.active) return e;
  }
  return null;
}

function burst(sim: Sim, x: number, z: number, hue: 0 | 1 | 2, n: number) {
  let left = n;
  for (const p of sim.particles) {
    if (p.active) continue;
    p.active = true;
    p.x = x + (Math.random() - 0.5) * 0.2;
    p.z = z;
    p.vx = (Math.random() - 0.5) * 2.2;
    p.vz = (Math.random() - 0.5) * 10;
    p.max = 0.28 + Math.random() * 0.35;
    p.life = p.max;
    p.hue = hue;
    left -= 1;
    if (left <= 0) break;
  }
}

function spawnWave(sim: Sim) {
  const flip = Math.random() < 0.62;
  const open = flip ? (sim.lastOpen === 0 ? 1 : 0) : sim.lastOpen;
  sim.lastOpen = open;
  const blocked = open === 0 ? 1 : 0;
  const z0 = Math.max(96, sim.speed * 4.8);
  const rock = acquire(sim);
  if (rock) {
    rock.active = true;
    rock.kind = "rock";
    rock.x = LANES[blocked];
    rock.z = z0;
    rock.resolved = false;
  }
  if (Math.random() < 0.7) {
    const orb = acquire(sim);
    if (!orb) return;
    orb.active = true;
    orb.kind = "orb";
    orb.x = LANES[open];
    orb.z = z0 + 8;
    orb.resolved = false;
  }
}

function crash(sim: Sim) {
  if (sim.phase !== "racing") return;
  sim.phase = "crashed";
  sim.shake = 1.25;
  sim.flash = 0.7;
  sim.banner = "GRAVITY FAIL";
  sim.bannerT = 2;
  sim.sfx = "crash";
  sim.latVel = 0;
  burst(sim, sim.lateral, 1.2, 2, 18);
}

function tickParticles(sim: Sim, dt: number) {
  for (const p of sim.particles) {
    if (!p.active) continue;
    p.life -= dt;
    p.x += p.vx * dt;
    p.z += p.vz * dt;
    if (p.life <= 0) p.active = false;
  }
}

export function step(sim: Sim, input: Input, dt: number) {
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

  const car = CARS[sim.config.car];
  const handling = car.handling * (1 + sim.config.aeroLevel * 0.2);
  const steer = Math.max(-1, Math.min(1, input.steer));

  const grip = Math.min(1, Math.max(0.4, sim.speed / 10));
  sim.yaw += steer * 2.5 * (sim.speed > 2 ? 1 : 0.4) * dt;
  const targetVel = -steer * 2.35 * handling * grip;
  const follow = sim.suctionT > 0 ? 14 : 7 + sim.config.aeroLevel;
  sim.latVel += (targetVel - sim.latVel) * (1 - Math.exp(-follow * dt));
  if (sim.suctionT > 0) sim.latVel += -sim.lateral * 9 * dt;
  sim.lateral += sim.latVel * dt;

  if (Math.abs(sim.lateral) > 0.86) {
    sim.lateral = Math.sign(sim.lateral) * 0.86;
    if (Math.sign(sim.latVel) === Math.sign(sim.lateral)) sim.latVel = 0;
    sim.scrape = 0.12;
    sim.shake = Math.max(sim.shake, 0.12);
  }

  const top = car.top + sim.config.thrusterLevel * 5 + Math.min(10, sim.distance / 1800);
  let ceiling = top;
  if (sim.boostT > 0) ceiling = top * (1.12 + sim.config.thrusterLevel * 0.03);
  if (sim.rocketT > 0) ceiling = top * 1.38;
  if (sim.scrape > 0) ceiling *= 0.8;

  sim.braking = input.brake && sim.speed > 0.4;
  const gas = (input.throttle || sim.boostT > 0 || sim.rocketT > 0) && !input.brake;
  sim.throttleOn = gas;
  if (input.brake) {
    sim.speed = Math.max(0, sim.speed - (32 + sim.config.aeroLevel * 4) * dt);
  } else if (gas) {
    const rate = car.accel * (input.throttle ? 1 : 0.8);
    sim.speed += (ceiling - sim.speed) * (1 - Math.exp(-rate * dt));
  } else {
    sim.speed = Math.max(0, sim.speed - 5 * dt);
  }
  sim.distance += sim.speed * dt;
  sim.scroll += sim.speed * dt;

  const sector = Math.floor(sim.distance / 1000);
  if (sector > sim.sector) {
    sim.sector = sector;
    sim.banner = `SECTOR ${sector}`;
    sim.bannerT = 1.3;
    sim.flash = Math.max(sim.flash, 0.25);
  }

  if (input.boostEdge && sim.boostCd <= 0) {
    sim.boostT = 1.35 + sim.config.thrusterLevel * 0.38;
    sim.boostCd = 5.1;
    sim.sfx = "boost";
    sim.flash = Math.max(sim.flash, 0.3);
  }

  if (input.suctionEdge && sim.suctionCd <= 0) {
    sim.suctionT = 0.7;
    sim.suctionCd = Math.max(4.2, 6.4 - sim.config.aeroLevel * 0.35);
    sim.shieldT = Math.max(sim.shieldT, 0.42);
    sim.speed *= 0.9;
    sim.sfx = "suction";
    for (const e of sim.entities) {
      if (!e.active || e.kind !== "rock") continue;
      if (e.z < 0 || e.z > 26) continue;
      if (Math.abs(e.x - sim.lateral) > 0.5) continue;
      const dir = e.x >= sim.lateral ? 1 : -1;
      e.x = Math.max(-1.35, Math.min(1.35, e.x + dir * 0.9));
    }
    burst(sim, sim.lateral, 2, 1, 10);
  }

  if (input.rocketEdge && sim.rocketLeft > 0) {
    sim.rocketLeft = 0;
    sim.rocketT = 2.2;
    sim.shieldT = 2.2;
    sim.sfx = "rocket";
    sim.flash = 0.55;
    for (const e of sim.entities) {
      if (!e.active || e.kind !== "rock") continue;
      if (e.z > 0 && e.z < 42 && Math.abs(e.x - sim.lateral) < 0.75) {
        e.active = false;
        burst(sim, e.x, e.z, 2, 6);
      }
    }
  }

  if (sim.boostT > 0 && Math.random() < 0.6) {
    burst(sim, sim.lateral + (Math.random() - 0.5) * 0.3, 0.4, 1, 1);
  }

  if (sim.speed > 5) sim.spawnAcc += dt;
  const interval = Math.max(1.8, 2.8 - sim.speed / 28);
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
    const overlaps = prevZ > -0.4 && e.z < 2.4;
    if (!overlaps) continue;
    const dx = Math.abs(sim.lateral - e.x);
    if (e.kind === "orb") {
      if (dx < 0.34 && prevZ > 0 && e.z < 2) {
        e.resolved = true;
        e.active = false;
        sim.orbs += 1;
        sim.sfx = sim.sfx ?? "orb";
        sim.flash = Math.max(sim.flash, 0.18);
        burst(sim, e.x, 1, 1, 8);
      } else if (e.z < 0) {
        e.resolved = true;
      }
      continue;
    }
    if (prevZ > 0 && e.z < 1.8) {
      e.resolved = true;
      if (dx < 0.31) {
        if (sim.shieldT > 0) {
          e.active = false;
          burst(sim, e.x, 1.2, 0, 8);
          sim.shake = Math.max(sim.shake, 0.2);
        } else {
          crash(sim);
        }
      } else if (dx < 0.5) {
        sim.nearMiss += 1;
        sim.combo += 1;
        sim.comboT = 1.6;
        sim.banner = sim.combo > 1 ? `CLOSE ×${sim.combo}` : "CLOSE";
        sim.bannerT = 0.7;
        sim.shake = Math.max(sim.shake, 0.18);
      }
    }
  }
}
