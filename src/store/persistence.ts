import { replay, validateState, type StoryEvent } from "../engine";

/** Saved ledgers, including older envelope formats, must pass the current model. */
export function decodeLedger(raw: string) {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("ledger is not an array");
  const ledger = parsed as StoryEvent[];
  const state = replay(ledger);
  const issues = validateState(state);
  if (issues.length) throw new Error(`invalid saved state: ${issues.map((i) => i.code).join(",")}`);
  return {ledger, state};
}
