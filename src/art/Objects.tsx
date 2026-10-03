import type { ReactNode } from "react";
import { FlowerSvg, type FlowerStage } from "./Nature";

export type ObjectKind =
  | "register" | "lantern" | "clock" | "map" | "radio" | "fan" | "drawer" | "phone" | "cup" | "tag"
  | "flower" | "workdesk" | "planner" | "moth" | "sign" | "pond" | "shutter" | "bench" | "label"
  | "pane" | "door" | "gate" | "jar" | "stone" | "letter" | "sprig" | "pencil" | "path" | "booth-clock" | "hook" | "sun";

export interface ObjectArtProps {
  kind: ObjectKind;
  lit?: boolean;     // lantern lit, phone lit, radio playing
  on?: boolean;      // fan spinning, radio on
  down?: boolean;    // phone face down
  tired?: boolean;   // flower tired
  messy?: boolean;   // desk cluttered
  side?: "l" | "r";  // cup handle
  warm?: boolean;
  stage?: FlowerStage;
  watered?: boolean;
  wiped?: boolean;
  /** exits only: the way on is physically available (door ajar, stones catching light) */
  ready?: boolean;
}

const VB: Record<ObjectKind, string> = {
  register: "0 0 170 76", lantern: "0 0 60 100", clock: "0 0 100 100", map: "0 0 150 110", radio: "0 0 120 74",
  fan: "0 0 100 100", drawer: "0 0 170 96", phone: "0 0 84 60", cup: "0 0 64 64", tag: "0 0 60 84",
  flower: "0 0 200 300", workdesk: "0 0 240 130", planner: "0 0 150 84", moth: "0 0 44 44", sign: "0 0 90 130",
  pond: "0 0 240 74", shutter: "0 0 44 54", bench: "0 0 210 94", label: "0 0 44 76", pane: "0 0 100 100",
  door: "0 0 100 170", gate: "0 0 220 170", jar: "0 0 70 90", stone: "0 0 80 60", letter: "0 0 90 64",
  sprig: "0 0 60 90", pencil: "0 0 100 40", path: "0 0 100 100", "booth-clock": "0 0 100 100", hook: "0 0 40 60", sun: "0 0 100 100"
};

export function ObjectArt(p: ObjectArtProps): ReactNode {
  const { kind } = p;
  if (kind === "flower")
    return <FlowerSvg stage={p.stage ?? (p.tired ? "tired" : "growing")} watered={p.watered} className="obj-flower" />;
  return (
    <svg viewBox={VB[kind]} className={`obj obj-${kind}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
      {draw(p)}
    </svg>
  );
}

const brass = "#b79a5e";
const edge = "rgba(225,210,180,.28)";

function draw(p: ObjectArtProps): ReactNode {
  switch (p.kind) {
    case "register":
      return (
        <g>
          <ellipse cx="85" cy="66" rx="76" ry="8" fill="rgba(0,0,0,.45)" />
          <polygon points="6,62 22,10 164,10 148,62" fill="#32251a" stroke={edge} strokeWidth="1.2" />
          <polygon points="12,58 26,15 86,15 80,58" fill="#d9d0bc" />
          <polygon points="86,15 158,15 144,58 80,58" fill="#d0c7b0" />
          {[22, 30, 38, 46, 52].map((y) => (
            <line key={y} x1={28 + (46 - y) * 0.18} y1={y} x2={78 + (46 - y) * 0.1} y2={y} stroke="#736955" strokeWidth=".85" opacity=".75" />
          ))}
          {[22, 30, 38, 46, 52].map((y) => (
            <line key={y} x1={92} y1={y} x2={148 - (y - 14) * 0.28} y2={y} stroke="#736955" strokeWidth=".85" opacity=".75" />
          ))}
          <line x1="84" y1="13" x2="80" y2="60" stroke="#8a2f2a" strokeWidth="2.2" />
          {/* ribbon marker */}
          <path d="M82 14 Q78 40 76 68 Q74 72 70 70" fill="none" stroke="#7e2420" strokeWidth="1.8" />
          {/* pen resting on book */}
          <line x1="116" y1="63" x2="154" y2="47" stroke="#1d1712" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="116" y1="63" x2="119" y2="62" stroke="#bda570" strokeWidth="3" />
        </g>
      );
    case "lantern":
      return (
        <g className={p.lit ? "lit" : ""}>
          <defs>
            <radialGradient id="lanternGlowWide">
              <stop offset="0" stopColor="#fde09d" stopOpacity=".85" />
              <stop offset="35%" stopColor="#f4be67" stopOpacity=".45" />
              <stop offset="100%" stopColor="#f4be67" stopOpacity="0" />
            </radialGradient>
          </defs>
          {p.lit && <circle cx="30" cy="56" r="48" fill="url(#lanternGlowWide)" className="glow-pulse" />}
          {/* handle */}
          <path d="M20 18 Q30 2 40 18" fill="none" stroke="#3d372e" strokeWidth="2.8" strokeLinecap="round" />
          {/* cap */}
          <polygon points="18,24 42,24 38,18 22,18" fill="#463f35" stroke="#2a251f" strokeWidth="1" />
          <circle cx="30" cy="18" r="3.5" fill="#5c5243" />
          {/* glass frame */}
          <path d="M18 24 H42 L46 76 H14 Z" fill={p.lit ? "rgba(245,210,130,.3)" : "rgba(150,165,165,.1)"} stroke="#544c3f" strokeWidth="2" />
          <line x1="30" y1="24" x2="30" y2="76" stroke="#463e33" strokeWidth="1.2" opacity=".7" />
          {p.lit && (
            <g>
              <ellipse cx="30" cy="62" rx="4.5" ry="3" fill="#6a5229" />
              <ellipse cx="30" cy="54" rx="4.5" ry="11" fill="#fff3c9" className="flame" />
              <ellipse cx="30" cy="55" rx="2.5" ry="6" fill="#fffdf5" />
            </g>
          )}
          {!p.lit && (
            <g>
              <ellipse cx="30" cy="66" rx="3" ry="3" fill="#2d261e" />
              <line x1="30" y1="63" x2="30" y2="59" stroke="#1c1712" strokeWidth="1.2" />
            </g>
          )}
          {/* base */}
          <rect x="12" y="76" width="36" height="8" rx="2" fill="#3d362d" stroke="#252019" strokeWidth="1" />
          <line x1="14" y1="80" x2="46" y2="80" stroke="rgba(255,255,255,.15)" strokeWidth=".8" />
        </g>
      );
    case "clock":
    case "booth-clock":
      return (
        <g>
          <ellipse cx="50" cy="54" rx="44" ry="44" fill="rgba(0,0,0,.35)" />
          <circle cx="50" cy="50" r="44" fill="#131518" stroke="#4a443a" strokeWidth="3" />
          <circle cx="50" cy="50" r="41" fill="#181a1f" stroke="#282a2f" strokeWidth="1" />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1="50" y1="13" x2="50" y2={i % 3 === 0 ? 23 : 18} stroke={i % 3 === 0 ? "#cfc5ae" : "#837b6c"} strokeWidth={i % 3 === 0 ? 2.4 : 1.2} transform={`rotate(${i * 30} 50 50)`} />
          ))}
          {/* hour and minute hands */}
          <line x1="50" y1="50" x2="50" y2="24" stroke="#d5cbb8" strokeWidth="2.8" strokeLinecap="round" transform="rotate(332 50 50)" />
          <line x1="50" y1="50" x2="50" y2="34" stroke="#d5cbb8" strokeWidth="3.4" strokeLinecap="round" transform="rotate(48 50 50)" />
          {/* second hand */}
          <line className="sweep" x1="50" y1="58" x2="50" y2="16" stroke="#c0573e" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="50" cy="50" r="3.4" fill="#c0573e" />
          <circle cx="50" cy="50" r="1.5" fill="#f5ede0" />
        </g>
      );
    case "map":
      return (
        <g>
          {/* shadow */}
          <ellipse cx="75" cy="108" rx="64" ry="6" fill="rgba(0,0,0,.45)" />
          {/* posts */}
          <rect x="22" y="80" width="8" height="30" rx="1" fill="#2d251d" />
          <rect x="120" y="80" width="8" height="30" rx="1" fill="#2d251d" />
          {/* frame */}
          <rect x="6" y="8" width="138" height="82" rx="4" fill="#3d3224" stroke="#251f16" strokeWidth="1.5" />
          <polygon points="2,10 75,0 148,10" fill="#2c2318" />
          {/* parchment board */}
          <rect x="14" y="15" width="122" height="68" rx="2" fill="#9c9071" />
          {/* map trails */}
          <path d="M26 66 C42 32 64 28 80 44 S112 60 122 32" fill="none" stroke="#483f2e" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M72 70 L98 52" stroke="#483f2e" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M40 74 C50 62 60 66 70 70" fill="none" stroke="#5a503c" strokeWidth="1.2" />
          {/* you are here red marker */}
          <circle cx="80" cy="44" r="3.5" fill="#8f2d24" />
          <circle cx="80" cy="44" r="1.5" fill="#ffdeda" />
          {/* compass star */}
          <path d="M120 22 L121 26 L125 27 L121 28 L120 32 L119 28 L115 27 L119 26 Z" fill="#463c2b" />
        </g>
      );
    case "radio":
      return (
        <g>
          <rect x="6" y="10" width="108" height="56" rx="8" fill="#2a2c30" stroke={edge} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1="16" y1={20 + i * 7} x2="64" y2={20 + i * 7} stroke="#14151a" strokeWidth="3" strokeLinecap="round" />
          ))}
          <circle cx="90" cy="30" r="12" fill="#17181b" stroke="#4b4b4b" />
          <line x1="90" y1="30" x2="97" y2="23" stroke={p.on ? "#e7c982" : "#6a6454"} strokeWidth="2" />
          <rect x="76" y="48" width="28" height="7" rx="3" fill={p.on ? "#7e6a3a" : "#3a3626"} />
          <line x1="104" y1="10" x2="116" y2="-4" stroke="#6b6b6b" strokeWidth="1.5" />
          {p.on && <path className="waves" d="M54 0 q6 6 0 12 M62 -4 q8 10 0 20" fill="none" stroke="#e7c982" strokeWidth="1" opacity=".6" />}
        </g>
      );
    case "fan":
      return (
        <g>
          <circle cx="50" cy="50" r="42" fill="#121416" stroke="#3b4244" strokeWidth="3" />
          <g className={`blades ${p.on ? "spin" : ""}`} style={{ transformOrigin: "50px 50px" }}>
            {[0, 120, 240].map((a) => (
              <path key={a} d="M50 50 C60 28 78 26 82 34 C74 46 62 50 50 50Z" fill="#2e3638" transform={`rotate(${a} 50 50)`} />
            ))}
          </g>
          <circle cx="50" cy="50" r="6" fill="#4b5457" />
          <path d="M82 12 C92 18 94 30 90 40" fill="none" stroke="#c9c0a8" strokeWidth="1.4" className="strip" />
        </g>
      );
    case "drawer":
      return (
        <g>
          <ellipse cx="85" cy="88" rx="78" ry="7" fill="rgba(0,0,0,.45)" />
          <rect x="6" y="6" width="158" height="84" rx="4" fill="#221e1a" stroke="#3d352b" strokeWidth="1.6" />
          {/* top drawer */}
          <rect x="12" y="12" width="146" height="34" rx="2" fill="#1a1714" stroke="#332c24" strokeWidth="1" />
          <rect x="62" y="27" width="46" height="5" rx="2.5" fill="#a48c5a" />
          <circle cx="85" cy="29.5" r="1.5" fill="#4d3d22" />
          {/* bottom drawer */}
          <rect x="12" y="50" width="146" height="34" rx="2" fill="#1a1714" stroke="#332c24" strokeWidth="1" />
          <rect x="62" y="65" width="46" height="5" rx="2.5" fill="#a48c5a" />
          <circle cx="85" cy="67.5" r="1.5" fill="#4d3d22" />
        </g>
      );
    case "phone":
      return (
        <g className={p.lit && !p.down ? "phone-lit" : ""}>
          <ellipse cx="42" cy="52" rx="36" ry="6" fill="rgba(0,0,0,.4)" />
          <rect x="8" y="8" width="68" height="44" rx="8" fill={p.down ? "#14161a" : "#1a1e24"} stroke="#3e454e" strokeWidth="1.8" />
          {!p.down && (
            <>
              <rect x="13" y="13" width="58" height="34" rx="5" fill={p.lit ? "#9bc4db" : "#19242c"} opacity={p.lit ? 0.6 : 0.75} className={p.lit ? "screen-pulse" : ""} />
              {p.lit && <circle cx="42" cy="30" r="18" fill="rgba(215,235,255,.25)" filter="blur(4px)" />}
            </>
          )}
          {p.down && (
            <g opacity=".8">
              <rect x="14" y="14" width="16" height="16" rx="4" fill="#0f1114" stroke="#2a3038" strokeWidth="1" />
              <circle cx="22" cy="22" r="4.5" fill="#1b2027" />
              <circle cx="22" cy="22" r="2" fill="#323c48" />
            </g>
          )}
        </g>
      );
    case "cup":
      return (
        <g>
          <ellipse cx="29" cy="56" rx="20" ry="5" fill="rgba(0,0,0,.4)" />
          {/* mug body */}
          <path d="M14 20 H44 L40 52 Q29 58 18 52 Z" fill="#d8d1c2" stroke="#7e7564" strokeWidth="1.4" />
          {/* handle */}
          <path d={p.side === "l" ? "M14 26 Q0 28 3 40 Q6 48 18 45" : "M44 26 Q58 28 55 40 Q52 48 40 45"} fill="none" stroke="#d8d1c2" strokeWidth="4.2" strokeLinecap="round" />
          {/* rim & tea surface */}
          <ellipse cx="29" cy="20" rx="15" ry="4" fill="#2d2218" stroke="#7e7564" strokeWidth="1" />
          <ellipse cx="29" cy="20" rx="12" ry="2.8" fill="#463120" />
          {p.warm && (
            <g className="steam" opacity=".65">
              <path d="M23 15 Q19 7 24 0" fill="none" stroke="#e8e2d4" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M33 15 Q37 7 32 0" fill="none" stroke="#e8e2d4" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          )}
        </g>
      );
    case "tag":
      return (
        <g>
          <path d="M30 4 C14 14 14 28 30 34 C46 28 46 14 30 4Z" fill="none" stroke="#6e655a" strokeWidth="1.6" />
          <path d="M16 38 H44 L50 50 L44 70 H16 L10 50 Z" fill={brass} stroke="#7a6838" strokeWidth="2" />
          <circle cx="30" cy="44" r="3" fill="#2a2418" />
          <line x1="20" y1="56" x2="40" y2="56" stroke="#7a6838" strokeWidth="1.6" />
          <line x1="22" y1="62" x2="38" y2="62" stroke="#7a6838" strokeWidth="1.6" />
        </g>
      );
    case "workdesk":
      return (
        <g>
          <ellipse cx="120" cy="118" rx="116" ry="8" fill="rgba(0,0,0,.45)" />
          <rect x="0" y="104" width="240" height="14" fill="#2a231c" stroke="#17130f" strokeWidth="1" />
          {/* laptop */}
          <polygon points="60,100 84,42 176,42 190,100" fill="#14171a" stroke="#3d444c" strokeWidth="2" />
          <polygon points="68,96 88,48 170,48 182,96" fill={p.messy ? "#9fb0b4" : "#6e8c97"} opacity=".35" />
          <rect x="46" y="100" width="162" height="6" rx="1" fill="#1b1f24" />
          {/* papers on left */}
          <g transform="rotate(-6 20 90)">
            <rect x="6" y="80" width="46" height="20" rx="1" fill="#dcd5c2" stroke="#9e9581" strokeWidth=".8" />
            <rect x="12" y="74" width="46" height="20" rx="1" fill="#cecaa7" opacity=".9" />
          </g>
          {/* messy papers on right */}
          {p.messy && (
            <g>
              <rect x="194" y="84" width="42" height="18" rx="1" fill="#cfc6b0" stroke="#9e9581" strokeWidth=".8" transform="rotate(8 215 93)" />
              <rect x="188" y="90" width="42" height="16" rx="1" fill="#bcb39c" />
            </g>
          )}
          {/* lamp */}
          <path d="M214 100 L224 50 L206 24" fill="none" stroke="#4d4c45" strokeWidth="4.2" strokeLinecap="round" />
          <circle cx="214" cy="100" r="5" fill="#383630" />
          <circle cx="206" cy="24" r="4" fill="#383630" />
          <path d="M196 20 L218 18 L208 34Z" fill="#2d2922" stroke="#1c1914" strokeWidth="1" />
          <polygon points="206,34 184,102 228,102" fill="url(#deskLamp)" opacity=".32" />
          <defs>
            <linearGradient id="deskLamp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f5dd9f" />
              <stop offset="1" stopColor="#f5dd9f" stopOpacity="0" />
            </linearGradient>
          </defs>
        </g>
      );
    case "planner":
      return (
        <g>
          <ellipse cx="75" cy="74" rx="72" ry="7" fill="rgba(0,0,0,.4)" />
          <polygon points="4,70 14,12 76,8 76,66" fill="#263436" stroke={edge} strokeWidth="1.2" />
          <polygon points="76,8 138,12 146,70 76,66" fill="#2d3d3f" stroke={edge} strokeWidth="1.2" />
          <polygon points="12,64 20,18 72,15 72,61" fill="#ded7c4" />
          <polygon points="80,15 132,18 140,64 80,61" fill="#d7d0bc" />
          {[0, 1, 2, 3, 4].map((r) => (
            <g key={r}>
              <line x1="24" y1={24 + r * 8} x2="68" y2={22 + r * 8} stroke="#857e6c" strokeWidth=".85" opacity=".75" />
              <line x1="84" y1={22 + r * 8} x2="130" y2={24 + r * 8} stroke="#857e6c" strokeWidth=".85" opacity=".75" />
            </g>
          ))}
          <rect x="30" y="26" width="22" height="5" rx="1" fill="#6d8e9c" opacity=".65" />
          <rect x="92" y="34" width="26" height="5" rx="1" fill="#a48850" opacity=".65" />
          <rect x="34" y="50" width="18" height="5" rx="1" fill="#7d9266" opacity=".65" />
        </g>
      );
    case "moth":
      return (
        <g className="moth-flit">
          <path d="M22 22 C10 6 2 14 8 26 C12 32 18 28 22 22Z" fill="#cfc6b0" opacity=".85" />
          <path d="M22 22 C34 6 42 14 36 26 C32 32 26 28 22 22Z" fill="#cfc6b0" opacity=".85" />
          <ellipse cx="22" cy="24" rx="2" ry="6" fill="#4a4338" />
        </g>
      );
    case "sign":
      return (
        <g>
          <ellipse cx="45" cy="126" rx="36" ry="5" fill="rgba(0,0,0,.45)" />
          <rect x="40" y="40" width="10" height="90" fill="#2d231a" />
          <polygon points="6,16 74,10 80,48 10,54" fill="#4d3d2a" stroke={edge} strokeWidth="1.2" />
          <line x1="20" y1="28" x2="64" y2="25" stroke="#d1c7ae" strokeWidth="2" strokeLinecap="round" />
          <line x1="22" y1="38" x2="52" y2="36" stroke="#d1c7ae" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "pond":
      return (
        <g>
          <ellipse cx="120" cy="40" rx="114" ry="30" fill="#0b131c" stroke="rgba(160,195,215,.22)" strokeWidth="1.5" />
          <ellipse className="ripple" cx="120" cy="40" rx="30" ry="7" fill="none" stroke="rgba(200,225,240,.4)" />
          <ellipse className="ripple r2" cx="120" cy="40" rx="30" ry="7" fill="none" stroke="rgba(200,225,240,.32)" />
          <line x1="120" y1="18" x2="120" y2="62" stroke="rgba(245,215,140,.32)" strokeWidth="5" strokeLinecap="round" opacity=".8" />
        </g>
      );
    case "shutter":
      return (
        <g>
          <rect x="6" y="6" width="32" height="42" rx="4" fill="#2c2924" stroke={edge} />
          <rect x="12" y="14" width="20" height="8" rx="2" fill={brass} />
          <circle cx="22" cy="36" r="5" fill="#3e3a32" stroke="#6a6252" />
        </g>
      );
    case "bench":
      return (
        <g>
          {/* contact shadows under bench legs */}
          <ellipse cx="26" cy="88" rx="12" ry="4" fill="rgba(0,0,0,.45)" />
          <ellipse cx="180" cy="88" rx="12" ry="4" fill="rgba(0,0,0,.45)" />
          {/* cast-iron scrolled ends */}
          <path d="M22 12 Q14 26 20 54 L24 88 M22 46 Q28 48 30 54" fill="none" stroke="#25201b" strokeWidth="4" strokeLinecap="round" />
          <path d="M182 12 Q174 26 180 54 L184 88 M182 46 Q188 48 190 54" fill="none" stroke="#25201b" strokeWidth="4" strokeLinecap="round" />
          {/* backrest slats */}
          <rect x="10" y="24" width="190" height="11" rx="2.5" fill="#5c4832" stroke="#332719" strokeWidth="1" />
          <rect x="12" y="42" width="186" height="11" rx="2.5" fill="#503e2a" stroke="#332719" strokeWidth="1" />
          {/* seat slat */}
          <polygon points="14,56 196,56 190,66 20,66" fill="#443422" stroke="#2a1f13" strokeWidth="1" />
        </g>
      );
    case "label":
      return (
        <g>
          <rect x="20" y="30" width="4" height="46" fill="#3b3329" />
          <rect x="4" y="6" width="36" height="28" rx="2" fill="#d6cdb4" />
          <line x1="10" y1="14" x2="34" y2="14" stroke="#6e6551" strokeWidth="1.3" />
          <line x1="10" y1="20" x2="30" y2="20" stroke="#6e6551" strokeWidth="1.3" />
          <line x1="10" y1="26" x2="26" y2="26" stroke="#6e6551" strokeWidth="1.3" />
        </g>
      );
    case "pane":
      return (
        <g>
          {/* The architecture owns the frame; this is only light on its glass. */}
          <path d="M12 8 L34 8 L74 92 L52 92Z" fill="var(--pane, rgba(170,195,205,.06))" />
          <path d="M42 8 L46 8 L86 92 L82 92Z" fill="rgba(220,235,235,.035)" />
          {p.wiped && <ellipse cx="46" cy="52" rx="24" ry="20" fill="rgba(210,230,240,.12)" />}
        </g>
      );
    case "door":
      return (
        <g className={p.ready ? "door-ajar" : ""}>
          <ellipse cx="50" cy="168" rx="46" ry="6" fill="rgba(0,0,0,.5)" />
          <path d="M8 168 V70 Q50 -6 92 70 V168 Z" fill="rgba(16,20,24,.92)" stroke="rgba(210,205,185,.32)" strokeWidth="2" />
          <path d="M16 168 V74 Q50 6 84 74 V168 Z" fill="url(#doorGlow)" opacity=".65" />
          <line x1="50" y1="74" x2="50" y2="168" stroke="rgba(210,205,185,.2)" strokeWidth="1.5" />
          <defs>
            <linearGradient id="doorGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f5d496" stopOpacity=".3" />
              <stop offset="1" stopColor="#f5d496" stopOpacity=".05" />
            </linearGradient>
            <linearGradient id="doorGap" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe5aa" stopOpacity=".15" />
              <stop offset="1" stopColor="#ffe5aa" stopOpacity=".85" />
            </linearGradient>
          </defs>
          {/* the door has come off its latch: a slim gap, and light through it */}
          <g className="ajar-gap">
            <path d="M50 76 L58 82 L58 172 L50 168Z" fill="url(#doorGap)" />
            <path d="M50 168 L58 172 L84 186 L36 186Z" fill="#ffe0a0" opacity=".18" />
          </g>
          <circle cx="76" cy="118" r="3.4" fill={brass} />
          <circle cx="76" cy="118" r="1.4" fill="#3a2f18" />
        </g>
      );
    case "gate":
      return (
        <g fill="none" stroke="#25292e" strokeWidth="4">
          <ellipse cx="110" cy="168" rx="104" ry="6" fill="rgba(0,0,0,.45)" stroke="none" />
          <path d="M10 168 V20 M210 168 V20" strokeWidth="5" />
          <path d="M10 20 Q110 -12 210 20" strokeWidth="4.5" />
          <path d="M10 32 Q110 0 210 32" strokeWidth="2.5" />
          <path d="M10 156 H210" strokeWidth="3" />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M${38 + i * 21} 168 V${28 - (i % 2 === 0 ? 0 : -4)}`} strokeWidth="2.4" />
          ))}
          {/* latch */}
          <circle cx="202" cy="94" r="4" fill="#8c784a" stroke="none" />
        </g>
      );
    case "jar":
      return (
        <g>
          <ellipse cx="35" cy="84" rx="28" ry="6" fill="rgba(0,0,0,.45)" />
          <circle cx="35" cy="56" r="42" fill="url(#jarGlow)" opacity=".8" className="glow-pulse" />
          <defs>
            <radialGradient id="jarGlow">
              <stop offset="0" stopColor="#fde3a7" stopOpacity=".85" />
              <stop offset="50%" stopColor="#f4ce7b" stopOpacity=".35" />
              <stop offset="100%" stopColor="#f4ce7b" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* wire bail & glass lip */}
          <rect x="22" y="14" width="26" height="8" rx="2" fill="#4d463a" />
          <path d="M22 18 Q35 10 48 18" fill="none" stroke="#756b5a" strokeWidth="1.5" />
          {/* glass body */}
          <path d="M20 24 H50 Q58 40 54 74 Q35 84 16 74 Q12 40 20 24Z" fill="rgba(220,235,235,.15)" stroke="rgba(230,235,225,.45)" strokeWidth="1.8" />
          {/* firefly / captured warm light inside */}
          <circle cx="35" cy="56" r="6" fill="#fff5d2" className="flame" />
          <circle cx="35" cy="56" r="2.5" fill="#ffffff" />
        </g>
      );
    case "stone":
      return (
        <g>
          <ellipse cx="40" cy="54" rx="38" ry="6.5" fill="rgba(0,0,0,.5)" />
          <path d="M8 48 C8 20 30 10 50 14 C70 18 75 36 70 50 C54 57 22 57 8 48Z" fill="#3c4144" stroke="rgba(220,225,225,.22)" strokeWidth="1.2" />
          <path d="M18 30 C28 22 46 22 56 27" stroke="#52595c" fill="none" strokeWidth="2" strokeLinecap="round" />
          <circle cx="34" cy="38" r="1.5" fill="#5a6266" />
          <circle cx="48" cy="42" r="1.2" fill="#5a6266" />
        </g>
      );
    case "letter":
      return (
        <g>
          <ellipse cx="45" cy="58" rx="40" ry="5.5" fill="rgba(0,0,0,.42)" />
          <rect x="6" y="8" width="78" height="48" rx="2" fill="#dfd6c0" stroke="#7e745f" strokeWidth="1.2" />
          <path d="M6 8 L45 36 L84 8" fill="none" stroke="#8a806b" strokeWidth="1.2" />
          {/* wax seal */}
          <circle cx="45" cy="36" r="7.5" fill="#932620" />
          <circle cx="45" cy="36" r="5" fill="#7a1f1a" />
          <path d="M42 36 h6 M45 33 v6" stroke="#b83832" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      );
    case "sprig":
      return (
        <g fill="none" strokeLinecap="round">
          <ellipse cx="32" cy="88" rx="22" ry="4" fill="rgba(0,0,0,.35)" stroke="none" />
          <path d="M30 86 C32 60 28 40 34 10" stroke="#6d8f69" strokeWidth="3.2" />
          <path d="M31 66 C14 62 10 50 12 44 C24 46 30 54 31 66Z" fill="#587a57" stroke="none" />
          <path d="M32 44 C46 40 52 30 50 24 C38 26 32 34 32 44Z" fill="#5f825d" stroke="none" />
          <circle cx="34" cy="10" r="5.5" fill="#d9c9e3" stroke="none" />
          <circle cx="34" cy="10" r="2.5" fill="#f2e8f8" stroke="none" />
        </g>
      );
    case "pencil":
      return (
        <g>
          <ellipse cx="50" cy="36" rx="46" ry="4" fill="rgba(0,0,0,.35)" />
          {/* body */}
          <polygon points="24,10 88,10 88,30 24,30" fill="#c99f48" stroke="#68501f" strokeWidth="1" />
          <line x1="24" y1="20" x2="88" y2="20" stroke="#b48834" strokeWidth="1.5" />
          {/* sharpened wood */}
          <polygon points="6,20 24,10 24,30" fill="#dfd3b2" stroke="#7a6944" strokeWidth="1" />
          {/* graphite tip */}
          <polygon points="6,20 12,17 12,23" fill="#1f2224" />
          {/* ferrule & eraser */}
          <rect x="88" y="10" width="8" height="20" fill="#a4986b" />
          <rect x="96" y="11" width="6" height="18" rx="2" fill="#7a6458" />
        </g>
      );
    case "hook":
      return (
        <g>
          <path d="M20 4 V40 Q20 54 30 50" fill="none" stroke="#4b463e" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "sun":
      return (
        <g>
          <circle cx="50" cy="50" r="44" fill="url(#sunGlow)" className="glow-pulse" />
          <defs>
            <radialGradient id="sunGlow">
              <stop offset="0" stopColor="#f8e0b0" stopOpacity=".95" />
              <stop offset="1" stopColor="#f8e0b0" stopOpacity="0" />
            </radialGradient>
          </defs>
        </g>
      );
    case "path":
      /* Pale stones. Invisible until the way on is open; then the moon catches them one by one. */
      return (
        <g className={`path-stones ${p.ready ? "lit" : ""}`}>
          {[
            [50, 12, 7, 2.4],
            [47, 30, 10, 3.4],
            [53, 50, 14, 4.6],
            [46, 72, 19, 6],
            [54, 94, 25, 7.6]
          ].map(([x, y, rx, ry], i) => (
            <ellipse key={i} className="stone" cx={x} cy={y} rx={rx} ry={ry} fill="#cfdbe6" style={{ transitionDelay: `${i * 0.35}s` }} />
          ))}
        </g>
      );
    default:
      return <g />;
  }
}
