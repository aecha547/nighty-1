/**
 * DEV-ONLY QA affordances (loaded only when `import.meta.env.DEV` and `?dev=1`).
 *
 * Nothing here ships in a production bundle: the dynamic import in store/story.ts is
 * guarded by `import.meta.env.DEV`, so the whole module is dropped by the build.
 *
 *   __tgtk.goto("H4")   jump to the moment a scene begins, with save state intact
 *   __tgtk.audit()      measure the current scene: overflow, tap targets, dialogue overlap
 *
 * The route itself lives in ./route.ts so the test suite can prove every scene is reachable.
 */
import { ARCHIVE_TARGETS, ROUTE, buildRoute } from "./route";

interface MinimalStore {
  /** Loose on purpose: these are dynamically built event payloads. */
  send: (event: Record<string, unknown>) => string;
  resetStory: () => void;
  getState: () => { currentScene: string | null; currentChapter: string };
}

export async function buildLedger(store: MinimalStore, target: string): Promise<string[]> {
  store.resetStory();
  // Yield once so React unmounts the previous view (aborting its sequence) before the
  // new one mounts. Without this a jump back into the same scene would keep the old,
  // still-running cinematic chain alive under the new state.
  await new Promise((r) => setTimeout(r, 80));
  let n = 0;
  const rejected: string[] = [];
  for (const e of buildRoute(target)) {
    const r = store.send({ ...e, eventId: `qa${(++n).toString(36)}` });
    if (r === "rejected") rejected.push(JSON.stringify(e));
  }
  return rejected;
}

export interface AuditIssue {
  kind: string;
  detail: string;
}

export interface Audit {
  scene: string;
  viewport: { w: number; h: number };
  stage: { w: number; h: number; pannable: boolean } | null;
  pageOverflow: { x: number; y: number };
  controls: number;
  /** informational: on phones the world is wider than the window on purpose */
  offscreenByDesign: number;
  /** real problems only */
  issues: AuditIssue[];
}

/**
 * Measure the *current* view with real geometry.
 *
 * Offscreen controls are NOT failures on narrow screens: the stage is deliberately wider
 * than the window and the Firefly pans to whatever matters. What IS a failure is a control
 * that cannot be reached by panning at all, a hit area under 44px, art hidden behind the
 * dialogue bar, or content that overflows the page itself.
 */
export function auditLayout(scene: string): Audit {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const issues: AuditIssue[] = [];

  const pageOverflow = {
    x: Math.max(0, document.documentElement.scrollWidth - vw),
    y: Math.max(0, document.documentElement.scrollHeight - vh)
  };
  if (pageOverflow.x > 2) issues.push({ kind: "PAGE_OVERFLOW_X", detail: `${pageOverflow.x}px` });
  if (pageOverflow.y > 2) issues.push({ kind: "PAGE_OVERFLOW_Y", detail: `${pageOverflow.y}px` });

  const scroller = document.querySelector<HTMLElement>("[data-scroller]");
  const stageEl = scroller?.firstElementChild as HTMLElement | null;
  const stageRect = stageEl?.getBoundingClientRect() ?? null;
  const stage = stageEl && stageRect
    ? { w: Math.round(stageEl.clientWidth), h: Math.round(stageEl.clientHeight), pannable: stageEl.clientWidth - (scroller?.clientWidth ?? 0) > 4 }
    : null;

  const dialogue = document.querySelector(".convo, .say.show") as HTMLElement | null;
  const dlg = dialogue?.getBoundingClientRect() ?? null;
  const nav = document.querySelector(".world-look") as HTMLElement | null;
  const navRects = nav
    ? Array.from(nav.querySelectorAll<HTMLButtonElement>("button"))
        .filter((b) => getComputedStyle(b).display !== "none" && !b.disabled)
        .map((b) => b.getBoundingClientRect())
    : [];
  const hits = (a: DOMRect, b: DOMRect) => a.right > b.left + 2 && a.left < b.right - 2 && a.bottom > b.top + 2 && a.top < b.bottom - 2;

  const all = Array.from(document.querySelectorAll<HTMLElement>(".spot, .char, .world-look button, .chip, .btn, .book-close")).filter((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) > 0.05 && r.width > 1 && r.height > 1;
  });

  let offscreenByDesign = 0;
  for (const el of all) {
    const r = el.getBoundingClientRect();
    const label = el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 34) ?? "?";

    // Reachability: the control must live inside the stage box, or panning can never reveal it.
    if (stageRect) {
      if (r.left < stageRect.left - 2 || r.right > stageRect.right + 2) {
        issues.push({ kind: "CONTROL_OUTSIDE_STAGE", detail: `${label}` });
      }
    }

    // Touch target, measured the way a finger experiences it (.spot::before is -14px).
    const isSpot = el.classList.contains("spot") || el.classList.contains("char");
    const hit = isSpot ? 28 : 0;
    if (r.width + hit < 44 || r.height + hit < 44) {
      issues.push({ kind: "TAP_TARGET_SMALL", detail: `${label} ${Math.round(r.width)}×${Math.round(r.height)}` });
    }

    if (dlg && hits(r, dlg)) issues.push({ kind: "CONTROL_UNDER_DIALOGUE", detail: label });
    // The pan controls are a fixed overlay: on phones they must not sit on top of the world.
    if (isSpot && navRects.some((nr) => hits(r, nr))) issues.push({ kind: "CONTROL_UNDER_NAV", detail: label });

    if (r.right < 0 || r.left > vw || r.bottom < 0 || r.top > vh) offscreenByDesign++;
  }

  return { scene, viewport: { w: vw, h: vh }, stage, pageOverflow, controls: all.length, offscreenByDesign, issues };
}

export function attach(store: MinimalStore) {
  const qa = {
    route: ROUTE.map((s) => s.c),
    archiveTargets: ARCHIVE_TARGETS,
    /** Jump so that `target` is the scene that has just begun (its own timeline runs). */
    goto: (target: string) => buildLedger(store, target),
    /** Audit the current view (pass the scene id for the report). */
    audit: (scene = "?") => auditLayout(scene),
    /** True once the view has settled on `target`. */
    settled: (target: string, timeoutMs = 4000) =>
      new Promise<boolean>((resolve) => {
        const t0 = Date.now();
        const tick = () => {
          if (store.getState().currentScene === target) return resolve(true);
          if (Date.now() - t0 > timeoutMs) return resolve(false);
          setTimeout(tick, 60);
        };
        tick();
      })
  };
  (store as unknown as { qa: typeof qa }).qa = qa;
  return qa;
}

/** Short live sample; no telemetry or external transmission. DEV only. */
export function auditPerformance(ms = 8000) {
  return new Promise((resolve) => {
    const tasks: number[] = [];
    const frames: number[] = [];
    let previous = performance.now();
    let raf = 0;
    const observer = new PerformanceObserver((list) => tasks.push(...list.getEntries().map((e) => e.duration)));
    const supported = PerformanceObserver.supportedEntryTypes.includes("longtask");
    if (supported) observer.observe({type:"longtask"});
    const frame = (now: number) => {frames.push(now-previous);previous=now;raf=requestAnimationFrame(frame);};
    raf=requestAnimationFrame(frame);
    setTimeout(() => {
      cancelAnimationFrame(raf);observer.disconnect();
      resolve({sampleMs:ms,longTaskSupported:supported,longTasks:tasks.length,maxTaskMs:Math.max(0,...tasks),frames:frames.length,maxFrameGapMs:Math.max(0,...frames),domNodes:document.querySelectorAll('*').length,svgNodes:document.querySelectorAll('svg *').length});
    },ms);
  });
}
