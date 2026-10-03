import type { CSSProperties } from "react";

/* ------------------------------------------------------------------ *
 * FLOWER — what grew.
 * Stem, leaves, roots and petals are separate parts so the bloom can
 * build progressively. It is canonical: never a score, never punishes.
 * ------------------------------------------------------------------ */
export type FlowerStage = "sprout" | "growing" | "budded" | "tired" | "bloom" | "full";

export function FlowerSvg({
  stage = "growing",
  animate = false,
  roots = false,
  watered = false,
  className = "",
  style
}: {
  stage?: FlowerStage;
  animate?: boolean;
  roots?: boolean;
  watered?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const petals = Array.from({ length: 12 }, (_, i) => i);
  const tired = stage === "tired";
  const stem = tired ? "M100 270 C101 228 92 180 80 138" : "M100 270 C102 222 97 172 100 126";
  return (
    <svg
      viewBox="0 0 200 300"
      className={`flower ${animate ? "bloom-anim" : ""} ${className}`}
      data-stage={stage}
      data-watered={watered}
      style={style}
      aria-hidden
    >
      <defs>
        <radialGradient id="pollenGlow">
          <stop offset="0" stopColor="#fdf0c2" stopOpacity=".95" />
          <stop offset="40%" stopColor="#f6e2a8" stopOpacity=".7" />
          <stop offset="100%" stopColor="#f6e2a8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="petalFill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--petal-a,#c9b8d4)" />
          <stop offset="65%" stopColor="var(--petal-b,#f4edf8)" />
          <stop offset="100%" stopColor="#fffbfc" />
        </linearGradient>
        <radialGradient id="flowerCenter">
          <stop offset="0%" stopColor="#f3dd8e" />
          <stop offset="70%" stopColor="#c79a4a" />
          <stop offset="100%" stopColor="#8d6829" />
        </radialGradient>
      </defs>
      {/* soil & contact shadow */}
      <ellipse cx="100" cy="276" rx="66" ry="11" fill="rgba(0,0,0,.45)" />
      <ellipse cx="100" cy="274" rx="58" ry="8" fill="#1e1813" />
      <path d="M48 274 Q100 258 152 274" fill="#292019" />
      {roots && (
        <g className="roots" fill="none" stroke="#756450" strokeWidth="1.6" strokeLinecap="round" opacity=".75">
          <path className="root" pathLength={100} d="M100 276 C94 288 80 292 60 298" />
          <path className="root" pathLength={100} d="M100 276 C104 290 120 292 142 298" style={{ animationDelay: ".3s" }} />
          <path className="root" pathLength={100} d="M100 276 C100 288 98 294 96 300" style={{ animationDelay: ".6s" }} />
        </g>
      )}
      <path className="stem" pathLength={100} d={stem} fill="none" stroke="var(--stem,#6d8f69)" strokeWidth="4.2" strokeLinecap="round" />
      {/* leaves */}
      <g transform="translate(99 232)">
        <g className="leaf leaf-1">
          <path d="M0 0 C-22 -8 -42 -2 -54 14 C-35 18 -14 14 0 0Z" fill="var(--leaf,#587a57)" />
          <path d="M0 0 C-18 4 -36 8 -48 13" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth=".8" />
        </g>
      </g>
      <g transform="translate(99 198)">
        <g className="leaf leaf-2">
          <path d="M0 0 C24 -12 44 -8 58 6 C38 14 14 12 0 0Z" fill="var(--leaf,#5f825d)" />
          <path d="M0 0 C20 4 38 6 52 6" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth=".8" />
        </g>
      </g>
      <g transform="translate(99 166)">
        <g className="leaf leaf-3">
          <path d="M0 0 C-18 -14 -36 -12 -46 -2 C-30 6 -12 6 0 0Z" fill="var(--leaf,#65885f)" />
          <path d="M0 0 C-16 0 -30 2 -40 -1" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth=".8" />
        </g>
      </g>
      {/* head */}
      <g transform={tired ? "translate(80 138)" : "translate(100 126)"}>
        <g className="head">
          <circle className="bud" r="10" fill="var(--petal-a,#c9b8d4)" />
          {petals.map((i) => {
            const rot = i * (360 / petals.length);
            const isInner = i % 2 === 1;
            return (
              <g key={i} transform={`rotate(${rot})`}>
                <path
                  className="petal"
                  d={isInner ? "M0 0 C-5 -10 -7 -20 0 -26 C7 -20 5 -10 0 0Z" : "M0 0 C-7 -11 -9 -23 0 -30 C9 -23 7 -11 0 0Z"}
                  fill="url(#petalFill)"
                  style={{ ["--i" as string]: i } as CSSProperties}
                />
              </g>
            );
          })}
          <circle r="8.5" fill="url(#flowerCenter)" />
          <circle r="4" fill="#a47731" opacity=".7" />
        </g>
      </g>
      {/* pollen */}
      <g className="pollen" transform="translate(100 120)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} className="mote" r="2.2" fill="url(#pollenGlow)" style={{ animationDelay: `calc(var(--md, 0s) + ${i * 1.1}s)`, ["--dx" as string]: `${(i - 2.5) * 16}px` } as CSSProperties} />
        ))}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * BIRD — release. Calm, never chased, never returns.
 * Wings are grouped with their own feathers; flap eases into a glide.
 * ------------------------------------------------------------------ */
export type BirdMode = "perch" | "flap" | "glide";

export function BirdSvg({ mode = "perch", className = "", style }: { mode?: BirdMode; className?: string; style?: CSSProperties }) {
  const feathers = [0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 260 170" className={`bird ${mode} ${className}`} style={style} aria-hidden>
      {/* far wing */}
      <g transform="translate(120 74)">
        <g className="wing far">
          <path d="M0 0 C-20 -34 -62 -50 -100 -34 C-76 -22 -50 -6 -26 14Z" fill="var(--bird-far,#2b3138)" />
        </g>
      </g>
      {/* tail */}
      <path d="M52 92 L4 114 L10 98 L2 92 L14 84 L10 74 Z" fill="var(--bird-tail,#242a30)" />
      {/* body */}
      <path d="M44 88 C60 66 112 58 152 70 C176 76 188 86 184 98 C178 116 130 124 86 116 C62 110 46 102 44 88Z" fill="var(--bird-body,#39424a)" />
      <path d="M96 100 C122 108 150 104 170 96" fill="none" stroke="var(--bird-belly,#7a8590)" strokeWidth="6" strokeLinecap="round" opacity=".5" />
      {/* head + beak */}
      <circle cx="176" cy="76" r="17" fill="var(--bird-body,#39424a)" />
      <path d="M190 72 L214 78 L190 84 Z" fill="#c39f5a" />
      <circle cx="180" cy="73" r="2.6" fill="#14171a" />
      <circle cx="181" cy="72" r="1" fill="#fffdf5" />
      {/* near wing: feathers travel with the wing */}
      <g transform="translate(120 74)">
        <g className="wing near">
          <path d={mode === "perch" ? "M0 0 C-24 -5 -48 2 -68 15 C-40 24 -18 30 10 13Z" : "M0 0 C-16 -44 -70 -66 -122 -42 C-92 -26 -58 -8 -30 18Z"} fill="var(--bird-wing,#434d56)" />
          {feathers.map((i) => (
            <path key={i} d={mode === "perch" ? `M${-12-i*8} ${7+i*2} l-15 5` : `M${-14 - i * 20} ${-8 - i * 6} L${-34 - i * 20} ${4 - i * 2}`} stroke="var(--bird-belly,#7a8590)" strokeWidth="1.2" opacity=".5" strokeLinecap="round" />
          ))}
        </g>
      </g>
      {/* gripping legs for perch */}
      <g className="legs" stroke="#4f473c" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M92 118 L86 138 M86 138 L78 140 M86 138 L88 142" />
        <path d="M112 120 L108 140 M108 140 L100 142 M108 140 L110 144" />
      </g>
    </svg>
  );
}
