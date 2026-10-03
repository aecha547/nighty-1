import { caretakerHoursTable, caretakerOrbitTable, dawnFocusTable, morningStillLifeTable, scenes } from "./data";
import { evaluateCondition } from "./conditions";
import { evaluateCollect, evaluateFirst } from "./decisionTables";
import type { StoryState } from "./types";

export const selectCaretakerOrbitVariant = (s: StoryState) => evaluateFirst(s, caretakerOrbitTable);
export const selectCaretakerHoursVariant = (s: StoryState) => evaluateFirst(s, caretakerHoursTable);
export const selectDuskFinalShot = (s: StoryState) => evaluateFirst(s, dawnFocusTable);
export const selectMorningStillLife = (s: StoryState) => evaluateCollect(s, morningStillLifeTable);

interface MontageCandidate {
  id: string;
  eligible: (s: StoryState) => boolean;
  priority: number;
}

/** Deterministic priority table: what the player actually noticed is foregrounded. */
const montageCandidates: MontageCandidate[] = [
  { id: "lantern", eligible: (s) => s.echoes["echo.meta.lantern_thread"] === true, priority: 100 },
  { id: "flower", eligible: (s) => s.echoes["echo.orbit.flower_noticed"] === true, priority: 95 },
  { id: "register", eligible: (s) => s.echoes["echo.dusk.register_inspected"] === true, priority: 90 },
  { id: "phone", eligible: (s) => s.echoes["echo.orbit.phone_inspected"] === true, priority: 85 },
  { id: "small", eligible: (s) => s.echoes["echo.orbit.shared_object_noticed"] === true, priority: 80 },
  { id: "workdesk", eligible: (s) => s.echoes["echo.orbit.a_work_pattern_seen"] === true, priority: 70 },
  { id: "planner", eligible: (s) => s.echoes["echo.orbit.b_independent_life_seen"] === true, priority: 70 },
  { id: "radio", eligible: (s) => s.echoes["echo.orbit.radio_used"] === true, priority: 40 },
  { id: "window", eligible: (s) => s.echoes["echo.dusk.window_watched"] === true, priority: 35 }
];

/** Fallback stars so that quiet routes still receive a full, dignified sky. */
const quietStars = ["flower", "lantern", "window", "register", "small"];

export function selectOrbitMontage(state: StoryState, limit = 5, minimum = 3): { id: string; noticed: boolean }[] {
  const noticed = montageCandidates
    .filter((c) => c.eligible(state))
    .sort((a, b) => (b.priority !== a.priority ? b.priority - a.priority : a.id.localeCompare(b.id)))
    .slice(0, limit)
    .map((c) => ({ id: c.id, noticed: true }));
  const out = [...noticed];
  for (const id of quietStars) {
    if (out.length >= minimum) break;
    if (!out.some((x) => x.id === id)) out.push({ id, noticed: false });
  }
  return out;
}

/* ------------------------- archive / tape rack -------------------------- */
export interface ArchiveView {
  /** index 0..4 of the tape that can be inserted right now, or null */
  next: number | null;
  /** tapes that have been fully watched */
  watched: boolean[];
  /** tape V label is readable only once DAWN's own story is done */
  tapeVReadable: boolean;
}

export function isArchiveMoment(s: StoryState): boolean {
  const c = s.currentScene;
  if (!c) return false;
  const done = (id: string) => s.completedScenes[id] === true;
  if (c === "I2") return !done("I2");
  if (c === "D4" || c === "O5" || c === "H5") return done(c);
  if (c === "A5") return !done("A5");
  return false;
}

export function selectArchive(s: StoryState): ArchiveView {
  const watched = [
    s.completedChapters["DUSK"] === true,
    s.completedChapters["ORBIT"] === true,
    s.completedChapters["HOURS_BETWEEN"] === true,
    s.completedChapters["DAWN"] === true,
    s.completedChapters["AFTERLIGHT"] === true
  ];
  let next: number | null = null;
  switch (s.currentScene) {
    case "I2":
      next = s.completedScenes["I2"] ? null : 0;
      break;
    case "D4":
      next = s.completedScenes["D4"] ? 1 : null;
      break;
    case "O5":
      next = s.completedScenes["O5"] ? 2 : null;
      break;
    case "H5":
      next = s.completedScenes["H5"] ? 3 : null;
      break;
    case "A5":
      next = s.completedScenes["A5"] ? null : 4;
      break;
  }
  return { next, watched, tapeVReadable: s.currentScene === "A5" || s.facts["fact.afterlight_unlocked"] === true };
}

/** Can this scene be completed right now (or already has been)? Used to decide when exits are ready. */
export function canComplete(state: StoryState, sceneId: string): boolean {
  if (state.completedScenes[sceneId] === true) return true;
  const def = scenes.find((s) => s.id === sceneId);
  if (!def) return false;
  return !def.completionGuard || evaluateCondition(state, def.completionGuard);
}
