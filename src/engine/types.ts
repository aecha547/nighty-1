/**
 * THE GARDEN THE NIGHT KEPT — story engine types.
 *
 * Truth layers:
 *   CANON_FACT      -> state.facts   (things the story may state as true)
 *   PLAYER_EVENT    -> the ledger    (what the player actually did)
 *   DERIVED_ECHO    -> state.echoes  (deterministic consequence of the above)
 *   PRESENTATION    -> never stored here (timers, DOM, audio nodes)
 */

export const SCHEMA_VERSION = 5;

export type Chapter =
  | "INTRO"
  | "DUSK"
  | "ORBIT"
  | "HOURS_BETWEEN"
  | "DAWN"
  | "AFTERLIGHT"
  | "COMPLETE";

export type CharacterId = "A" | "B" | "CARETAKER" | "GUIDE";
export type InteractionCategory = "CRITICAL" | "ECHO" | "TEXTURE" | "PLAYFUL";
export type ReloadPolicy = "RESTART_SCENE" | "RESUME_STATE" | "RESUME_AFTER_CANONICAL_EVENT";

export type Flags = Readonly<Record<string, true>>;

export type Condition =
  | { kind: "always" }
  | { kind: "echo"; id: string; expected?: boolean }
  | { kind: "fact"; id: string; expected?: boolean }
  | { kind: "beat"; id: string }
  | { kind: "sceneVisited"; id: string }
  | { kind: "sceneCompleted"; id: string }
  | { kind: "chapterCompleted"; id: Chapter }
  | { kind: "action"; id: string }
  | { kind: "spokenSite"; sceneId: string; characterId: CharacterId }
  | { kind: "interactionSite"; sceneId: string; objectId: string }
  | { kind: "sceneInteractionCountAtLeast"; sceneId: string; count: number }
  | { kind: "claimEquals"; claimId: string; value: string }
  | { kind: "all"; conditions: Condition[] }
  | { kind: "any"; conditions: Condition[] }
  | { kind: "not"; condition: Condition };

export interface ObjectDef {
  id: string;
  persistent: boolean;
  role: "STORY" | "ECHO" | "CHARACTER" | "TACTILITY" | "ARTIFACT";
}

export interface InteractionDef {
  objectId: string;
  category: InteractionCategory;
  addEchoesOnFirst?: string[];
  claimIfEmpty?: { claimId: string; value: string; echoId?: string };
}

export interface TransitionDef {
  to: string;
  guard?: Condition;
}

export interface SceneDef {
  id: string;
  chapter: Exclude<Chapter, "COMPLETE">;
  reloadPolicy: ReloadPolicy;
  characters: CharacterId[];
  interactions: InteractionDef[];
  /** one-shot canonical story beats that may be committed while in this scene */
  beats?: string[];
  completionGuard?: Condition;
  terminalChapter?: boolean;
  factsOnComplete?: string[];
  echoesOnComplete?: string[];
  speakEchoes?: Partial<Record<CharacterId, string[]>>;
  next: TransitionDef[];
}

export interface ActionDef {
  id: string;
  sceneId: string;
  oneShot: boolean;
  requires?: Condition;
  /** actions that cannot coexist with this one */
  excludes?: string[];
  addEchoes?: string[];
  objectPatches?: { objectId: string; values: Record<string, string | boolean> }[];
}

export interface DecisionRule<T> {
  id: string;
  when: Condition;
  output: T;
}

export interface DecisionTable<T> {
  id: string;
  hitPolicy: "FIRST" | "UNIQUE" | "COLLECT";
  rules: DecisionRule<T>[];
}

export interface DerivedEchoRule {
  id: string;
  when: Condition;
  add: string;
}

export interface StoryState {
  schemaVersion: number;
  started: boolean;
  currentScene: string | null;
  currentChapter: Chapter;
  visitedScenes: Flags;
  completedScenes: Flags;
  completedChapters: Flags;
  facts: Flags;
  echoes: Flags;
  beats: Flags;
  interactionSites: Flags;
  interactionCounts: Readonly<Record<string, number>>;
  siteCounts: Readonly<Record<string, number>>;
  spokenSites: Flags;
  actions: Flags;
  claims: Readonly<Record<string, string>>;
  objectStates: Readonly<Record<string, Readonly<Record<string, string | boolean>>>>;
  processedEvents: Readonly<Record<string, string>>;
}

type WithId<T> = T & { eventId: string };

export type StoryEvent =
  | WithId<{ type: "START_EXPERIENCE" }>
  | WithId<{ type: "ENTER_SCENE"; sceneId: string }>
  | WithId<{ type: "INTERACT"; objectId: string }>
  | WithId<{ type: "SPEAK_TO"; characterId: CharacterId }>
  | WithId<{ type: "PERFORM_ACTION"; actionId: string }>
  | WithId<{ type: "COMMIT_BEAT"; beatId: string }>
  | WithId<{ type: "COMPLETE_SCENE"; sceneId: string }>;

/** An event before the store has assigned an identity to it. */
export type StoryEventInput =
  | { type: "START_EXPERIENCE"; eventId?: string }
  | { type: "ENTER_SCENE"; sceneId: string; eventId?: string }
  | { type: "INTERACT"; objectId: string; eventId?: string }
  | { type: "SPEAK_TO"; characterId: CharacterId; eventId?: string }
  | { type: "PERFORM_ACTION"; actionId: string; eventId?: string }
  | { type: "COMMIT_BEAT"; beatId: string; eventId?: string }
  | { type: "COMPLETE_SCENE"; sceneId: string; eventId?: string };

export type Command =
  | { type: "SCENE_CHANGED"; sceneId: string }
  | { type: "SCENE_COMPLETED"; sceneId: string }
  | { type: "INTERACTION_ACCEPTED"; objectId: string }
  | { type: "ACTION_ACCEPTED"; actionId: string }
  | { type: "BEAT_COMMITTED"; beatId: string }
  | { type: "SAVE_REQUESTED" };

export interface DispatchResult {
  status: "APPLIED" | "DUPLICATE" | "REJECTED";
  state: StoryState;
  commands: Command[];
  reason?: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
}
