import type { ReactNode } from "react";

/**
 * All backdrops are drawn on one 1600 × 1000 stage and recoloured by CSS variables
 * (see styles/story.css: [data-pal="dusk|night|cold|dawn|morning"]), so the same
 * place can visibly travel through the night.
 */
const Svg = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <svg className={`bd ${className}`} viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden>
    {children}
  </svg>
);

const Defs = () => (
  <defs>
    <radialGradient id="orbGlow">
      <stop offset="0" stopColor="var(--orb)" stopOpacity=".45" />
      <stop offset="1" stopColor="var(--orb)" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="warmGlow">
      <stop offset="0" stopColor="var(--glow)" stopOpacity=".55" />
      <stop offset="1" stopColor="var(--glow)" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="groundFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="var(--ground)" />
      <stop offset="1" stopColor="var(--ground2)" />
    </linearGradient>
    <linearGradient id="wallFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="var(--wall)" />
      <stop offset="1" stopColor="var(--wall2)" />
    </linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="var(--glow)" stopOpacity=".22" />
      <stop offset="1" stopColor="var(--glow)" stopOpacity="0" />
    </linearGradient>
  </defs>
);

const Orb = ({ x = 1230, y = 150, r = 44 }: { x?: number; y?: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r * 3.4} fill="url(#orbGlow)" />
    <circle cx={x} cy={y} r={r} fill="var(--orb)" opacity=".9" />
  </g>
);

const Trees = ({ y = 600 }: { y?: number }) => (
  <g fill="var(--far2)">
    {[60, 210, 330, 560, 960, 1160, 1560].map((x, i) => (
      <g key={x}>
        <ellipse cx={x} cy={y - 40 - (i % 3) * 20} rx={70 + (i % 2) * 24} ry={90 + (i % 3) * 20} />
        <rect x={x - 5} y={y - 20} width="10" height="60" />
      </g>
    ))}
  </g>
);

/* ---------------------------------------------------------------- GARDEN FRONT
 * glasshouse x80–900 y230–640 · booth x1000–1500 y340–670 · path to (800,650)
 */
export function GardenFront({ lampOn = true, gateOpen = false }: { lampOn?: boolean; gateOpen?: boolean }) {
  return (
    <Svg>
      <Defs />
      <Orb />
      <path d="M0 650 C200 560 360 610 520 570 S880 540 1120 590 S1480 560 1600 610 V1000 H0Z" fill="var(--far)" />
      <Trees y={640} />
      {/* glasshouse */}
      <g>
        <path d="M80 650 V370 L250 232 H730 L900 370 V650Z" fill="var(--glass)" stroke="var(--rim)" strokeWidth="2" />
        <path d="M80 650 V370 L250 232 H730 L900 370 V650Z" fill="url(#warmGlow)" opacity=".18" />
        {[170, 260, 350, 440, 540, 630, 720, 810].map((x) => (
          <line key={x} x1={x} y1={x < 490 ? 380 - (x - 80) * 0.36 : 238 + (x - 730) * 0.8} x2={x} y2="650" stroke="var(--rim)" strokeWidth="1.2" opacity=".6" />
        ))}
        <line x1="80" y1="370" x2="900" y2="370" stroke="var(--rim)" strokeWidth="1.2" opacity=".6" />
        <line x1="80" y1="500" x2="900" y2="500" stroke="var(--rim)" strokeWidth="1" opacity=".4" />
        {/* plants inside */}
        <g fill="var(--plant)" opacity=".7">
          <ellipse cx="200" cy="590" rx="60" ry="70" />
          <ellipse cx="460" cy="570" rx="90" ry="90" />
          <ellipse cx="700" cy="600" rx="70" ry="60" />
        </g>
        <path d="M760 650 V560 H830 V650" fill="rgba(0,0,0,.35)" stroke="var(--rim)" />
      </g>
      {/* closing lamp above the glasshouse door */}
      <g className={`closing-lamp ${lampOn ? "on" : "off"}`}>
        <circle cx="795" cy="520" r="90" fill="url(#warmGlow)" />
        <rect x="788" y="500" width="14" height="22" rx="3" fill="var(--glow)" />
      </g>
      {/* booth */}
      <g>
        <polygon points="980,350 1250,300 1520,350" fill="var(--wall2)" stroke="var(--rim)" />
        <rect x="1000" y="350" width="500" height="320" fill="url(#wallFade)" stroke="var(--rim)" />
        <rect x="1040" y="385" width="210" height="165" fill="var(--glow)" opacity=".22" stroke="var(--rim)" />
        <rect x="1040" y="385" width="210" height="165" fill="url(#warmGlow)" opacity=".4" />
        <line x1="1145" y1="385" x2="1145" y2="550" stroke="var(--rim)" />
        <rect x="1030" y="548" width="330" height="12" fill="var(--furn)" />
        <path d="M1046 560 V579 M1338 560 V579" stroke="var(--furn2)" strokeWidth="8" />
        <rect x="1330" y="470" width="120" height="200" fill="var(--wall2)" stroke="var(--rim)" />
      </g>
      {/* ground + path */}
      <rect x="0" y="650" width="1600" height="350" fill="url(#groundFade)" />
      <polygon points="720,650 880,650 1140,1000 460,1000" fill="var(--path)" />
      <polygon points="720,650 880,650 900,700 700,700" fill="var(--glow)" opacity=".08" />
      {/* gate in distance */}
      {gateOpen && <path d="M740 650 V600 M860 650 V600" stroke="var(--rim)" strokeWidth="3" />}
      <g fill="var(--plant)" opacity=".85">
        <ellipse cx="60" cy="990" rx="200" ry="110" />
        <ellipse cx="1560" cy="1000" rx="240" ry="120" />
        <ellipse cx="760" cy="1040" rx="120" ry="40" />
      </g>
      {/* lamp post */}
      <rect x="966" y="350" width="8" height="330" fill="var(--furn2)" />
      <path d="M970 356 Q990 340 1000 356" fill="none" stroke="var(--furn2)" strokeWidth="6" />
    </Svg>
  );
}

/* ------------------------------------------------------------ GLASSHOUSE INTERIOR
 * vanishing ~ (800,430). path (700,520)-(900,520)-(1300,1000)-(300,1000). bench ~ (690,610)-(910,740)
 */
export function Glasshouse({ dim = false }: { dim?: boolean }) {
  return (
    <Svg>
      <Defs />
      <Orb x={800} y={120} r={36} />
      {/* ribs */}
      <g stroke="var(--rim)" strokeWidth="2" fill="none" opacity=".75">
        <path d="M0 520 Q400 -40 800 -40 Q1200 -40 1600 520" />
        <path d="M120 600 Q440 90 800 70 Q1160 90 1480 600" opacity=".7" />
        <path d="M260 640 Q500 230 800 200 Q1100 230 1340 640" opacity=".55" />
        <path d="M400 660 Q580 360 800 330 Q1020 360 1200 660" opacity=".45" />
        <line x1="800" y1="-40" x2="800" y2="330" opacity=".4" />
        <line x1="0" y1="520" x2="700" y2="520" opacity=".35" />
        <line x1="900" y1="520" x2="1600" y2="520" opacity=".35" />
      </g>
      <rect x="0" y="520" width="1600" height="480" fill="url(#groundFade)" />
      <polygon points="700,520 900,520 1300,1000 300,1000" fill="var(--path)" />
      {/* Two side entrances feed the same walk, below the raised beds. */}
      <path d="M240 620 Q250 745 690 810 M1360 620 Q1350 745 910 810" fill="none" stroke="var(--path)" strokeWidth="90" />
      <path d="M240 620 Q250 745 690 810 M1360 620 Q1350 745 910 810" fill="none" stroke="var(--rim)" strokeWidth="1" opacity=".18" />
      {/* planters */}
      <g fill="var(--furn)" stroke="var(--rim)" strokeWidth="1.2">
        <polygon points="40,640 560,590 520,720 20,800" />
        <polygon points="1560,640 1040,590 1080,720 1580,800" />
      </g>
      <g fill="var(--plant)" opacity=".85">
        <ellipse cx="170" cy="580" rx="110" ry="100" />
        <ellipse cx="400" cy="540" rx="120" ry="90" />
        <ellipse cx="1430" cy="580" rx="110" ry="100" />
        <ellipse cx="1200" cy="540" rx="120" ry="90" />
      </g>
      {/* far doors */}
      <path d="M150 620 V420 Q240 330 330 420 V620Z" fill="var(--wall2)" stroke="var(--rim)" />
      <path d="M1270 620 V420 Q1360 330 1450 420 V620Z" fill="var(--wall2)" stroke="var(--rim)" />
      <polygon points="470,520 800,430 1130,520 800,600" fill="var(--glow)" opacity=".05" />
      {dim && <rect width="1600" height="1000" fill="rgba(2,3,6,.5)" />}
    </Svg>
  );
}

/* ----------------------------------------------------------------- PASSAGE (D3)
 * hook post x ~525 · pond x150–520 y760–900 · signpost x1150–1300 · path (700,560)-(900,560)-(1220,1000)-(380,1000)
 */
export function Passage({ lit = false }: { lit?: boolean }) {
  return (
    <Svg>
      <Defs />
      <Orb x={1330} y={130} r={30} />
      <path d="M0 560 C240 500 420 540 600 520 S1000 500 1200 540 S1500 520 1600 560 V1000 H0Z" fill="var(--far)" />
      <Trees y={560} />
      {/* hedges */}
      <path d="M0 330 C140 300 260 340 420 320 L560 560 L380 1000 H0Z" fill="var(--hedge)" />
      <path d="M1600 320 C1460 300 1340 340 1180 330 L1040 560 L1240 1000 H1600Z" fill="var(--hedge)" />
      <rect x="0" y="560" width="1600" height="440" fill="url(#groundFade)" />
      <polygon points="700,560 900,560 1230,1000 380,1000" fill="var(--path)" />
      <g className={`passage-light ${lit ? "on" : ""}`}>
        <ellipse cx="660" cy="680" rx="380" ry="210" fill="url(#warmGlow)" opacity=".46" />
        <path d="M525 420 L380 1000 H1100 L830 600Z" fill="url(#beam)" opacity=".6" />
        <ellipse cx="740" cy="815" rx="280" ry="70" fill="#d5a566" opacity=".08" />
      </g>
      {/* hook post */}
      <rect x="520" y="300" width="10" height="400" fill="var(--furn2)" />
      <path d="M525 306 Q560 286 585 312" fill="none" stroke="var(--furn2)" strokeWidth="7" />
      {/* signpost */}
      <rect x="1196" y="520" width="12" height="200" fill="var(--furn2)" />
      <rect x="150" y="740" width="380" height="170" rx="80" fill="var(--furn2)" opacity=".5" />
    </Svg>
  );
}

/* ----------------------------------------------------------------- BOOTH INTERIOR
 * desk x300–1100 y620–720 · register ~ (520,560) · window x1050–1400 y200–500 · wall clock ~ (260,220)
 */
export function Booth() {
  return (
    <Svg>
      <Defs />
      <rect width="1600" height="1000" fill="url(#wallFade)" />
      <rect x="0" y="760" width="1600" height="240" fill="var(--furn2)" />
      {/* window */}
      <rect x="1050" y="190" width="360" height="320" fill="var(--sky2)" stroke="var(--rim)" strokeWidth="3" />
      <rect x="1050" y="190" width="360" height="320" fill="var(--sky1)" opacity=".5" />
      <line x1="1230" y1="190" x2="1230" y2="510" stroke="var(--rim)" strokeWidth="3" />
      <line x1="1050" y1="350" x2="1410" y2="350" stroke="var(--rim)" strokeWidth="3" />
      <circle cx="1310" cy="270" r="22" fill="var(--orb)" opacity=".85" />
      {/* shelf */}
      <rect x="180" y="440" width="560" height="14" fill="var(--furn)" />
      <rect x="220" y="454" width="10" height="40" fill="var(--furn)" />
      <rect x="690" y="454" width="10" height="40" fill="var(--furn)" />
      {/* desk */}
      <polygon points="260,640 1180,640 1220,730 220,730" fill="var(--furn)" stroke="var(--rim)" />
      <rect x="260" y="730" width="920" height="40" fill="var(--furn2)" />
      <circle cx="800" cy="640" r="260" fill="url(#warmGlow)" opacity=".3" />
      {/* hook wall right */}
      <rect x="1456" y="320" width="10" height="170" fill="var(--furn2)" opacity=".0" />
    </Svg>
  );
}

/* ------------------------------------------------------------------- WORK ROOM (A)
 * window x100–520 y180–540 · desk surface y640–720 x480–1300 · wall clock ~ (1380,220) · fan ~ (1380,520)
 */
export function WorkRoom({ cold = false, windowScene = null }: { cold?: boolean; windowScene?: ReactNode }) {
  return (
    <Svg>
      <Defs />
      <rect width="1600" height="1000" fill="url(#wallFade)" />
      <rect x="0" y="780" width="1600" height="220" fill="var(--furn2)" />
      {/* window */}
      <rect x="100" y="170" width="420" height="380" fill="var(--sky2)" stroke="var(--rim)" strokeWidth="4" />
      <rect x="100" y="170" width="420" height="380" fill="var(--sky1)" opacity=".5" />
      <path d="M100 550 L240 470 L330 520 L430 440 L520 500 V550Z" fill="var(--far)" />
      {windowScene}
      <line x1="310" y1="170" x2="310" y2="550" stroke="var(--rim)" strokeWidth="3" />
      <line x1="100" y1="360" x2="520" y2="360" stroke="var(--rim)" strokeWidth="3" />
      {/* shelf */}
      <rect x="1020" y="330" width="260" height="12" fill="var(--furn)" />
      {/* desk */}
      <polygon points="440,650 1340,650 1380,740 400,740" fill="var(--furn)" stroke="var(--rim)" />
      <rect x="440" y="740" width="900" height="50" fill="var(--furn2)" />
      <rect x="460" y="790" width="12" height="200" fill="var(--furn2)" />
      <rect x="1308" y="790" width="12" height="200" fill="var(--furn2)" />
      {/* lamp cone of light */}
      <polygon points="1196,420 1090,650 1300,650" fill="url(#beam)" opacity={cold ? 0.35 : 0.55} />
      {/* chair */}
      <path d="M690 780 Q720 640 790 650 L920 650 Q960 700 960 790Z" fill="var(--furn2)" stroke="var(--rim)" opacity=".9" />
    </Svg>
  );
}

/* ------------------------------------------------------------------- ROOM B
 * window x1000–1480 y180–560 · table surface y640–740 x380–900 · shelf y350 x150–520 · chest x1050–1330 y700–900
 */
export function RoomB() {
  return (
    <Svg>
      <Defs />
      <rect width="1600" height="1000" fill="url(#wallFade)" />
      <rect x="0" y="800" width="1600" height="200" fill="var(--furn2)" />
      <rect x="1000" y="170" width="480" height="400" fill="var(--sky2)" stroke="var(--rim)" strokeWidth="4" />
      <rect x="1000" y="170" width="480" height="400" fill="var(--sky1)" opacity=".5" />
      {/* city lights */}
      <g fill="var(--glow)" opacity=".55">
        {Array.from({ length: 22 }, (_, i) => (
          <rect key={i} x={1020 + (i * 53) % 440} y={430 + ((i * 37) % 110)} width="7" height="9" opacity={0.3 + ((i * 7) % 5) / 8} />
        ))}
      </g>
      <path d="M1000 570 L1090 470 L1160 520 L1250 440 L1340 510 L1480 450 V570Z" fill="var(--far)" opacity=".85" />
      <line x1="1240" y1="170" x2="1240" y2="570" stroke="var(--rim)" strokeWidth="3" />
      <rect x="130" y="350" width="420" height="12" fill="var(--furn)" />
      <polygon points="340,650 940,650 980,740 300,740" fill="var(--furn)" stroke="var(--rim)" />
      <rect x="340" y="740" width="600" height="40" fill="var(--furn2)" />
      <rect x="1040" y="720" width="300" height="180" fill="var(--furn)" stroke="var(--rim)" />
      <rect x="40" y="260" width="8" height="200" fill="var(--furn2)" />
      <path d="M44 270 Q90 300 80 360 L44 380Z" fill="var(--furn2)" opacity=".8" />
      <circle cx="640" cy="640" r="300" fill="url(#warmGlow)" opacity=".18" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- SHARED ROOM
 * window x220–560 y200–560 · table surface y660–740 x480–1120 · shelf y440 x560–1100 · hook wall x~1250
 */
export function SharedRoom({ quiet = false, occupants }: { quiet?: boolean; occupants?: ReactNode }) {
  return (
    <Svg>
      <Defs />
      <rect width="1600" height="1000" fill="url(#wallFade)" />
      <rect x="0" y="800" width="1600" height="200" fill="var(--furn2)" />
      <rect x="210" y="190" width="360" height="380" fill="var(--sky2)" stroke="var(--rim)" strokeWidth="4" />
      <rect x="210" y="190" width="360" height="380" fill="var(--sky1)" opacity=".5" />
      <g opacity=".85">
        <path d="M210 570 V420 Q300 340 390 420 V570Z" fill="var(--glass)" stroke="var(--rim)" />
        <path d="M390 570 V420 Q480 340 570 420 V570Z" fill="var(--glass)" stroke="var(--rim)" />
      </g>
      <line x1="390" y1="190" x2="390" y2="570" stroke="var(--rim)" strokeWidth="3" />
      <rect x="196" y="566" width="388" height="14" fill="var(--furn)" />
      <rect x="560" y="440" width="560" height="12" fill="var(--furn)" />
      <path d="M530 810 V550 Q580 530 630 550 V810 M960 810 V550 Q1010 530 1060 550 V810" fill="var(--furn2)" stroke="var(--rim)" strokeWidth="2" opacity={quiet ? .55 : .35} />
      {occupants}
      <ellipse cx="800" cy="822" rx="420" ry="38" fill="rgba(0,0,0,.25)" />
      <polygon points="470,670 1130,670 1180,760 420,760" fill="var(--furn)" stroke="var(--rim)" />
      <rect x="470" y="760" width="660" height="50" fill="var(--furn2)" />
      <path d="M500 810 V980 M1100 810 V980" stroke="var(--furn2)" strokeWidth="18" />
      <rect x="1220" y="260" width="10" height="260" fill="var(--furn2)" />
      <path d="M1225 270 Q1260 250 1285 276" fill="none" stroke="var(--furn2)" strokeWidth="7" />
      <rect x="1100" y="780" width="380" height="170" fill="var(--furn)" stroke="var(--rim)" />
      {!quiet && <circle cx="800" cy="640" r="320" fill="url(#warmGlow)" opacity=".22" />}
      {quiet && <circle cx="1260" cy="380" r="260" fill="url(#warmGlow)" opacity=".16" />}
    </Svg>
  );
}

/* --------------------------------------------------------------------- MEADOW
 * soft abstract horizon used for 'what remains' and the morning.
 */
export function Meadow({ gateOpen = false, flowerSpace = true }: { gateOpen?: boolean; flowerSpace?: boolean }) {
  return (
    <Svg>
      <Defs />
      <Orb x={800} y={560} r={58} />
      <path d="M0 620 C260 580 460 610 700 590 S1150 560 1600 610 V1000 H0Z" fill="var(--far)" />
      <path d="M0 690 C300 650 640 700 960 670 S1400 650 1600 690 V1000 H0Z" fill="var(--mid)" />
      <rect x="0" y="720" width="1600" height="280" fill="url(#groundFade)" />
      {flowerSpace && <ellipse cx="800" cy="900" rx="520" ry="60" fill="rgba(0,0,0,.18)" />}
      <g stroke="var(--plant)" strokeWidth="2" opacity=".5" fill="none">
        {Array.from({ length: 46 }, (_, i) => (
          <path key={i} d={`M${20 + i * 35} ${1000} q${(i % 3) - 1} -${60 + ((i * 17) % 50)} ${((i * 5) % 11) - 5} -${90 + ((i * 29) % 60)}`} />
        ))}
      </g>
      {gateOpen && (
        <g stroke="var(--rim)" strokeWidth="3" fill="none">
          <path d="M120 740 V560 M300 740 V560" />
          <path d="M300 560 Q260 580 240 640" />
        </g>
      )}
    </Svg>
  );
}
