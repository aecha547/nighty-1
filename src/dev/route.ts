/**
 * The canonical walk through the story, expressed as a pure recipe.
 *
 * This is QA/dev tooling, not story content: it exists so that a test can prove the route
 * actually reaches every scene, and so the dev scene-jump cannot silently drift out of step
 * with the engine's real completion guards. (It once did — one missing INTERACT made every
 * later scene unreachable, and mislabelled screenshots. Hence the test.)
 *
 * It is intentionally NOT imported by any production module.
 */
export interface RouteStep {
  /** the scene being completed */
  c: string;
  /** what must happen inside it first */
  e: Record<string, unknown>[];
  /** the scene entered next, or null for the final scene */
  n: string | null;
}

export const ROUTE: RouteStep[] = [
  { c: "I1", e: [], n: "I2" },
  {
    c: "I2",
    e: [
      { type: "INTERACT", objectId: "object.archive.rack" },
      { type: "PERFORM_ACTION", actionId: "action.archive.insert_dusk" }
    ],
    n: "D1"
  },
  { c: "D1", e: [{ type: "COMMIT_BEAT", beatId: "beat.d1.orientation" }], n: "D2" },
  {
    c: "D2",
    e: [
      { type: "COMMIT_BEAT", beatId: "beat.d2.a_arrives" },
      { type: "COMMIT_BEAT", beatId: "beat.d2.b_arrives" },
      { type: "COMMIT_BEAT", beatId: "beat.d2.crossing" }
    ],
    n: "D3"
  },
  {
    c: "D3",
    e: [
      { type: "COMMIT_BEAT", beatId: "beat.d3.caretaker_lantern" },
      { type: "INTERACT", objectId: "object.shared.lantern" }
    ],
    n: "D4"
  },
  {
    c: "D4",
    e: [
      { type: "COMMIT_BEAT", beatId: "beat.d4.a_departs" },
      { type: "COMMIT_BEAT", beatId: "beat.d4.b_departs" }
    ],
    n: "O1"
  },
  { c: "O1", e: [], n: "O2" },
  {
    c: "O2",
    e: [
      { type: "COMMIT_BEAT", beatId: "beat.o2.routine" },
      { type: "INTERACT", objectId: "object.shared.lantern" }
    ],
    n: "O3A"
  },
  { c: "O3A", e: [{ type: "INTERACT", objectId: "object.a.workdesk" }], n: "O3B" },
  { c: "O3B", e: [{ type: "INTERACT", objectId: "object.b.planner" }], n: "O4" },
  { c: "O4", e: [{ type: "INTERACT", objectId: "object.caretaker.register" }], n: "O5" },
  { c: "O5", e: [{ type: "COMMIT_BEAT", beatId: "beat.o5.montage_shown" }], n: "H1" },
  {
    c: "H1",
    e: [
      { type: "COMMIT_BEAT", beatId: "beat.h1.after_this" },
      { type: "INTERACT", objectId: "object.personal.phone" },
      { type: "INTERACT", objectId: "object.room.clock" }
    ],
    n: "H2"
  },
  {
    c: "H2",
    e: [
      { type: "COMMIT_BEAT", beatId: "beat.h2.contact_attempt" },
      { type: "COMMIT_BEAT", beatId: "beat.h2.b_leaves" },
      { type: "COMMIT_BEAT", beatId: "beat.h2.reverse" }
    ],
    n: "H3"
  },
  { c: "H3", e: [{ type: "INTERACT", objectId: "object.caretaker.register" }], n: "H4" },
  {
    c: "H4",
    e: [
      { type: "INTERACT", objectId: "object.shared.lantern" },
      { type: "PERFORM_ACTION", actionId: "action.hours.leave_lantern_burning" },
      { type: "PERFORM_ACTION", actionId: "action.hours.water_flower" }
    ],
    n: "H5"
  },
  { c: "H5", e: [{ type: "SPEAK_TO", characterId: "CARETAKER" }], n: "A1" },
  { c: "A1", e: [{ type: "COMMIT_BEAT", beatId: "beat.a1.arrival" }], n: "A2" },
  { c: "A2", e: [{ type: "COMMIT_BEAT", beatId: "beat.a2.ending_spoken" }], n: "A3" },
  { c: "A3", e: [{ type: "PERFORM_ACTION", actionId: "action.dawn.keep_memory" }], n: "A4" },
  { c: "A4", e: [{ type: "PERFORM_ACTION", actionId: "action.portrait.acknowledge" }], n: "A5" },
  {
    c: "A5",
    e: [
      { type: "INTERACT", objectId: "object.archive.rack" },
      { type: "PERFORM_ACTION", actionId: "action.archive.insert_afterlight" }
    ],
    n: "F1"
  },
  { c: "F1", e: [{ type: "COMMIT_BEAT", beatId: "beat.f1.voice_complete" }], n: "F2" },
  { c: "F2", e: [], n: "F3" },
  { c: "F3", e: [{ type: "INTERACT", objectId: "object.garden.flower" }], n: "F4" },
  { c: "F4", e: [], n: "F5" },
  { c: "F5", e: [], n: null }
];

/** Scenes whose view is the archive screen rather than a room. */
export const ARCHIVE_TARGETS = ["I2", "D4", "O5", "H5", "A5"] as const;

/** Every scene a jump can land on, in story order (deduplicated). */
export const ROUTE_TARGETS: string[] = ["I1", ...ROUTE.map((s) => (s.n ? s.n : s.c))];

/**
 * The events that leave `target` as the scene that has just begun — so its own
 * timeline runs from the top, exactly as it would for a first-time player.
 */
export function buildRoute(target: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const push = (e: Record<string, unknown>) => out.push(e);
  push({ type: "START_EXPERIENCE" });
  push({ type: "COMPLETE_SCENE", sceneId: "I0" });
  push({ type: "ENTER_SCENE", sceneId: "I1" });
  if (target === "I1") return out;
  if (target === "I2") {
    push({ type: "COMPLETE_SCENE", sceneId: "I1" });
    push({ type: "ENTER_SCENE", sceneId: "I2" });
    return out;
  }
  for (const step of ROUTE) {
    for (const e of step.e) push(e);
    push({ type: "COMPLETE_SCENE", sceneId: step.c });
    if (!step.n) return out;
    push({ type: "ENTER_SCENE", sceneId: step.n });
    if (step.n === target) return out;
  }
  return out;
}
