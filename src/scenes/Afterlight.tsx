import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Caretaker } from "../art/Figures";
import { Meadow } from "../art/Backdrops";
import { FlowerSvg, BirdSvg, type BirdMode } from "../art/Nature";
import { ObjectArt } from "../art/Objects";
import { audio } from "../audio/director";
import { BLOOM_LINE, BLOOM_TOUCH, BLOOM_TOUCH_FAMILIAR, GATE_LINE, VOICE_LINES } from "../content/dialogue";
import { selectMorningStillLife } from "../engine";
import { beatDone, commitBeat, finish, leave } from "../lib/flow";
import { createClock, sleep } from "../lib/timeline";
import { getState, send, useStory } from "../store/story";
import { At, Stage, panTo, type Pal } from "../ui/Stage";
import { say } from "../ui/say";

/* ======================================================================= F1 — the direct voice
 * No allegory, no characters, no decisions. The creator, to her.
 * Paced on the AFTERLIGHT song's own clock (wall clock only if the song is unavailable).
 */
const START = 3.4;
const GAP = 1.9;
const schedule = (() => {
  let t = START;
  return VOICE_LINES.map((l) => {
    const at = t;
    t += l.hold + GAP;
    return { at, end: at + l.hold, text: l.text };
  });
})();
const VOICE_END = schedule[schedule.length - 1].end + 3.2;

export function Voice() {
  const [idx, setIdx] = useState(-1);
  const bonus = useRef(0);
  const clockRef = useRef<ReturnType<typeof createClock> | null>(null);

  useEffect(() => {
    if (beatDone("beat.f1.voice_complete")) { leave("F1", "F2"); return; }
    let alive = true;
    let raf = 0;
    let finished = false;
    const clock = createClock({ track: "afterlight", offset: 0 });
    clockRef.current = clock;
    const frame = () => {
      if (!alive) return;
      const t = clock.now() + bonus.current;
      let cur = -1;
      for (let i = 0; i < schedule.length; i++) if (t >= schedule[i].at && t < schedule[i].end) cur = i;
      setIdx((p) => (p === cur ? p : cur));
      if (t >= VOICE_END && !finished) {
        finished = true;
        commitBeat("beat.f1.voice_complete");
        leave("F1", "F2");
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  const skip = () => {
    const t = (clockRef.current?.now() ?? 0) + bonus.current;
    const next = schedule.find((l) => l.at > t + 0.2);
    bonus.current += next ? next.at - t : Math.max(0, VOICE_END - t);
  };

  return (
    <div className="voice" role="presentation">
      {schedule.map((l, i) => (
        <p key={i} className={`voice-line ${idx === i ? "on" : ""}`} aria-live={idx === i ? "polite" : "off"} aria-hidden={idx !== i}>
          {l.text}
        </p>
      ))}
      <button className="voice-skip" onClick={skip}>
        next line
      </button>
    </div>
  );
}

/* ======================================================================= F2–F5 — morning */
const step = (from: string, to: string) => {
  if (getState().currentScene === from) leave(from, to);
};

const STILL: Record<string, { box: readonly [number, number, number, number]; kind: "lantern" | "jar" | "sprig" | "pencil" | "letter" | "radio" | "tag"; art?: object; label: string }> = {
  lantern_set_down: { box: [292, 790, 62, 104], kind: "lantern", art: { lit: false }, label: "the lantern, finally set down" },
  lantern_dark: { box: [232, 802, 62, 104], kind: "lantern", art: { lit: false }, label: "the lantern, put out and left where it was" },
  memory_jar: { box: [170, 735, 112, 144], kind: "jar", label: "a small jar of light" },
  gratitude_by_flower: { box: [1060, 780, 80, 120], kind: "sprig", label: "a sprig beside the flower" },
  lesson_mark: { box: [1346, 836, 156, 56], kind: "pencil", label: "a worn pencil" },
  drawer_sealed: { box: [980, 828, 126, 90], kind: "letter", label: "a sealed envelope" },
  radio_low: { box: [470, 846, 108, 66], kind: "radio", art: { on: false }, label: "a radio, turned low" },
  tag_on_hook: { box: [1236, 720, 54, 78], kind: "tag", label: "a small brass tag" }
};

export function Morning({ final = false, onRestart }: { final?: boolean; onRestart: () => void }) {
  const s = useStory();
  const entry = useRef(getState().currentScene);
  const [stage, setStage] = useState<"garden" | "bloom" | "bird" | "gate" | "end">(final ? "end" : entry.current === "F5" ? "gate" : entry.current === "F4" ? "bird" : entry.current === "F3" ? "bloom" : "garden");
  const [pal, setPal] = useState<Pal>(final ? "morning" : "dawn");
  const [bloomReady, setBloomReady] = useState(final);
  const [bird, setBird] = useState<{ mode: BirdMode; leaving: boolean; gone: boolean }>({ mode: "perch", leaving: false, gone: final });
  const [gateOpen, setGateOpen] = useState(final);
  const [card, setCard] = useState(final);
  const [cardHidden, setCardHidden] = useState(false);
  const items = useMemo(() => selectMorningStillLife(getState()), []);

  useEffect(() => {
    panTo(stage === "bird" ? 1100 : stage === "gate" || stage === "end" ? 1150 : 800);
  }, [stage]);

  useEffect(() => {
    if (final) return;
    const ac = new AbortController();
    const { signal } = ac;
    (async () => {
      if (entry.current === "F2") {
      await sleep(1400, signal);
      setPal("morning");
      await sleep(11500, signal);
      // F3 — the flower: canonical bloom
      step("F2", "F3");
      setStage("bloom");
      }
      if (entry.current === "F2" || entry.current === "F3") {
      await sleep(15200, signal);
      setBloomReady(true);
      say(BLOOM_LINE, "", 8000);
      await sleep(9600, signal);
      // F4 — the bird: leaves calmly, is not chased, does not return
      step("F3", "F4");
      setStage("bird");
      }
      if (entry.current !== "F5") {
      await sleep(4200, signal);
      setBird({ mode: "flap", leaving: false, gone: false });
      audio.sfx("wings");
      await sleep(900, signal);
      setBird({ mode: "flap", leaving: true, gone: false });
      await sleep(3600, signal);
      setBird({ mode: "glide", leaving: true, gone: false });
      await sleep(8200, signal);
      setBird({ mode: "glide", leaving: true, gone: true });
      // F5 — the Caretaker opens the garden
      step("F4", "F5");
      setStage("gate");
      }
      setPal("morning");
      await sleep(2400, signal);
      setGateOpen(true);
      audio.sfx("gate");
      say(GATE_LINE, "Caretaker", 5000);
      await sleep(9000, signal);
      finish("F5");
      setStage("end");
      setCard(true);
    })();
    return () => ac.abort();
  }, [final]);

  const touchFlower = () => {
    if (!bloomReady) return;
    send({ type: "INTERACT", objectId: "object.garden.flower" });
    audio.sfx("soft");
    const familiar = s.echoes["echo.meta.flower_thread"] === true && s.echoes["echo.hours.flower_cared"] === true;
    say(familiar ? BLOOM_TOUCH_FAMILIAR : BLOOM_TOUCH);
  };

  const showBig = stage !== "garden";
  return (
    <>
      <Stage pal={pal} focus={50} focusAt={stage === "bird" ? 1100 : stage === "gate" || stage === "end" ? 1150 : 800} className={`morning-world morning-${stage}`}>
        <Meadow gateOpen={false} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="cloud" style={{ top: `${9 + i * 8}%`, width: `${14 + i * 5}%`, ["--d" as string]: `${95 + i * 40}s`, animationDelay: `-${i * 31}s`, opacity: pal === "morning" ? 1 : 0.3 } as CSSProperties} />
        ))}
        {/* what the player chose to keep or release only changes the composition */}
        {items
          .filter((id) => STILL[id])
          .map((id) => {
            const it = STILL[id];
            return (
              <At key={id} box={it.box} className="still">
                <span role="img" aria-label={it.label} style={{ display: "block", width: "100%", height: "100%" }}>
                  <ObjectArt kind={it.kind} {...(it.art ?? {})} />
                </span>
              </At>
            );
          })}
        {items.includes("petals_drift") &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <i key={i} className="leaf-fall" style={{ left: `${44 + i * 5}%`, top: `${40 + (i % 3) * 5}%`, ["--d" as string]: `${13 + i * 2}s`, ["--dl" as string]: `${i * 2.2}s` } as CSSProperties} />
          ))}
        {/* F3 — the flower */}
        <div className={`morning-flower ${showBig ? "open" : ""}`}>
          <FlowerSvg stage={final ? "full" : showBig ? "bloom" : "budded"} animate={showBig && !final} className="petals-only" watered={items.includes("flower_watered")} />
          {bloomReady && stage === "bloom" && <button className="spot" style={{ position: "absolute", inset: "0 20% 30% 20%" }} aria-label="touch the flower" onClick={touchFlower} />}
        </div>
        {/* F4 — the bird */}
        {stage === "bird" && !bird.gone && (
          <>
            <div className={`bird-wrap ${bird.leaving ? "leave" : bird.mode === "flap" ? "takeoff" : ""}`}>
              <BirdSvg mode={bird.mode} />
            </div>
          </>
        )}
        {/* The bird's perch belongs to the garden before it arrives and after it leaves. */}
        <At box={[1118, 566, 100, 234]} className="morning-perch">
          <svg viewBox="0 0 100 234" aria-hidden><ellipse cx="35" cy="232" rx="28" ry="4" fill="rgba(0,0,0,.16)" /><path d="M36 230 V4 M6 4 H80" stroke="var(--furn2)" strokeWidth="7" strokeLinecap="round" /></svg>
        </At>
        {/* F5 — the Caretaker opens the garden for morning */}
        {(stage === "gate" || stage === "end") && (
          <>
            <At box={[1220, 540, 260, 200]} className={`gate-wrap ${gateOpen ? "open" : ""}`}>
              <ObjectArt kind="gate" />
            </At>
            <At box={[stage === "end" ? 1130 : 900, 590, 110, 260]} className="glide" style={{ ["--dur" as string]: "7s", zIndex: 11 } as CSSProperties}>
              <Caretaker className="fig-sway" />
            </At>
          </>
        )}
      </Stage>
      <div className={`endcard ${card && !cardHidden ? "on" : ""}`} aria-hidden={!(card && !cardHidden)}>
        <div className="endcard-inner">
          <h2>THE GARDEN THE NIGHT KEPT</h2>
          <p>The gate is open.</p>
          <div className="btn-row" style={{ justifyContent: "center" }}>
            <button className="btn" onClick={() => setCardHidden(true)} tabIndex={card && !cardHidden ? 0 : -1}>stay a while</button>
            <button className="btn quiet" onClick={onRestart} tabIndex={card && !cardHidden ? 0 : -1}>begin again</button>
          </div>
        </div>
      </div>
      {cardHidden && (
        <button className="voice-skip" style={{ color: "#3b3b32" }} onClick={() => setCardHidden(false)}>
          the end
        </button>
      )}
    </>
  );
}
