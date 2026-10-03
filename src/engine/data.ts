import { action, all, any, beat, completed, echo, fact, inspected, not, spoken, always } from "./conditions";
import type {
  ActionDef,
  DecisionTable,
  DerivedEchoRule,
  ObjectDef,
  SceneDef
} from "./types";

/* ------------------------------------------------------------------------- *
 * OBJECTS — stable ids. Text can change; ids never do.
 * ------------------------------------------------------------------------- */
const o = (id: string, role: ObjectDef["role"], persistent = false): ObjectDef => ({ id, role, persistent });

export const objects: ObjectDef[] = [
  o("object.archive.rack", "STORY", true),
  o("object.caretaker.register", "ECHO", true),
  o("object.caretaker.radio", "CHARACTER"),
  o("object.shared.window", "ECHO"),
  o("object.shared.lantern", "ECHO", true),
  o("object.shared.bench", "CHARACTER"),
  o("object.shared.small", "ECHO", true),
  o("object.garden.flower", "ECHO", true),
  o("object.garden.map", "CHARACTER"),
  o("object.personal.phone", "STORY", true),
  o("object.room.clock", "STORY"),
  o("object.room.fan", "TACTILITY"),
  o("object.room.drawer", "ECHO", true),
  o("object.room.cup.a", "CHARACTER"),
  o("object.room.cup.b", "CHARACTER"),
  o("object.a.workdesk", "STORY", true),
  o("object.b.planner", "STORY", true),
  o("object.d2.west", "ECHO"),
  o("object.d2.east", "ECHO"),
  o("object.d2.label", "CHARACTER"),
  o("object.d2.glass", "TACTILITY"),
  o("object.d3.moth", "CHARACTER"),
  o("object.d3.sign", "CHARACTER"),
  o("object.d3.water", "CHARACTER"),
  o("object.d3.shade", "TACTILITY"),
  o("object.d4.gate", "CHARACTER"),
  o("artifact.real.portrait", "ARTIFACT", true)
];

/* ------------------------------------------------------------------------- *
 * ECHO CATALOG — every echo that may exist. Validated at build/test time.
 * No numeric relationship meter exists anywhere in this model.
 * ------------------------------------------------------------------------- */
export const echoCatalog: string[] = [
  "echo.dusk.lantern_inspected",
  "echo.dusk.register_inspected",
  "echo.dusk.window_watched",
  "echo.dusk.caretaker_spoken",
  "echo.dusk.small_object_found",
  "echo.dusk.west_first",
  "echo.dusk.east_first",
  "echo.dusk.bench_first",
  "echo.dusk.crossing_observed",
  "echo.orbit.phone_inspected",
  "echo.orbit.flower_noticed",
  "echo.orbit.radio_used",
  "echo.orbit.shared_object_noticed",
  "echo.orbit.caretaker_spoken",
  "echo.orbit.a_work_pattern_seen",
  "echo.orbit.b_independent_life_seen",
  "echo.hours.phone_first",
  "echo.hours.clock_first",
  "echo.hours.window_waited",
  "echo.hours.register_sequence_seen",
  "echo.hours.lantern_left_burning",
  "echo.hours.lantern_put_out",
  "echo.hours.flower_cared",
  "echo.hours.caretaker_depth",
  "echo.dawn.keep_memory",
  "echo.dawn.release_guilt",
  "echo.dawn.keep_gratitude",
  "echo.dawn.release_question",
  "echo.dawn.keep_lesson",
  "echo.meta.explorer",
  "echo.meta.caretaker_familiar",
  "echo.meta.lantern_thread",
  "echo.meta.flower_thread"
];

/* ------------------------------------------------------------------------- *
 * ACTIONS — deliberate player gestures (never menu "choices" about the ending)
 * ------------------------------------------------------------------------- */
export const actions: ActionDef[] = [
  { id: "action.archive.insert_dusk", sceneId: "I2", oneShot: true },
  {
    id: "action.hours.leave_lantern_burning",
    sceneId: "H4",
    oneShot: true,
    excludes: ["action.hours.dim_lantern"],
    addEchoes: ["echo.hours.lantern_left_burning"],
    objectPatches: [{ objectId: "object.shared.lantern", values: { lit: true, location: "QUIET_ROOM" } }]
  },
  {
    id: "action.hours.dim_lantern",
    sceneId: "H4",
    oneShot: true,
    excludes: ["action.hours.leave_lantern_burning"],
    addEchoes: ["echo.hours.lantern_put_out"],
    objectPatches: [{ objectId: "object.shared.lantern", values: { lit: false, location: "QUIET_ROOM" } }]
  },
  {
    id: "action.hours.water_flower",
    sceneId: "H4",
    oneShot: true,
    addEchoes: ["echo.hours.flower_cared"],
    objectPatches: [{ objectId: "object.garden.flower", values: { watered: true } }]
  },
  { id: "action.dawn.keep_memory", sceneId: "A3", oneShot: true, addEchoes: ["echo.dawn.keep_memory"] },
  { id: "action.dawn.release_guilt", sceneId: "A3", oneShot: true, addEchoes: ["echo.dawn.release_guilt"] },
  { id: "action.dawn.keep_gratitude", sceneId: "A3", oneShot: true, addEchoes: ["echo.dawn.keep_gratitude"] },
  { id: "action.dawn.release_question", sceneId: "A3", oneShot: true, addEchoes: ["echo.dawn.release_question"] },
  { id: "action.dawn.keep_lesson", sceneId: "A3", oneShot: true, addEchoes: ["echo.dawn.keep_lesson"] },
  {
    id: "action.portrait.acknowledge",
    sceneId: "A4",
    oneShot: true,
    requires: fact("fact.mutual_ending_established")
  },
  {
    id: "action.archive.insert_afterlight",
    sceneId: "A5",
    oneShot: true,
    requires: all(fact("fact.mutual_ending_established"), completed("A4"))
  }
];

/* ------------------------------------------------------------------------- *
 * SCENE GRAPH
 * ------------------------------------------------------------------------- */
const scene = (d: SceneDef): SceneDef => d;
const I = inspected;

export const scenes: SceneDef[] = [
  /* ---------------------------- INTRO ---------------------------- */
  scene({ id: "I0", chapter: "INTRO", reloadPolicy: "RESTART_SCENE", characters: ["GUIDE"], interactions: [], next: [{ to: "I1" }] }),
  scene({ id: "I1", chapter: "INTRO", reloadPolicy: "RESTART_SCENE", characters: ["GUIDE"], interactions: [], next: [{ to: "I2" }] }),
  scene({
    id: "I2",
    chapter: "INTRO",
    reloadPolicy: "RESUME_STATE",
    characters: ["GUIDE"],
    interactions: [{ objectId: "object.archive.rack", category: "CRITICAL" }],
    completionGuard: action("action.archive.insert_dusk"),
    terminalChapter: true,
    next: [{ to: "D1" }]
  }),

  /* ---------------------------- DUSK ----------------------------- */
  scene({
    id: "D1",
    chapter: "DUSK",
    reloadPolicy: "RESUME_STATE",
    characters: ["A", "B", "CARETAKER", "GUIDE"],
    beats: ["beat.d1.orientation"],
    interactions: [
      { objectId: "object.caretaker.register", category: "ECHO", addEchoesOnFirst: ["echo.dusk.register_inspected"] },
      { objectId: "object.shared.window", category: "ECHO", addEchoesOnFirst: ["echo.dusk.window_watched"] },
      { objectId: "object.shared.lantern", category: "ECHO", addEchoesOnFirst: ["echo.dusk.lantern_inspected"] },
      { objectId: "object.room.clock", category: "TEXTURE" },
      { objectId: "object.garden.map", category: "TEXTURE" },
      { objectId: "object.caretaker.radio", category: "TEXTURE" },
      { objectId: "object.room.fan", category: "PLAYFUL" },
      { objectId: "object.room.drawer", category: "PLAYFUL" }
    ],
    speakEchoes: { CARETAKER: ["echo.dusk.caretaker_spoken"] },
    completionGuard: beat("beat.d1.orientation"),
    next: [{ to: "D2" }]
  }),
  scene({
    id: "D2",
    chapter: "DUSK",
    reloadPolicy: "RESUME_AFTER_CANONICAL_EVENT",
    characters: ["A", "B", "CARETAKER"],
    beats: ["beat.d2.a_arrives", "beat.d2.b_arrives", "beat.d2.crossing"],
    interactions: [
      {
        objectId: "object.shared.bench",
        category: "CRITICAL",
        claimIfEmpty: { claimId: "claim.d2.first_focus", value: "bench", echoId: "echo.dusk.bench_first" }
      },
      {
        objectId: "object.d2.west",
        category: "ECHO",
        claimIfEmpty: { claimId: "claim.d2.first_focus", value: "west", echoId: "echo.dusk.west_first" }
      },
      {
        objectId: "object.d2.east",
        category: "ECHO",
        claimIfEmpty: { claimId: "claim.d2.first_focus", value: "east", echoId: "echo.dusk.east_first" }
      },
      { objectId: "object.shared.small", category: "ECHO", addEchoesOnFirst: ["echo.dusk.small_object_found"] },
      { objectId: "object.d2.label", category: "TEXTURE" },
      { objectId: "object.d2.glass", category: "PLAYFUL" }
    ],
    completionGuard: beat("beat.d2.crossing"),
    factsOnComplete: ["fact.a_b_noticed_each_other"],
    echoesOnComplete: ["echo.dusk.crossing_observed"],
    next: [{ to: "D3" }]
  }),
  scene({
    id: "D3",
    chapter: "DUSK",
    reloadPolicy: "RESUME_STATE",
    characters: ["A", "B", "CARETAKER"],
    beats: ["beat.d3.caretaker_lantern"],
    interactions: [
      { objectId: "object.shared.lantern", category: "CRITICAL", addEchoesOnFirst: ["echo.dusk.lantern_inspected"] },
      { objectId: "object.garden.map", category: "TEXTURE" },
      { objectId: "object.d3.moth", category: "TEXTURE" },
      { objectId: "object.d3.sign", category: "TEXTURE" },
      { objectId: "object.d3.water", category: "TEXTURE" },
      { objectId: "object.d3.shade", category: "PLAYFUL" }
    ],
    completionGuard: all(beat("beat.d3.caretaker_lantern"), I("D3", "object.shared.lantern")),
    factsOnComplete: ["fact.lantern_introduced"],
    next: [{ to: "D4" }]
  }),
  scene({
    id: "D4",
    chapter: "DUSK",
    reloadPolicy: "RESTART_SCENE",
    characters: ["A", "B", "CARETAKER"],
    beats: ["beat.d4.a_departs", "beat.d4.b_departs"],
    interactions: [
      { objectId: "object.d4.gate", category: "TEXTURE" },
      { objectId: "object.shared.window", category: "TEXTURE" },
      { objectId: "object.shared.lantern", category: "TEXTURE" },
      { objectId: "object.caretaker.register", category: "TEXTURE" }
    ],
    completionGuard: all(beat("beat.d4.a_departs"), beat("beat.d4.b_departs")),
    terminalChapter: true,
    next: [{ to: "O1" }]
  }),

  /* ---------------------------- ORBIT ---------------------------- */
  scene({
    id: "O1",
    chapter: "ORBIT",
    reloadPolicy: "RESUME_STATE",
    characters: ["A", "B", "CARETAKER"],
    interactions: [
      { objectId: "object.caretaker.register", category: "TEXTURE" },
      { objectId: "object.garden.flower", category: "ECHO", addEchoesOnFirst: ["echo.orbit.flower_noticed"] },
      { objectId: "object.shared.small", category: "ECHO", addEchoesOnFirst: ["echo.orbit.shared_object_noticed"] },
      { objectId: "object.caretaker.radio", category: "PLAYFUL", addEchoesOnFirst: ["echo.orbit.radio_used"] },
      { objectId: "object.shared.lantern", category: "TEXTURE" }
    ],
    next: [{ to: "O2" }]
  }),
  scene({
    id: "O2",
    chapter: "ORBIT",
    reloadPolicy: "RESUME_STATE",
    characters: ["A", "B"],
    beats: ["beat.o2.routine"],
    interactions: [
      { objectId: "object.personal.phone", category: "ECHO", addEchoesOnFirst: ["echo.orbit.phone_inspected"] },
      { objectId: "object.shared.lantern", category: "CRITICAL" },
      { objectId: "object.shared.small", category: "ECHO", addEchoesOnFirst: ["echo.orbit.shared_object_noticed"] },
      { objectId: "object.garden.flower", category: "ECHO", addEchoesOnFirst: ["echo.orbit.flower_noticed"] },
      { objectId: "object.caretaker.radio", category: "PLAYFUL", addEchoesOnFirst: ["echo.orbit.radio_used"] },
      { objectId: "object.shared.window", category: "TEXTURE" },
      { objectId: "object.room.cup.a", category: "TEXTURE" },
      { objectId: "object.room.cup.b", category: "TEXTURE" }
    ],
    completionGuard: any(
      I("O2", "object.personal.phone"),
      I("O2", "object.shared.lantern"),
      I("O2", "object.shared.small")
    ),
    factsOnComplete: ["fact.routine_exists"],
    next: [{ to: "O3A" }, { to: "O3B" }]
  }),
  scene({
    id: "O3A",
    chapter: "ORBIT",
    reloadPolicy: "RESUME_STATE",
    characters: ["A"],
    interactions: [
      { objectId: "object.a.workdesk", category: "CRITICAL", addEchoesOnFirst: ["echo.orbit.a_work_pattern_seen"] },
      { objectId: "object.personal.phone", category: "TEXTURE" },
      { objectId: "object.room.clock", category: "TEXTURE" },
      { objectId: "object.room.cup.a", category: "TEXTURE" },
      { objectId: "object.shared.window", category: "TEXTURE" },
      { objectId: "object.room.fan", category: "PLAYFUL" }
    ],
    completionGuard: I("O3A", "object.a.workdesk"),
    next: [{ to: "O3B" }, { to: "O4", guard: all(completed("O3A"), completed("O3B")) }]
  }),
  scene({
    id: "O3B",
    chapter: "ORBIT",
    reloadPolicy: "RESUME_STATE",
    characters: ["B"],
    interactions: [
      { objectId: "object.b.planner", category: "CRITICAL", addEchoesOnFirst: ["echo.orbit.b_independent_life_seen"] },
      { objectId: "object.shared.window", category: "TEXTURE" },
      { objectId: "object.shared.small", category: "TEXTURE" },
      { objectId: "object.room.drawer", category: "TEXTURE" },
      { objectId: "object.room.cup.b", category: "TEXTURE" }
    ],
    completionGuard: I("O3B", "object.b.planner"),
    next: [{ to: "O3A" }, { to: "O4", guard: all(completed("O3A"), completed("O3B")) }]
  }),
  scene({
    id: "O4",
    chapter: "ORBIT",
    reloadPolicy: "RESUME_AFTER_CANONICAL_EVENT",
    characters: ["CARETAKER"],
    interactions: [
      { objectId: "object.caretaker.register", category: "CRITICAL" },
      { objectId: "object.shared.lantern", category: "TEXTURE" }
    ],
    completionGuard: any(spoken("O4"), I("O4", "object.caretaker.register")),
    echoesOnComplete: ["echo.orbit.caretaker_spoken", "echo.meta.caretaker_familiar"],
    next: [{ to: "O5" }]
  }),
  scene({
    id: "O5",
    chapter: "ORBIT",
    reloadPolicy: "RESTART_SCENE",
    characters: ["A", "B"],
    beats: ["beat.o5.montage_shown"],
    interactions: [],
    completionGuard: beat("beat.o5.montage_shown"),
    terminalChapter: true,
    next: [{ to: "H1" }]
  }),

  /* ------------------------ THE HOURS BETWEEN ------------------------ */
  scene({
    id: "H1",
    chapter: "HOURS_BETWEEN",
    reloadPolicy: "RESUME_STATE",
    characters: ["A", "B", "CARETAKER"],
    beats: ["beat.h1.after_this"],
    interactions: [
      {
        objectId: "object.personal.phone",
        category: "CRITICAL",
        claimIfEmpty: { claimId: "claim.h1.first_focus", value: "phone", echoId: "echo.hours.phone_first" }
      },
      {
        objectId: "object.room.clock",
        category: "CRITICAL",
        claimIfEmpty: { claimId: "claim.h1.first_focus", value: "clock", echoId: "echo.hours.clock_first" }
      },
      { objectId: "object.a.workdesk", category: "CRITICAL" },
      { objectId: "object.shared.window", category: "TEXTURE" },
      { objectId: "object.room.fan", category: "PLAYFUL" }
    ],
    completionGuard: all(I("H1", "object.personal.phone"), I("H1", "object.room.clock")),
    factsOnComplete: ["fact.a_busy_and_tired", "fact.time_mismatch_exists"],
    next: [{ to: "H2" }]
  }),
  scene({
    id: "H2",
    chapter: "HOURS_BETWEEN",
    reloadPolicy: "RESUME_AFTER_CANONICAL_EVENT",
    characters: ["A", "B", "CARETAKER"],
    beats: ["beat.h2.contact_attempt", "beat.h2.b_leaves", "beat.h2.reverse"],
    interactions: [
      { objectId: "object.personal.phone", category: "CRITICAL" },
      { objectId: "object.shared.window", category: "ECHO", addEchoesOnFirst: ["echo.hours.window_waited"] },
      { objectId: "object.room.clock", category: "TEXTURE" },
      { objectId: "object.a.workdesk", category: "TEXTURE" }
    ],
    completionGuard: all(beat("beat.h2.contact_attempt"), beat("beat.h2.b_leaves")),
    factsOnComplete: ["fact.contact_attempt_occurs", "fact.missed_connection_occurred"],
    next: [{ to: "H3" }, { to: "H4" }]
  }),
  scene({
    id: "H3",
    chapter: "HOURS_BETWEEN",
    reloadPolicy: "RESUME_STATE",
    characters: ["CARETAKER"],
    interactions: [
      { objectId: "object.caretaker.register", category: "CRITICAL", addEchoesOnFirst: ["echo.hours.register_sequence_seen"] }
    ],
    completionGuard: I("H3", "object.caretaker.register"),
    next: [{ to: "H4" }, { to: "H5", guard: completed("H4") }]
  }),
  scene({
    id: "H4",
    chapter: "HOURS_BETWEEN",
    reloadPolicy: "RESUME_STATE",
    characters: ["A", "GUIDE"],
    interactions: [
      { objectId: "object.personal.phone", category: "CRITICAL" },
      { objectId: "object.shared.lantern", category: "CRITICAL" },
      { objectId: "object.garden.flower", category: "CRITICAL" },
      { objectId: "object.a.workdesk", category: "TEXTURE" },
      { objectId: "object.room.drawer", category: "TEXTURE" },
      { objectId: "object.room.clock", category: "TEXTURE" },
      { objectId: "object.room.cup.a", category: "TEXTURE" },
      { objectId: "object.shared.window", category: "TEXTURE" },
      { objectId: "object.shared.small", category: "TEXTURE" },
      { objectId: "object.room.fan", category: "PLAYFUL" }
    ],
    completionGuard: any(
      I("H4", "object.personal.phone"),
      I("H4", "object.shared.lantern"),
      I("H4", "object.garden.flower")
    ),
    next: [{ to: "H3" }, { to: "H5", guard: completed("H3") }]
  }),
  scene({
    id: "H5",
    chapter: "HOURS_BETWEEN",
    reloadPolicy: "RESUME_AFTER_CANONICAL_EVENT",
    characters: ["CARETAKER"],
    interactions: [],
    completionGuard: all(completed("H3"), completed("H4"), spoken("H5")),
    echoesOnComplete: ["echo.hours.caretaker_depth"],
    terminalChapter: true,
    next: [{ to: "A1" }]
  }),

  /* ------------------------------ DAWN ------------------------------ */
  scene({
    id: "A1",
    chapter: "DAWN",
    reloadPolicy: "RESTART_SCENE",
    characters: ["A", "B", "CARETAKER"],
    beats: ["beat.a1.arrival"],
    interactions: [
      { objectId: "object.shared.lantern", category: "TEXTURE" },
      { objectId: "object.garden.flower", category: "TEXTURE" },
      { objectId: "object.caretaker.register", category: "TEXTURE" }
    ],
    completionGuard: beat("beat.a1.arrival"),
    next: [{ to: "A2" }]
  }),
  scene({
    id: "A2",
    chapter: "DAWN",
    reloadPolicy: "RESUME_AFTER_CANONICAL_EVENT",
    characters: ["A", "B"],
    beats: ["beat.a2.ending_spoken"],
    interactions: [{ objectId: "object.shared.lantern", category: "TEXTURE" }],
    completionGuard: beat("beat.a2.ending_spoken"),
    factsOnComplete: ["fact.mutual_ending_established"],
    next: [{ to: "A3" }]
  }),
  scene({
    id: "A3",
    chapter: "DAWN",
    reloadPolicy: "RESUME_STATE",
    characters: ["A", "B"],
    interactions: [
      { objectId: "object.room.drawer", category: "TEXTURE" },
      { objectId: "object.shared.small", category: "TEXTURE" },
      { objectId: "object.shared.lantern", category: "TEXTURE" }
    ],
    completionGuard: any(
      action("action.dawn.keep_memory"),
      action("action.dawn.release_guilt"),
      action("action.dawn.keep_gratitude"),
      action("action.dawn.release_question"),
      action("action.dawn.keep_lesson")
    ),
    next: [{ to: "A4", guard: fact("fact.mutual_ending_established") }]
  }),
  scene({
    id: "A4",
    chapter: "DAWN",
    reloadPolicy: "RESUME_AFTER_CANONICAL_EVENT",
    characters: [],
    interactions: [{ objectId: "artifact.real.portrait", category: "CRITICAL" }],
    completionGuard: action("action.portrait.acknowledge"),
    next: [{ to: "A5" }]
  }),
  scene({
    id: "A5",
    chapter: "DAWN",
    reloadPolicy: "RESUME_AFTER_CANONICAL_EVENT",
    characters: ["GUIDE"],
    interactions: [{ objectId: "object.archive.rack", category: "CRITICAL" }],
    completionGuard: action("action.archive.insert_afterlight"),
    factsOnComplete: ["fact.afterlight_unlocked"],
    terminalChapter: true,
    next: [{ to: "F1", guard: all(fact("fact.mutual_ending_established"), fact("fact.afterlight_unlocked")) }]
  }),

  /* --------------------------- AFTERLIGHT --------------------------- */
  scene({
    id: "F1",
    chapter: "AFTERLIGHT",
    reloadPolicy: "RESUME_AFTER_CANONICAL_EVENT",
    characters: [],
    beats: ["beat.f1.voice_complete"],
    interactions: [],
    completionGuard: beat("beat.f1.voice_complete"),
    next: [{ to: "F2" }]
  }),
  scene({ id: "F2", chapter: "AFTERLIGHT", reloadPolicy: "RESTART_SCENE", characters: [], interactions: [], next: [{ to: "F3" }] }),
  scene({
    id: "F3",
    chapter: "AFTERLIGHT",
    reloadPolicy: "RESTART_SCENE",
    characters: [],
    interactions: [{ objectId: "object.garden.flower", category: "CRITICAL" }],
    factsOnComplete: ["fact.flower_bloomed"],
    next: [{ to: "F4" }]
  }),
  scene({
    id: "F4",
    chapter: "AFTERLIGHT",
    reloadPolicy: "RESTART_SCENE",
    characters: [],
    interactions: [],
    factsOnComplete: ["fact.bird_departed"],
    next: [{ to: "F5" }]
  }),
  scene({
    id: "F5",
    chapter: "AFTERLIGHT",
    reloadPolicy: "RESUME_AFTER_CANONICAL_EVENT",
    characters: ["CARETAKER"],
    interactions: [],
    factsOnComplete: ["fact.experience_completed"],
    terminalChapter: true,
    next: []
  })
];

/* ------------------------------------------------------------------------- *
 * DERIVED ECHOES
 * ------------------------------------------------------------------------- */
export const derivedEchoRules: DerivedEchoRule[] = [
  { id: "derived.explorer", when: { kind: "sceneInteractionCountAtLeast", sceneId: "D1", count: 5 }, add: "echo.meta.explorer" },
  { id: "derived.lantern_thread", when: echo("echo.dusk.lantern_inspected"), add: "echo.meta.lantern_thread" },
  { id: "derived.flower_thread", when: echo("echo.orbit.flower_noticed"), add: "echo.meta.flower_thread" }
];

/* ------------------------------------------------------------------------- *
 * DECISION TABLES
 * ------------------------------------------------------------------------- */
export const caretakerOrbitTable: DecisionTable<string> = {
  id: "dialogue.caretaker.orbit",
  hitPolicy: "FIRST",
  rules: [
    {
      id: "O4.R1",
      when: all(echo("echo.dusk.register_inspected"), echo("echo.meta.lantern_thread"), spoken("D1")),
      output: "caretaker.orbit.deep_familiar"
    },
    { id: "O4.R2", when: echo("echo.dusk.register_inspected"), output: "caretaker.orbit.register" },
    { id: "O4.R3", when: all(echo("echo.meta.lantern_thread"), spoken("D1")), output: "caretaker.orbit.lantern_familiar" },
    { id: "O4.R4", when: echo("echo.meta.lantern_thread"), output: "caretaker.orbit.lantern" },
    { id: "O4.R5", when: always, output: "caretaker.orbit.default" }
  ]
};

export const caretakerHoursTable: DecisionTable<string> = {
  id: "dialogue.caretaker.hours",
  hitPolicy: "FIRST",
  rules: [
    {
      id: "H5.R1",
      when: all(echo("echo.hours.register_sequence_seen"), echo("echo.hours.lantern_left_burning")),
      output: "caretaker.hours.fragments_and_light"
    },
    {
      id: "H5.R2",
      when: all(echo("echo.hours.register_sequence_seen"), echo("echo.hours.phone_first")),
      output: "caretaker.hours.arrival_and_signal"
    },
    {
      id: "H5.R3",
      when: all(echo("echo.hours.register_sequence_seen"), echo("echo.hours.clock_first")),
      output: "caretaker.hours.arrival_and_time"
    },
    { id: "H5.R4", when: echo("echo.hours.lantern_left_burning"), output: "caretaker.hours.light_only" },
    { id: "H5.R5", when: always, output: "caretaker.hours.default" }
  ]
};

/** What the last shot of DUSK lingers on. Actual looking beats echoes. */
export const dawnFocusTable: DecisionTable<string> = {
  id: "presentation.d4.final_shot",
  hitPolicy: "FIRST",
  rules: [
    { id: "D4.R1", when: I("D4", "object.shared.lantern"), output: "lantern" },
    { id: "D4.R2", when: I("D4", "object.caretaker.register"), output: "register" },
    { id: "D4.R3", when: I("D4", "object.shared.window"), output: "window" },
    { id: "D4.R4", when: I("D4", "object.d4.gate"), output: "gate" },
    { id: "D4.R5", when: echo("echo.meta.lantern_thread"), output: "lantern" },
    { id: "D4.R6", when: echo("echo.dusk.register_inspected"), output: "register" },
    { id: "D4.R7", when: echo("echo.dusk.window_watched"), output: "window" },
    { id: "D4.R8", when: always, output: "gate" }
  ]
};

/** Composition of the final garden. COLLECT: independent, order-free. */
export const morningStillLifeTable: DecisionTable<string> = {
  id: "presentation.afterlight.still_life",
  hitPolicy: "COLLECT",
  rules: [
    { id: "F2.R1", when: all(echo("echo.meta.lantern_thread"), not(echo("echo.hours.lantern_put_out"))), output: "lantern_set_down" },
    { id: "F2.R1b", when: echo("echo.hours.lantern_put_out"), output: "lantern_dark" },
    { id: "F2.R2", when: echo("echo.dawn.keep_memory"), output: "memory_jar" },
    { id: "F2.R3", when: echo("echo.dawn.keep_gratitude"), output: "gratitude_by_flower" },
    { id: "F2.R4", when: echo("echo.dawn.keep_lesson"), output: "lesson_mark" },
    { id: "F2.R5", when: echo("echo.dawn.release_question"), output: "drawer_sealed" },
    { id: "F2.R6", when: echo("echo.dawn.release_guilt"), output: "petals_drift" },
    { id: "F2.R7", when: echo("echo.orbit.radio_used"), output: "radio_low" },
    { id: "F2.R8", when: echo("echo.orbit.shared_object_noticed"), output: "tag_on_hook" },
    { id: "F2.R9", when: echo("echo.hours.flower_cared"), output: "flower_watered" }
  ]
};

export const decisionTables: DecisionTable<string>[] = [
  caretakerOrbitTable,
  caretakerHoursTable,
  dawnFocusTable,
  morningStillLifeTable
];
