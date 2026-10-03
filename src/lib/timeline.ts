import { audio, type TrackId } from "../audio/director";
import { activeTime, storyTimeout } from "./pause";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/**
 * An abortable pause.
 *
 * On abort this REJECTS with an AbortError rather than resolving. That is deliberate: a
 * cinematic chain awaits between every side effect (a line of dialogue, a sound, a committed
 * beat), so rejecting stops the chain at its very next await. Resolving instead would let a
 * scene whose component has unmounted keep narrating and committing story beats over the top
 * of the scene that replaced it. AbortError rejections are swallowed globally in main.tsx.
 */
export function abortedError(): Error {
  const err = new Error("The sequence was cancelled.");
  err.name = "AbortError";
  return err;
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortedError());
    const cancel = storyTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      cancel();
      signal?.removeEventListener("abort", onAbort);
      reject(abortedError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * One clock for a cinematic sequence.
 *
 * Until the audio element is audibly running it follows `performance.now()`.
 * The moment it is, the timeline is *re-anchored* to the audio clock without a jump,
 * and from then on the audio element is the authority (no drifting timeout chains).
 *
 *   timelineSeconds = audio.currentTime + offset + anchor
 *
 * `offset` maps source time to timeline time, e.g. for the intro MEMORY.mp3 begins at
 * source 8.0s when the timeline reads 19.8s  →  offset = 19.8 − 8.0.
 */
export function createClock(opts: { track?: TrackId; offset?: number } = {}) {
  const start = activeTime();
  let anchor: number | null = null;
  let last = 0;
  let lastSource: number | null = null;
  let movedAt = 0;
  let previousWall = 0;
  const wall = () => (activeTime() - start) / 1000;
  const read = () => {
    const w = wall();
    let t = w;
    if (opts.track) {
      const ct = audio.currentTime(opts.track);
      if (ct !== null) {
        const mapped = ct + (opts.offset ?? 0);
        if (lastSource === null || ct !== lastSource) movedAt = w;
        lastSource = ct;
        if (anchor === null) anchor = w - mapped;
        if (w - movedAt < 1.5) t = mapped + anchor;
        else {
          // A media element can remain "playing" while its network stream stalls.
          // Continue from the last cue rather than hold the story indefinitely.
          t = last + (w - previousWall);
          anchor = t - mapped;
        }
      }
    }
    last = Math.max(last, t);
    previousWall = w;
    return last;
  };
  return { now: read, wall, usingAudio: () => anchor !== null };
}

export interface Cue {
  at: number;
  run: () => void;
}

/** Fires cues in order as the clock passes them. Resolves when all cues fired or aborted. */
export function runCues(cues: Cue[], clock: () => number, signal: AbortSignal): Promise<void> {
  const ordered = [...cues].sort((a, b) => a.at - b.at);
  return new Promise((resolve) => {
    let i = 0;
    let raf = 0;
    let poll = 0;
    const finish = () => {
      cancelAnimationFrame(raf);
      clearInterval(poll);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const tick = () => {
      if (signal.aborted) return finish();
      const t = clock();
      while (i < ordered.length && ordered[i].at <= t) ordered[i++].run();
      if (i >= ordered.length) return finish();
      raf = requestAnimationFrame(tick);
    };
    signal.addEventListener("abort", finish, { once: true });
    raf = requestAnimationFrame(tick);
    // rAF pauses in hidden tabs; keep the sequence honest with a slow poll as well.
    poll = window.setInterval(() => {
      if (document.hidden) tick();
    }, 500);
  });
}
