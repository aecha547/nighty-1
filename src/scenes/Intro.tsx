import { useEffect, useState } from "react";
import { Firefly } from "../art/Figures";
import { audio } from "../audio/director";
import {
  INTRO_CUES,
  INTRO_END,
  INTRO_MUSIC_AT,
  INTRO_MUSIC_OFFSET,
  INTRO_PRELOAD_AT
} from "../content/dialogue";
import { createClock } from "../lib/timeline";

const DEV = import.meta.env.DEV && typeof location !== "undefined" && new URLSearchParams(location.search).get("dev") === "1";

/**
 * I1 — the Firefly wakes.
 *
 * Preserves the original MINJI index.html choreography exactly:
 *   eight lines at 2.6 / 5.3 / 9.3 / 13.0 / 16.3 / 19.8 / 23.8 / 27.3 s,
 *   BGM preloaded with line 5, MEMORY.mp3 started with line 6 from source offset 8.0 s,
 *   hand-off after the final hold at 31.6 s.
 *
 * Until the song is audibly running the timeline follows performance.now(); from the moment it is,
 * the timeline is re-anchored to the audio element's own clock (no drifting timeout chain).
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const [view, setView] = useState({ i: -1, visible: false });
  const [ff, setFf] = useState<[number, number]>([50, 43]);

  useEffect(() => {
    let alive = true;
    let prepped = false;
    let started = false;
    let finished = false;
    let raf = 0;
    audio.stop("archive");
    audio.setBed(null);
    const clock = createClock({ track: "archive", offset: INTRO_MUSIC_AT - INTRO_MUSIC_OFFSET });

    const finish = () => {
      if (finished) return;
      finished = true;
      onDone();
    };

    const frame = () => {
      if (!alive) return;
      const wall = clock.wall();
      const t = clock.now();
      if (!prepped && wall >= INTRO_PRELOAD_AT) {
        prepped = true;
        void audio.preload("archive").then(() => audio.seek("archive", INTRO_MUSIC_OFFSET));
      }
      if (!started && wall >= INTRO_MUSIC_AT) {
        started = true;
        void audio.play("archive", { offset: INTRO_MUSIC_OFFSET, level: 0.2, fade: 2.7 });
      }
      let idx = -1;
      let vis = false;
      for (let i = 0; i < INTRO_CUES.length; i++) {
        if (t >= INTRO_CUES[i].at) {
          idx = i;
          vis = t < INTRO_CUES[i].at + INTRO_CUES[i].dur;
        }
      }
      setView((v) => (v.i === idx && v.visible === vis ? v : { i: idx, visible: vis }));
      if (t >= INTRO_END) return finish();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // rAF sleeps in hidden tabs; this keeps the hand-off honest if someone switches away.
    const poll = window.setInterval(() => {
      if (document.hidden && alive) {
        const t = clock.now();
        if (t >= INTRO_END) {
          window.clearInterval(poll);
          finish();
        }
      }
    }, 800);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view.i >= 0) {
      setFf([INTRO_CUES[view.i].ff[0], INTRO_CUES[view.i].ff[1]]);
      if (view.i === 0) audio.sfx("chime");
    }
  }, [view.i]);

  return (
    <div className="intro" role="presentation">
      <Firefly x={`${ff[0]}%`} y={`${ff[1]}%`} />
      <p className={`intro-line ${view.visible ? "visible" : ""}`} aria-live="polite">
        {view.i >= 0 ? INTRO_CUES[view.i].text : ""}
      </p>
      {DEV && (
        <button className="btn quiet" style={{ position: "fixed", right: 12, bottom: 12 }} onClick={onDone}>
          skip intro (dev)
        </button>
      )}
    </div>
  );
}
