import type { Beat } from "../ui/Conversation";
import type { RegisterRow } from "../ui/RegisterBook";
import { caretakerHoursLead, caretakerOrbit } from "./copy";

/* ---------------------------------------------------------------------------
 * INTRO — the eight Firefly lines in the original eight timing slots.
 * `at` / `dur` are seconds relative to entering the intro function (see MINJI index.html):
 *    line n appears at `at`, stays for `dur`, then hides for ~0.5s before the next.
 * Line 6 is the music cue: MEMORY.mp3 begins from source offset 8.0s at t = 19.8s.
 * ------------------------------------------------------------------------- */
export const INTRO_CUES = [
  { at: 2.6, dur: 2.2, text: "there you are.", ff: [50, 43] },
  { at: 5.3, dur: 3.5, text: "Something was left here for you.", ff: [44, 38] },
  { at: 9.3, dur: 3.2, text: "Not quite a letter.", ff: [56, 40] },
  { at: 13.0, dur: 2.8, text: "Not a request, either.", ff: [48, 35] },
  { at: 16.3, dur: 3.0, text: "Five recordings. One night.", ff: [42, 44] },
  { at: 19.8, dur: 3.5, text: "They remember the same two people differently.", ff: [58, 38] },
  { at: 23.8, dur: 3.0, text: "Some things stay. Some are released.", ff: [52, 46] },
  { at: 27.3, dur: 3.5, text: "Start where the night did.", ff: [47, 39] }
] as const;
export const INTRO_MUSIC_AT = 19.8;
export const INTRO_MUSIC_OFFSET = 8.0;
export const INTRO_PRELOAD_AT = 16.3;
export const INTRO_END = 31.6;

/* ------------------------------------------------------------------ DUSK */
export const D1_ORIENTATION =
  "Closing in a few minutes. The glasshouse path is open, if you're going through. Mind the west gate — I chain it at close.";

/**
 * D2 — the first crossing, as an ordinary event.
 *
 * Both of them are carrying things at closing time. One stack slips. One person
 * steadies it. Something small is dropped and returned. Nothing here is destiny:
 * it is two people at the same narrow gate on the same evening, being useful.
 */
export const D2_APPROACH = [
  { text: "Someone comes up the west path with a stack of flattened plant crates on one shoulder.", ms: 3200 },
  { text: "From the east, someone with a coat over one arm, checking the glass panes as they walk.", ms: 3200 },
  { text: "Both of them are heading for the same gap between the doors.", ms: 2600 }
];

export const D2_CROSSING = [
  { who: "", text: "The top crate slides off the stack and falls.", ms: 2000 },
  { who: "", text: "The other catches it against a hip without stopping.", ms: 2000 },
  { who: "A", text: "Sorry — thanks.", ms: 1800 },
  { who: "B", text: "It was coming down on me either way.", ms: 2200 },
  { who: "A", text: "You're going through?", ms: 1500 },
  { who: "B", text: "I was. You're standing in the gate.", ms: 2200 },
  { who: "A", text: "Right. The west gate gets chained at closing.", ms: 2400 },
  { who: "B", text: "Then we're going the same way.", ms: 2000 },
  { who: "", text: "They go through one at a time. The gap is only wide enough for one.", ms: 2400 },
  { who: "", text: "Something small rings off the gravel. A brass tag on a loop of string.", ms: 2600 },
  { who: "B", text: "Yours.", ms: 1300 },
  { who: "A", text: "It's a glasshouse tag. Half the garden carries one.", ms: 2400 },
  { who: "B", text: "Still. Losing it would be a nuisance.", ms: 2200 },
  { who: "", text: "They both bend for it. A's hand gets there first and B waits.", ms: 2400 },
  { who: "A", text: "I'm here most evenings. Closing time, usually.", ms: 2500 },
  { who: "B", text: "Then I'll probably see you here.", ms: 2000 },
  { who: "", text: "It isn't a promise. It's just what the evenings look like.", ms: 2200 }
];
export const D3_CARETAKER =
  "Past the glasshouse the path loses its lamps. There's a lantern on the hook. Take it, or hand it along.";

/* ----------------------------------------------------------------- ORBIT */
export const orbitWitnessBeats = (variantId: string): Beat[] => [
  ...(caretakerOrbit[variantId] ?? caretakerOrbit["caretaker.orbit.default"]).map((text) => ({ who: "Caretaker", text })),
  { who: "Caretaker", text: "I don't say what it is. I only open the gate and close it." }
];

export const orbitRegisterRows: RegisterRow[] = [
  { night: "night", who: "A", inn: "19:55", out: "21:30" },
  { night: "night", who: "B", inn: "20:05", out: "21:30", hl: true },
  { night: "next", who: "B", inn: "19:30", out: "21:10" },
  { night: "next", who: "A", inn: "19:40", out: "21:10", hl: true },
  { note: "Same two hands. Same hours, give or take." }
];

/**
 * O2 — routine, not romance. This is the chapter's whole job: familiarity shown
 * through behaviour, so that THE HOURS BETWEEN has something to hurt.
 */
export const O2_ROUTINE = [
  { text: "B sets the cup down in the ring already worn into the table. Neither of them looks at it.", ms: 4000 },
  { text: "A moves the lantern to the hook by the door without being asked. It has been going to that hook for a while.", ms: 4200 },
  { who: "B", text: "You never finished the sentence from Tuesday.", ms: 2800 },
  { who: "A", text: "I know. I was getting to it.", ms: 2400 },
  { who: "B", text: "You were getting to it for about forty minutes.", ms: 3000 },
  { who: "A", text: "They were a good forty minutes.", ms: 2600 },
  { who: "B", text: "They were.", ms: 1800 },
  { text: "The radio finds a song. One of them hums two bars and stops. The other pretends not to hear, and doesn't turn it off.", ms: 4600 }
];

export const CONSTELLATION_CAPTIONS: Record<string, string> = {
  lantern: "a lantern, carried more than once",
  flower: "something growing by the door",
  register: "the same two names, again",
  phone: "a phone that woke the room, and didn't startle it",
  small: "a small brass tag, given a place",
  workdesk: "a desk that was always a little ahead of its owner",
  planner: "a planner full of a life of its own",
  radio: "a song both of them half knew",
  window: "a window that kept watch"
};
export const CONSTELLATION_OPEN = "These are the parts that stayed lit.";

/* ----------------------------------------------------------------- HOURS */
/** H1 — the promise that the rest of the chapter will quietly break. */
export const H1_AFTER_THIS = [
  { text: "A types four words, reads them back, and sends them.", ms: 3200 },
  { who: "A", text: "\"after this. i'll come by.\"", ms: 3200 },
  { text: "There is a stack of work between A and the word this. It looks like an hour. It is not an hour.", ms: 4200 }
];

export const H2_MURMUR = "One minute. Give me one minute.";
/** H2 — the absence, made of ordinary behaviour rather than explanation. */
export const H2_WAIT = [
  { text: "Under the garden lamp, B checks the time. Then checks it again, which is the same thing.", ms: 3800 }
];
export const H2_LEFT = [
  { text: "B doesn't pace. Hands in coat pockets, B watches the east path from under the lamp.", ms: 4000 },
  { text: "Then B walks back the way they came, and the lamp goes to lighting an empty path.", ms: 3600 }
];
export const H2_TOO_LATE = [
  { text: "When A finally looks up, the path is dark. The hour went where hours go.", ms: 4200 }
];
export const H2_REVERSE = [
  { text: "It happens the other way round on other nights. Nobody is early. Nobody is late. They simply arrive into different hours.", ms: 5000 }
];

export const hoursRegisterRows: RegisterRow[] = [
  { night: "first night", who: "B", inn: "19:40", out: "21:05" },
  { night: "first night", who: "A", inn: "21:30", hl: true },
  { night: "another night", who: "A", inn: "20:10", out: "21:40" },
  { night: "another night", who: "B", inn: "22:05", hl: true },
  { note: "Written down as it happened. The book has no opinion." }
];
export const H3_REMARK =
  "Twenty-five minutes one night. Twenty-five minutes the other way on another. I'm not saying anything about it. I'm only reading it out.";
export const H3_REMARK_2 =
  "You'd have to have been in the room to know what either of them was carrying. I was in the booth.";

export const hoursLimitBeats = (variantId: string): Beat[] => [
  { who: "Caretaker", text: "Before you go on, I should say what I actually know." },
  { who: "Caretaker", text: caretakerHoursLead[variantId] ?? caretakerHoursLead["caretaker.hours.default"] },
  { who: "Caretaker", text: "What I don't know is what either of them was carrying while it happened." },
  { who: "Caretaker", text: "A gatekeeper sees comings and goings. That's a very small part of two people." },
  { silence: 3 },
  { who: "Caretaker", text: "So I won't tell you who was late, or who was right, or what anyone meant." },
  { who: "Caretaker", text: "I can tell you the night is nearly over. And the garden will be here after it." }
];

/* ------------------------------------------------------------------ DAWN */
export const A1_CARETAKER = "Dawn comes early here. I'll be in the back.";

/**
 * A2 — the mutual ending. Fictional symbolic characters; the ending is agreed, not argued.
 * It says enough to be earned: it mattered, care was real, presence and care did not always match,
 * the pattern cannot continue, and neither of them has to become the villain of it.
 */
export const conversationBeats: Beat[] = [
  { who: "A", text: "You came." },
  { who: "B", text: "So did you." },
  { silence: 3 },
  { who: "A", text: "I wasn't sure I would." },
  { who: "B", text: "Neither was I. I came anyway." },
  { who: "A", text: "I've been trying to find the right way to say this for weeks." },
  { who: "B", text: "So have I. That's probably the answer." },
  { silence: 3.2 },
  { who: "A", text: "I care about you. That part was never the problem." },
  { who: "B", text: "No. It wasn't." },
  { who: "A", text: "I wasn't there the way I said I would be. I kept saying after this, and after this kept not arriving." },
  { who: "B", text: "I waited a lot of evenings. I'd rather say that once than pretend I didn't." },
  { who: "A", text: "You should. I'd rather hear it." },
  { silence: 3.2 },
  { who: "A", text: "I don't think we can keep doing this to each other." },
  { who: "B", text: "No. I don't think we can." },
  { who: "A", text: "So this is where we stop." },
  { who: "B", text: "This is where we stop." },
  { silence: 4 },
  { who: "A", text: "I'm not asking you for anything. I just didn't want it to end by fading out." },
  { who: "B", text: "Then let it end properly." },
  { who: "A", text: "Properly." },
  { silence: 3.4 },
  { who: "A", text: "It mattered. All of it. Even the parts I got wrong." },
  { who: "B", text: "It did. I have the evenings to show for it." },
  { silence: 3.2 },
  { who: "A", text: "I don't know what comes after this." },
  { who: "B", text: "Neither do I." },
  { who: "A", text: "Then I'll leave it there." },
  { who: "B", text: "So will I." },
  { silence: 3.6 }
];

export const WHAT_REMAINS: Record<
  string,
  { label: string; look: string; verb: string; after: string; action: string }
> = {
  memory: {
    label: "a small jar with a light in it",
    look: "A small jar. Something warm is in it. You could keep it where it can be seen.",
    verb: "keep it where it shows",
    after: "You set it where the morning will find it.",
    action: "action.dawn.keep_memory"
  },
  guilt: {
    label: "a heavy stone",
    look: "A heavy stone, smoothed by being held. You could set it down here.",
    verb: "set it down",
    after: "It doesn't roll. It simply rests.",
    action: "action.dawn.release_guilt"
  },
  question: {
    label: "a sealed envelope",
    look: "An envelope with a question on it that nobody is going to answer. You could leave it sealed.",
    verb: "leave it sealed",
    after: "It stays closed. Not every question needs opening.",
    action: "action.dawn.release_question"
  },
  gratitude: {
    label: "a cutting from the flower",
    look: "A sprig cut from the flower. You could carry it, or place it beside the flower.",
    verb: "place it by the flower",
    after: "It looks as if it had always been growing there.",
    action: "action.dawn.keep_gratitude"
  },
  lesson: {
    label: "a worn pencil",
    look: "A pencil, worn on one side from use. You could keep what it taught.",
    verb: "keep it",
    after: "It goes into your pocket like a habit.",
    action: "action.dawn.keep_lesson"
  }
};

export const PORTRAIT_PRE = "Here the story stops standing in for anyone.";
export const PORTRAIT_CAPTION = "drawn by hand · 45 days";

/* ----------------------------------------------------------- AFTERLIGHT
 * DRAFT of the creator's own voice. This file is the single place to rewrite it.
 * Required qualities: gratitude · accountability without self-punishment · no pressure ·
 * no prediction · no claim about her private feelings · permission for an ending to be an ending.
 * `hold` is the minimum seconds a line stays on screen (reading time is added on top).
 */
export const VOICE_LINES: { text: string; hold: number }[] = [
  { text: "I'm going to stop speaking through them now.", hold: 4.2 },
  { text: "This part is only me, and only to you.", hold: 4.4 },
  { text: "Thank you. For the time, for the patience, for the ordinary nights that mattered to me more than I said.", hold: 6.8 },
  { text: "I wasn't always there. When work took everything, I went quiet.", hold: 5.6 },
  { text: "I thought of you more often than I knew how to show. I've learned that thinking of someone is not the same as being there for them.", hold: 8.2 },
  { text: "I'm sorry for the times I wasn't present when I could have been.", hold: 5.6 },
  { text: "That isn't an excuse. It's only true, and you deserve to hear it without one.", hold: 6 },
  { text: "We chose this ending together, and I'm still at peace with how carefully we did it.", hold: 6.2 },
  { text: "I'm not asking you for anything. Not forgiveness. Not a reply. Not a second chance.", hold: 6.4 },
  { text: "I don't know what happens after this. Maybe our paths cross again, differently. Maybe they don't. Either is allowed.", hold: 8.4 },
  { text: "What I do know is that I'm grateful this version of my life had you in it.", hold: 6.6 },
  { text: "Be gentle with yourself. I hope the morning treats you well.", hold: 6 }
];

export const BLOOM_LINE = "Something grew here because it was here. It doesn't have to be more than that.";
export const BLOOM_TOUCH_FAMILIAR = "It has been noticed in every chapter. It leans toward your hand, once, and then lets go.";
export const BLOOM_TOUCH = "A petal moves under your finger, and settles.";
export const GATE_LINE = "Morning, then.";

/* ------------------------------------------------------------------ JEV
 * Optional, bounded interpretation. These are the ONLY categories the reader's
 * one optional word may be classified into, and each has one authored response.
 * Nothing here can change the story: no endings, no guards, no facts about anyone.
 */
export const JEV_REFLECTION_PROMPT = "One word, if you want to leave one. Or nothing at all.";
export const JEV_REFLECTION_RESPONSES: Record<string, string> = {
  KEEP: "You keep it. Whatever it is, it's yours to carry.",
  RELEASE: "You set it down. It stays down.",
  FORGIVE: "You leave the door where it is. Not shut. Not held open.",
  UNCERTAIN: "Not knowing is an answer too. You leave it as it is.",
  OTHER: "It's noted, and it stays yours."
};
