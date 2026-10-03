import { useSyncExternalStore } from "react";

/** A single quiet line of text at a time (inspection notes, Caretaker remarks, murmurs). */
interface Say {
  id: number;
  who: string;
  text: string;
  show: boolean;
}

let cur: Say = { id: 0, who: "", text: "", show: false };
const listeners = new Set<() => void>();
let timer = 0;
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function say(text: string, who = "", ms?: number) {
  window.clearTimeout(timer);
  cur = { id: cur.id + 1, who, text, show: true };
  emit();
  const life = ms ?? Math.max(3600, Math.min(9000, text.length * 62));
  timer = window.setTimeout(hush, life);
}

export function hush() {
  window.clearTimeout(timer);
  if (!cur.show) return;
  cur = { ...cur, show: false };
  emit();
}

export function Subtitle() {
  const s = useSyncExternalStore(subscribe, () => cur, () => cur);
  return (
    <div className={`say ${s.show ? "show" : ""}`} role="status" aria-live="polite" aria-atomic="true" aria-hidden={!s.show}>
      <div className="say-who">{s.who}</div>
      <div className="say-text">{s.text}</div>
    </div>
  );
}
