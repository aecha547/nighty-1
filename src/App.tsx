import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { audio } from "./audio/director";
import { audioPlan } from "./content/audioPlan";
import { isArchiveMoment, type StoryState } from "./engine";
import { A1, A2, A3, A4, D2, D3, D4, H2, H5, O5 } from "./scenes/Cinematics";
import { Boot, Resume } from "./scenes/Boot";
import { Archive } from "./scenes/Archive";
import { Intro } from "./scenes/Intro";
import { Morning, Voice } from "./scenes/Afterlight";
import { D1, H1, H3, H4, O1, O2, O3A, O3B, O4 } from "./scenes/Rooms";
import { exportLedger, getLedger, getState, resetStory, send, useStory } from "./store/story";
import { Loader, loaderActive } from "./ui/loader";
import { Subtitle, hush } from "./ui/say";
import { useModal } from "./ui/useModal";
import { setTimelinePaused } from "./lib/pause";

const DEV = import.meta.env.DEV && new URLSearchParams(location.search).get("dev") === "1";

/** Which view the story state calls for. Chapters F2–F5 share one continuous view. */
function viewKey(s: StoryState): string {
  if (!s.started || !s.currentScene) return "boot";
  const c = s.currentScene;
  if (c === "I0" || c === "I1") return "intro";
  if (isArchiveMoment(s)) return "archive";
  if (c === "F2" || c === "F3" || c === "F4" || c === "F5") return "morning";
  return c;
}

export default function App() {
  const s = useStory();
  // Browsers require a gesture before audio. The first screen is therefore always a doorway.
  const [phase, setPhase] = useState<"gate" | "play">("gate");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.isMuted());
  const toggleSound = useCallback(() => {
    const next = !audio.isMuted();
    audio.setMuted(next);
    setMuted(next);
  }, []);
  const key = viewKey(s);
  const [shown, setShown] = useState(key);
  const [veil, setVeil] = useState(false);
  const morningFinal = useRef(false);
  useEffect(() => {
    setTimelinePaused(paused);
    audio.setPaused(paused);
    return () => { setTimelinePaused(false); audio.setPaused(false); };
  }, [paused]);

  /* ---- cross-fade between views (the tape loader covers the screen itself) ---- */
  useEffect(() => {
    if (phase !== "play" || key === shown) { setVeil(false); return; }
    if (key === "boot") { setShown(key); setVeil(false); return; }
    if (loaderActive()) {
      setShown(key);
      return;
    }
    setVeil(true);
    const t = window.setTimeout(() => {
      setShown(key);
      setVeil(false);
    }, 620);
    return () => window.clearTimeout(t);
  }, [key, shown, phase]);
  useEffect(() => { hush(); }, [shown]);

  /* ---- audio conductor: exploration scenes get beds, never a scene clock ---- */
  useEffect(() => {
    if (phase !== "play") return;
    const plan = s.currentScene ? audioPlan[s.currentScene] : undefined;
    if (!plan) return;
    if (plan.track) void audio.crossfade(plan.track, plan.level, plan.fade ?? 2);
    else audio.fadeAllOut(plan.fade ?? 2);
    audio.setBed(plan.bed, plan.bedGain ?? 1);
  }, [s.currentScene, phase]);

  /* ---- keyboard: Esc opens the quiet menu, M toggles sound ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "play") setPaused((p) => !p);
      if ((e.key === "m" || e.key === "M") && phase === "play" && !(e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]"))) toggleSound();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, toggleSound]);

  const enterFresh = useCallback(async () => {
    await audio.unlock();
    send({ type: "START_EXPERIENCE" });
    send({ type: "COMPLETE_SCENE", sceneId: "I0" });
    send({ type: "ENTER_SCENE", sceneId: "I1" });
    setShown("intro");
    setPhase("play");
  }, []);

  const resume = useCallback(async () => {
    await audio.unlock();
    morningFinal.current = getState().completedScenes["F5"] === true;
    setShown(viewKey(getState()));
    setPhase("play");
  }, []);

  const restart = useCallback(() => {
    audio.stopAll();
    resetStory();
    morningFinal.current = false;
    setPaused(false);
    setShown("boot");
    setPhase("gate");
  }, []);

  const introDone = useCallback(() => {
    send({ type: "COMPLETE_SCENE", sceneId: "I1" });
    send({ type: "ENTER_SCENE", sceneId: "I2" });
  }, []);

  let body: ReactNode;
  if (phase === "gate") {
    body = s.started ? <Resume finished={s.completedScenes["F5"] === true} onContinue={resume} onRestart={restart} /> : <Boot onEnter={enterFresh} />;
  } else {
    const views: Record<string, ReactNode> = {
      boot: null,
      intro: <Intro onDone={introDone} />,
      archive: <Archive />,
      D1: <D1 />,
      D2: <D2 />,
      D3: <D3 />,
      D4: <D4 />,
      O1: <O1 />,
      O2: <O2 />,
      O3A: <O3A />,
      O3B: <O3B />,
      O4: <O4 />,
      O5: <O5 />,
      H1: <H1 />,
      H2: <H2 />,
      H3: <H3 />,
      H4: <H4 />,
      H5: <H5 />,
      A1: <A1 />,
      A2: <A2 />,
      A3: <A3 />,
      A4: <A4 />,
      F1: <Voice />,
      morning: <Morning final={morningFinal.current} onRestart={restart} />
    };
    body = views[shown] ?? null;
  }

  return (
    <div className="root-stage" data-paused={paused ? "true" : undefined}>
      <div id="grain" aria-hidden />
      {/* key= remounts a view exactly once per scene so timelines never leak across scenes */}
      <div key={`${phase}:${shown}`} className="view" style={{ position: "absolute", inset: 0 }}>
        {body}
      </div>
      <Subtitle />
      <Loader />
      <div className={`veil ${veil ? "on" : ""}`} aria-hidden />
      {paused && <PauseMenu muted={muted} onToggleSound={toggleSound} onClose={() => setPaused(false)} onRestart={restart} />}
      {DEV && <DevPanel />}
    </div>
  );
}

function PauseMenu({ muted, onToggleSound, onClose, onRestart }: { muted: boolean; onToggleSound: () => void; onClose: () => void; onRestart: () => void }) {
  const modal = useModal(onClose);
  const [sure, setSure] = useState(false);
  return (
    <div ref={modal} className="book-wrap" role="dialog" aria-modal="true" aria-label="Menu" onClick={onClose}>
      <div className="pause" onClick={(e) => e.stopPropagation()}>
        <div className="boot-kicker">the archive is waiting</div>
        <div className="btn-row" style={{ flexDirection: "column", alignItems: "center", marginTop: 18 }}>
          <button className="btn" onClick={onClose}>return</button>
          <button
            className="btn quiet"
            onClick={onToggleSound}
          >
            sound: {muted ? "off" : "on"}
          </button>
          {!sure ? (
            <button className="btn quiet" onClick={() => setSure(true)}>begin again</button>
          ) : (
            <button className="btn quiet" onClick={onRestart}>yes, begin again</button>
          )}
        </div>
        <div className="boot-note" style={{ marginTop: 18 }}>Esc to close · M toggles sound</div>
      </div>
    </div>
  );
}

/** Only mounted with ?dev=1. */
function DevPanel() {
  const s = useStory();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("A3");
  const [audit, setAudit] = useState("");
  return (
    <div className="dev">
      <div>
        TGTK dev · {s.currentScene ?? "—"} · {s.currentChapter}
      </div>
      <button onClick={() => setOpen((o) => !o)}>{open ? "hide" : "state"}</button>
      <button onClick={() => console.log(exportLedger())}>log ledger</button>
      <button onClick={() => navigator.clipboard?.writeText(exportLedger())}>copy ledger</button>
      <label>QA scene <select aria-label="QA scene" value={target} onChange={(e) => setTarget(e.target.value)}>{["I0","I1","I2","D1","D2","D3","D4","O1","O2","O3A","O3B","O4","O5","H1","H2","H3","H4","H5","A1","A2","A3","A4","A5","F1","F2","F3","F4","F5"].map((id)=><option key={id}>{id}</option>)}</select></label>
      <button onClick={() => void import("./dev/qa").then(m=>m.buildLedger({send:send as (e:Record<string,unknown>)=>string,resetStory,getState},target))}>QA go</button>
      <button onClick={() => void import("./dev/qa").then(m=>setAudit(JSON.stringify(m.auditLayout(s.currentScene ?? "?"))))}>QA geometry</button>
      <button onClick={() => void import("./dev/qa").then(m=>m.auditPerformance()).then(r=>setAudit(JSON.stringify(r)))}>QA performance</button>
      <button onClick={() => setAudit(JSON.stringify({tracks:(["archive","dusk","orbit","hours","dawn","afterlight"] as const).map(id=>({id,playing:audio.isPlaying(id),time:audio.currentTime(id)}))}))}>QA media</button>
      <button onClick={() => {localStorage.setItem("tgtk:v1:ledger", "{");location.reload();}}>QA corrupt save</button>
      {audit && <output>{audit}</output>}
      {open && <pre>{JSON.stringify({ facts: Object.keys(s.facts), echoes: Object.keys(s.echoes), beats: Object.keys(s.beats), events: getLedger().length }, null, 1)}</pre>}
    </div>
  );
}
