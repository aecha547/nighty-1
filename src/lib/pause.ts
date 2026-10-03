/** A shared presentation clock; opening the menu cannot consume an unseen story beat. */
let paused = false;
let since = 0;
let total = 0;
const listeners = new Set<() => void>();
export const isPaused = () => paused;
export const activeTime = () => performance.now() - total - (paused ? performance.now() - since : 0);
export function setTimelinePaused(value: boolean) {
  if (value === paused) return;
  if (value) since = performance.now();
  else total += performance.now() - since;
  paused = value;
  listeners.forEach((fn) => fn());
}
export function storyTimeout(fn: () => void, ms: number): () => void {
  let left = ms;
  let started = activeTime();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => { clearTimeout(timer); listeners.delete(update); };
  const update = () => {
    clearTimeout(timer);
    const now = activeTime();
    left = Math.max(0, left - (now - started));
    started = now;
    if (!paused) timer = setTimeout(() => { cancel(); fn(); }, left);
  };
  listeners.add(update);
  update();
  return cancel;
}
