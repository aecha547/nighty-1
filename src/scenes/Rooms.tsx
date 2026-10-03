import { useEffect, useMemo, useState, useRef } from "react";
import { storyTimeout } from "../lib/pause";
import { Caretaker, FigureA, FigureB } from "../art/Figures";
import { Booth, GardenFront, RoomB, SharedRoom, WorkRoom } from "../art/Backdrops";
import { audio } from "../audio/director";
import {
  D1_ORIENTATION,
  H1_AFTER_THIS,
  H3_REMARK,
  H3_REMARK_2,
  O2_ROUTINE,
  hoursRegisterRows,
  orbitRegisterRows,
  orbitWitnessBeats
} from "../content/dialogue";
import { caretakerTalk } from "../content/copy";
import { canComplete, selectCaretakerOrbitVariant } from "../engine";
import { beatDone, commitBeat, leave } from "../lib/flow";
import { sleep } from "../lib/timeline";
import { getState, send, useStory } from "../store/story";
import { Conversation } from "../ui/Conversation";
import { RegisterBook, type RegisterRow } from "../ui/RegisterBook";
import { Room, type CharDef, type RoomDef, type SpotDef } from "../ui/Room";
import { DistantFigure, At } from "../ui/Stage";
import { say } from "../ui/say";

/**
 * Plays a short authored beat sequence once (guarded by a one-shot story beat, so a
 * reload never repeats it). Used for the two scenes whose job is behaviour, not dialogue:
 * O2's routine and H1's promise. Narration goes through `say`, so the player can keep
 * exploring underneath it and is never held hostage by a cutscene.
 */
function useScripted(
  lines: { text: string; who?: string; ms: number }[],
  beatId: string,
  delayMs: number
) {
  useEffect(() => {
    if (beatDone(beatId)) return;
    const ac = new AbortController();
    (async () => {
      await sleep(delayMs, ac.signal);
      if (ac.signal.aborted) return;
      commitBeat(beatId);
      for (const l of lines) {
        if (ac.signal.aborted) return;
        say(l.text, l.who ?? "", l.ms);
        await sleep(l.ms + 420, ac.signal);
      }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

const talkCount: Record<string, number> = {};
function caretakerSays(scene: string) {
  send({ type: "SPEAK_TO", characterId: "CARETAKER" });
  const lines = caretakerTalk[scene] ?? [];
  if (!lines.length) return;
  const n = talkCount[scene] ?? 0;
  talkCount[scene] = n + 1;
  const l = lines[Math.min(n, lines.length - 1)];
  audio.sfx("soft");
  say(l.text, l.speaker ?? "Caretaker");
}

const caretakerAt = (scene: string, box: readonly [number, number, number, number], lamp = false): CharDef => ({
  id: "CARETAKER",
  box,
  art: <Caretaker lamp={lamp} className="fig-sway" />,
  label: "the caretaker",
  onTalk: () => caretakerSays(scene)
});

/* ======================================================================= D1 */
const D1_SPOTS: SpotDef[] = [
  { object: "object.caretaker.register", kind: "register", box: [1050, 482, 190, 78], label: "the visitor register" },
  { object: "object.shared.window", kind: "pane", box: [300, 330, 360, 230], label: "the glasshouse window" },
  { object: "object.shared.lantern", kind: "lantern", box: [938, 380, 62, 104], label: "a lantern on its hook", art: () => ({ lit: true }) },
  { object: "object.room.clock", kind: "clock", box: [1350, 350, 90, 90], label: "the old clock" },
  { object: "object.caretaker.radio", kind: "radio", box: [1255, 497, 95, 64], label: "the caretaker's radio", effect: "radio" },
  { object: "object.room.fan", kind: "fan", box: [130, 470, 110, 110], label: "the vent fan", effect: "fan" },
  { object: "object.room.drawer", kind: "drawer", box: [1130, 626, 270, 150], label: "the maintenance drawer" },
  { object: "object.garden.map", kind: "map", box: [140, 730, 230, 165], label: "the garden map" }
];

export function D1() {
  const [lamp, setLamp] = useState(true);
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      // The world is already happening: a light is being put out before you arrive.
      await sleep(1400, ac.signal);
      if (ac.signal.aborted) return;
      setLamp(false);
      audio.sfx("extinguish");
      if (!beatDone("beat.d1.orientation")) {
        await sleep(2800, ac.signal);
        if (ac.signal.aborted) return;
        commitBeat("beat.d1.orientation");
        say(D1_ORIENTATION, "Caretaker");
      }
    })();
    return () => ac.abort();
  }, []);

  const def: RoomDef = useMemo(
    () => ({
      scene: "D1",
      pal: "dusk",
      kicker: "recording i · dusk",
      title: "Closing Hour",
      whisper: "The garden is already beginning to close.",
      backdrop: () => <GardenFront lampOn={lamp} />,
      spots: D1_SPOTS,
      chars: [caretakerAt("D1", [830, 545, 115, 265], true)],
      exits: [
        {
          id: "path",
          label: "continue along the glasshouse path",
          box: [640, 770, 320, 230],
          kind: "path",
          cue: "the glasshouse path",
          ready: () => beatDone("beat.d1.orientation"),
          hint: "The Caretaker is still finishing the round. Not quite yet.",
          go: () => leave("D1", "D2")
        }
      ],
      focus: 46
    }),
    [lamp]
  );
  return (
    <Room def={def}>
      <DistantFigure who="a" box={[250, 598, 34, 84]} seconds={52} delay={5} />
      <DistantFigure who="b" box={[1480, 606, 34, 84]} seconds={60} delay={12} reverse />
    </Room>
  );
}

/* ======================================================================= O1 */
const O1_DEF: RoomDef = {
  scene: "O1",
  pal: "night",
  kicker: "recording ii · orbit",
  title: "Returned Places",
  whisper: "The same garden, a while later.",
  backdrop: () => <GardenFront lampOn={false} />,
  spots: [
    { object: "object.caretaker.register", kind: "register", box: [1050, 482, 190, 78], label: "the visitor register" },
    { object: "object.garden.flower", kind: "flower", box: [586, 650, 112, 170], label: "a flower by the door", art: () => ({ stage: "growing" }) },
    { object: "object.shared.small", kind: "tag", box: [846, 548, 46, 66], label: "a small brass tag on a nail" },
    { object: "object.caretaker.radio", kind: "radio", box: [1255, 497, 95, 64], label: "the caretaker's radio", effect: "radio" },
    { object: "object.shared.lantern", kind: "lantern", box: [938, 380, 62, 104], label: "the lantern, on its hook", art: () => ({ lit: true }) }
  ],
  chars: [caretakerAt("O1", [1180, 592, 110, 255])],
  exits: [
    {
      id: "path",
      label: "continue to the garden room",
      box: [640, 780, 320, 220],
      kind: "path",
      cue: "the garden room",
      ready: () => true,
      hint: "",
      go: () => leave("O1", "O2")
    }
  ],
  focus: 50
};
export const O1 = () => (
  <Room def={O1_DEF}>
    <DistantFigure who="a" box={[250, 598, 34, 84]} seconds={50} delay={3} />
    <DistantFigure who="b" box={[1480, 606, 34, 84]} seconds={58} delay={9} reverse />
  </Room>
);

/* ======================================================================= O2 */
const O2_DEF: RoomDef = {
  scene: "O2",
  pal: "night",
  kicker: "recording ii · orbit",
  title: "Ordinary Night",
  whisper: "Nothing is happening. That is what's happening.",
  backdrop: () => <SharedRoom occupants={<g opacity=".85">
    <svg x="530" y="475" width="110" height="245"><FigureA /></svg>
    <svg x="986" y="478" width="108" height="242"><FigureB /></svg>
  </g>} />,
  spots: [
    { object: "object.shared.window", kind: "pane", box: [230, 200, 320, 160], label: "the window" },
    { object: "object.garden.flower", kind: "flower", box: [262, 386, 128, 198], label: "the flower on the sill", art: () => ({ stage: "growing" }) },
    { object: "object.shared.small", kind: "tag", box: [546, 254, 52, 76], label: "a small brass tag" },
    { object: "object.caretaker.radio", kind: "radio", box: [900, 352, 130, 86], label: "a radio on the shelf", effect: "radio" },
    { object: "object.shared.lantern", kind: "lantern", box: [1196, 282, 78, 130], label: "the lantern, turned low", art: () => ({ lit: true }) },
    { object: "object.room.cup.a", kind: "cup", box: [596, 652, 66, 66], label: "a chipped mug", art: () => ({ side: "l", warm: true }) },
    { object: "object.personal.phone", kind: "phone", box: [772, 684, 100, 72], label: "a phone on the table", art: () => ({ lit: true }) },
    { object: "object.room.cup.b", kind: "cup", box: [958, 646, 66, 66], label: "a cup with a faint ring", art: () => ({ side: "r", warm: true }) }
  ],
  exits: [
    {
      id: "to-a",
      label: "the door toward A's room",
      box: [50, 430, 118, 340],
      kind: "door",
      cue: "A's room",
      ready: (s) => canComplete(s, "O2"),
      hint: "There's still something in this room you haven't looked at.",
      go: () => leave("O2", "O3A")
    },
    {
      id: "to-b",
      label: "the door toward B's room",
      box: [1466, 430, 118, 340],
      kind: "door",
      cue: "B's room",
      ready: (s) => canComplete(s, "O2"),
      hint: "There's still something in this room you haven't looked at.",
      go: () => leave("O2", "O3B")
    }
  ],
  focus: 50
};
export function O2() {
  // ORBIT's whole reason for existing: familiarity shown as behaviour, not described.
  useScripted(O2_ROUTINE, "beat.o2.routine", 4200);
  return <Room def={O2_DEF} />;
}

/* ======================================================================= O3A / O3B */
const O3A_DEF: RoomDef = {
  scene: "O3A",
  pal: "night",
  kicker: "recording ii · orbit",
  title: "Elsewhere, A",
  whisper: "A has a life this garden never sees.",
  backdrop: () => <WorkRoom />,
  spots: [
    { object: "object.shared.window", kind: "pane", box: [100, 180, 420, 360], label: "the window" },
    { object: "object.room.cup.a", kind: "cup", box: [556, 622, 66, 66], label: "a cup of coffee", art: () => ({ side: "l" }) },
    { object: "object.a.workdesk", kind: "workdesk", box: [630, 492, 372, 206], label: "the work desk" },
    { object: "object.personal.phone", kind: "phone", box: [1036, 658, 100, 72], label: "a phone, charging", art: () => ({ lit: true }) },
    { object: "object.room.fan", kind: "fan", box: [1130, 228, 108, 108], label: "a small fan", effect: "fan" },
    { object: "object.room.clock", kind: "clock", box: [1382, 200, 108, 108], label: "the wall clock" }
  ],
  chars: [],
  exits: [
    {
      id: "door",
      label: (s) => (s.completedScenes["O3B"] ? "the door, back toward the booth" : "the door, toward B's room"),
      cue: (s) => (s.completedScenes["O3B"] ? "the booth" : "B's room"),
      box: [1466, 360, 114, 330],
      kind: "door",
      ready: (s) => canComplete(s, "O3A"),
      hint: "The desk is still waiting to be looked at.",
      go: () => (getState().completedScenes["O3B"] ? leave("O3A", "O4") : leave("O3A", "O3B"))
    }
  ],
  focus: 56
};
export const O3A = () => (
  <Room def={O3A_DEF}>
    <At box={[790, 430, 210, 224]}>
      <FigureA pose="seated" className="fig-sway" />
    </At>
  </Room>
);

const O3B_DEF: RoomDef = {
  scene: "O3B",
  pal: "night",
  kicker: "recording ii · orbit",
  title: "Elsewhere, B",
  whisper: "B has a life this garden never sees.",
  backdrop: () => <RoomB />,
  spots: [
    { object: "object.shared.small", kind: "tag", box: [196, 262, 50, 78], label: "a brass tag by the door" },
    { object: "object.b.planner", kind: "planner", box: [494, 556, 290, 160], label: "a planner" },
    { object: "object.room.cup.b", kind: "cup", box: [826, 636, 66, 66], label: "a cup with a tea bag", art: () => ({ side: "r" }) },
    { object: "object.shared.window", kind: "pane", box: [1000, 180, 480, 390], label: "the window" },
    { object: "object.room.drawer", kind: "drawer", box: [1040, 722, 300, 180], label: "a drawer of odds and ends" }
  ],
  exits: [
    {
      id: "door",
      label: (s) => (s.completedScenes["O3A"] ? "the door, back toward the booth" : "the door, toward A's room"),
      cue: (s) => (s.completedScenes["O3A"] ? "the booth" : "A's room"),
      box: [34, 440, 118, 330],
      kind: "door",
      ready: (s) => canComplete(s, "O3B"),
      hint: "The planner is still waiting to be looked at.",
      go: () => (getState().completedScenes["O3A"] ? leave("O3B", "O4") : leave("O3B", "O3A"))
    }
  ],
  focus: 38
};
export const O3B = () => <Room def={O3B_DEF} />;

/* ======================================================================= O4 — the Witness */
export function O4() {
  const s = useStory();
  const [book, setBook] = useState(false);
  const [talk, setTalk] = useState<ReturnType<typeof orbitWitnessBeats> | null>(null);

  const def: RoomDef = useMemo(
    () => ({
      scene: "O4",
      pal: "night",
      kicker: "recording ii · orbit",
      title: "The Witness",
      whisper: "The Caretaker only writes down what they see.",
      backdrop: () => <Booth />,
      spots: [
        { object: "object.caretaker.register", kind: "register", box: [520, 556, 320, 140], label: "the visitor register", effect: undefined },
        { object: "object.shared.lantern", kind: "lantern", box: [1440, 340, 70, 118], label: "the lantern on its hook", art: () => ({ lit: false }) }
      ],
      chars: [
        {
          id: "CARETAKER",
          box: [880, 300, 150, 340],
          art: <Caretaker className="fig-sway" />,
          label: "the caretaker",
          onTalk: () => {
            send({ type: "SPEAK_TO", characterId: "CARETAKER" });
            setTalk(orbitWitnessBeats(selectCaretakerOrbitVariant(getState())));
          }
        }
      ],
      exits: [
        {
          id: "door",
          label: "the booth door, back to the garden",
          cue: "the garden",
          box: [1450, 520, 120, 300],
          kind: "door",
          ready: (st) => canComplete(st, "O4"),
          hint: "Look at the book, or speak to the Caretaker, before you go.",
          go: () => leave("O4", "O5")
        }
      ],
      focus: 58
    }),
    []
  );
  void s;
  return (
    <>
      <Room
        def={def}
        onUse={(sp) => {
          if (sp.object === "object.caretaker.register") {
            audio.sfx("page");
            setBook(true);
            return true;
          }
        }}
        overlay={
          <>
            <At box={[260, 215, 120, 120]}>
              <svg viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="42" fill="#15171a" stroke="#5c564b" strokeWidth="4" />
                <line x1="50" y1="50" x2="50" y2="26" stroke="#b7ad98" strokeWidth="3" transform="rotate(332 50 50)" />
                <line x1="50" y1="50" x2="50" y2="34" stroke="#b7ad98" strokeWidth="3.4" transform="rotate(48 50 50)" />
              </svg>
            </At>
          </>
        }
      />
      {book && <RegisterBook rows={orbitRegisterRows} onClose={() => setBook(false)} />}
      {talk && <Conversation beats={talk} onDone={() => setTalk(null)} />}
    </>
  );
}

/* ======================================================================= H1 — Two Clocks */
const H1_DEF: RoomDef = {
  scene: "H1",
  pal: "cold",
  kicker: "recording iii · the hours between",
  title: "Two Clocks",
  whisper: "Same night. Different hours.",
  backdrop: () => (
    <WorkRoom
      cold
      windowScene={
        <g>
          <circle cx="396" cy="470" r="4.4" fill="var(--fig-rim-b)" />
          <rect x="392" y="474" width="8" height="24" rx="3" fill="var(--fig-rim-b)" opacity=".8" />
          <circle cx="396" cy="450" r="22" fill="var(--glow)" opacity=".15" />
        </g>
      }
    />
  ),
  spots: [
    { object: "object.shared.window", kind: "pane", box: [100, 180, 420, 360], label: "the window" },
    { object: "object.a.workdesk", kind: "workdesk", box: [630, 492, 372, 206], label: "the work desk", art: () => ({ messy: true }) },
    { object: "object.personal.phone", kind: "phone", box: [1036, 658, 100, 72], label: "a phone, face-up", art: () => ({ lit: true }) },
    { object: "object.room.fan", kind: "fan", box: [1130, 228, 108, 108], label: "a small fan", effect: "fan" },
    { object: "object.room.clock", kind: "clock", box: [1370, 190, 128, 128], label: "the wall clock" }
  ],
  exits: [
    {
      id: "door",
      label: "the door",
      cue: "the hours that follow",
      box: [1466, 360, 114, 330],
      kind: "door",
      ready: (s) => canComplete(s, "H1"),
      hint: "The phone and the clock both want a look before this night moves on.",
      go: () => leave("H1", "H2")
    }
  ],
  focus: 62
};
export function H1() {
  // H1 — the promise. "after this" is sent here so that every later absence has a cause.
  useScripted(H1_AFTER_THIS, "beat.h1.after_this", 5200);
  return (
    <Room def={H1_DEF}>
      <At box={[790, 430, 210, 224]}>
        <FigureA pose="seated" className="fig-sway" />
      </At>
    </Room>
  );
}

/* ======================================================================= H3 — The Register */
export function H3() {
  const [book, setBook] = useState(false);
  const remark = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => remark.current?.(), []);
  const def: RoomDef = useMemo(
    () => ({
      scene: "H3",
      pal: "cold",
      kicker: "recording iii · the hours between",
      title: "The Register",
      whisper: "Objective things, written down as they happened.",
      backdrop: () => <Booth />,
      spots: [{ object: "object.caretaker.register", kind: "register", box: [520, 556, 320, 140], label: "the visitor register" }],
      chars: [
        { id: "CARETAKER", box: [880, 300, 150, 340], art: <Caretaker className="fig-sway" />, label: "the caretaker", onTalk: () => say("Go on. It's only a book.", "Caretaker") }
      ],
      exits: [
        {
          id: "door",
          label: (s) => (s.completedScenes["H4"] ? "the booth door, toward the gate" : "the booth door, toward the quiet room"),
          cue: (s) => (s.completedScenes["H4"] ? "the gate" : "the quiet room"),
          box: [1450, 520, 120, 300],
          kind: "door",
          ready: (s) => canComplete(s, "H3"),
          hint: "Open the register first.",
          go: () => (getState().completedScenes["H4"] ? leave("H3", "H5") : leave("H3", "H4"))
        }
      ],
      focus: 52
    }),
    []
  );
  return (
    <>
      <Room
        def={def}
        onUse={(sp) => {
          if (sp.object === "object.caretaker.register") {
            audio.sfx("page");
            setBook(true);
            return true;
          }
        }}
      />
      {book && (
        <RegisterBook
          title="Visitor register"
          rows={hoursRegisterRows as RegisterRow[]}
          onClose={() => {
            setBook(false);
            say(H3_REMARK, "Caretaker", 9000);
            remark.current?.();
            remark.current = storyTimeout(() => say(H3_REMARK_2, "Caretaker", 9000), 10500);
          }}
        />
      )}
    </>
  );
}

/* ======================================================================= H4 — The Quiet Room */
export function H4() {
  const s = useStory();
  const [chip, setChip] = useState<"lantern" | "flower" | null>(null);
  const watered = s.actions["action.hours.water_flower"] === true;
  const lanternDecided = s.actions["action.hours.leave_lantern_burning"] === true || s.actions["action.hours.dim_lantern"] === true;

  const def: RoomDef = useMemo(
    () => ({
      scene: "H4",
      pal: "cold",
      kicker: "recording iii · the hours between",
      title: "The Quiet Room",
      whisper: "The same room. Fewer traces of two.",
      backdrop: () => <SharedRoom quiet />,
      spots: [
        { object: "object.shared.window", kind: "pane", box: [230, 200, 320, 160], label: "the window" },
        { object: "object.garden.flower", kind: "flower", box: [262, 386, 128, 198], label: "the flower on the sill", art: (st) => ({ stage: "tired", watered: st.actions["action.hours.water_flower"] === true }) },
        { object: "object.a.workdesk", kind: "workdesk", box: [470, 586, 340, 180], label: "work spread across the table", art: () => ({ messy: true }) },
        { object: "object.shared.small", kind: "tag", box: [1040, 604, 50, 70], label: "a small brass tag" },
        { object: "object.room.clock", kind: "clock", box: [1380, 200, 108, 108], label: "the clock" },
        { object: "object.shared.lantern", kind: "lantern", box: [1196, 282, 78, 130], label: "the lantern", art: (st) => ({ lit: (st.objectStates["object.shared.lantern"]?.lit ?? true) as boolean }) },
        { object: "object.room.cup.a", kind: "cup", box: [828, 652, 66, 66], label: "one cup, cold", art: () => ({ side: "l" }) },
        { object: "object.personal.phone", kind: "phone", box: [930, 692, 100, 70], label: "a phone, face-down", art: () => ({ down: true }) },
        { object: "object.room.drawer", kind: "drawer", box: [1110, 790, 360, 160], label: "a drawer" },
        { object: "object.room.fan", kind: "fan", box: [110, 700, 120, 120], label: "a small fan", effect: "fan" }
      ],
      exits: [
        {
          id: "door",
          label: (st) => (st.completedScenes["H3"] ? "the door, toward the gate" : "the door, toward the booth"),
          cue: (st) => (st.completedScenes["H3"] ? "the gate" : "the booth"),
          box: [34, 430, 120, 340],
          kind: "door",
          ready: (st) => canComplete(st, "H4"),
          hint: "Something in this room is still waiting to be looked at.",
          go: () => (getState().completedScenes["H3"] ? leave("H4", "H5") : leave("H4", "H3"))
        }
      ],
      focus: 48
    }),
    []
  );

  const act = (id: string, line: string, sfx: "lantern" | "extinguish" | "water") => {
    send({ type: "PERFORM_ACTION", actionId: id });
    audio.sfx(sfx);
    say(line);
    setChip(null);
  };

  return (
    <Room
      def={def}
      onUse={(sp) => {
        if (sp.object === "object.shared.lantern" && !lanternDecided) setChip("lantern");
        if (sp.object === "object.garden.flower" && !watered) setChip("flower");
        return false;
      }}
      overlay={
        <>
          {chip === "lantern" && !lanternDecided && (
            <div className="chip-row" style={{ left: "77.5%", top: "44%" }}>
              <button className="chip" onClick={() => act("action.hours.leave_lantern_burning", "You leave it burning. The room is quieter in its light.", "lantern")}>leave it burning</button>
              <button className="chip" onClick={() => act("action.hours.dim_lantern", "You turn it down to an ember. The room settles.", "extinguish")}>turn it down</button>
            </div>
          )}
          {chip === "flower" && !watered && (
            <div className="chip-row" style={{ left: "20%", top: "58%" }}>
              <button className="chip" onClick={() => act("action.hours.water_flower", "A little water. Nothing dramatic. It simply stops asking.", "water")}>water it</button>
            </div>
          )}
        </>
      }
    />
  );
}
