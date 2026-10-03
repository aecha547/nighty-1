import { evaluateCondition } from "./conditions";
import type { DecisionTable, StoryState } from "./types";

/**
 * FIRST   : ordered, first match wins (presentation variants). Requires a fallback.
 * UNIQUE  : exactly one rule may match (canonical transitions).
 * COLLECT : every matching rule contributes (independent echoes).
 */
export function evaluateFirst<T>(state: StoryState, table: DecisionTable<T>): T {
  const hit = table.rules.find((r) => evaluateCondition(state, r.when));
  if (!hit) throw new Error(`Decision table ${table.id} had no matching rule.`);
  return hit.output;
}

export function evaluateUnique<T>(state: StoryState, table: DecisionTable<T>): T {
  const hits = table.rules.filter((r) => evaluateCondition(state, r.when));
  if (hits.length !== 1) throw new Error(`Decision table ${table.id} expected exactly one match; got ${hits.length}.`);
  return hits[0].output;
}

export function evaluateCollect<T>(state: StoryState, table: DecisionTable<T>): T[] {
  return table.rules.filter((r) => evaluateCondition(state, r.when)).map((r) => r.output);
}
