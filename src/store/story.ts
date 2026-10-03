import { useSyncExternalStore } from "react";
import {
  createInitialState,
  dispatch,
  type StoryEvent,
  type StoryEventInput,
  type StoryState
} from "../engine";
import { decodeLedger } from "./persistence";

const SAVE_KEY = "tgtk:v1:ledger";
const CORRUPT_KEY = "tgtk:v1:ledger:corrupt";

type Listener = () => void;
const listeners = new Set<Listener>();

function load(): { ledger: StoryEvent[]; state: StoryState } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ledger: [], state: createInitialState() };
    return decodeLedger(raw);
  } catch (err) {
    // T9: invalid saved data fails validation rather than silently corrupting state.
    console.warn("[tgtk] Save could not be restored; starting clean.", err);
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) localStorage.setItem(CORRUPT_KEY, raw);
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
    return { ledger: [], state: createInitialState() };
  }
}

let { ledger, state } = load();

function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(ledger));
  } catch (err) {
    console.warn("[tgtk] Save failed", err);
  }
}
const emit = () => listeners.forEach((l) => l());

export const getState = () => state;
export const getLedger = () => ledger;
export const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useStory = () => useSyncExternalStore(subscribe, getState, getState);

let counter = 0;
const newId = (type: string) =>
  `${type.toLowerCase()}-${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Touch + click (or a stuttering double click) must never count twice. */
const recent = new Map<string, number>();
const DEBOUNCE_MS = 260;

export type SendOutcome = "applied" | "duplicate" | "rejected";

export function send(input: StoryEventInput): SendOutcome {
  const { eventId: given, ...payload } = input;
  const key = JSON.stringify(payload);
  const now = performance.now();
  const prev = recent.get(key);
  if (!given && prev !== undefined && now - prev < DEBOUNCE_MS && payload.type !== "COMMIT_BEAT") return "duplicate";
  recent.set(key, now);

  const event = { ...payload, eventId: given ?? newId(payload.type) } as StoryEvent;
  const result = dispatch(state, event);
  if (result.status === "APPLIED") {
    ledger = [...ledger, event];
    state = result.state;
    persist();
    emit();
    return "applied";
  }
  if (result.status === "REJECTED" && import.meta.env.DEV) console.debug("[tgtk] rejected", event, result.reason);
  return result.status === "DUPLICATE" ? "duplicate" : "rejected";
}

export function resetStory() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
  ledger = [];
  state = createInitialState();
  recent.clear();
  emit();
}

export function exportLedger(): string {
  return JSON.stringify(ledger, null, 2);
}

/**
 * Dev-only: expose the store for debugging / automated playthroughs.
 * The QA module (route jumps + layout audit) is imported dynamically so that the whole
 * thing is dropped from a production build.
 */
if (import.meta.env.DEV && typeof window !== "undefined" && new URLSearchParams(location.search).get("dev") === "1") {
  const api = { getState, getLedger, send, resetStory, exportLedger, qa: null as unknown };
  (window as unknown as { __tgtk: unknown }).__tgtk = api;
  void import("../dev/qa").then((m) => m.attach(api as unknown as Parameters<typeof m.attach>[0]));
}
