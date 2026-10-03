import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/story.css";
import App from "./App";

/**
 * Cancelled cinematic sequences reject with an AbortError by design (see lib/timeline.ts).
 * Swallow exactly that, and nothing else.
 */
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason as { name?: string } | undefined;
  if (reason?.name === "AbortError") event.preventDefault();
});

/**
 * Keyboard modality, tracked explicitly.
 *
 * :focus-visible is the right default, but it depends on the browser's own input heuristic
 * and does not match for genuine Tab presses in every embedding context (verified here: a real
 * Tab focused a scene object, and :focus-visible stayed false, leaving a keyboard user with no
 * focus ring at all). Marking keyboard use ourselves guarantees a visible indicator for
 * keyboard users, and never draws a ring for anyone using a mouse, pen or finger.
 */
const KEYS = new Set(["Tab", "Enter", " ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"]);
window.addEventListener(
  "keydown",
  (event) => {
    if (KEYS.has(event.key) && document.documentElement.dataset.kb !== "1") document.documentElement.dataset.kb = "1";
  },
  true
);
for (const type of ["pointerdown", "mousedown", "touchstart"] as const) {
  window.addEventListener(type, () => delete document.documentElement.dataset.kb, true);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
