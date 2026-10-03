import { useSyncExternalStore } from "react";
import { audio, type TrackId } from "../audio/director";
import { createClock, sleep } from "../lib/timeline";

/**
 * Tape hand-off loader.
 *
 * Not a fake percentage: the bar follows ONE clock, is capped until the next song has
 * genuinely buffered, and the music fades are scheduled on that same clock — so what you
 * see and what you hear change together.
 */
interface LoaderState {
  on: boolean;
  kicker: string;
  title: string;
  progress: number;
  status: string;
}

let st: LoaderState = { on: false, kicker: "", title: "", progress: 0, status: "" };
const ls = new Set<() => void>();
const set = (p: Partial<LoaderState>) => {
  st = { ...st, ...p };
  ls.forEach((l) => l());
};
const sub = (l: () => void) => {
  ls.add(l);
  return () => ls.delete(l);
};

export const loaderActive = () => st.on;

export async function runTransition(o: {
  kicker: string;
  title: string;
  track?: TrackId;
  level?: number;
  minSeconds?: number;
  /** called once, while the screen is fully covered */
  cover: () => void;
}) {
  const min = o.minSeconds ?? 2.8;
  set({ on: true, kicker: o.kicker, title: o.title, progress: 0, status: "reading tape" });
  const clock = createClock();

  // Called synchronously from the user's gesture so that every browser lets the next song start.
  let ready = true;
  if (o.track) {
    ready = false;
    audio.fadeAllOut(1.4);
    void audio.play(o.track, { level: 0, fade: 0 });
    void audio.preload(o.track, 6000).then(() => (ready = true));
  }

  let faded = false;
  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = clock.now();
      let p = Math.min(1, t / min);
      if (!ready) p = Math.min(p, 0.92);
      if (o.track && !faded && t >= 0.5) {
        faded = true;
        audio.fadeTo(o.track, o.level ?? 0.15, min - 0.5 + 0.8);
      }
      set({ progress: p, status: p < 0.4 ? "reading tape" : p < 0.8 ? "aligning memory" : "opening scene" });
      if (p >= 1 && ready) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  o.cover();
  await sleep(180);
  set({ on: false });
  await sleep(520);
}

export function Loader() {
  const s = useSyncExternalStore(sub, () => st, () => st);
  return (
    <div className={`loader ${s.on ? "on" : ""}`} aria-hidden={!s.on}>
      <div className="loader-inner">
        <div className="loader-kicker">{s.kicker}</div>
        <div className="loader-title">{s.title}</div>
        <div className="loader-track">
          <div className="loader-fill" style={{ transform: `scaleX(${s.progress})` }} />
        </div>
        <div className="loader-status" role="status">{s.status}</div>
      </div>
    </div>
  );
}
