import { useEffect, useRef, useState, type ReactNode } from "react";
import { ObjectArt, type ObjectArtProps, type ObjectKind } from "../art/Objects";
import { Firefly } from "../art/Figures";
import { audio, type SfxName } from "../audio/director";
import { pickCopy } from "../content/copy";
import type { CharacterId, StoryState } from "../engine";
import { getState, send, useStory } from "../store/story";
import { guidePlan, tierOf } from "./guidance";
import { activeTime, isPaused } from "../lib/pause";
import { say, hush } from "./say";
import { Spot, Stage, At, SceneTitle, panIntoView, pos, type Box, type Frame, type Pal } from "./Stage";

export type Fx = Record<string, boolean>;

export interface SpotDef {
  object: string;
  kind: ObjectKind;
  box: Box;
  label: string;
  art?: (s: StoryState, fx: Fx) => Partial<ObjectArtProps>;
  sfx?: SfxName;
  effect?: "fan" | "lantern" | "radio" | "glass" | "shutter";
  cls?: (s: StoryState, fx: Fx) => string;
  hidden?: (s: StoryState) => boolean;
}

export interface CharDef {
  id: CharacterId;
  box: Box;
  art: ReactNode;
  label: string;
  hidden?: (s: StoryState) => boolean;
  onTalk: () => void;
}

export interface ExitDef {
  id: string;
  label: string | ((s: StoryState) => string);
  box: Box;
  kind?: ObjectKind;
  ready: (s: StoryState) => boolean;
  hint: string;
  cue?: string | ((s: StoryState) => string);
  go: () => void;
  hidden?: (s: StoryState) => boolean;
}

export interface RoomDef {
  scene: string;
  pal: Pal;
  kicker: string;
  title: string;
  whisper?: string;
  backdrop: (s: StoryState, fx: Fx) => ReactNode;
  spots: SpotDef[];
  chars?: CharDef[];
  exits: ExitDef[];
  focus?: number;
  guide?: boolean;
}

const defaultSfx: Partial<Record<ObjectKind, SfxName>> = {
  register: "page", lantern: "lantern", clock: "clock", radio: "radio", fan: "fan", drawer: "drawer", phone: "click",
  cup: "soft", tag: "soft", map: "paper", planner: "page", workdesk: "paper", label: "paper", sign: "paper", pond: "water",
  shutter: "click", moth: "soft", flower: "soft", pane: "glass", letter: "paper", jar: "soft", stone: "step"
};

const REST = { x: "88%", y: "14%" };

export function Room({
  def,
  children,
  frame,
  onUse,
  overlay
}: {
  def: RoomDef;
  children?: ReactNode;
  frame?: Frame | null;
  /** return true to take over the default response for a spot */
  onUse?: (spot: SpotDef, countBefore: number, flash: (key: string, ms: number) => void, setFx: (key: string, on: boolean) => void) => boolean | void;
  overlay?: ReactNode;
}) {
  const s = useStory();
  const [fx, setFxState] = useState<Fx>({});
  const [ff, setFf] = useState<{ x: string; y: string; struggle: boolean }>({ ...REST, struggle: false });
  const [guided, setGuided] = useState<string | null>(null);
  const lastAct = useRef(activeTime());
  const readyPrev = useRef<Record<string, boolean> | null>(null);

  const setFx = (key: string, on: boolean) => setFxState((f) => ({ ...f, [key]: on }));
  const flash = (key: string, ms: number) => {
    setFx(key, true);
    window.setTimeout(() => setFx(key, false), ms);
  };

  useEffect(() => () => hush(), []);

  /* ------------------------------------------------------------------
   * The way on becomes physically available: the door comes off its latch
   * (a sound, a gap of light), or the moon starts to catch the path stones.
   * Silent for exits that were already open when you arrived.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const cur: Record<string, boolean> = {};
    for (const ex of def.exits) cur[ex.id] = !ex.hidden?.(s) && ex.ready(s);
    const prev = readyPrev.current;
    if (prev) {
      for (const ex of def.exits) {
        if (cur[ex.id] && !prev[ex.id]) {
          const t = window.setTimeout(() => audio.sfx(ex.kind === "door" ? "latch" : "chime"), 350);
          void t;
        }
      }
    }
    readyPrev.current = cur;
  });

  /* ------------------------------------------------------------------
   * Firefly guidance — a restrained guide, never a marker.
   *   0. free discovery (≈11 s; 8 s in the many-object H4)
   *   1. if the scene's REAL completion guard is still unmet, the Firefly visits
   *      the first unmet requirement (a soft swell of light on the object itself)
   *   2. later, one contextual hint — once
   *   3. when nothing blocks, it may settle by the one open way on
   * Scenes with guide:false (automatic beats, H2's uncertainty) are left alone.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (def.guide === false) return;
    const entered = activeTime();
    let phase = 0; // 0 free · 1 visited · 2 hinted
    let visitedAt = 0;
    let calmSince = entered;
    let hadPlan = false;
    let settled = false;
    let releaseTimer = 0;
    let planKey = "";

    const iv = window.setInterval(() => {
      const st = getState();
      if (isPaused()) return;
      if (st.currentScene !== def.scene) return;
      const now = activeTime();
      const plan = guidePlan(def.scene, st);

      if (plan) {
        const nextKey = plan.targets.join("|");
        if (nextKey !== planKey) { planKey = nextKey; phase = 0; setGuided(null); }
        hadPlan = true;
        if (phase === 0 && now - lastAct.current >= plan.visitAfter * 1000) {
          const sp = plan.targets
            .map((id) => def.spots.find((x) => x.object === id && !x.hidden?.(st)))
            .find((x): x is SpotDef => !!x);
          if (sp) {
            const cx = sp.box[0] + sp.box[2] / 2;
            panIntoView(cx);
            setFf({ x: `${(cx / 1600) * 100}%`, y: `${((sp.box[1] - 30) / 1000) * 100}%`, struggle: false });
            setGuided(sp.object);
            audio.sfx("chime");
            window.clearTimeout(releaseTimer);
            releaseTimer = window.setTimeout(() => setGuided((g) => (g === sp.object ? null : g)), 10000);
            phase = 1;
            visitedAt = now;
          }
        } else if (phase === 1 && now - Math.max(lastAct.current, visitedAt) >= plan.hintAfter * 1000) {
          say(plan.hint, "", 7000);
          phase = 2;
        }
        return;
      }

      // Nothing blocks. Let the guide step back, then (once) settle near the way on.
      if (hadPlan) {
        hadPlan = false;
        calmSince = now;
        setGuided(null);
        setFf({ ...REST, struggle: false });
      }
      if (!settled && now - Math.max(calmSince, lastAct.current) >= (calmSince > entered ? 6000 : 14000)) {
        const open = def.exits.filter((ex) => !ex.hidden?.(st) && ex.ready(st));
        if (open.length === 1) {
          const b = open[0].box;
          setFf({ x: `${((b[0] + b[2] / 2) / 1600) * 100}%`, y: `${((b[1] + b[3] * 0.1) / 1000) * 100}%`, struggle: false });
          panIntoView(b[0] + b[2] / 2);
          settled = true;
        }
      }
    }, 1000);
    return () => {
      window.clearInterval(iv);
      window.clearTimeout(releaseTimer);
    };
  }, [def]);

  const use = (sp: SpotDef) => {
    lastAct.current = activeTime();
    const site = `${def.scene}::${sp.object}`;
    const n = getState().siteCounts[site] ?? 0;
    send({ type: "INTERACT", objectId: sp.object });
    if (onUse?.(sp, n, flash, setFx)) return;
    switch (sp.effect) {
      case "fan":
        flash(sp.object, 2400);
        setFf((f) => ({ ...f, struggle: true }));
        window.setTimeout(() => setFf((f) => ({ ...f, struggle: false })), 1700);
        break;
      case "radio":
        setFx(sp.object, !fx[sp.object]);
        break;
      case "glass":
        setFx(sp.object, true);
        break;
      case "shutter":
        flash(sp.object, 1400);
        break;
      default:
        break;
    }
    audio.sfx(sp.sfx ?? defaultSfx[sp.kind] ?? "click");
    const line = pickCopy(def.scene, sp.object, getState(), n);
    if (line) say(line.text, line.speaker ?? "");
  };

  const guideOn = def.guide !== false;
  return (
    <>
      <Stage pal={def.pal} focus={def.focus ?? 50} frame={frame} className={`scene-${def.scene}`}>
        {def.backdrop(s, fx)}
        {children}
        {def.chars?.map((c) =>
          c.hidden?.(s) ? null : (
            <button
              key={c.id}
              type="button"
              className="spot char"
              style={pos(c.box)}
              aria-label={c.label}
              onClick={() => {
                lastAct.current = activeTime();
                c.onTalk();
              }}
            >
              {c.art}
            </button>
          )
        )}
        {def.spots.map((sp, i) =>
          sp.hidden?.(s) ? null : (
            <Spot
              key={sp.object + i}
              box={sp.box}
              kind={sp.kind}
              label={sp.label}
              seen={s.interactionSites[`${def.scene}::${sp.object}`] === true}
              art={{ on: fx[sp.object], wiped: fx[sp.object], ...(sp.art?.(s, fx) ?? {}) }}
              onUse={() => use(sp)}
              delay={(i * 3.7) % 11}
              className={sp.cls?.(s, fx) ?? ""}
              tier={guideOn ? tierOf(def.scene, sp.object, s) : "optional"}
              guided={guided === sp.object}
            />
          )
        )}
        {def.exits.map((ex) => {
          if (ex.hidden?.(s)) return null;
          const ready = ex.ready(s);
          const label = typeof ex.label === "function" ? ex.label(s) : ex.label;
          const cue = typeof ex.cue === "function" ? ex.cue(s) : ex.cue;
          return (
            <button
              key={ex.id}
              type="button"
              className={`spot exit exit-${ex.kind ?? "plain"} ${ready ? "ready" : ""}`}
              style={pos(ex.box)}
              aria-label={label}
              onClick={() => {
                lastAct.current = activeTime();
                if (ready) {
                  audio.sfx("step");
                  ex.go();
                } else {
                  audio.sfx("soft");
                  say(ex.hint);
                }
              }}
            >
              {ex.kind && <ObjectArt kind={ex.kind} ready={ready} />}
              <i className="exit-glow" aria-hidden />
              {cue && <span className="exit-cue">{cue}</span>}
            </button>
          );
        })}
        {guideOn && <Firefly x={ff.x} y={ff.y} className={ff.struggle ? "struggle" : ""} />}
        {overlay}
      </Stage>
      <SceneTitle kicker={def.kicker} title={def.title} whisper={def.whisper} />
    </>
  );
}

export { At };
