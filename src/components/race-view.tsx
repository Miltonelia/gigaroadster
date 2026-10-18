import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { audio } from "@/game/audio";
import { drawFrame } from "@/game/draw";
import "@/game/probe";
import {
  createSim,
  payout,
  step,
  type CarId,
  type Input,
  type Sim,
} from "@/game/sim";
import { Button } from "@/components/ui/button";

type TouchFlags = {
  left: boolean;
  right: boolean;
  gas: boolean;
  brake: boolean;
  boost: boolean;
  suction: boolean;
  rocket: boolean;
};

type Hud = {
  phase: Sim["phase"];
  speed: number;
  distance: number;
  orbs: number;
  nearMiss: number;
  payout: number;
  boostCd: number;
  suctionCd: number;
  rocketLeft: number;
  shield: boolean;
};

function snapshot(sim: Sim): Hud {
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
    shield: sim.shieldT > 0,
  };
}

export function RaceView({
  car,
  thruster,
  aero,
  rocketMode,
  onExit,
}: {
  car: CarId;
  thruster: number;
  aero: number;
  rocketMode: boolean;
  onExit: (earned: number, distance: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim | null>(null);
  const touchRef = useRef<TouchFlags>({
    left: false,
    right: false,
    gas: false,
    brake: false,
    boost: false,
    suction: false,
    rocket: false,
  });
  const keysRef = useRef<Set<string>>(new Set());
  const qaKeysRef = useRef<Set<string>>(new Set());
  const qaSteerRef = useRef<number | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [muted, setMuted] = useState(audio.muted);
  const exited = useRef(false);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sim = createSim({
      car,
      thrusterLevel: thruster,
      aeroLevel: aero,
      rocketMode,
    });
    simRef.current = sim;
    setHud(snapshot(sim));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const keys = keysRef.current;
    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.code);
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
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
      },
    };

    let raf = 0;
    let last = performance.now();
    let hudAcc = 0;
    let prevBoost = false;
    let prevSuction = false;
    let prevRocket = false;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const down = (code: string) => keys.has(code) || qaKeysRef.current.has(code);
      const touch = touchRef.current;
      let steer = 0;
      if (down("KeyA") || down("ArrowLeft") || touch.left) steer += 1;
      if (down("KeyD") || down("ArrowRight") || touch.right) steer -= 1;
      if (qaSteerRef.current != null) steer = qaSteerRef.current;
      const boostDown = down("ShiftLeft") || down("ShiftRight") || touch.boost;
      const suctionDown = down("Space") || down("KeyF") || touch.suction;
      const rocketDown = down("KeyR") || touch.rocket;
      const input: Input = {
        steer: Math.max(-1, Math.min(1, steer)),
        throttle: down("KeyW") || down("ArrowUp") || touch.gas,
        brake: down("KeyS") || down("ArrowDown") || touch.brake,
        boostEdge: boostDown && !prevBoost,
        suctionEdge: suctionDown && !prevSuction,
        rocketEdge: rocketDown && !prevRocket,
      };
      prevBoost = boostDown;
      prevSuction = suctionDown;
      prevRocket = rocketDown;

      const before = sim.phase;
      let acc = dt;
      let first = true;
      while (acc > 0.0001) {
        const slice = Math.min(1 / 60, acc);
        step(
          sim,
          first
            ? input
            : { ...input, boostEdge: false, suctionEdge: false, rocketEdge: false },
          slice,
        );
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
      if (hudAcc > 0.12 || sim.phase !== before) {
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
  }, [aero, car, rocketMode, thruster]);

  const leave = () => {
    if (exited.current) return;
    exited.current = true;
    const sim = simRef.current;
    onExit(sim ? payout(sim) : 0, sim ? sim.distance : 0);
  };

  const press = (key: keyof TouchFlags) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
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
    },
  });

  const kmh = Math.round((hud?.speed ?? 0) * 3.6);
  const crashed = hud?.phase === "crashed";

  return (
    <div className="race-lock relative h-dvh w-full overflow-hidden bg-void text-fg">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Gigaroadster race" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <p className="font-display text-lg tracking-wide">$GIGAROADSTER</p>
          <p className="text-sm text-muted">W gas · S brake · A and D steer</p>
        </div>
        <div className="pr-14 text-right">
          <p className="font-display text-5xl leading-none tabular-nums">{kmh}</p>
          <p className="text-sm tracking-wide text-mint">KM/H</p>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-20 flex flex-wrap justify-center gap-x-6 gap-y-1 px-4 text-sm tabular-nums">
        <span>{Math.floor(hud?.distance ?? 0)} m</span>
        <span className="text-mint">{hud?.orbs ?? 0} orbs</span>
        <span className="text-gold">+{hud?.payout ?? 0} $GIRO</span>
        {hud?.shield ? <span className="text-mint">Shield</span> : null}
      </div>
      {!crashed && (hud?.speed ?? 0) < 4 ? (
        <p className="pointer-events-none absolute inset-x-0 top-36 text-center font-display text-3xl tracking-wide text-fg">
          Hold Gas
        </p>
      ) : null}
      <button
        type="button"
        className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full border border-line bg-ink text-fg"
        aria-label={muted ? "Unmute" : "Mute"}
        onClick={() => {
          audio.unlock();
          setMuted(audio.toggleMute());
        }}
      >
        {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </button>

      {crashed ? (
        <div className="absolute inset-0 flex items-center justify-center bg-void/80 p-4">
          <div className="panel w-full max-w-md p-6 text-center">
            <p className="font-display text-sm tracking-widest text-gold">GRAVITY FAIL</p>
            <h2 className="mt-1 text-4xl">Run over</h2>
            <p className="mt-3 text-pretty text-muted">
              {Math.floor(hud?.distance ?? 0)} meters · {hud?.orbs ?? 0} orbs · {hud?.nearMiss ?? 0} close calls
            </p>
            <p className="mt-2 font-display text-3xl tabular-nums text-mint">+{hud?.payout ?? 0} $GIRO</p>
            <p className="mt-1 text-sm text-muted">Saved as pending until you claim them.</p>
            <Button className="mt-5 w-full" size="lg" onClick={leave}>
              Save and exit
            </Button>
          </div>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-void/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            <button type="button" className="min-h-11 shrink-0 px-2 text-sm text-muted" onClick={leave}>
              Paddock
            </button>
            <div className="grid flex-1 grid-cols-2 gap-2">
              <Button variant="gold" size="sm" {...press("suction")}>
                Suction{(hud?.suctionCd ?? 0) > 0.2 ? ` ${Math.ceil(hud?.suctionCd ?? 0)}` : ""}
              </Button>
              <Button variant="ghost" size="sm" {...press("boost")}>
                Boost{(hud?.boostCd ?? 0) > 0.2 ? ` ${Math.ceil(hud?.boostCd ?? 0)}` : ""}
              </Button>
            </div>
          </div>
          {rocketMode ? (
            <Button variant="gold" size="md" {...press("rocket")} disabled={(hud?.rocketLeft ?? 1) === 0}>
              {(hud?.rocketLeft ?? 1) > 0 ? "Rocket mode" : "Rocket used"}
            </Button>
          ) : null}
          {/* Thumb pads: gas under the left thumb, brake under the right, steering in the middle. */}
          <div className="grid grid-cols-[1.25fr_1fr_1fr_1.25fr] gap-2">
            <Button variant="primary" className="h-20 rounded-2xl px-2 text-lg" {...press("gas")}>
              Gas
            </Button>
            <Button variant="ghost" className="h-20 rounded-2xl px-2" aria-label="Steer left" {...press("left")}>
              <ChevronLeft className="size-9" />
            </Button>
            <Button variant="ghost" className="h-20 rounded-2xl px-2" aria-label="Steer right" {...press("right")}>
              <ChevronRight className="size-9" />
            </Button>
            <Button variant="brake" className="h-20 rounded-2xl px-2 text-lg" {...press("brake")}>
              Brake
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
