import { getSceneDefinition, type StoryState } from "../engine";
import type { Tier } from "./Stage";

/**
 * Presentation-only navigation guidance. It READS the engine; it never writes story state.
 *
 * Conceptual tiers:
 *   REQUIRED  – an object the scene's real completion guard is still waiting on (right now)
 *   STORY     – engine category CRITICAL / ECHO that is not currently blocking (may drift, glint)
 *   OPTIONAL  – texture / playful: responds to hover and focus only
 *
 * The engine's `CRITICAL` label is NOT "must click to proceed". Requirements below mirror the
 * actual guards in engine/data.ts, expressed as "what is still unmet, in the order to attend to it".
 */
export interface GuidePlan {
  /** unmet requirements, in the order the Firefly should consider them (any-of lists: first wins) */
  targets: string[];
  /** a single, gentle, in-world nudge — never an objective */
  hint: string;
  /** seconds of undisturbed discovery before the Firefly visits */
  visitAfter: number;
  /** seconds after the visit before the one contextual hint */
  hintAfter: number;
}

const FREE = 11; // 10–12 s of free discovery
const LATER = 15;

const seen = (s: StoryState, scene: string, object: string) => s.interactionSites[`${scene}::${object}`] === true;

export function guidePlan(scene: string, s: StoryState): GuidePlan | null {
  switch (scene) {
    case "D3":
      return seen(s, scene, "object.shared.lantern")
        ? null
        : {
            targets: ["object.shared.lantern"],
            hint: "The path loses its lamps here. Something on the hook still holds a light.",
            visitAfter: FREE,
            hintAfter: LATER
          };
    case "O2":
      return seen(s, scene, "object.personal.phone") || seen(s, scene, "object.shared.lantern") || seen(s, scene, "object.shared.small")
        ? null
        : {
            targets: ["object.shared.lantern", "object.personal.phone", "object.shared.small"],
            hint: "A few small things in this room get used every day.",
            visitAfter: FREE,
            hintAfter: LATER
          };
    case "O3A":
      return seen(s, scene, "object.a.workdesk")
        ? null
        : { targets: ["object.a.workdesk"], hint: "The desk is where most of the evening went.", visitAfter: FREE, hintAfter: LATER };
    case "O3B":
      return seen(s, scene, "object.b.planner")
        ? null
        : { targets: ["object.b.planner"], hint: "A planner lies open near the middle of the table.", visitAfter: FREE, hintAfter: LATER };
    case "O4":
      return seen(s, scene, "object.caretaker.register") || s.spokenSites["O4::CARETAKER"] === true
        ? null
        : { targets: ["object.caretaker.register"], hint: "The Caretaker glances at the book, then at you.", visitAfter: FREE, hintAfter: LATER };
    case "H1": {
      const phone = !seen(s, scene, "object.personal.phone");
      const clock = !seen(s, scene, "object.room.clock");
      if (!phone && !clock) return null;
      const targets = [...(phone ? ["object.personal.phone"] : []), ...(clock ? ["object.room.clock"] : [])];
      const hint =
        phone && clock
          ? "Two things in this room are keeping time. One is on the wall."
          : clock
            ? "The clock on the wall is louder than it was a minute ago."
            : "The phone has been waiting a while.";
      return { targets, hint, visitAfter: FREE, hintAfter: LATER };
    }
    case "H3":
      return seen(s, scene, "object.caretaker.register")
        ? null
        : { targets: ["object.caretaker.register"], hint: "The Caretaker nods toward the open book.", visitAfter: FREE, hintAfter: LATER };
    case "H4":
      // Many objects, one real requirement. The room is quiet, so help sooner and more clearly.
      return seen(s, scene, "object.personal.phone") || seen(s, scene, "object.shared.lantern") || seen(s, scene, "object.garden.flower")
        ? null
        : {
            targets: ["object.shared.lantern", "object.garden.flower", "object.personal.phone"],
            hint: "The room is quieter than it should be. One thing in it is still lit.",
            visitAfter: 8,
            hintAfter: 13
          };
    default:
      return null;
  }
}

/** Which tier an object has in this scene, right now. */
export function tierOf(scene: string, object: string, s: StoryState): Tier {
  const plan = guidePlan(scene, s);
  if (plan?.targets.includes(object)) return "required";
  try {
    const cat = getSceneDefinition(scene).interactions.find((i) => i.objectId === object)?.category;
    if (cat === "CRITICAL" || cat === "ECHO") return "story";
  } catch {
    /* unknown scene */
  }
  return "optional";
}
