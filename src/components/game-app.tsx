import { useEffect, useState, type ReactNode } from "react";
import { Gauge, Hexagon, Leaf, Wallet } from "lucide-react";
import { audio } from "@/game/audio";
import type { CarId } from "@/game/sim";
import { MINT_COST, useSave } from "@/game/store";
import { RaceView } from "@/components/race-view";
import { Button } from "@/components/ui/button";

type View = "lobby" | "garage" | "shop" | "race";

const CARS: { id: CarId; name: string; blurb: string; paint: string }[] = [
  {
    id: "performance",
    name: "Performance",
    blurb: "Factory violet. Balanced top speed and steering.",
    paint: "",
  },
  {
    id: "thrust",
    name: "Thrust",
    blurb: "Mint. Reaches speed sooner and changes lanes cleaner.",
    paint: "paint-thrust",
  },
  {
    id: "rocket",
    name: "Rocket",
    blurb: "Gold. Highest top speed. Add aero if you want sharper turns.",
    paint: "paint-rocket",
  },
];

export function GameApp() {
  const [view, setView] = useState<View>("race");
  const [note, setNote] = useState<string | null>(null);
  const save = useSave();

  useEffect(() => {
    void useSave.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(null), 2400);
    return () => window.clearTimeout(id);
  }, [note]);

  const unlock = () => audio.unlock();

  if (view === "race") {
    return (
      <RaceView
        car={save.active}
        thruster={save.thruster}
        aero={save.aero}
        rocketMode={save.rocketMode}
        onExit={(earned, distance) => {
          save.bank(earned, distance);
          setNote(
            earned > 0
              ? `+${earned} $GIRO pending. Claim it in the paddock.`
              : "Short run. The paddock is still open.",
          );
          setView("lobby");
        }}
      />
    );
  }

  return (
    <div className="sky-wash relative min-h-dvh overflow-x-hidden text-fg">
      <img
        src="/art/banner.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void/70 via-void/80 to-void" />
      <div className="gold-corners pointer-events-none absolute inset-3 sm:inset-4" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <p className="font-display text-xl tracking-wide sm:text-2xl">$GIGAROADSTER</p>
          <div className="flex items-center gap-2">
            <p className="text-right text-sm leading-tight">
              <span className="block tabular-nums text-mint">{save.giga} $GIRO</span>
              <span className="text-muted">{save.wallet ?? "No wallet"}</span>
            </p>
            <Button
              size="sm"
              variant={save.wallet ? "ghost" : "gold"}
              onClick={() => {
                unlock();
                save.connect();
              }}
            >
              <Wallet className="size-4" aria-hidden />
              {save.wallet ? "Linked" : "Connect"}
            </Button>
          </div>
        </header>

        {view === "lobby" ? (
          <Lobby
            best={save.best}
            pending={save.pending}
            onRace={() => {
              unlock();
              setView("race");
            }}
            onGarage={() => setView("garage")}
            onShop={() => setView("shop")}
            onClaim={() => {
              unlock();
              if (save.pending <= 0) {
                setNote("No rewards waiting.");
                return;
              }
              audio.play("buy");
              save.claim();
              setNote("Rewards added to your balance.");
            }}
          />
        ) : null}

        {view === "garage" ? (
          <Garage
            active={save.active}
            cars={save.cars}
            giga={save.giga}
            onBack={() => setView("lobby")}
            onSelect={(id) => {
              unlock();
              save.select(id);
            }}
            onMint={(id) => {
              unlock();
              const ok = save.mint(id);
              audio.play(ok ? "buy" : "crash");
              setNote(ok ? `${label(id)} minted into the garage.` : "Not enough $GIRO.");
            }}
          />
        ) : null}

        {view === "shop" ? (
          <Shop
            giga={save.giga}
            thruster={save.thruster}
            aero={save.aero}
            rocketMode={save.rocketMode}
            onBack={() => setView("lobby")}
            onBuy={(id) => {
              unlock();
              const ok = save.buy(id);
              audio.play(ok ? "buy" : "crash");
              setNote(ok ? "Part installed." : "Not enough $GIRO.");
            }}
          />
        ) : null}

        <footer className="mt-auto flex flex-col items-center gap-3 pt-10 pb-2">
          <p className="text-center font-display text-sm tracking-widest text-gold">
            FAST · DECENTRALIZED · LIMITLESS
          </p>
          <SolanaMark />
          {note ? (
            <p className="text-center text-sm text-mint" role="status">
              {note}
            </p>
          ) : (
            <p className="max-w-md text-center text-sm text-pretty text-muted">
              Demo wallet. Nothing is signed or leaves this browser.
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}

function Lobby({
  best,
  pending,
  onRace,
  onGarage,
  onShop,
  onClaim,
}: {
  best: number;
  pending: number;
  onRace: () => void;
  onGarage: () => void;
  onShop: () => void;
  onClaim: () => void;
}) {
  return (
    <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="order-2 lg:order-1">
        <p className="font-display tracking-widest text-gold">STAR CIRCUIT</p>
        <h1 className="mt-2 text-5xl leading-none sm:text-7xl">$GIGAROADSTER</h1>
        <p className="mt-4 max-w-xl font-display text-lg tracking-wide text-fg sm:text-2xl">
          BUILT FOR SPEED. <span className="text-violet">LAUNCHING</span> ON{" "}
          <span className="text-mint">SOLANA</span>.
        </p>
        <p className="mt-3 max-w-xl rounded-lg border border-line bg-void/60 px-4 py-3 text-sm text-pretty text-muted">
          <span className="font-display tracking-widest text-gold">SIMULATED GAME.</span> Points earned here are not real yet. The mission: make it real, so every point turns into real{" "}
          <span className="text-fg">$GIGAROADSTER</span> token earnings.
        </p>
        <div className="mt-6 flex gap-6 text-gold">
          <Stat icon={<Hexagon className="size-6" />} label="Chassis" />
          <Stat icon={<Leaf className="size-6" />} label="Thrust" />
          <Stat icon={<Gauge className="size-6" />} label="No limit" />
        </div>
        <p className="mt-6 max-w-md text-pretty text-muted">
          Dodge asteroids on the crystal bridge, grab orbs, and bank $GIRO. Hold gas to accelerate and brake to stop. Best distance:{" "}
          <span className="tabular-nums text-fg">{best} m</span>.
        </p>
        <div className="sticky bottom-0 z-10 -mx-5 mt-6 flex flex-col gap-2 border-t border-line bg-void/90 px-5 py-3 sm:-mx-8 sm:flex-row sm:px-8">
          <Button size="lg" className="w-full sm:w-auto" onClick={onRace}>
            Start race
          </Button>
          <Button size="lg" variant="gold" className="w-full sm:w-auto" onClick={onGarage}>
            Garage
          </Button>
          <Button size="lg" variant="ghost" className="w-full sm:w-auto" onClick={onShop}>
            Shop
          </Button>
        </div>
        <div className="panel mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted">Pending rewards</p>
            <p className="font-display text-2xl tabular-nums text-mint">{pending} $GIRO</p>
          </div>
          <Button variant="gold" onClick={onClaim} disabled={pending <= 0}>
            Claim
          </Button>
        </div>
      </div>
      <div className="order-1 flex justify-center lg:order-2">
        <div className="relative aspect-square w-full max-w-64 sm:max-w-sm lg:max-w-md">
          <div className="orbit-ring pointer-events-none absolute -inset-3 rounded-full border border-dashed border-gold" />
          <img
            src="/art/cosmos.png"
            alt="Violet Gigaroadster on a crystal bridge among planets"
            className="gold-ring h-full w-full rounded-full object-cover"
            width={900}
            height={1200}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {icon}
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

function Garage({
  active,
  cars,
  giga,
  onBack,
  onSelect,
  onMint,
}: {
  active: CarId;
  cars: Record<CarId, boolean>;
  giga: number;
  onBack: () => void;
  onSelect: (id: CarId) => void;
  onMint: (id: CarId) => void;
}) {
  return (
    <section className="py-8">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="font-display tracking-widest text-gold">GARAGE</p>
          <h1 className="text-4xl sm:text-5xl">Mint cars</h1>
        </div>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {CARS.map((car) => {
          const owned = cars[car.id];
          const cost = MINT_COST[car.id];
          const selected = active === car.id;
          return (
            <article key={car.id} className="panel overflow-hidden">
              <div className="relative aspect-[4/5] bg-ink">
                <img
                  src={car.id === "performance" ? "/art/emblem.jpg" : "/art/cosmos.png"}
                  alt=""
                  className={`h-full w-full object-cover ${car.paint}`}
                />
                {selected ? (
                  <span className="absolute top-3 left-3 rounded-full bg-mint px-3 py-1 font-display text-sm text-void">
                    On track
                  </span>
                ) : null}
              </div>
              <div className="p-4">
                <h2 className="text-2xl">{car.name}</h2>
                <p className="mt-1 text-sm text-pretty text-muted">{car.blurb}</p>
                <div className="mt-4">
                  {owned ? (
                    <Button className="w-full" variant={selected ? "ghost" : "primary"} onClick={() => onSelect(car.id)}>
                      {selected ? "Selected" : "Choose"}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="gold" disabled={giga < cost} onClick={() => onMint(car.id)}>
                      Mint · {cost} $GIRO
                    </Button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Shop({
  giga,
  thruster,
  aero,
  rocketMode,
  onBack,
  onBuy,
}: {
  giga: number;
  thruster: number;
  aero: number;
  rocketMode: boolean;
  onBack: () => void;
  onBuy: (id: "thruster" | "aero" | "rocketMode") => void;
}) {
  const cost = useSave.getState().cost;
  const rows: {
    id: "thruster" | "aero" | "rocketMode";
    name: string;
    blurb: string;
    level: string;
  }[] = [
    {
      id: "thruster",
      name: "Thrusters",
      blurb: "Extends boost and raises top speed.",
      level: `${thruster}/3`,
    },
    {
      id: "aero",
      name: "Active Aero",
      blurb: "Sharper steering and a shorter suction cooldown.",
      level: `${aero}/3`,
    },
    {
      id: "rocketMode",
      name: "Rocket Mode",
      blurb: "Once per run: clears your lane and breaks the limit.",
      level: rocketMode ? "Installed" : "Not installed",
    },
  ];

  return (
    <section className="py-8">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="font-display tracking-widest text-gold">SHOP</p>
          <h1 className="text-4xl sm:text-5xl">Parts</h1>
        </div>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
      <ul className="grid gap-3">
        {rows.map((row) => {
          const price = cost(row.id);
          return (
            <li key={row.id} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl">{row.name}</h2>
                <p className="text-sm text-pretty text-muted">{row.blurb}</p>
                <p className="mt-1 text-sm text-gold">{row.level}</p>
              </div>
              <Button
                variant="primary"
                disabled={price == null || giga < price}
                onClick={() => onBuy(row.id)}
              >
                {price == null ? "Maxed" : `Buy · ${price}`}
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-muted">Balance {giga} $GIRO. Gas is W, brake is S, steer with A and D. Shift boosts, Space is suction, R is rocket.</p>
    </section>
  );
}

function SolanaMark() {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" aria-hidden className="text-mint">
      <path d="M4 6h22l-4-4H0l4 4z" fill="currentColor" />
      <path d="M4 16h22l-4-4H0l4 4z" fill="#9945ff" />
      <path d="M4 26h22l-4-4H0l4 4z" fill="currentColor" />
    </svg>
  );
}

function label(id: CarId) {
  if (id === "thrust") return "Thrust";
  if (id === "rocket") return "Rocket";
  return "Performance";
}
