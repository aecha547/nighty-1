import type { Condition, StoryState, ValidationIssue } from "./types";
import { actions, decisionTables, echoCatalog, objects, scenes } from "./data";

const chapterOrder: Record<string, number> = {
  INTRO: 0,
  DUSK: 1,
  ORBIT: 2,
  HOURS_BETWEEN: 3,
  DAWN: 4,
  AFTERLIGHT: 5
};

interface Refs {
  scenes: Set<string>;
  actions: Set<string>;
  echoes: Set<string>;
  beats: Set<string>;
}

function collect(c: Condition, refs: Refs) {
  switch (c.kind) {
    case "sceneVisited":
    case "sceneCompleted":
      refs.scenes.add(c.id);
      return;
    case "spokenSite":
    case "interactionSite":
    case "sceneInteractionCountAtLeast":
      refs.scenes.add(c.sceneId);
      return;
    case "action":
      refs.actions.add(c.id);
      return;
    case "echo":
      refs.echoes.add(c.id);
      return;
    case "beat":
      refs.beats.add(c.id);
      return;
    case "all":
    case "any":
      c.conditions.forEach((x) => collect(x, refs));
      return;
    case "not":
      collect(c.condition, refs);
      return;
    default:
      return;
  }
}

/** Facts may describe what happened and what the creator says — never the recipient's private mind. */
const FORBIDDEN_FACT_PATTERN = /(\bb_felt|\bb_wanted|\bb_secret|she_felt|she_wanted|she_forgave|forgiven|unloved|reunion|get_back|never_again|trust|score|rating)/i;

export function validateStaticModel(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (code: string, message: string) => issues.push({ code, message });

  const sceneIds = new Set<string>();
  const objectIds = new Set<string>();
  const actionIds = new Set<string>();
  const echoIds = new Set(echoCatalog);
  const sceneMap = new Map(scenes.map((s) => [s.id, s]));
  const allBeats = new Set<string>();

  for (const s of scenes) {
    if (sceneIds.has(s.id)) push("DUPLICATE_SCENE", s.id);
    sceneIds.add(s.id);
    s.beats?.forEach((b) => {
      if (allBeats.has(b)) push("DUPLICATE_BEAT", b);
      allBeats.add(b);
    });
  }
  for (const ob of objects) {
    if (objectIds.has(ob.id)) push("DUPLICATE_OBJECT", ob.id);
    objectIds.add(ob.id);
  }
  if (echoIds.size !== echoCatalog.length) push("DUPLICATE_ECHO", "echoCatalog contains duplicates");

  for (const a of actions) {
    if (actionIds.has(a.id)) push("DUPLICATE_ACTION", a.id);
    actionIds.add(a.id);
    if (!sceneIds.has(a.sceneId)) push("ACTION_UNKNOWN_SCENE", `${a.id} -> ${a.sceneId}`);
    a.excludes?.forEach((x) => {
      if (!actions.some((y) => y.id === x)) push("ACTION_UNKNOWN_EXCLUDE", `${a.id} excludes ${x}`);
    });
    a.addEchoes?.forEach((e) => {
      if (!echoIds.has(e)) push("UNKNOWN_ECHO", `${a.id} adds ${e}`);
    });
    // I7: AFTERLIGHT contains no decisions.
    if (sceneMap.get(a.sceneId)?.chapter === "AFTERLIGHT") push("AFTERLIGHT_HAS_ACTION", a.id);
  }

  const refs: Refs = { scenes: new Set(), actions: new Set(), echoes: new Set(), beats: new Set() };

  for (const s of scenes) {
    for (const t of s.next) {
      const target = sceneMap.get(t.to);
      if (!target) {
        push("UNKNOWN_TRANSITION_TARGET", `${s.id} -> ${t.to}`);
        continue;
      }
      const from = chapterOrder[s.chapter];
      const to = chapterOrder[target.chapter];
      if (to < from || to > from + 1) push("ILLEGAL_CHAPTER_JUMP", `${s.id} -> ${target.id}`);
      if (t.guard) collect(t.guard, refs);
    }
    for (const i of s.interactions) {
      if (!objectIds.has(i.objectId)) push("UNKNOWN_OBJECT", `${s.id} -> ${i.objectId}`);
      i.addEchoesOnFirst?.forEach((e) => {
        if (!echoIds.has(e)) push("UNKNOWN_ECHO", `${s.id}/${i.objectId} adds ${e}`);
      });
      if (i.claimIfEmpty?.echoId && !echoIds.has(i.claimIfEmpty.echoId))
        push("UNKNOWN_ECHO", `${s.id}/${i.objectId} claim echo ${i.claimIfEmpty.echoId}`);
    }
    s.echoesOnComplete?.forEach((e) => {
      if (!echoIds.has(e)) push("UNKNOWN_ECHO", `${s.id} completes with ${e}`);
    });
    Object.values(s.speakEchoes ?? {}).forEach((list) =>
      list?.forEach((e) => {
        if (!echoIds.has(e)) push("UNKNOWN_ECHO", `${s.id} speak adds ${e}`);
      })
    );
    s.factsOnComplete?.forEach((f) => {
      if (FORBIDDEN_FACT_PATTERN.test(f)) push("FORBIDDEN_FACT", `${s.id}: ${f}`);
    });
    if (s.completionGuard) collect(s.completionGuard, refs);
    if (s.id !== "F5" && s.next.length === 0) push("ACCIDENTAL_DEAD_END", s.id);
    if (s.terminalChapter && s.next.length > 1) push("TERMINAL_HAS_MULTIPLE_EXITS", s.id);
    // I7: AFTERLIGHT has no branching: every scene has at most one exit.
    if (s.chapter === "AFTERLIGHT" && s.next.length > 1) push("AFTERLIGHT_BRANCHES", s.id);
  }

  for (const t of decisionTables) {
    t.rules.forEach((r) => collect(r.when, refs));
    if (t.hitPolicy === "FIRST" && t.rules.at(-1)?.when.kind !== "always") push("FIRST_TABLE_NO_FALLBACK", t.id);
    const ids = new Set<string>();
    t.rules.forEach((r) => {
      if (ids.has(r.id)) push("DUPLICATE_RULE", `${t.id}/${r.id}`);
      ids.add(r.id);
    });
  }

  refs.scenes.forEach((id) => !sceneIds.has(id) && push("GUARD_UNKNOWN_SCENE", id));
  refs.actions.forEach((id) => !actionIds.has(id) && push("GUARD_UNKNOWN_ACTION", id));
  refs.echoes.forEach((id) => !echoIds.has(id) && push("GUARD_UNKNOWN_ECHO", id));
  refs.beats.forEach((id) => !allBeats.has(id) && push("GUARD_UNKNOWN_BEAT", id));

  // I1: the only way into AFTERLIGHT is A5.
  const incoming = scenes.filter((s) => s.next.some((n) => n.to === "F1")).map((s) => s.id);
  if (incoming.length !== 1 || incoming[0] !== "A5") push("AFTERLIGHT_ENTRY_NOT_UNIQUE", incoming.join(","));
  // I2: the only way into the portrait is A3, and it is fact-guarded.
  const toPortrait = scenes.filter((s) => s.next.some((n) => n.to === "A4"));
  if (toPortrait.length !== 1 || toPortrait[0].id !== "A3" || !toPortrait[0].next.find((n) => n.to === "A4")?.guard)
    push("PORTRAIT_ENTRY_UNGUARDED", toPortrait.map((s) => s.id).join(","));

  // reachability (ignoring guards) from I0 + every chapter has a path to its terminal scene
  const reachable = new Set<string>(["I0"]);
  for (let changed = true; changed; ) {
    changed = false;
    for (const s of scenes)
      if (reachable.has(s.id))
        for (const t of s.next)
          if (!reachable.has(t.to)) {
            reachable.add(t.to);
            changed = true;
          }
  }
  for (const s of scenes) if (!reachable.has(s.id)) push("UNREACHABLE_SCENE", s.id);
  const reaches = (from: string, goal: string, seen = new Set<string>()): boolean => {
    if (from === goal) return true;
    if (seen.has(from)) return false;
    seen.add(from);
    return (sceneMap.get(from)?.next ?? []).some((n) => reaches(n.to, goal, seen));
  };
  for (const s of scenes) if (!reaches(s.id, "F5")) push("NO_PATH_TO_END", s.id);

  return issues;
}

export function validateState(state: StoryState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const cur = scenes.find((s) => s.id === state.currentScene);
  if (state.started && !cur) issues.push({ code: "UNKNOWN_CURRENT_SCENE", message: String(state.currentScene) });
  if (cur && state.currentChapter !== "COMPLETE" && cur.chapter !== state.currentChapter && !state.completedScenes[cur.id]) {
    issues.push({ code: "SCENE_CHAPTER_MISMATCH", message: `${cur.id} is ${cur.chapter}, state says ${state.currentChapter}` });
  }
  const inAfterlight = cur?.chapter === "AFTERLIGHT" || state.completedChapters["AFTERLIGHT"] === true;
  if (inAfterlight) {
    if (state.facts["fact.mutual_ending_established"] !== true) issues.push({ code: "AFTERLIGHT_WITHOUT_MUTUAL_ENDING", message: "I1" });
    if (state.facts["fact.afterlight_unlocked"] !== true) issues.push({ code: "AFTERLIGHT_WITHOUT_UNLOCK", message: "I1" });
    if (state.completedChapters["DAWN"] !== true) issues.push({ code: "AFTERLIGHT_WITHOUT_DAWN", message: "I1" });
  }
  if (state.visitedScenes["A4"] === true && state.facts["fact.mutual_ending_established"] !== true)
    issues.push({ code: "PORTRAIT_BEFORE_ENDING", message: "I2" });
  if (state.echoes["echo.hours.phone_first"] === true && state.echoes["echo.hours.clock_first"] === true)
    issues.push({ code: "MULTIPLE_H1_FIRST_FOCUS", message: "claims" });
  if (state.actions["action.hours.leave_lantern_burning"] === true && state.actions["action.hours.dim_lantern"] === true)
    issues.push({ code: "EXCLUSIVE_ACTIONS_BOTH_PERFORMED", message: "lantern" });
  if (state.facts["fact.experience_completed"] === true && state.completedChapters["AFTERLIGHT"] !== true)
    issues.push({ code: "COMPLETE_WITHOUT_AFTERLIGHT", message: "end" });
  return issues;
}
