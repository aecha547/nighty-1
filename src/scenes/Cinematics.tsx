import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Caretaker, FigureA, FigureB, Firefly } from "../art/Figures";
import { FlowerSvg } from "../art/Nature";
import { Glasshouse, GardenFront, Meadow, Passage, WorkRoom } from "../art/Backdrops";
import { ObjectArt } from "../art/Objects";
import { audio } from "../audio/director";
import { pickCopy } from "../content/copy";
import {
  A1_CARETAKER,
  CONSTELLATION_CAPTIONS,
  CONSTELLATION_OPEN,
  D2_APPROACH,
  D2_CROSSING,
  D3_CARETAKER,
  JEV_REFLECTION_PROMPT,
  JEV_REFLECTION_RESPONSES,
  H2_LEFT,
  H2_MURMUR,
  H2_REVERSE,
  H2_TOO_LATE,
  H2_WAIT,
  PORTRAIT_CAPTION,
  PORTRAIT_PRE,
  WHAT_REMAINS,
  conversationBeats,
  hoursLimitBeats
} from "../content/dialogue";
import { canComplete, classifyReflection, isReflectionUiEnabled, selectCaretakerHoursVariant, selectDuskFinalShot, selectOrbitMontage } from "../engine";
import { beatDone, commitBeat, finish, leave } from "../lib/flow";
import { sleep } from "../lib/timeline";
import { activeTime, storyTimeout } from "../lib/pause";
import { useModal } from "../ui/useModal";
import { getState, send, useStory } from "../store/story";
import { Conversation } from "../ui/Conversation";
import { Room, type RoomDef } from "../ui/Room";
import { At, DistantFigure, SceneTitle, Spot, Stage, panIntoView, panTo, pos, type Box, type Frame } from "../ui/Stage";
import { say } from "../ui/say";

/* ------------------------------------------------------------------ helpers */
interface Pose {
  x: number;
  y: number;
  h: number;
  o: number;
}
const Mover = ({ pose, who, seconds = 6, children }: { pose: Pose; who?: "a" | "b"; seconds?: number; children?: React.ReactNode }) => (
  <div
    className="at glide"
    style={
      {
        left: `${(pose.x / 1600) * 100}%`,
        top: `${(pose.y / 1000) * 100}%`,
        width: `${((pose.h * 0.4) / 1600) * 100}%`,
        height: `${(pose.h / 1000) * 100}%`,
        opacity: pose.o,
        zIndex: 10,
        pointerEvents: "none",
        ["--dur" as string]: `${seconds}s`
      } as CSSProperties
    }
  >
    {children ?? (who === "a" ? <FigureA className="fig-sway" /> : <FigureB className="fig-sway" />)}
  </div>
);

/* ======================================================================= D2 — First Crossing */
/** The crates A is carrying out of the glasshouse. They are how the crossing happens. */
const Crates = ({ mode }: { mode: "carry" | "fall" | "set" }) => (
  <svg viewBox="0 0 120 150" className={`crates ${mode}`} aria-hidden>
    {[0, 1, 2].map((i) => (
      <rect
        key={i}
        className={`crate c${i}`}
        x={12}
        y={104 - i * 20}
        width={96}
        height={15}
        rx={3}
        fill="var(--furn)"
        stroke="var(--rim)"
        strokeWidth="1.2"
      />
    ))}
  </svg>
);

const D2_SPOTS: RoomDef["spots"] = [
  { object: "object.d2.west", kind: "door", box: [150, 380, 180, 240], label: "the west door" },
  { object: "object.d2.east", kind: "door", box: [1270, 380, 180, 240], label: "the east door" },
  { object: "object.shared.bench", kind: "bench", box: [690, 606, 220, 100], label: "the bench where both paths meet" },
  { object: "object.d2.label", kind: "label", box: [400, 690, 58, 100], label: "a plant label" },
  { object: "object.shared.small", kind: "tag", box: [1010, 780, 64, 90], label: "a small brass tag on the gravel" },
  { object: "object.d2.glass", kind: "pane", box: [500, 170, 300, 220], label: "the misted glass", effect: "glass" }
];

export function D2() {
  const [a, setA] = useState<Pose>({ x: 205, y: 415, h: 210, o: 0 });
  const [b, setB] = useState<Pose>({ x: 1320, y: 420, h: 200, o: 0 });
  const [crate, setCrate] = useState<"carry" | "fall" | "set">("carry");
  const [frame, setFrame] = useState<Frame | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;
    (async () => {
      if (beatDone("beat.d2.crossing")) {
        setCrate("set");
        await sleep(700, signal);
        if (!signal.aborted) leave("D2", "D3");
        return;
      }
      /* ARRIVE — one of them is carrying a stack of crates out of the glasshouse. */
      await sleep(1300, signal);
      if (signal.aborted) return;
      commitBeat("beat.d2.a_arrives");
      audio.sfx("step");
      setA({ x: 205, y: 415, h: 210, o: 1 });
      say(D2_APPROACH[0].text, "", D2_APPROACH[0].ms);
      /* ORIENT — the other comes the other way, at closing, for the same gap. */
      await sleep(1900, signal);
      commitBeat("beat.d2.b_arrives");
      audio.sfx("step");
      setB({ x: 1320, y: 420, h: 200, o: 1 });
      say(D2_APPROACH[1].text, "", D2_APPROACH[1].ms);
      await sleep(3000, signal);
      setA({ x: 655, y: 540, h: 280, o: 1 });
      setB({ x: 910, y: 548, h: 272, o: 1 });
      await sleep(1100, signal);
      if (signal.aborted) return;
      say(D2_APPROACH[2].text, "", D2_APPROACH[2].ms);
      /* DISCOVER — let the player look around the crossing before it happens. */
      await sleep(4000, signal);
      if (signal.aborted) return;
      // Where the player looked first only changes the framing of the moment.
      const first = getState().claims["claim.d2.first_focus"];
      panTo(800);
      setFrame(first === "west" ? { x: 560, y: 600, scale: 1.12 } : first === "east" ? { x: 1040, y: 600, scale: 1.12 } : { x: 800, y: 620, scale: 1.08 });
      await sleep(1200, signal);
      /* EVENT — the crates slip; the tag falls; they get through the gap. */
      for (let i = 0; i < D2_CROSSING.length; i++) {
        if (signal.aborted) return;
        const l = D2_CROSSING[i];
        if (i === 0) {
          setCrate("fall");
          audio.sfx("step");
        }
        if (i === 8) setCrate("set");
        say(l.text, l.who, l.ms);
        await sleep(l.ms + 260, signal);
      }
      commitBeat("beat.d2.crossing");
      /* ABSORB — they leave separately, as people do. */
      await sleep(1000, signal);
      setA({ x: 1320, y: 420, h: 200, o: 0 });
      setB({ x: 205, y: 415, h: 210, o: 0 });
      await sleep(2500, signal);
      setFrame(null);
      await sleep(2100, signal);
      if (!signal.aborted) leave("D2", "D3");
    })();
    return () => ac.abort();
  }, []);

  const def: RoomDef = useMemo(
    () => ({
      scene: "D2",
      pal: "dusk",
      kicker: "recording i · dusk",
      title: "First Crossing",
      whisper: "Not every beginning knows what it is.",
      backdrop: () => <Glasshouse />,
      spots: D2_SPOTS,
      exits: [],
      guide: false
    }),
    []
  );

  return (
    <Room def={def} frame={frame}>
      <At box={[780, 452, 34, 82]} style={{ opacity: 0.55 }}>
        <Caretaker />
      </At>
      <At
        box={[a.x - 26, a.y + 10, 86, 108]}
        className="glide crates-hold"
        style={{ ["--dur" as string]: "5.5s", zIndex: 9, opacity: a.o } as CSSProperties}
      >
        <Crates mode={crate} />
      </At>
      <Mover pose={a} who="a" seconds={5.5} />
      <Mover pose={b} who="b" seconds={5.5} />
    </Room>
  );
}

/* ======================================================================= D3 — The Lantern Passage */
export function D3() {
  const s = useStory();
  const lit = s.interactionSites["D3::object.shared.lantern"] === true;

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      await sleep(1800, ac.signal);
      if (ac.signal.aborted || beatDone("beat.d3.caretaker_lantern")) return;
      commitBeat("beat.d3.caretaker_lantern");
      say(D3_CARETAKER, "Caretaker");
    })();
    return () => ac.abort();
  }, []);

  const def: RoomDef = useMemo(
    () => ({
      scene: "D3",
      pal: "night",
      kicker: "recording i · dusk",
      title: "The Lantern Passage",
      whisper: "Some light has to be carried.",
      backdrop: (st) => <Passage lit={st.interactionSites["D3::object.shared.lantern"] === true} />,
      spots: [
        { object: "object.shared.lantern", kind: "lantern", box: [478, 346, 92, 148], label: "the lantern on its hook", art: (st) => ({ lit: st.interactionSites["D3::object.shared.lantern"] === true }) },
        { object: "object.d3.shade", kind: "shutter", box: [470, 520, 62, 76], label: "the lantern's brass shutter", effect: "shutter" },
        { object: "object.d3.moth", kind: "moth", box: [606, 330, 62, 62], label: "a moth" },
        { object: "object.d3.sign", kind: "sign", box: [1150, 470, 150, 220], label: "a wooden sign" },
        { object: "object.d3.water", kind: "pond", box: [150, 760, 380, 130], label: "still water" },
        { object: "object.garden.map", kind: "map", box: [1290, 770, 170, 125], label: "a garden map" }
      ],
      chars: [
        {
          id: "CARETAKER",
          box: [612, 440, 86, 212],
          art: <Caretaker className="fig-sway" />,
          label: "the caretaker",
          onTalk: () => {
            send({ type: "SPEAK_TO", characterId: "CARETAKER" });
            say(D3_CARETAKER, "Caretaker");
          }
        }
      ],
      exits: [
        {
          id: "path",
          label: "follow the lit path",
          cue: "the lit path",
          box: [640, 720, 320, 280],
          kind: "path",
          ready: (st) => canComplete(st, "D3"),
          hint: "It's too dark to follow the path yet. There's a lantern on the hook.",
          go: () => leave("D3", "D4")
        }
      ],
      focus: 42
    }),
    []
  );
  return (
    <Room def={def} onUse={(sp, countBefore) => {
      if (sp.object === "object.shared.lantern" && countBefore === 0) {
        // first touch: it lights
        window.setTimeout(() => audio.sfx("lantern"), 40);
        say("The wick catches. Warm light spreads across the gravel and the hedges step back to make room.");
        return true;
      }
    }}
      overlay={
        <>
          <div className="dark-veil" style={{ opacity: lit ? 0.12 : 0.66 }} />
          <Mover pose={{ x: lit ? 775 : 725, y: lit ? 470 : 560, h: lit ? 96 : 145, o: lit ? 0.7 : 0 }} who="a" seconds={7} />
          <Mover pose={{ x: lit ? 840 : 835, y: lit ? 472 : 562, h: lit ? 92 : 140, o: lit ? 0.7 : 0 }} who="b" seconds={7} />
        </>
      }
    />
  );
}

/* ======================================================================= D4 — Two Departures */
const FOCUS: Record<string, Frame> = {
  lantern: { x: 970, y: 430, scale: 1.34 },
  register: { x: 1145, y: 550, scale: 1.3 },
  window: { x: 480, y: 440, scale: 1.24 },
  gate: { x: 800, y: 650, scale: 1.28 }
};

export function D4() {
  const [a, setA] = useState<Pose>({ x: 690, y: 690, h: 200, o: 0 });
  const [b, setB] = useState<Pose>({ x: 870, y: 690, h: 200, o: 0 });
  const [frame, setFrame] = useState<Frame | null>(null);
  const [lamp] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;
    (async () => {
      await sleep(900, signal);
      setA((p) => ({ ...p, o: 1 }));
      setB((p) => ({ ...p, o: 1 }));
      await sleep(2800, signal);
      setA({ x: 120, y: 640, h: 120, o: 0 });
      await sleep(2400, signal);
      commitBeat("beat.d4.a_departs");
      await sleep(900, signal);
      setB({ x: 1500, y: 640, h: 120, o: 0 });
      await sleep(2800, signal);
      commitBeat("beat.d4.b_departs");
      await sleep(900, signal);
      const key = selectDuskFinalShot(getState());
      setFrame(FOCUS[key]);
      const line = pickCopy("D4", { lantern: "object.shared.lantern", register: "object.caretaker.register", window: "object.shared.window", gate: "object.d4.gate" }[key] as string, getState(), 0);
      if (line) say(line.text, "", 6000);
      await sleep(8200, signal);
      if (!signal.aborted) finish("D4");
    })();
    return () => ac.abort();
  }, []);

  const look = (key: string) => setFrame(FOCUS[key]);
  const def: RoomDef = useMemo(
    () => ({
      scene: "D4",
      pal: "night",
      kicker: "recording i · dusk",
      title: "Two Departures",
      whisper: "Nothing was decided here. Two people went home.",
      backdrop: () => <GardenFront lampOn={lamp} gateOpen />,
      spots: [
        { object: "object.d4.gate", kind: "gate", box: [690, 536, 220, 130], label: "the gate" },
        { object: "object.shared.lantern", kind: "lantern", box: [938, 380, 62, 104], label: "the lantern", art: () => ({ lit: true }) },
        { object: "object.caretaker.register", kind: "register", box: [1050, 512, 190, 78], label: "the register" },
        { object: "object.shared.window", kind: "pane", box: [300, 330, 360, 230], label: "the window" }
      ],
      chars: [],
      exits: [],
      guide: false
    }),
    [lamp]
  );
  return (
    <Room
      def={def}
      frame={frame}
      onUse={(sp) => {
        const m: Record<string, string> = { "object.d4.gate": "gate", "object.shared.lantern": "lantern", "object.caretaker.register": "register", "object.shared.window": "window" };
        look(m[sp.object]);
        const line = pickCopy("D4", sp.object, getState(), 0);
        if (line) say(line.text);
        return true;
      }}
    >
      <At box={[830, 545, 115, 265]}>
        <Caretaker lamp className="fig-sway" />
      </At>
      <Mover pose={a} who="a" seconds={8} />
      <Mover pose={b} who="b" seconds={8} />
    </Room>
  );
}

/* ======================================================================= O5 — Constellation */
const STAR_POS: [number, number][] = [
  [20, 62],
  [36, 36],
  [52, 54],
  [68, 30],
  [82, 50]
];
const SKY_DOTS = Array.from({ length: 70 }, (_, i) => ({ x: (i * 37.7) % 100, y: (i * 53.3) % 70, r: 0.1 + ((i * 7) % 5) / 25, o: 0.2 + ((i * 11) % 7) / 12 }));

export function O5() {
  const items = useMemo(() => selectOrbitMontage(getState()), []);
  const [shown, setShown] = useState(-1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;
    (async () => {
      await sleep(1200, signal);
      setOpen(true);
      await sleep(4200, signal);
      setOpen(false);
      await sleep(1400, signal);
      for (let i = 0; i < items.length; i++) {
        if (signal.aborted) return;
        setShown(i);
        audio.sfx("chime");
        await sleep(5600, signal);
      }
      await sleep(2200, signal);
      commitBeat("beat.o5.montage_shown");
      await sleep(3200, signal);
      if (!signal.aborted) finish("O5");
    })();
    return () => ac.abort();
  }, [items]);

  return (
    <div className="cine" style={{ background: "radial-gradient(ellipse at 50% 80%, #1a2234, #070a12 70%)" }}>
      <svg className="constellation" viewBox="0 0 100 70" preserveAspectRatio="xMidYMid meet" aria-hidden>
        {SKY_DOTS.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#e9e2d0" opacity={d.o} />
        ))}
        {items.map((_it, i) => {
          if (i === 0) return null;
          const [x1, y1] = STAR_POS[i - 1];
          const [x2, y2] = STAR_POS[i];
          return <path key={`l${i}`} d={`M${x1} ${y1} L${x2} ${y2}`} pathLength={1} className={`star-line ${shown >= i ? "on" : ""}`} />;
        })}
        {items.map((it, i) => {
          const [x, y] = STAR_POS[i];
          return (
            <g key={it.id} className={`star-node ${shown >= i ? "on" : ""}`} transform={`translate(${x} ${y})`}>
              <circle r="4.6" fill="#f2d79b" opacity={it.noticed ? 0.16 : 0.08} />
              <circle r="1.1" fill="#f6e5b8" opacity={it.noticed ? 1 : 0.7} />
              <path d="M-3 0H3M0 -3V3" stroke="#f6e5b8" strokeWidth=".18" opacity={it.noticed ? 0.9 : 0.5} />
            </g>
          );
        })}
      </svg>
      <div className={`star-caption ${open ? "on" : ""}`} role="status">{CONSTELLATION_OPEN}</div>
      {items.map((it, i) => (
        <div key={it.id} className={`star-caption ${shown === i ? "on" : ""}`} aria-live="polite">
          {CONSTELLATION_CAPTIONS[it.id]}
        </div>
      ))}
      <SceneTitle kicker="recording ii · orbit" title="Constellation" whisper="What the night kept of it." />
    </div>
  );
}

/* ======================================================================= H2 — Missed Signal */
type H2Phase = "wait" | "ring" | "asleep" | "left";

export function H2() {
  const [phase, setPhase] = useState<H2Phase>(() => (beatDone("beat.h2.b_leaves") ? "left" : beatDone("beat.h2.contact_attempt") ? "asleep" : "wait"));

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;
    (async () => {
      // Reload safety: the phone never rings twice, and nobody waits twice.
      if (!beatDone("beat.h2.contact_attempt")) {
        // Somewhere out on the path, B is already waiting. We see it before A does.
        await sleep(2600, signal);
        if (signal.aborted) return;
        say(H2_WAIT[0].text, "", H2_WAIT[0].ms);
        await sleep(5200, signal);
        if (signal.aborted) return;
        commitBeat("beat.h2.contact_attempt");
        setPhase("ring");
        for (let i = 0; i < 3; i++) {
          audio.sfx("phone");
          await sleep(1500, signal);
          if (signal.aborted) return;
        }
        say(H2_MURMUR, "A", 4200);
        await sleep(2600, signal);
        setPhase("asleep");
        // Cause and effect, without commentary: the moment is over and the hour went with it.
        say(H2_TOO_LATE[0].text, "", H2_TOO_LATE[0].ms);
      }
      if (!beatDone("beat.h2.b_leaves")) {
        await sleep(5400, signal);
        if (signal.aborted) return;
        say(H2_LEFT[0].text, "", H2_LEFT[0].ms);
        await sleep(4400, signal);
        if (signal.aborted) return;
        say(H2_LEFT[1].text, "", H2_LEFT[1].ms);
        setPhase("left");
        commitBeat("beat.h2.b_leaves");
      }
      // The reverse: on other nights it is A who waits and B who arrives late.
      // The player has now seen both directions, so the register in H3 will land.
      if (!beatDone("beat.h2.reverse")) {
        await sleep(4600, signal);
        if (signal.aborted) return;
        commitBeat("beat.h2.reverse");
        say(H2_REVERSE[0].text, "", H2_REVERSE[0].ms);
      }
    })();
    return () => ac.abort();
  }, []);

  const def: RoomDef = useMemo(
    () => ({
      scene: "H2",
      pal: "cold",
      kicker: "recording iii · the hours between",
      title: "Missed Signal",
      whisper: "",
      backdrop: () => (
        <WorkRoom
          cold
          windowScene={
            phase !== "left" ? (
              <g>
                <circle cx="396" cy="470" r="4.4" fill="var(--fig-rim-b)" />
                <rect x="392" y="474" width="8" height="24" rx="3" fill="var(--fig-rim-b)" opacity=".8" />
                <circle cx="396" cy="452" r="26" fill="var(--glow)" opacity=".18" />
              </g>
            ) : (
              <circle cx="396" cy="452" r="26" fill="var(--glow)" opacity=".18" />
            )
          }
        />
      ),
      spots: [
        { object: "object.shared.window", kind: "pane", box: [100, 180, 420, 360], label: "the window" },
        { object: "object.a.workdesk", kind: "workdesk", box: [630, 492, 372, 206], label: "the work desk", art: () => ({ messy: true }) },
        { object: "object.personal.phone", kind: "phone", box: [1036, 598, 100, 72], label: "the phone", art: () => ({ lit: phase === "ring" }), cls: () => (phase === "ring" ? "phone-buzz" : "") },
        { object: "object.room.clock", kind: "clock", box: [1370, 190, 128, 128], label: "the wall clock" }
      ],
      exits: [
        {
          id: "to-booth",
          label: "the door toward the booth",
          cue: "the booth",
          box: [1466, 360, 114, 330],
          kind: "door",
          ready: (st) => canComplete(st, "H2"),
          hint: "Not yet. Something is still unfolding.",
          go: () => leave("H2", "H3")
        },
        {
          id: "to-room",
          label: "the door toward the garden room",
          cue: "the garden room",
          box: [8, 400, 92, 380],
          kind: "door",
          ready: (st) => canComplete(st, "H2"),
          hint: "Not yet. Something is still unfolding.",
          go: () => leave("H2", "H4")
        }
      ],
      focus: 62,
      guide: false
    }),
    [phase]
  );
  return (
    <Room
      def={def}
      onUse={(sp) => {
        if (sp.object === "object.personal.phone" && phase === "ring") {
          say("You reach for it. The hand doesn't move. It buzzes against the wood, and goes quiet.");
          return true;
        }
        if (sp.object === "object.personal.phone" && phase !== "wait") {
          say("It has gone quiet.");
          return true;
        }
        if (sp.object === "object.shared.window" && phase === "left") {
          say("The path is empty. The lamp is still lit.");
          return true;
        }
      }}
    >
      <At box={[790, 430, 210, 224]}>
        <FigureA pose={phase === "asleep" || phase === "left" ? "slumped" : "seated"} className="fig-sway" />
      </At>
    </Room>
  );
}

/* ======================================================================= H5 — The Caretaker's Limit */
export function H5() {
  const [talk, setTalk] = useState<ReturnType<typeof hoursLimitBeats> | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      await sleep(2000, ac.signal);
      if (ac.signal.aborted) return;
      send({ type: "SPEAK_TO", characterId: "CARETAKER" });
      setTalk(hoursLimitBeats(selectCaretakerHoursVariant(getState())));
    })();
    return () => ac.abort();
  }, []);

  const def: RoomDef = useMemo(
    () => ({
      scene: "H5",
      pal: "cold",
      kicker: "recording iii · the hours between",
      title: "The Caretaker's Limit",
      whisper: "Seeing is not the same as knowing.",
      backdrop: () => <GardenFront lampOn={false} />,
      spots: [],
      chars: [],
      exits: [],
      guide: false
    }),
    []
  );
  return (
    <>
      <Room def={def}>
        <At box={[830, 545, 115, 265]}>
          <Caretaker lamp className="fig-sway" />
        </At>
        <DistantFigure who="a" box={[250, 598, 34, 84]} seconds={70} delay={2} />
        <DistantFigure who="b" box={[1480, 606, 34, 84]} seconds={78} delay={10} reverse />
      </Room>
      {talk && (
        <Conversation
          beats={talk}
          onDone={() => {
            setTalk(null);
            finish("H5");
          }}
        />
      )}
    </>
  );
}

/* ======================================================================= A1 — Intentional Arrival */
export function A1() {
  const [care, setCare] = useState<Pose>({ x: 830, y: 545, h: 265, o: 1 });
  const [a, setA] = useState<Pose>({ x: 280, y: 700, h: 210, o: 0 });
  const [b, setB] = useState<Pose>({ x: 1250, y: 700, h: 210, o: 0 });

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;
    (async () => {
      await sleep(2200, signal);
      say(A1_CARETAKER, "Caretaker");
      await sleep(3600, signal);
      // The Caretaker gives them space instead of advice.
      setCare({ x: 1330, y: 560, h: 180, o: 0 });
      await sleep(2400, signal);
      if (beatDone("beat.a1.arrival")) {
        setA({ x: 650, y: 690, h: 250, o: 1 });
        setB({ x: 900, y: 690, h: 250, o: 1 });
        return;
      }
      setA({ x: 300, y: 700, h: 215, o: 1 });
      setB({ x: 1240, y: 700, h: 215, o: 1 });
      await sleep(1200, signal);
      setA({ x: 650, y: 690, h: 250, o: 1 });
      setB({ x: 900, y: 690, h: 250, o: 1 });
      await sleep(6800, signal);
      commitBeat("beat.a1.arrival");
    })();
    return () => ac.abort();
  }, []);

  const def: RoomDef = useMemo(
    () => ({
      scene: "A1",
      pal: "dawn",
      kicker: "recording iv · dawn",
      title: "Intentional Arrival",
      whisper: "For once, both of them are here.",
      backdrop: () => <GardenFront lampOn={false} />,
      spots: [
        { object: "object.shared.lantern", kind: "lantern", box: [938, 380, 62, 104], label: "the lantern, still lit", art: () => ({ lit: true }) },
        { object: "object.garden.flower", kind: "flower", box: [586, 650, 112, 170], label: "the flower, still closed", art: () => ({ stage: "budded" }) },
        { object: "object.caretaker.register", kind: "register", box: [1050, 512, 190, 78], label: "the register" }
      ],
      exits: [
        {
          id: "join",
          label: "walk to where they are",
          cue: "join them",
          box: [730, 640, 150, 230],
          kind: "path",
          ready: (st) => st.beats["beat.a1.arrival"] === true,
          hint: "Give them a moment to arrive.",
          go: () => leave("A1", "A2")
        }
      ],
      focus: 50,
      guide: false
    }),
    []
  );
  return (
    <Room def={def}>
      <Mover pose={care} seconds={3.2}>
        <Caretaker lamp />
      </Mover>
      <Mover pose={a} who="a" seconds={7} />
      <Mover pose={b} who="b" seconds={7} />
    </Room>
  );
}

/* ======================================================================= A2 — The Conversation */
export function A2() {
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (beatDone("beat.a2.ending_spoken")) { leave("A2", "A3"); return; }
    return storyTimeout(() => setStarted(true), 2600);
  }, []);

  const def: RoomDef = useMemo(
    () => ({
      scene: "A2",
      pal: "dawn",
      kicker: "recording iv · dawn",
      title: "The Conversation",
      whisper: "Nothing here is asked to change.",
      backdrop: () => <Glasshouse />,
      spots: [{ object: "object.shared.lantern", kind: "lantern", box: [836, 706, 66, 108], label: "the lantern, set down between them", art: () => ({ lit: true }) }],
      exits: [],
      guide: false
    }),
    []
  );
  return (
    <>
      <Room def={def}>
        <At box={[610, 520, 135, 330]}><FigureA className="fig-sway" /></At>
        <At box={[960, 530, 130, 320]}><FigureB className="fig-sway" /></At>
      </Room>
      {started && !done && (
        <Conversation
          beats={conversationBeats}
          onDone={() => {
            setDone(true);
            (async () => {
              commitBeat("beat.a2.ending_spoken");
              await sleep(2600);
              leave("A2", "A3");
            })();
          }}
        />
      )}
    </>
  );
}

/* ======================================================================= A3 — What Remains */
const STATIONS: { key: keyof typeof WHAT_REMAINS; kind: "jar" | "stone" | "letter" | "sprig" | "pencil"; box: Box }[] = [
  { key: "memory", kind: "jar", box: [400, 716, 98, 126] },
  { key: "guilt", kind: "stone", box: [586, 803, 115, 85] },
  { key: "question", kind: "letter", box: [743, 753, 126, 90] },
  { key: "gratitude", kind: "sprig", box: [1030, 727, 78, 117] },
  { key: "lesson", kind: "pencil", box: [856, 859, 156, 59] }
];
const A3_PERMISSION = "You may explore more, but you are allowed to leave.";
const anyKept = () => Object.values(WHAT_REMAINS).some((w) => getState().actions[w.action] === true);

export function A3() {
  const s = useStory();
  const [chip, setChip] = useState<string | null>(null);
  const [ff, setFf] = useState<{ x: string; y: string }>({ x: "88%", y: "14%" });
  const [guided, setGuided] = useState<string | null>(null);
  /**
   * Optional, bounded reflection. Presentation only: it can change nothing.
   * The whole offer is behind `isReflectionUiEnabled()` (VITE_JEV_REFLECTION=1) and is
   * OFF in normal production until we have played A3 and decided about free text.
   */
  const [reflect, setReflect] = useState<"hidden" | "chip" | "input" | "done">("hidden");
  const [word, setWord] = useState("");
  const reflectionDone = useRef(false);
  const lastAct = useRef(activeTime());
  const timers = useRef<Array<() => void>>([]);
  useEffect(() => () => timers.current.forEach((cancel) => cancel()), []);
  const later = (fn: () => void, ms: number) => timers.current.push(storyTimeout(fn, ms));
  const anyDone = Object.values(WHAT_REMAINS).some((w) => s.actions[w.action] === true);

  const submitReflection = async () => {
    setReflect("done");
    reflectionDone.current = true;
    const text = word.trim();
    if (!text) return;
    // Never throws, never touches story state — only chooses a line already written.
    const res = await classifyReflection(text, { stateHash: "A3" });
    audio.sfx("soft");
    say(JEV_REFLECTION_RESPONSES[res.category] ?? JEV_REFLECTION_RESPONSES.OTHER, "", 8000);
  };

  /* The Firefly: after free discovery it visits the ledge once; later, one gentle line.
   * After the first choice it steps back, then settles by the light on the horizon. */
  useEffect(() => {
    let phase = 0;
    let visitedAt = 0;
    let settled = false;
    let release = 0;
    const iv = window.setInterval(() => {
      if (getState().currentScene !== "A3") return;
      const now = activeTime();
      if (!anyKept()) {
        if (phase === 0 && now - lastAct.current >= 11000) {
          const st = STATIONS[0];
          const cx = st.box[0] + st.box[2] / 2;
          panIntoView(cx);
          setFf({ x: `${(cx / 1600) * 100}%`, y: `${((st.box[1] - 34) / 1000) * 100}%` });
          setGuided(st.key);
          audio.sfx("chime");
          release = window.setTimeout(() => setGuided(null), 10000);
          phase = 1;
          visitedAt = now;
        } else if (phase === 1 && now - Math.max(lastAct.current, visitedAt) >= 15000) {
          say("Something here can be taken with you, or set down.", "", 7000);
          phase = 2;
        }
      } else if (!settled) {
        setGuided(null);
        if (now - lastAct.current >= 7000) {
          panIntoView(800);
          setFf({ x: "50%", y: "40%" });
          settled = true;
        }
      }
    }, 1000);
    return () => {
      window.clearInterval(iv);
      window.clearTimeout(release);
    };
  }, []);

  return (
    <>
      <Stage pal="dawn" focus={50} className={`scene-A3 ${anyDone ? "settled" : ""}`}>
        <Meadow />
        {/* once one thing has been kept or set down, the way to the morning is lit */}
        <svg className={`bd a3-way ${anyDone ? "on" : ""}`} viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="a3WayFade" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#ffe2a8" stopOpacity=".0" />
              <stop offset=".5" stopColor="#ffe2a8" stopOpacity=".14" />
              <stop offset="1" stopColor="#ffe2a8" stopOpacity=".26" />
            </linearGradient>
          </defs>
          <polygon points="770,610 830,610 1010,850 590,850" fill="url(#a3WayFade)" />
        </svg>
        <svg className="bd keeping-stone" viewBox="0 0 1600 1000" aria-hidden>
          <ellipse cx="760" cy="922" rx="410" ry="30" fill="rgba(0,0,0,.22)" />
          <path d="M358 835 Q660 790 1140 835 L1120 912 Q770 951 370 912Z" fill="#292b29" stroke="var(--rim)" strokeWidth="1" />
          <path d="M358 835 Q720 860 1140 835" fill="none" stroke="var(--rim)" opacity=".45" />
        </svg>
        <At box={[1000, 610, 150, 240]}>
          <FlowerSvg stage="budded" />
        </At>
        <Mover pose={{ x: 690, y: 560, h: 120, o: 0.5 }} who="a" seconds={1} />
        <Mover pose={{ x: 850, y: 560, h: 116, o: 0.5 }} who="b" seconds={1} />
        {STATIONS.map((st, i) => {
          const w = WHAT_REMAINS[st.key];
          const done = s.actions[w.action] === true;
          return (
            <div key={st.key}>
              <Spot
                box={st.box}
                kind={st.kind}
                label={w.label}
                seen={done}
                className={`a3-station a3-station-${i} ${done ? "done" : anyDone ? "settle" : ""}`}
                delay={i * 3.7}
                art={{ lit: true }}
                /* Not a menu: nothing here gleams for attention. Only the Firefly's own visit marks one. */
                tier="optional"
                guided={guided === st.key}
                onUse={() => {
                  lastAct.current = activeTime();
                  if (done) {
                    say(w.after);
                    return;
                  }
                  audio.sfx("soft");
                  say(w.look);
                  setChip(st.key);
                }}
              />
              {chip === st.key && !done && (
                <button
                  className="chip"
                  style={{ left: `${((st.box[0] + st.box[2] / 2) / 1600) * 100}%`, top: `${((st.box[1] - 62) / 1000) * 100}%` }}
                  onClick={() => {
                    lastAct.current = activeTime();
                    const first = !anyKept();
                    send({ type: "PERFORM_ACTION", actionId: w.action });
                    audio.sfx(st.key === "guilt" ? "step" : "chime");
                    say(w.after);
                    setChip(null);
                    // The one permission the scene gives: nothing more is required.
                    if (first) {
                      later(() => say(A3_PERMISSION, "", 6500), 4300);
                      // Long after the permission, and only if nobody has left: a quiet offer.
                      // Offered only when the A3 free-text reflection flag is on (off in production).
                      later(() => {
                        if (isReflectionUiEnabled() && !reflectionDone.current) setReflect((r) => (r === "hidden" ? "chip" : r));
                      }, 12500);
                    }
                  }}
                >
                  {w.verb}
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          className={`spot exit exit-sun ${anyDone ? "ready" : ""}`}
          style={pos([700, 450, 200, 220])}
          aria-label="first light on the horizon"
          onClick={() => {
            lastAct.current = activeTime();
            if (!anyDone) {
              say("There's still something here you could carry, or leave.");
              return;
            }
            audio.sfx("step");
            leave("A3", "A4");
          }}
        >
          <ObjectArt kind="sun" />
          <i className="exit-glow" aria-hidden />
          <span className="exit-cue">when you're ready</span>
        </button>
        <Firefly x={ff.x} y={ff.y} />
        {isReflectionUiEnabled() && reflect === "chip" && (
          <button className="chip reflect-chip" style={{ left: "50%", top: "74%" }} onClick={() => setReflect("input")}>
            leave a word, if you want
          </button>
        )}
      </Stage>
      {isReflectionUiEnabled() && reflect === "input" && (
        <ReflectionDialog onClose={() => setReflect("done")}>
          <div className="reflect-card">
            <div className="reflect-prompt">{JEV_REFLECTION_PROMPT}</div>
            <div className="reflect-row">
              <input
                value={word}
                maxLength={40}
                autoComplete="off"
                enterKeyHint="done"
                aria-label="one optional word, for yourself only"
                onChange={(e) => setWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitReflection();
                }}
              />
              <button onClick={() => void submitReflection()}>leave it</button>
              <button onClick={() => setReflect("done")} aria-label="not now">not now</button>
            </div>
            <div className="reflect-note">this changes nothing but your own reading</div>
          </div>
        </ReflectionDialog>
      )}
      <SceneTitle kicker="recording iv · dawn" title="What Remains" whisper="Nothing here changes what happened." />
    </>
  );
}

function ReflectionDialog({onClose, children}: {onClose: () => void; children: React.ReactNode}) {
  const modal = useModal(onClose);
  return <div ref={modal} className="reflect-wrap" role="dialog" aria-modal="true" aria-label="Optional reflection">{children}</div>;
}

/* ======================================================================= A4 — The Portrait */
export function A4() {
  const [step, setStep] = useState(0);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;
    (async () => {
      await sleep(900, signal);
      setStep(1);
      await sleep(5200, signal);
      setStep(2);
      await sleep(1800, signal);
      if (!getState().interactionSites["A4::artifact.real.portrait"]) send({ type: "INTERACT", objectId: "artifact.real.portrait" });
      setStep(3);
      await sleep(15500, signal);
      setStep(4);
      await sleep(6500, signal);
      setStep(5);
    })();
    return () => ac.abort();
  }, []);

  return (
    <div className="portrait-scene">
      <div className={`portrait-static ${step >= 3 ? "gone" : ""}`} />
      <div className={`portrait-pre ${step === 1 ? "on" : ""}`}>{PORTRAIT_PRE}</div>
      <div className={`portrait-frame ${step >= 3 ? "on" : ""}`}>
        {!missing ? (
          <img
            className="portrait-img"
            src={`${import.meta.env.BASE_URL}images/portrait-45-days.png`}
            alt="A hand-drawn portrait, drawn over forty-five days."
            onError={() => setMissing(true)}
            draggable={false}
          />
        ) : (
          <div className="portrait-missing" role="img" aria-label="The hand-drawn portrait is not available in this build." />
        )}
      </div>
      <div className={`portrait-caption ${step >= 4 ? "on" : ""}`}>{PORTRAIT_CAPTION}</div>
      <button
        className={`btn quiet portrait-next ${step >= 5 ? "on" : ""}`}
        tabIndex={step >= 5 ? 0 : -1}
        aria-hidden={step < 5}
        onClick={() => {
          send({ type: "PERFORM_ACTION", actionId: "action.portrait.acknowledge" });
          leave("A4", "A5");
        }}
      >
        continue
      </button>
    </div>
  );
}
