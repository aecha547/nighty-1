import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Firefly } from "../art/Figures";
import { audio } from "../audio/director";
import { tapeLevel, tapeTrack } from "../content/audioPlan";
import { selectArchive } from "../engine";
import { sleep } from "../lib/timeline";
import { send, useStory } from "../store/story";
import { runTransition } from "../ui/loader";

const NAMES = ["DUSK", "ORBIT", "THE HOURS BETWEEN", "DAWN", "AFTERLIGHT"];
const ROMAN = ["I", "II", "III", "IV", "V"];
const COPY: { h: string; p: string }[] = [
  { h: "NIGHT ARCHIVE", p: "The recordings are kept in order. The last one has no name yet." },
  { h: "RECORDING I", p: "Dusk has played. What came next is already on the shelf." },
  { h: "RECORDING II", p: "Orbit has played. The hours are next." },
  { h: "RECORDING III", p: "The hours between have played. Morning is close." },
  { h: "RECORDING IV", p: "Nothing in the dawn is left to watch. One recording remains." }
];

/** Enter one tape's first scene, via the shared-clock loader. */
function enter(i: number) {
  if (i === 0) {
    send({ type: "INTERACT", objectId: "object.archive.rack" });
    send({ type: "PERFORM_ACTION", actionId: "action.archive.insert_dusk" });
    send({ type: "COMPLETE_SCENE", sceneId: "I2" });
    send({ type: "ENTER_SCENE", sceneId: "D1" });
  } else if (i === 1) send({ type: "ENTER_SCENE", sceneId: "O1" });
  else if (i === 2) send({ type: "ENTER_SCENE", sceneId: "H1" });
  else if (i === 3) send({ type: "ENTER_SCENE", sceneId: "A1" });
  else {
    send({ type: "INTERACT", objectId: "object.archive.rack" });
    send({ type: "PERFORM_ACTION", actionId: "action.archive.insert_afterlight" });
    send({ type: "COMPLETE_SCENE", sceneId: "A5" });
    send({ type: "ENTER_SCENE", sceneId: "F1" });
  }
}

export function Archive() {
  const s = useStory();
  const view = selectArchive(s);
  const isA5 = s.currentScene === "A5";
  const [shifted, setShifted] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [armed, setArmed] = useState(!isA5);
  const [busy, setBusy] = useState(false);
  const [ff, setFf] = useState<{ left: string; top: string }>({ left: "50%", top: "30%" });
  const tapeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const slot = useRef<HTMLDivElement>(null);
  const [slotReady, setSlotReady] = useState(false);

  // Tape V physically shifts forward and its label resolves — only after the story has been remembered.
  useEffect(() => {
    if (!isA5) return;
    const ac = new AbortController();
    (async () => {
      await sleep(1700, ac.signal);
      if (ac.signal.aborted) return;
      setShifted(true);
      audio.sfx("unlock");
      await sleep(1500, ac.signal);
      if (ac.signal.aborted) return;
      setResolved(true);
      setArmed(true);
    })();
    return () => ac.abort();
  }, [isA5]);

  const place = () => {
    const target = view.next !== null ? tapeRefs.current[view.next] : null;
    if (!target) return;
    const r = target.getBoundingClientRect();
    setFf({ left: `${r.left - 22}px`, top: `${r.top + r.height / 2}px` });
  };
  useLayoutEffect(() => {
    const t = window.setTimeout(place, 4200);
    window.addEventListener("resize", place);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", place);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.next, armed]);

  const insert = async (i: number) => {
    if (busy || view.next !== i || (i === 4 && !armed)) return;
    setBusy(true);
    const tape = tapeRefs.current[i];
    const track = tapeTrack[i];
    void audio.play(track, { level: 0, fade: 0 }); // inside the gesture, so every browser lets it start
    setSlotReady(true);
    audio.sfx("tape");
    if (tape && slot.current) await flyToSlot(tape, slot.current);
    await runTransition({
      kicker: `RECORDING ${ROMAN[i]}`,
      title: NAMES[i],
      track,
      level: tapeLevel[i],
      cover: () => enter(i)
    });
  };

  const copy = armed && isA5 ? { h: "AFTERLIGHT", p: "It was always going to be last." } : COPY[Math.min(view.next ?? 0, 4)];

  return (
    <main className="archive">
      <section className="archive-shell">
        <div className="archive-screen">
          <div className="crt">
            <div className="crt-copy">
              {/* keyed so each chapter's words arrive afresh instead of swapping silently */}
              <div key={copy.h} className="crt-words">
                <h2>{copy.h}</h2>
                <p>{copy.p}</p>
              </div>
            </div>
          </div>
          <div className="slot-strip">
            <div ref={slot} className={`tape-slot ${slotReady ? "ready" : ""}`} />
            <span className="slot-label">insert recording</span>
          </div>
        </div>
        <aside className="rack" aria-label="Recording rack">
          <div className="rack-title">5 recordings</div>
          {NAMES.map((name, i) => {
            const ready = view.next === i && (i !== 4 || armed);
            const readable = i < 4 || resolved;
            const cls = [
              "tape",
              ready ? "ready" : view.watched[i] ? "watched" : "waiting",
              i === 4 && !readable ? "unreadable" : "",
              i === 4 && shifted ? "v-shift" : ""
            ].join(" ");
            return (
              <button
                key={name}
                ref={(el) => {
                  tapeRefs.current[i] = el;
                }}
                className={cls}
                disabled={!ready}
                aria-label={`Recording ${ROMAN[i]}: ${readable ? name : "unreadable"}`}
                onClick={() => insert(i)}
              >
                <div className="win">
                  <i className="reel" />
                  <i className="reel" />
                </div>
                <small>REC {ROMAN[i]}</small>
                <div className="tape-label">{readable ? name : "· · · · ·"}</div>
              </button>
            );
          })}
        </aside>
        <Firefly className="archive-ff still" x={ff.left} y={ff.top} style={{ position: "fixed" }} />
      </section>
    </main>
  );
}

async function flyToSlot(tape: HTMLElement, slot: HTMLElement) {
  const a = tape.getBoundingClientRect();
  const b = slot.getBoundingClientRect();
  const clone = tape.cloneNode(true) as HTMLElement;
  clone.classList.add("tape-fly");
  Object.assign(clone.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, margin: "0" });
  document.body.appendChild(clone);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const sx = Math.max(0.5, (b.width / a.width) * 0.82);
  const sy = Math.max(0.28, (b.height / a.height) * 0.85);
  requestAnimationFrame(() => {
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    clone.style.opacity = ".16";
  });
  await sleep(760);
  clone.remove();
}
