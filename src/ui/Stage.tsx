import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ObjectArt, type ObjectArtProps } from "../art/Objects";
import { FigureA, FigureB } from "../art/Figures";

export type Pal = "dusk" | "night" | "cold" | "dawn" | "morning";
/** [x, y, w, h] in stage units (the stage is 1600 × 1000). */
export type Box = readonly [number, number, number, number];
/** REQUIRED = currently blocks progress · STORY = important, optional · OPTIONAL = texture / playful */
export type Tier = "required" | "story" | "optional";

export const pos = (b: Box): CSSProperties => ({
  left: `${(b[0] / 1600) * 100}%`,
  top: `${(b[1] / 1000) * 100}%`,
  width: `${(b[2] / 1600) * 100}%`,
  height: `${(b[3] / 1000) * 100}%`
});

export interface Frame {
  x: number;
  y: number;
  scale: number;
}

/* ---- camera onboarding: "swipe to explore" is taught once, then goes quiet ---- */
let lookLearned = (() => {
  try {
    return sessionStorage.getItem("tgtk:look") === "1";
  } catch {
    return false;
  }
})();
let lastProgrammatic = 0;
/** Camera moves the story makes itself must not count as the player having learned to look around. */
export const markProgrammatic = () => {
  lastProgrammatic = performance.now();
};
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A fixed 16:10 stage scaled to *cover* the viewport. On a wide screen it is cropped a little
 * top/bottom; on a portrait phone it becomes a horizontally pannable world with large objects.
 */
export function Stage({
  pal,
  children,
  focus = 50,
  focusAt,
  frame = null,
  frameSeconds = 5,
  className = ""
}: {
  pal: Pal;
  children: ReactNode;
  focus?: number;
  /** Initial/resized framing in world units; later story moves may still pan smoothly. */
  focusAt?: number;
  frame?: Frame | null;
  frameSeconds?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const baseline = useRef(0);
  const point = useRef(focusAt);
  point.current = focusAt;
  const [edges, setEdges] = useState({ left: false, right: false });
  const [learned, setLearned] = useState(lookLearned);
  const [hintOn, setHintOn] = useState(!lookLearned);

  const learn = () => {
    if (lookLearned) return;
    lookLearned = true;
    try {
      sessionStorage.setItem("tgtk:look", "1");
    } catch {
      /* ignore */
    }
    setLearned(true);
    setHintOn(false);
  };

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // SVG light halos can overflow the world: do not mistake them for extra geography.
    const range = () => Math.max(0, (el.firstElementChild?.clientWidth ?? 0) - el.clientWidth);
    const measure = () => setEdges({ left: range() > 4 && el.scrollLeft > 4, right: el.scrollLeft < range() - 4 });
    const align = () => {
      markProgrammatic();
      el.scrollLeft = point.current === undefined ? (range() * focus) / 100 :
        Math.max(0, Math.min(range(), point.current / 1600 * (el.firstElementChild?.clientWidth ?? 0) - el.clientWidth / 2));
      baseline.current = el.scrollLeft;
      measure();
    };
    const onScroll = () => {
      measure();
      // A real drag or swipe, well after any camera move of our own, shows the player understands.
      if (performance.now() - lastProgrammatic > 1500 && Math.abs(el.scrollLeft - baseline.current) > 48) learn();
    };
    align();
    el.addEventListener("scroll", onScroll, { passive: true });
    const resize = new ResizeObserver(align);
    resize.observe(el);
    // Even if nobody swipes, the explanation does not linger.
    const t = window.setTimeout(() => setHintOn(false), 9000);
    return () => {
      el.removeEventListener("scroll", onScroll);
      resize.disconnect();
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  const look = (direction: number) => {
    const el = ref.current;
    if (!el) return;
    learn();
    markProgrammatic();
    const range = Math.max(0, (el.firstElementChild?.clientWidth ?? 0) - el.clientWidth);
    el.scrollTo({ left: Math.max(0, Math.min(range, el.scrollLeft + direction * el.clientWidth * 0.68)), behavior: reduced() ? "instant" : "smooth" });
  };
  const style: CSSProperties = frame
    ? { transformOrigin: `${(frame.x / 1600) * 100}% ${(frame.y / 1000) * 100}%`, transform: `scale(${frame.scale})`, transition: `transform ${frameSeconds}s cubic-bezier(.3,.1,.2,1), background 2.4s ease` }
    : { transformOrigin: "50% 50%", transform: "scale(1)", transition: `transform ${frameSeconds}s cubic-bezier(.3,.1,.2,1), background 2.4s ease` };
  const any = edges.left || edges.right;
  return (
    <>
      <div
        className="scroller"
        ref={ref}
        data-pal={pal}
        data-scroller
        onFocusCapture={(event) => {
          const target = event.target as HTMLElement;
          if (target.matches("button")) {
            markProgrammatic();
            target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
          }
        }}
      >
        <div className={`stage ${className}`} data-pal={pal} style={style}>
          {children}
        </div>
      </div>
      {/* the world continues: a faint falloff on the side where there is more to see */}
      <i className={`world-edge l ${edges.left ? "on" : ""}`} aria-hidden />
      <i className={`world-edge r ${edges.right ? "on" : ""}`} aria-hidden />
      {any && (
        <nav className={`world-look ${learned ? "learned" : ""}`} aria-label="look around the scene">
          <button type="button" disabled={!edges.left} onClick={() => look(-1)} aria-label="look left">
            <span aria-hidden>←</span>
            <span className="word" aria-hidden> look left</span>
          </button>
          <span className={`swipe-hint ${hintOn && !learned ? "on" : ""}`} aria-hidden="true">swipe to explore</span>
          <button type="button" disabled={!edges.right} onClick={() => look(1)} aria-label="look right">
            <span className="word" aria-hidden>look right </span>
            <span aria-hidden>→</span>
          </button>
        </nav>
      )}
    </>
  );
}

/** Smoothly bring a stage-unit x coordinate to the centre of the viewport (no-op if nothing to pan). */
export function panTo(xUnits: number) {
  const el = document.querySelector<HTMLElement>("[data-scroller]");
  if (!el) return;
  const stage = el.firstElementChild as HTMLElement | null;
  if (!stage) return;
  markProgrammatic();
  const target = (xUnits / 1600) * stage.clientWidth - el.clientWidth / 2;
  el.scrollTo({ left: Math.max(0, Math.min(stage.clientWidth - el.clientWidth, target)), behavior: reduced() ? "instant" : "smooth" });
}

/** Pan only if the point is off screen (phones). Used when the Firefly visits something out of view. */
export function panIntoView(xUnits: number) {
  const el = document.querySelector<HTMLElement>("[data-scroller]");
  const stage = el?.firstElementChild as HTMLElement | null;
  if (!el || !stage) return;
  const px = (xUnits / 1600) * stage.clientWidth;
  const margin = el.clientWidth * 0.18;
  if (px < el.scrollLeft + margin || px > el.scrollLeft + el.clientWidth - margin) panTo(xUnits);
}

export function At({ box, children, className = "", style }: { box: Box; children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`at ${className}`} style={{ ...pos(box), ...style }}>
      {children}
    </div>
  );
}

export function Spot({
  box,
  kind,
  label,
  seen = false,
  art,
  onUse,
  delay = 0,
  className = "",
  tier = "optional",
  guided = false
}: {
  box: Box;
  kind: ObjectArtProps["kind"];
  label: string;
  seen?: boolean;
  art?: Partial<ObjectArtProps>;
  onUse: () => void;
  delay?: number;
  className?: string;
  tier?: Tier;
  /** the Firefly is attending to this object right now */
  guided?: boolean;
}) {
  return (
    <button
      type="button"
      className={`spot tier-${tier} ${seen ? "seen" : ""} ${guided ? "guided" : ""} ${className}`}
      style={{ ...pos(box), ["--gd" as string]: `${delay}s` } as CSSProperties}
      aria-label={label}
      onClick={onUse}
    >
      <ObjectArt kind={kind} {...art} />
      {tier !== "optional" && <i className="gleam" aria-hidden />}
      {guided && <i className="attend" aria-hidden />}
    </button>
  );
}

/** Tiny far-off figure drifting across the background: the world is already happening. */
export function DistantFigure({ who, box, seconds = 46, delay = 0, reverse = false }: { who: "a" | "b"; box: Box; seconds?: number; delay?: number; reverse?: boolean }) {
  return (
    <At box={box} className="distant" style={{ ["--dd" as string]: `${seconds}s`, animationDelay: `${delay}s`, animationDirection: reverse ? "reverse" : "normal" } as CSSProperties}>
      {who === "a" ? <FigureA /> : <FigureB />}
    </At>
  );
}

export function SceneTitle({ kicker, title, whisper }: { kicker: string; title: string; whisper?: string }) {
  return (
    <div className="title-block" aria-hidden="true">
      <div className="title-kicker">{kicker}</div>
      <h1 className="title-main">{title}</h1>
      {whisper && <div className="title-whisper">{whisper}</div>}
    </div>
  );
}
