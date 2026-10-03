import type { CSSProperties } from "react";

/**
 * Symbolic silhouettes. They are deliberately not literal portraits of anyone.
 * No leg animation: figures glide and sway (the old procedural walkers are gone).
 */
const rim = "var(--fig-rim, rgba(230,215,185,.28))";

export function Caretaker({ lamp = false, style, className = "" }: { lamp?: boolean; style?: CSSProperties; className?: string }) {
  return (
    <svg viewBox="0 0 120 270" className={`fig fig-caretaker ${className}`} style={style} aria-hidden>
      <defs>
        <radialGradient id="caretakerGlow">
          <stop offset="0" stopColor="#f7d58f" stopOpacity=".9" />
          <stop offset="35%" stopColor="#e5b45f" stopOpacity=".55" />
          <stop offset="100%" stopColor="#e5b45f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="caretakerShadow">
          <stop offset="0" stopColor="rgba(0,0,0,.55)" />
          <stop offset="70%" stopColor="rgba(0,0,0,.25)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="58" cy="262" rx="42" ry="8" fill="url(#caretakerShadow)" />
      <path d="M30 262 L36 118 Q58 104 80 118 L88 262 Z" fill="#202328" stroke={rim} strokeWidth="1.2" />
      <path d="M44 120 Q58 138 74 120" fill="none" stroke={rim} strokeWidth="1" />
      <path d="M36 122 L26 190 L34 192 L44 140" fill="#1b1d21" stroke={rim} strokeWidth=".8" />
      <circle cx="58" cy="94" r="15" fill="#3a332d" />
      <path d="M40 90 Q58 64 77 90 L75 85 Q58 72 42 85 Z" fill="#17191c" />
      <path d="M38 91 H80" stroke="#17191c" strokeWidth="4" strokeLinecap="round" />
      {lamp && (
        <g>
          <line x1="86" y1="150" x2="86" y2="236" stroke="#3b3733" strokeWidth="2.5" />
          <rect x="79" y="132" width="14" height="20" rx="2" fill="#2a2620" stroke="var(--glow,#e0b56d)" strokeWidth="1" />
          <circle cx="86" cy="142" r="34" fill="url(#caretakerGlow)" opacity=".75" className="glow-pulse" />
          <ellipse cx="86" cy="142" rx="2.5" ry="4.5" fill="#fff5d9" />
        </g>
      )}
    </svg>
  );
}

/** A — quietly attentive. Slight forward lean, a warm scarf. */
export function FigureA({
  pose = "stand",
  facing = "right",
  style,
  className = ""
}: {
  pose?: "stand" | "seated" | "slumped";
  facing?: "left" | "right";
  style?: CSSProperties;
  className?: string;
}) {
  if (pose !== "stand") {
    const slump = pose === "slumped";
    return (
      <svg viewBox="0 0 160 170" className={`fig fig-a seated ${slump ? "slumped" : ""} ${className}`} style={style} aria-hidden>
        <ellipse cx="80" cy="168" rx="55" ry="7" fill="rgba(0,0,0,.45)" />
        <path d="M20 170 Q30 80 78 70 Q122 66 138 170 Z" fill="#22262c" stroke={rim} strokeWidth="1.2" />
        <g className="a-head" style={{ transformOrigin: "86px 70px", transform: slump ? "rotate(34deg) translate(6px,14px)" : "rotate(8deg)", transition: "transform 2.6s ease" }}>
          <circle cx="94" cy="48" r="17" fill="#3b342d" />
          <path d="M78 42 Q96 20 112 42 Q100 34 80 46Z" fill="#161719" />
        </g>
        <path d="M70 80 Q90 96 112 80" fill="none" stroke="var(--glow,#d8a35a)" strokeWidth="5" strokeLinecap="round" opacity=".8" />
      </svg>
    );
  }
  const flip = facing === "left";
  return (
    <svg viewBox="0 0 100 270" className={`fig fig-a ${className}`} style={style} aria-hidden>
      <ellipse cx="50" cy="262" rx="36" ry="7" fill="rgba(0,0,0,.42)" />
      <g style={{ transform: flip ? "scaleX(-1)" : "none", transformOrigin: "50px 135px" }}>
        <path d="M30 262 L36 118 Q50 106 66 116 L74 262 Z" fill="#23272d" stroke={rim} strokeWidth="1.2" />
        <g style={{ transform: "rotate(5deg)", transformOrigin: "52px 112px" }}>
          <circle cx="54" cy="90" r="14" fill="#3b342d" />
          <path d="M39 85 Q54 62 70 85 Q56 78 41 90Z" fill="#161719" />
        </g>
        <path d="M38 118 Q52 134 68 118" fill="none" stroke="var(--glow,#d8a35a)" strokeWidth="6" strokeLinecap="round" opacity=".85" />
        <path d="M32 126 L22 200" stroke="#1c1f23" strokeWidth="8" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** B — her own life, her own weather. Long coat, a cool rim of light. */
export function FigureB({
  facing = "left",
  style,
  className = ""
}: {
  facing?: "left" | "right";
  style?: CSSProperties;
  className?: string;
}) {
  const flip = facing === "right";
  return (
    <svg viewBox="0 0 100 250" className={`fig fig-b ${className}`} style={style} aria-hidden>
      <ellipse cx="50" cy="243" rx="34" ry="7" fill="rgba(0,0,0,.42)" />
      <g style={{ transform: flip ? "scaleX(-1)" : "none", transformOrigin: "50px 125px" }}>
        <path d="M26 243 L34 110 Q50 98 66 110 L78 243 Z" fill="#1f262a" stroke="var(--fig-rim-b, rgba(160,205,205,.32))" strokeWidth="1.2" />
        <path d="M44 112 Q50 140 56 112" fill="none" stroke="var(--fig-rim-b, rgba(160,205,205,.32))" strokeWidth="1" />
        <circle cx="50" cy="86" r="13" fill="#3a332e" />
        <path d="M36 88 Q36 62 50 62 Q66 62 64 90 Q60 74 50 74 Q42 74 36 88Z" fill="#14171a" />
        <path d="M34 112 L24 178" stroke="#192024" strokeWidth="8" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function Firefly({ x, y, className = "", style }: { x?: string; y?: string; className?: string; style?: CSSProperties }) {
  return (
    <div className={`ff ${className}`} style={{ left: x, top: y, ...style }} aria-hidden>
      <i className="ff-glow" />
      <i className="ff-wing l" />
      <i className="ff-wing r" />
      <i className="ff-body" />
    </div>
  );
}
