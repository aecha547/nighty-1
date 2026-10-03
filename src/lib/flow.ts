import { getState, send } from "../store/story";
import { canComplete } from "../engine";

/** Complete the current scene (if its own guard allows it) and move on. Never throws; never skips a guard. */
export function leave(sceneId: string, to: string): boolean {
  const st = getState();
  if (st.currentScene !== sceneId) return false;
  if (!st.completedScenes[sceneId]) {
    if (!canComplete(st, sceneId)) return false;
    if (send({ type: "COMPLETE_SCENE", sceneId }) === "rejected") return false;
  }
  return send({ type: "ENTER_SCENE", sceneId: to }) !== "rejected";
}

/** Complete only (used by terminal chapter scenes; the archive takes over afterwards). */
export function finish(sceneId: string): boolean {
  const st = getState();
  if (st.currentScene !== sceneId) return false;
  if (st.completedScenes[sceneId]) return true;
  return send({ type: "COMPLETE_SCENE", sceneId }) !== "rejected";
}

export const beatDone = (id: string) => getState().beats[id] === true;
export const commitBeat = (beatId: string) => send({ type: "COMMIT_BEAT", beatId });
