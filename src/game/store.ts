import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CarId } from "@/game/sim";

type Save = {
  giga: number;
  pending: number;
  wallet: string | null;
  thruster: number;
  aero: number;
  rocketMode: boolean;
  cars: Record<CarId, boolean>;
  active: CarId;
  best: number;
  connect: () => void;
  claim: () => void;
  buy: (id: "thruster" | "aero" | "rocketMode") => boolean;
  mint: (id: CarId) => boolean;
  select: (id: CarId) => void;
  bank: (earned: number, distance: number) => void;
  cost: (id: "thruster" | "aero" | "rocketMode") => number | null;
};

const BASE = { thruster: 300, aero: 200, rocketMode: 500 } as const;
export const MINT_COST: Record<CarId, number> = {
  performance: 0,
  thrust: 450,
  rocket: 900,
};

export const useSave = create<Save>()(
  persist(
    (set, get) => ({
      giga: 1000,
      pending: 0,
      wallet: null,
      thruster: 0,
      aero: 0,
      rocketMode: false,
      cars: { performance: true, thrust: false, rocket: false },
      active: "performance",
      best: 0,
      connect: () => {
        if (get().wallet) return;
        const bytes = crypto.getRandomValues(new Uint8Array(3));
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
        set({ wallet: `Giga…${hex}` });
      },
      claim: () => {
        const pending = get().pending;
        if (pending <= 0) return;
        set({ giga: get().giga + pending, pending: 0 });
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
          set({ giga: get().giga - cost, rocketMode: true });
          return true;
        }
        set({ giga: get().giga - cost, [id]: get()[id] + 1 });
        return true;
      },
      mint: (id) => {
        if (id === "performance" || get().cars[id]) return false;
        const cost = MINT_COST[id];
        if (get().giga < cost) return false;
        set({
          giga: get().giga - cost,
          cars: { ...get().cars, [id]: true },
          active: id,
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
          best: Math.max(get().best, Math.floor(distance)),
        });
      },
    }),
    { name: "gigaroadster-save-v1", skipHydration: true },
  ),
);
