import { actions, derivedEchoRules, scenes } from "./data";
import { evaluateCondition, interactionSiteKey, spokenSiteKey } from "./conditions";
import {
  SCHEMA_VERSION,
  type Chapter,
  type Command,
  type DispatchResult,
  type StoryEvent,
  type StoryState
} from "./types";

const sceneById = new Map(scenes.map((s) => [s.id, s]));
const actionById = new Map(actions.map((a) => [a.id, a]));

export function createInitialState(): StoryState {
  return {
    schemaVersion: SCHEMA_VERSION,
    started: false,
    currentScene: null,
    currentChapter: "INTRO",
    visitedScenes: {},
    completedScenes: {},
    completedChapters: {},
    facts: {},
    echoes: {},
    beats: {},
    interactionSites: {},
    interactionCounts: {},
    siteCounts: {},
    spokenSites: {},
    actions: {},
    claims: {},
    objectStates: {},
    processedEvents: {}
  };
}

/** Order-independent serialisation so identical payloads fingerprint identically. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

type FlagMap = Readonly<Record<string, true>>;
const addFlag = (src: FlagMap, id: string): FlagMap => (src[id] === true ? src : { ...src, [id]: true });
const addFlags = (src: FlagMap, ids: readonly string[]): FlagMap => ids.reduce(addFlag, src);

const reject = (state: StoryState, reason: string): DispatchResult => ({ status: "REJECTED", state, commands: [], reason });

function applyDerivedEchoes(state: StoryState): StoryState {
  let next = state;
  for (let pass = 0; pass < derivedEchoRules.length + 2; pass++) {
    let changed = false;
    for (const rule of derivedEchoRules) {
      if (next.echoes[rule.add] === true) continue;
      if (evaluateCondition(next, rule.when)) {
        next = { ...next, echoes: addFlag(next.echoes, rule.add) };
        changed = true;
      }
    }
    if (!changed) break;
  }
  return next;
}

const chapterAfterTerminal = (c: Chapter): Chapter => (c === "AFTERLIGHT" ? "COMPLETE" : c);

function transitionAllowed(state: StoryState, from: string, to: string): boolean {
  const rule = sceneById.get(from)?.next.find((n) => n.to === to);
  if (!rule) return false;
  return rule.guard ? evaluateCondition(state, rule.guard) : true;
}

/**
 * δ : S × Event → S'   (pure; no I/O, no clock, no randomness)
 *
 * Idempotency: an eventId that has already been committed with an identical
 * payload is reported as DUPLICATE and leaves state untouched.
 */
export function dispatch(state: StoryState, event: StoryEvent): DispatchResult {
  if (!event || typeof event !== "object" || typeof event.eventId !== "string" || !event.eventId.trim())
    return reject(state, "Invalid event envelope.");
  const fields: Record<string, string | null> = {
    START_EXPERIENCE: null, ENTER_SCENE: "sceneId", COMPLETE_SCENE: "sceneId",
    INTERACT: "objectId", SPEAK_TO: "characterId", PERFORM_ACTION: "actionId", COMMIT_BEAT: "beatId"
  };
  if (!Object.prototype.hasOwnProperty.call(fields, event.type)) return reject(state, "Unknown event type.");
  const field = fields[event.type];
  if (field && (typeof (event as unknown as Record<string, unknown>)[field] !== "string" || !(event as unknown as Record<string, string>)[field].trim()))
    return reject(state, `Invalid ${field}.`);
  const fingerprint = stableStringify(event);
  const seen = state.processedEvents[event.eventId];
  if (seen !== undefined) {
    return seen === fingerprint
      ? { status: "DUPLICATE", state, commands: [], reason: "Event already committed." }
      : reject(state, `EVENT_ID_COLLISION: ${event.eventId}`);
  }
  if (!state.started && event.type !== "START_EXPERIENCE") return reject(state, "Experience has not started.");

  let next = state;
  const commands: Command[] = [];

  switch (event.type) {
    case "START_EXPERIENCE": {
      if (state.started || state.currentScene !== null) return reject(state, "Experience already started.");
      next = {
        ...state,
        started: true,
        currentScene: "I0",
        currentChapter: "INTRO",
        visitedScenes: addFlag(state.visitedScenes, "I0")
      };
      commands.push({ type: "SCENE_CHANGED", sceneId: "I0" });
      break;
    }

    case "ENTER_SCENE": {
      const current = state.currentScene;
      if (!current) return reject(state, "No current scene.");
      if (state.completedScenes[current] !== true) return reject(state, `Cannot leave ${current} before it is completed.`);
      if (!transitionAllowed(state, current, event.sceneId))
        return reject(state, `Transition ${current} -> ${event.sceneId} is not currently legal.`);
      const target = sceneById.get(event.sceneId);
      if (!target) return reject(state, `Unknown scene ${event.sceneId}.`);
      next = {
        ...state,
        currentScene: event.sceneId,
        currentChapter: target.chapter,
        visitedScenes: addFlag(state.visitedScenes, event.sceneId)
      };
      commands.push({ type: "SCENE_CHANGED", sceneId: event.sceneId });
      break;
    }

    case "INTERACT": {
      const current = state.currentScene;
      if (!current) return reject(state, "No current scene.");
      const def = sceneById.get(current);
      const interaction = def?.interactions.find((i) => i.objectId === event.objectId);
      if (!interaction) return reject(state, `${event.objectId} is not interactable in ${current}.`);

      const site = interactionSiteKey(current, event.objectId);
      const first = state.interactionSites[site] !== true;
      let echoes: FlagMap = state.echoes;
      let claims = state.claims;
      if (first && interaction.addEchoesOnFirst) echoes = addFlags(echoes, interaction.addEchoesOnFirst);
      if (first && interaction.claimIfEmpty) {
        const c = interaction.claimIfEmpty;
        if (claims[c.claimId] === undefined) {
          claims = { ...claims, [c.claimId]: c.value };
          if (c.echoId) echoes = addFlag(echoes, c.echoId);
        }
      }
      next = {
        ...state,
        echoes,
        claims,
        interactionSites: first ? addFlag(state.interactionSites, site) : state.interactionSites,
        interactionCounts: {
          ...state.interactionCounts,
          [event.objectId]: (state.interactionCounts[event.objectId] ?? 0) + 1
        },
        siteCounts: { ...state.siteCounts, [site]: (state.siteCounts[site] ?? 0) + 1 }
      };
      commands.push({ type: "INTERACTION_ACCEPTED", objectId: event.objectId });
      break;
    }

    case "SPEAK_TO": {
      const current = state.currentScene;
      if (!current) return reject(state, "No current scene.");
      const def = sceneById.get(current);
      if (!def?.characters.includes(event.characterId)) return reject(state, `${event.characterId} is not present in ${current}.`);
      const extra = def.speakEchoes?.[event.characterId];
      next = {
        ...state,
        echoes: extra ? addFlags(state.echoes, extra) : state.echoes,
        spokenSites: addFlag(state.spokenSites, spokenSiteKey(current, event.characterId))
      };
      break;
    }

    case "PERFORM_ACTION": {
      const def = actionById.get(event.actionId);
      if (!def) return reject(state, `Unknown action ${event.actionId}.`);
      if (state.currentScene !== def.sceneId)
        return reject(state, `${event.actionId} belongs to ${def.sceneId}, not ${state.currentScene}.`);
      if (def.oneShot && state.actions[event.actionId] === true) return reject(state, `${event.actionId} already performed.`);
      if (def.excludes?.some((x) => state.actions[x] === true)) return reject(state, `${event.actionId} is excluded by an earlier action.`);
      if (def.requires && !evaluateCondition(state, def.requires)) return reject(state, `Requirements not met for ${event.actionId}.`);

      let objectStates = state.objectStates;
      if (def.objectPatches) {
        const draft = { ...objectStates };
        for (const p of def.objectPatches) draft[p.objectId] = { ...(draft[p.objectId] ?? {}), ...p.values };
        objectStates = draft;
      }
      next = {
        ...state,
        actions: addFlag(state.actions, event.actionId),
        echoes: def.addEchoes ? addFlags(state.echoes, def.addEchoes) : state.echoes,
        objectStates
      };
      commands.push({ type: "ACTION_ACCEPTED", actionId: event.actionId });
      break;
    }

    case "COMMIT_BEAT": {
      const current = state.currentScene;
      if (!current) return reject(state, "No current scene.");
      const def = sceneById.get(current);
      if (!def?.beats?.includes(event.beatId)) return reject(state, `${event.beatId} is not a beat of ${current}.`);
      if (state.beats[event.beatId] === true)
        return { status: "DUPLICATE", state, commands: [], reason: `${event.beatId} already committed.` };
      next = { ...state, beats: addFlag(state.beats, event.beatId) };
      commands.push({ type: "BEAT_COMMITTED", beatId: event.beatId });
      break;
    }

    case "COMPLETE_SCENE": {
      const current = state.currentScene;
      if (current !== event.sceneId) return reject(state, `Cannot complete ${event.sceneId}; current scene is ${current}.`);
      const def = sceneById.get(event.sceneId);
      if (!def) return reject(state, `Unknown scene ${event.sceneId}.`);
      if (state.completedScenes[event.sceneId] === true) return reject(state, `${event.sceneId} already completed.`);
      if (def.completionGuard && !evaluateCondition(state, def.completionGuard))
        return reject(state, `Completion guard not satisfied for ${event.sceneId}.`);
      next = {
        ...state,
        currentChapter: def.terminalChapter ? chapterAfterTerminal(def.chapter) : state.currentChapter,
        completedScenes: addFlag(state.completedScenes, event.sceneId),
        completedChapters: def.terminalChapter ? addFlag(state.completedChapters, def.chapter) : state.completedChapters,
        facts: def.factsOnComplete ? addFlags(state.facts, def.factsOnComplete) : state.facts,
        echoes: def.echoesOnComplete ? addFlags(state.echoes, def.echoesOnComplete) : state.echoes
      };
      commands.push({ type: "SCENE_COMPLETED", sceneId: event.sceneId });
      break;
    }
  }

  next = applyDerivedEchoes(next);
  next = { ...next, processedEvents: { ...next.processedEvents, [event.eventId]: fingerprint } };
  commands.push({ type: "SAVE_REQUESTED" });
  return { status: "APPLIED", state: next, commands };
}

/** Sn = fold(δ, S0, L) */
export function replay(events: readonly StoryEvent[]): StoryState {
  let state = createInitialState();
  for (const event of events) {
    const r = dispatch(state, event);
    if (r.status === "REJECTED") throw new Error(`Replay rejected ${event.eventId} (${event.type}): ${r.reason}`);
    state = r.state;
  }
  return state;
}

export function getSceneDefinition(id: string) {
  const def = sceneById.get(id);
  if (!def) throw new Error(`Unknown scene ${id}.`);
  return def;
}
