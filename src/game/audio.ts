/** Tiny Web Audio mixer. Resume only from a user gesture. */
class Mixer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private engine: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private sfx: GainNode | null = null;
  muted = false;
  private hooked = false;

  unlock() {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: "interactive" });
      const master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(ctx.destination);
      const sfx = ctx.createGain();
      sfx.gain.value = 0.7;
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
    if (this.ctx.state === "suspended") void this.ctx.resume();
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
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime, 0.03);
    return this.muted;
  }

  setDrive(speed: number, boost: boolean) {
    if (!this.ctx || !this.engine || !this.engineGain) return;
    const now = this.ctx.currentTime;
    const freq = 46 + Math.min(160, speed * 1.15) + (boost ? 36 : 0);
    this.engine.frequency.setTargetAtTime(freq, now, 0.08);
    const gain = this.muted ? 0 : Math.min(0.045, 0.01 + speed * 0.00028);
    this.engineGain.gain.setTargetAtTime(speed <= 0.5 ? 0 : gain, now, 0.06);
  }

  play(kind: string) {
    if (!this.ctx || !this.sfx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.sfx);
    let dur = 0.18;
    if (kind === "orb") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(660 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(1180, now + 0.12);
      dur = 0.16;
    } else if (kind === "boost") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.28);
      dur = 0.32;
    } else if (kind === "suction") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.28);
      dur = 0.3;
    } else if (kind === "rocket") {
      osc.type = "square";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
      dur = 0.42;
    } else if (kind === "crash") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
      dur = 0.45;
    } else if (kind === "buy") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.1);
      dur = 0.14;
    } else {
      osc.type = "sine";
      osc.frequency.value = 300;
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "crash" ? 0.35 : 0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
}

export const audio = new Mixer();
