/**
 * Audio director.
 *
 *  - six authored songs (HTMLAudioElement, so they can be seeked deterministically)
 *  - synthesized beds + SFX (Web Audio) so no extra full songs or binaries are needed
 *  - every method degrades to a no-op if a file is missing or the browser refuses playback;
 *    the story never depends on audio.
 *  - `currentTime()` exposes the audio clock so cinematic cues can follow it.
 */

export type TrackId = "archive" | "dusk" | "orbit" | "hours" | "dawn" | "afterlight";
export type BedName = "garden" | "room" | "rain" | "morning" | "booth";
export type SfxName =
  | "tape" | "unlock" | "lantern" | "extinguish" | "phone" | "drawer" | "paper" | "clock" | "wings"
  | "chime" | "radio" | "fan" | "click" | "drip" | "gate" | "page" | "glass" | "water" | "step" | "soft"
  | "latch" | "hover";

const FILES: Record<TrackId, string> = {
  archive: "memory.mp3",
  dusk: "lost.mp3",
  orbit: "rain.mp3",
  hours: "rust-of-life.mp3",
  dawn: "burner-boy.mp3",
  afterlight: "wonder.mp3"
};
export const audioUrl = (id: TrackId) => `${import.meta.env.BASE_URL}audio/${FILES[id]}`;

interface Track {
  el: HTMLAudioElement;
  level: number; // 0..1 before master
  failed: boolean;
  token: number;
}

const smooth = (p: number) => p * p * (3 - 2 * p);

class AudioDirector {
  private ctx: AudioContext | null = null;
  private synth: GainNode | null = null;
  private tracks = new Map<TrackId, Track>();
  private master = 1;
  private muted = false;
  private paused = false;
  private resumeTracks = new Set<TrackId>();
  private bed: { name: BedName; stop: () => void } | null = null;
  private noiseBuf: AudioBuffer | null = null;

  /* ------------------------------ tracks ------------------------------ */
  private track(id: TrackId): Track {
    let t = this.tracks.get(id);
    if (t) return t;
    const el = new Audio();
    el.preload = id === "archive" ? "auto" : "none";
    el.loop = true;
    el.volume = 0;
    el.src = audioUrl(id);
    const track: Track = { el, level: 0, failed: false, token: 0 };
    el.addEventListener("error", () => {
      track.failed = true;
    });
    this.tracks.set(id, track);
    t = track;
    return t;
  }

  private apply(t: Track) {
    t.el.volume = Math.max(0, Math.min(1, this.muted ? 0 : t.level * this.master));
  }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  async unlock(): Promise<void> {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (Ctor) {
          this.ctx = new Ctor();
          this.synth = this.ctx.createGain();
          this.synth.gain.value = this.muted ? 0 : 1;
          this.synth.connect(this.ctx.destination);
        }
      }
      await this.ctx?.resume();
    } catch {
      /* audio is optional */
    }
    // Prime the element that will start later without a gesture (the intro's MEMORY cue).
    const t = this.track("archive");
    if (t.el.paused && !t.failed) {
      try {
        t.el.muted = true;
        await Promise.race([t.el.play(), new Promise((r) => setTimeout(r, 1200))]);
        t.el.pause();
        t.el.currentTime = 0;
      } catch {
        /* ignore */
      } finally {
        t.el.muted = false;
      }
    }
  }

  async preload(id: TrackId, timeoutMs = 4000): Promise<boolean> {
    const t = this.track(id);
    if (t.failed) return false;
    if (t.el.readyState >= 3) return true;
    return new Promise<boolean>((resolve) => {
      const done = (ok: boolean) => {
        t.el.removeEventListener("canplaythrough", onOk);
        t.el.removeEventListener("canplay", onOk);
        t.el.removeEventListener("error", onErr);
        clearTimeout(timer);
        resolve(ok);
      };
      const onOk = () => done(true);
      const onErr = () => done(false);
      const timer = setTimeout(() => done(t.el.readyState >= 2), timeoutMs);
      t.el.addEventListener("canplaythrough", onOk, { once: true });
      t.el.addEventListener("canplay", onOk, { once: true });
      t.el.addEventListener("error", onErr, { once: true });
      t.el.preload = "auto";
      try {
        t.el.load();
      } catch {
        done(false);
      }
    });
  }

  seek(id: TrackId, seconds: number) {
    try {
      this.track(id).el.currentTime = seconds;
    } catch {
      /* not seekable yet */
    }
  }

  /** Start (or continue) a song. `offset` seeks first. Resolves true if audible playback began. */
  async play(id: TrackId, opts: { offset?: number; level?: number; fade?: number } = {}): Promise<boolean> {
    const t = this.track(id);
    if (t.failed) return false;
    const { offset, level = 0.2, fade = 2 } = opts;
    if (offset !== undefined) this.seek(id, offset);
    if (t.el.paused) {
      t.level = 0;
      this.apply(t);
      try {
        await t.el.play();
      } catch {
        if (t.el.error) t.failed = true; // Includes HTTP 200 SPA HTML: media decoding rejects it.
        return false;
      }
    }
    this.fadeTo(id, level, fade);
    return true;
  }

  isPlaying(id: TrackId) {
    const t = this.tracks.get(id);
    return !!t && !t.failed && !t.el.paused;
  }

  /** The audio clock. null if the track is not audibly running. */
  currentTime(id: TrackId): number | null {
    const t = this.tracks.get(id);
    if (!t || t.failed || t.el.paused || t.el.readyState < 2) return null;
    return t.el.currentTime;
  }

  fadeTo(id: TrackId, level: number, seconds = 1, pauseAtZero = true) {
    const t = this.track(id);
    const token = ++t.token;
    const from = t.level;
    const t0 = performance.now();
    const step = (now: number) => {
      if (t.token !== token) return;
      const p = seconds <= 0 ? 1 : Math.min(1, (now - t0) / (seconds * 1000));
      t.level = from + (level - from) * smooth(p);
      this.apply(t);
      if (p < 1) requestAnimationFrame(step);
      else if (level === 0 && pauseAtZero) t.el.pause();
    };
    requestAnimationFrame(step);
    // rAF is suspended in background tabs; guarantee the end state anyway.
    setTimeout(() => {
      if (t.token === token) {
        t.level = level;
        this.apply(t);
        if (level === 0 && pauseAtZero) t.el.pause();
      }
    }, seconds * 1000 + 250);
  }

  stop(id: TrackId) {
    const t = this.tracks.get(id);
    if (!t) return;
    t.token++;
    t.level = 0;
    t.el.pause();
    try {
      t.el.currentTime = 0;
    } catch {
      /* ignore */
    }
  }

  stopAll() {
    (Object.keys(FILES) as TrackId[]).forEach((id) => this.stop(id));
    this.setBed(null);
  }

  /** Fade every other song out and `to` in. */
  async crossfade(to: TrackId, level: number, seconds = 1.8, opts: { offset?: number } = {}) {
    for (const [id, t] of this.tracks) if (id !== to && !t.el.paused) this.fadeTo(id, 0, seconds);
    return this.play(to, { level, fade: seconds, offset: opts.offset });
  }

  fadeAllOut(seconds = 2) {
    for (const [id, t] of this.tracks) if (!t.el.paused) this.fadeTo(id, 0, seconds);
  }

  /* ------------------------------ mute / master ------------------------------ */
  isMuted() {
    return this.muted;
  }
  setPaused(value: boolean) {
    if (value === this.paused) return;
    this.paused = value;
    if (value) {
      this.resumeTracks.clear();
      for (const [id, track] of this.tracks) if (!track.el.paused) { this.resumeTracks.add(id); track.el.pause(); }
      void this.ctx?.suspend().catch(() => {});
    } else {
      for (const id of this.resumeTracks) void this.tracks.get(id)?.el.play().catch(() => {});
      this.resumeTracks.clear();
      void this.ctx?.resume().catch(() => {});
    }
  }
  setMuted(m: boolean) {
    this.muted = m;
    this.tracks.forEach((t) => this.apply(t));
    if (this.synth) this.synth.gain.value = m ? 0 : 1;
  }

  /* ------------------------------ synth helpers ------------------------------ */
  private get ready() {
    return !!this.ctx && !!this.synth && this.ctx.state !== "closed";
  }
  private noise(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (this.noiseBuf) return this.noiseBuf;
    const len = this.ctx.sampleRate * 2;
    const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02; // brown-ish
      d[i] = w * 0.5 + last * 3.5;
    }
    this.noiseBuf = b;
    return b;
  }

  private tone(freq: number, dur: number, gain: number, type: OscillatorType = "sine", slideTo?: number, when = 0) {
    if (!this.ready || !this.ctx || !this.synth) return;
    const c = this.ctx;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.015, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.synth);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private hiss(dur: number, gain: number, kind: BiquadFilterType, freq: number, q = 0.7, when = 0, sweepTo?: number) {
    if (!this.ready || !this.ctx || !this.synth) return;
    const c = this.ctx;
    const buf = this.noise();
    if (!buf) return;
    const t = c.currentTime + when;
    const s = c.createBufferSource();
    s.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = kind;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.02, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.synth);
    s.start(t, Math.random());
    s.stop(t + dur + 0.05);
  }

  sfx(name: SfxName) {
    if (!this.ready) return;
    switch (name) {
      case "tape":
        this.hiss(0.14, 0.09, "lowpass", 500);
        this.tone(95, 0.2, 0.08, "sine", 55, 0.05);
        this.hiss(0.05, 0.05, "highpass", 2400, 1, 0.3);
        break;
      case "unlock":
        this.hiss(0.05, 0.07, "bandpass", 1800, 4);
        this.tone(70, 0.28, 0.1, "triangle", 48, 0.04);
        this.hiss(0.04, 0.06, "bandpass", 2600, 5, 0.38);
        this.tone(1180, 1.4, 0.015, "sine", undefined, 0.5);
        break;
      case "latch":
        // a door or gate quietly coming off its latch
        this.hiss(0.03, 0.06, "bandpass", 2200, 3);
        this.tone(120, 0.2, 0.06, "triangle", 72, 0.05);
        this.hiss(0.05, 0.03, "lowpass", 420, 0.7, 0.18);
        break;
      case "hover":
        this.tone(880, 0.35, 0.006, "sine", 740);
        break;
      case "lantern":
        this.hiss(0.18, 0.05, "highpass", 3000);
        this.tone(200, 0.5, 0.03, "sine", 320, 0.06);
        break;
      case "extinguish":
        this.hiss(0.35, 0.04, "lowpass", 1400, 0.7, 0, 300);
        this.tone(260, 0.4, 0.02, "sine", 90);
        break;
      case "phone":
        for (let i = 0; i < 2; i++) {
          this.tone(160, 0.16, 0.08, "square", 150, i * 0.26);
          this.hiss(0.16, 0.05, "lowpass", 400, 0.7, i * 0.26);
        }
        break;
      case "drawer":
        this.hiss(0.32, 0.05, "lowpass", 700, 0.7, 0, 260);
        this.tone(80, 0.12, 0.05, "sine", 60, 0.28);
        break;
      case "paper":
        this.hiss(0.12, 0.03, "bandpass", 2400, 0.8);
        this.hiss(0.1, 0.02, "bandpass", 3200, 0.8, 0.09);
        break;
      case "page":
        this.hiss(0.2, 0.035, "bandpass", 1800, 0.6, 0, 3600);
        break;
      case "clock":
        this.tone(1500, 0.03, 0.03, "square");
        this.tone(1100, 0.03, 0.02, "square", undefined, 0.5);
        break;
      case "wings":
        for (let i = 0; i < 5; i++) this.hiss(0.09, 0.05 - i * 0.006, "bandpass", 700 + i * 90, 1.2, i * 0.1);
        break;
      case "chime":
        this.tone(1320, 1.1, 0.02);
        this.tone(1980, 1.5, 0.012, "sine", undefined, 0.07);
        break;
      case "radio":
        this.hiss(0.5, 0.035, "bandpass", 900, 3, 0, 3200);
        this.tone(440, 0.4, 0.008, "sine", undefined, 0.52);
        break;
      case "fan":
        this.hiss(0.9, 0.03, "lowpass", 500, 0.7, 0, 1100);
        break;
      case "click":
        this.hiss(0.03, 0.04, "highpass", 2000, 1);
        break;
      case "soft":
        this.tone(520, 0.4, 0.012, "sine", 400);
        break;
      case "drip":
        this.tone(1400, 0.12, 0.03, "sine", 520);
        break;
      case "water":
        this.hiss(0.5, 0.04, "bandpass", 1200, 0.8, 0, 2600);
        this.tone(900, 0.18, 0.02, "sine", 400, 0.2);
        break;
      case "glass":
        this.hiss(0.2, 0.03, "highpass", 4500, 0.8);
        break;
      case "gate":
        this.tone(90, 1.4, 0.04, "sawtooth", 130);
        this.hiss(1.2, 0.025, "bandpass", 600, 4, 0, 1100);
        this.tone(180, 0.5, 0.04, "triangle", 120, 1.3);
        break;
      case "step":
        this.hiss(0.08, 0.04, "lowpass", 350);
        break;
    }
  }

  /* ------------------------------ ambient beds ------------------------------ */
  setBed(name: BedName | null, gain = 1) {
    if (this.bed?.name === name) return;
    this.bed?.stop();
    this.bed = null;
    if (!name || !this.ready || !this.ctx || !this.synth) return;
    const c = this.ctx;
    const buf = this.noise();
    if (!buf) return;
    const out = c.createGain();
    out.gain.value = 0;
    out.connect(this.synth);
    const nodes: AudioNode[] = [out];
    const timers = new Set<number>();

    const loopNoise = (type: BiquadFilterType, freq: number, level: number, q = 0.6) => {
      const s = c.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      const f = c.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = c.createGain();
      g.gain.value = level;
      s.connect(f).connect(g).connect(out);
      s.start(0, Math.random());
      nodes.push(s, f, g);
    };
    const hum = (freq: number, level: number) => {
      const o = c.createOscillator();
      o.frequency.value = freq;
      const g = c.createGain();
      g.gain.value = level;
      o.connect(g).connect(out);
      o.start();
      nodes.push(o, g);
    };
    const every = (min: number, max: number, fn: () => void) => {
      const schedule = () => {
        const id = window.setTimeout(() => { timers.delete(id); loop(); }, (min + Math.random() * (max - min)) * 1000);
        timers.add(id);
      };
      const loop = () => {
        fn();
        schedule();
      };
      schedule();
    };

    switch (name) {
      case "garden":
        loopNoise("lowpass", 420, 0.07);
        every(1.4, 3.8, () => {
          const base = 3800 + Math.random() * 500;
          for (let i = 0; i < 3; i++) this.tone(base, 0.05, 0.006, "sine", undefined, i * 0.09);
        });
        break;
      case "room":
        hum(50, 0.012);
        loopNoise("lowpass", 220, 0.05);
        break;
      case "booth":
        hum(55, 0.008);
        loopNoise("lowpass", 300, 0.035);
        every(5, 9, () => this.sfx("clock"));
        break;
      case "rain":
        loopNoise("bandpass", 2600, 0.12, 0.35);
        loopNoise("highpass", 6000, 0.02);
        every(2, 5, () => this.sfx("drip"));
        break;
      case "morning":
        loopNoise("lowpass", 900, 0.025);
        every(1.2, 3.2, () => {
          const f = 2400 + Math.random() * 1600;
          this.tone(f, 0.09, 0.008, "sine", f * 1.3);
          this.tone(f * 1.1, 0.08, 0.006, "sine", f * 0.9, 0.12);
        });
        break;
    }
    out.gain.linearRampToValueAtTime(gain, c.currentTime + 2.2);
    const bed = {
      name,
      stop: () => {
        timers.forEach(clearTimeout);
        timers.clear();
        try {
          out.gain.cancelScheduledValues(c.currentTime);
          out.gain.setValueAtTime(out.gain.value, c.currentTime);
          out.gain.linearRampToValueAtTime(0, c.currentTime + 1.4);
        } catch {
          /* ignore */
        }
        setTimeout(() => {
          nodes.forEach((n) => {
            try {
              (n as AudioScheduledSourceNode).stop?.();
            } catch {
              /* ignore */
            }
            try {
              n.disconnect();
            } catch {
              /* ignore */
            }
          });
        }, 1600);
      }
    };
    this.bed = bed;
  }
}

export const audio = new AudioDirector();
