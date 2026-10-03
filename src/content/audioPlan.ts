import type { BedName, TrackId } from "../audio/director";

/**
 * Exploration mode: the song is a bed, never the scene clock (a player may stay 20 seconds or 8 minutes).
 * Cinematic beats (intro, loaders, AFTERLIGHT voice) are paced on the audio clock where the song is the authority.
 * Silence is part of the score: several scenes deliberately fade music to nothing.
 */
export interface AudioPlan {
  track: TrackId | null;
  level: number;
  bed: BedName | null;
  bedGain?: number;
  fade?: number;
}

export const audioPlan: Record<string, AudioPlan> = {
  D1: { track: "dusk", level: 0.15, bed: "garden", bedGain: 0.9 },
  D2: { track: "dusk", level: 0.09, bed: "garden", bedGain: 0.8 }, // restrained: no swell when they notice each other
  D3: { track: "dusk", level: 0.11, bed: "garden", bedGain: 0.7 },
  D4: { track: "dusk", level: 0.14, bed: "garden", bedGain: 0.6, fade: 3 },

  O1: { track: "orbit", level: 0.14, bed: "rain", bedGain: 0.55 },
  O2: { track: "orbit", level: 0.13, bed: "rain", bedGain: 0.75 },
  O3A: { track: "orbit", level: 0.07, bed: "room", bedGain: 0.9 },
  O3B: { track: "orbit", level: 0.07, bed: "room", bedGain: 0.9 },
  O4: { track: "orbit", level: 0.08, bed: "booth", bedGain: 0.9 },
  O5: { track: "orbit", level: 0.2, bed: null, fade: 3 },

  H1: { track: "hours", level: 0.12, bed: "room", bedGain: 1 },
  H2: { track: "hours", level: 0.035, bed: "room", bedGain: 1, fade: 5 },
  H3: { track: null, level: 0, bed: "booth", bedGain: 0.9, fade: 3 },
  H4: { track: null, level: 0, bed: "room", bedGain: 0.9, fade: 3 },
  H5: { track: "hours", level: 0.1, bed: "booth", bedGain: 0.6, fade: 4 },

  A1: { track: "dawn", level: 0.13, bed: "garden", bedGain: 0.45 },
  A2: { track: "dawn", level: 0.05, bed: "garden", bedGain: 0.5, fade: 4 },
  A3: { track: "dawn", level: 0.11, bed: "morning", bedGain: 0.35, fade: 3 },
  A4: { track: "dawn", level: 0.012, bed: "room", bedGain: 0.5, fade: 6 }, // portrait: almost nothing, room tone only
  A5: { track: "archive", level: 0.13, bed: null, fade: 3 },

  F1: { track: "afterlight", level: 0.2, bed: null, fade: 4 },
  F2: { track: "afterlight", level: 0.18, bed: "morning", bedGain: 0.7, fade: 4 },
  F3: { track: "afterlight", level: 0.17, bed: "morning", bedGain: 0.8 },
  F4: { track: "afterlight", level: 0.14, bed: "morning", bedGain: 0.9 },
  F5: { track: "afterlight", level: 0.06, bed: "morning", bedGain: 1, fade: 10 }
};

/** Which song carries each tape; used by the archive hand-off loader. */
export const tapeTrack: TrackId[] = ["dusk", "orbit", "hours", "dawn", "afterlight"];
export const tapeLevel = [0.15, 0.14, 0.12, 0.13, 0.2];
