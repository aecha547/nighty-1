import type { Condition, StoryState } from "./types";

export const interactionSiteKey = (sceneId: string, objectId: string) => `${sceneId}::${objectId}`;
export const spokenSiteKey = (sceneId: string, characterId: string) => `${sceneId}::${characterId}`;

// ---- composable guards (pure builders) -------------------------------------
export const always: Condition = { kind: "always" };
export const all = (...conditions: Condition[]): Condition => ({ kind: "all", conditions });
export const any = (...conditions: Condition[]): Condition => ({ kind: "any", conditions });
export const not = (condition: Condition): Condition => ({ kind: "not", condition });
export const echo = (id: string): Condition => ({ kind: "echo", id });
export const fact = (id: string): Condition => ({ kind: "fact", id });
export const beat = (id: string): Condition => ({ kind: "beat", id });
export const completed = (id: string): Condition => ({ kind: "sceneCompleted", id });
export const action = (id: string): Condition => ({ kind: "action", id });
export const spoken = (sceneId: string, characterId: "CARETAKER" | "A" | "B" = "CARETAKER"): Condition => ({
  kind: "spokenSite",
  sceneId,
  characterId
});
export const inspected = (sceneId: string, objectId: string): Condition => ({
  kind: "interactionSite",
  sceneId,
  objectId
});

export function evaluateCondition(state: StoryState, c: Condition): boolean {
  switch (c.kind) {
    case "always":
      return true;
    case "echo":
      return (state.echoes[c.id] === true) === (c.expected ?? true);
    case "fact":
      return (state.facts[c.id] === true) === (c.expected ?? true);
    case "beat":
      return state.beats[c.id] === true;
    case "sceneVisited":
      return state.visitedScenes[c.id] === true;
    case "sceneCompleted":
      return state.completedScenes[c.id] === true;
    case "chapterCompleted":
      return state.completedChapters[c.id] === true;
    case "action":
      return state.actions[c.id] === true;
    case "spokenSite":
      return state.spokenSites[spokenSiteKey(c.sceneId, c.characterId)] === true;
    case "interactionSite":
      return state.interactionSites[interactionSiteKey(c.sceneId, c.objectId)] === true;
    case "sceneInteractionCountAtLeast": {
      const prefix = `${c.sceneId}::`;
      let n = 0;
      for (const key of Object.keys(state.interactionSites)) if (key.startsWith(prefix)) n += 1;
      return n >= c.count;
    }
    case "claimEquals":
      return state.claims[c.claimId] === c.value;
    case "all":
      return c.conditions.every((x) => evaluateCondition(state, x));
    case "any":
      return c.conditions.some((x) => evaluateCondition(state, x));
    case "not":
      return !evaluateCondition(state, c.condition);
  }
}
