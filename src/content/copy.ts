import type { StoryState } from "../engine";

/**
 * Inspection copy — one short observation per touch.
 *
 * Writing rules (from the handoff):
 *  - observable things only; never state what the recipient privately feels or thinks
 *  - no exposition paragraphs; at most one image and one small beat
 *  - not every object is a symbol: some are only here to make the room feel lived in
 *  - nothing here is derived from the creator's private notes
 */
export interface Line {
  speaker?: string;
  text: string;
}
type Entry = Line | Line[] | ((s: StoryState, n: number) => Line | Line[]);

const L = (text: string): Line => ({ text });
const C = (text: string): Line => ({ text, speaker: "Caretaker" });
const echo = (s: StoryState, id: string) => s.echoes[id] === true;

export const copy: Record<string, Record<string, Entry>> = {
  /* ------------------------------------------------------------- DUSK */
  D1: {
    "object.caretaker.register": [
      L("A visitor register. Names, times in, times out. Mostly the same handful of hands."),
      L("Nothing new. Nobody has underlined anything.")
    ],
    "object.shared.window": [
      L("The last light holds in the glass. Beyond it someone moves along the far path, too distant to name."),
      L("Gone behind the hedge.")
    ],
    "object.shared.lantern": [
      C("That one stays lit longest. Past the glasshouse the path loses its lamps."),
      L("Still warm from the evening.")
    ],
    "object.room.clock": [
      L("A few minutes before closing. The second hand carries on whether anyone watches it or not."),
      L("Same minute. Different second.")
    ],
    "object.garden.map": [
      L("Paths loop through the glasshouse and the west garden. The east gate is marked with a small note: chained at close."),
      L("One narrow stretch is marked only by a faded line. The line doesn't say where it ends.")
    ],
    "object.caretaker.radio": [
      C("Leave it. It only behaves when nobody's touching it."),
      L("Static, then half a song, then the evening news about weather that already happened.")
    ],
    "object.room.fan": [
      L("A vent fan, turning slowly. A strip of paper tied to its grille lifts and falls."),
      C("That one doesn't behave either."),
      L("The strip flaps like it has opinions.")
    ],
    "object.room.drawer": [
      L("Twine. Spare keys. A pencil worn down to a stub. Nothing in here is waiting to become a metaphor."),
      L("Still just twine.")
    ]
  },
  D2: {
    "object.d2.west": [
      L("The west path arrives at a stack of flattened plant crates, carried on one shoulder. Unhurried. Someone who looks at things before touching them."),
      L("The footsteps are closer now. The crates knock together once.")
    ],
    "object.d2.east": [
      L("The east path arrives with a coat over one arm and the glass panes being read like a map."),
      L("Closer. Not in a hurry either. Same gap, same evening.")
    ],
    "object.shared.bench": [
      L("A bench where both paths meet, and behind it the gap between the two doors — wide enough for one person, and no more."),
      L("The wood is still warm from the day.")
    ],
    "object.shared.small": [
      L("A small brass tag on a loop of string, on the gravel where it fell. It's a glasshouse tag; half the garden carries one."),
      L("You put it back where it was. It looks better there.")
    ],
    "object.d2.label": [
      L("A plant label in careful handwriting: night-flowering. Water sparingly."),
      L("Underneath, someone has added a tiny question mark.")
    ],
    "object.d2.glass": [
      L("You wipe a clear patch in the condensation. The garden beyond is as dark as before, only closer."),
      L("The patch fogs over again, slowly, as if it never happened.")
    ]
  },
  D3: {
    "object.shared.lantern": [
      L("The wick catches. Warm light spreads across the gravel and the hedges step back to make room."),
      L("It's the same lantern from the hook by the door — the one the Caretaker keeps close. It sways a little when the air shifts.")
    ],
    "object.garden.map": [
      L("The narrow section with the faded line is just ahead. It still doesn't say where it ends."),
      L("Somebody has folded this corner many times.")
    ],
    "object.d3.moth": [
      L("A moth circling the flame at a respectful distance."),
      L("It has decided to stay.")
    ],
    "object.d3.sign": [
      L("A wooden sign: West garden. Please keep to the path. In pencil underneath: mostly."),
      L("The pencil has been gone over more than once.")
    ],
    "object.d3.water": [
      L("Still water at the edge of the path. The lantern lays a thin line of gold across it."),
      L("A single ripple, and then the line mends itself.")
    ],
    "object.d3.shade": [
      L("You tilt the shutter. The light narrows to a coin, then spills again when you let go."),
      L("Narrow. Wide. Narrow. The moth is unimpressed.")
    ]
  },
  D4: {
    "object.d4.gate": [L("The gate stands open at the end of the path, wide enough for two people not to touch.")],
    "object.shared.window": [L("Through the glass, one figure going one way. Then the other going the other.")],
    "object.shared.lantern": [L("The lantern is still burning on its hook, as if the evening hasn't been told.")],
    "object.caretaker.register": [L("The Caretaker writes something small in the register, and does not say what.")]
  },

  /* ------------------------------------------------------------ ORBIT */
  O1: {
    "object.caretaker.register": [
      L("The same two hands, again and again down the page. Nothing underlined. Only frequency."),
      L("Entries creep closer together as the page goes on.")
    ],
    "object.garden.flower": [
      L("The seedling has become something with leaves. It leans a little toward the door."),
      L("Still leaning. It has made up its mind about the door.")
    ],
    "object.shared.small": [
      L("The brass tag hangs from a nail by the window now. Someone gave it a place."),
      L("It turns slowly on its string when the door opens.")
    ],
    "object.caretaker.radio": [
      L("Tuned to a different station than before, quieter. One side of the dial is worn smooth."),
      L("A song starts mid-line. One of them knows the words.")
    ],
    "object.shared.lantern": (s) =>
      echo(s, "echo.meta.lantern_thread")
        ? L("It hangs where you'd expect it to now, as though the garden learned where it belongs.")
        : L("A lantern on a hook by the door. It looks well used.")
  },
  O2: {
    "object.personal.phone": [
      L("A phone on the table. It wakes, shows a few words, goes dark. Nothing urgent; the room doesn't hold its breath."),
      L("It buzzes once. Someone across the room smiles at it. Nothing else happens.")
    ],
    "object.shared.lantern": [
      L("The lantern hangs by the window, turned low. Nobody has to explain it anymore."),
      L("A lifted it off the hook on the way in and set it down here without breaking a sentence. Low and steady, like a habit.")
    ],
    "object.shared.small": [
      L("The brass tag has company now: a shelf, a string, a place."),
      L("Tag. String. Shelf. A tiny, complete arrangement.")
    ],
    "object.garden.flower": [
      L("The flower has a pot of its own now, and a stake in case it needs one."),
      L("It has leaned toward the window all evening.")
    ],
    "object.caretaker.radio": [
      L("A song starts mid-line. One of them knows the words; the other pretends not to."),
      L("The station drifts, and nobody retunes it.")
    ],
    "object.shared.window": [
      L("The glasshouse lights lie across the courtyard like something spilled."),
      L("Rain has started on the glass. Neither of them mentions it.")
    ],
    "object.room.cup.a": [
      L("A chipped mug, handle turned out. The tea went cold during a good conversation."),
      L("B moves it an inch so the handle faces the same way it always does. Nobody asked.")
    ],
    "object.room.cup.b": [
      L("A cup set down in the same spot, many times. There's a ring worn into the table for it."),
      L("The ring is almost a tiny moon. A sets it back inside the ring without looking.")
    ]
  },
  O3A: {
    "object.a.workdesk": [
      L("A desk occupied by tomorrow. Open files, a half-written list, a lamp bent to exactly the right angle."),
      L("Deadlines in neat handwriting, each a little closer than the last.")
    ],
    "object.personal.phone": [
      L("Face-up and charging. A few messages waiting under a stack of work notifications."),
      L("The screen lights, thinks about it, goes dark.")
    ],
    "object.room.clock": [L("Late. It is later than the room looks."), L("Late is a place, too.")],
    "object.room.cup.a": [L("Coffee at three different stages of cold."), L("The oldest one has a skin.")],
    "object.shared.window": [
      L("From here the glasshouse is a small lit shape. It looks far away for how close it is."),
      L("Someone crosses the courtyard, too far to tell who.")
    ],
    "object.room.fan": [
      L("The fan pushes the papers into a slow dance. You weigh them down with the cup."),
      L("The papers go back to dancing as soon as you let go.")
    ]
  },
  O3B: {
    "object.b.planner": [
      L("A planner with every square taken: names, places, other people's evenings. A life with a great deal in it, most of it nothing to do with anyone else."),
      L("Some squares have a tiny drawn star. You can't tell what for. It isn't yours to know.")
    ],
    "object.shared.window": [
      L("From here the garden is a thin line of light. Across the street another window is awake too."),
      L("The thin line of light flickers once.")
    ],
    "object.shared.small": [L("The brass tag, hung by the door where it would be seen on the way out."), L("It catches the hall light.")],
    "object.room.drawer": [
      L("Cables, receipts, and a tidy stack of postcards nobody has posted yet."),
      L("The postcards have a rubber band that has given up.")
    ],
    "object.room.cup.b": [L("A cup with a tea bag folded over the rim, ready for the kettle."), L("Ready, and in no rush.")]
  },
  O4: {
    "object.shared.lantern": [L("The lantern rests on its hook inside the booth, as if it too clocks off.")],
    "object.caretaker.register": [L("The register, open to a page that's mostly the same two names.")]
  },

  /* ------------------------------------------------- THE HOURS BETWEEN */
  H1: {
    "object.personal.phone": [
      L("A few words sent an hour ago, still unanswered: after this. i'll come by."),
      L("The screen wakes, shows the same few words, and sleeps again.")
    ],
    "object.room.clock": [
      L("The clock here reads late. In the glasshouse across the courtyard it reads earlier. Same night, different hours — and the work between here and there."),
      L("Louder than it was a minute ago.")
    ],
    "object.a.workdesk": [
      L("Piles. Lists. A lamp bent over all of it. The work isn't villainous; it is only very, very present."),
      L("The cursor blinks at the end of a sentence nobody is finishing.")
    ],
    "object.shared.window": [
      L("Far off, a figure waits on the garden path, small as a match head."),
      L("Still there. Still small.")
    ],
    "object.room.fan": [L("Papers lift and settle. Nothing else here moves."), L("Settle.")]
  },
  H2: {
    "object.personal.phone": [L("Face-up on the desk. The sent words are still there. Nobody has answered them, including the person who sent them.")],
    "object.shared.window": [
      L("Far down the path, a small figure under a lamp, checking the time. Then checking it again."),
      L("The lamp is still lit. The figure is not.")
    ],
    "object.room.clock": [L("It keeps going."), L("It keeps going.")],
    "object.a.workdesk": [L("The cursor blinks at the end of an unfinished sentence."), L("Blink.")]
  },
  H3: {
    "object.caretaker.register": [
      L("The register, open to two particular nights. Both nights have the same two names in different orders, an hour and a half apart."),
      L("Twenty-five minutes, either way round. The book records it without comment.")
    ]
  },
  H4: {
    "object.personal.phone": [
      L("Face-down. Whoever put it there didn't want it buzzing, or didn't want to see it. The room doesn't say which."),
      L("Still face-down.")
    ],
    "object.shared.lantern": [
      L("Still burning, low, on a table nobody is sitting at."),
      L("The light is patient. It always was.")
    ],
    "object.garden.flower": [
      L("The leaves have lost some of their lift. Dry, rather than dying."),
      L("It leans, waiting for ordinary things.")
    ],
    "object.a.workdesk": [
      L("The desk followed them here. It was here on the nights that mattered and the nights that didn't — it is not the villain, only very, very present."),
      L("A sticky note says: reply. It has been saying that for a while.")
    ],
    "object.room.drawer": [
      L("The drawer sticks. Inside, a coaster set aside rather than thrown away."),
      L("The coaster is still there. It didn't ask to be.")
    ],
    "object.room.clock": [L("It is the loudest thing in the room."), L("It was louder the other night.")],
    "object.room.cup.a": [L("One cup. Cold."), L("Still one. The ring worn into the table has room for a second, and doesn't get one.")],
    "object.shared.window": [
      L("The glasshouse lights are on. Nobody is crossing the courtyard."),
      L("On other nights the light went the other way — someone walking toward this window while this room was already dark. The register keeps both versions. The room only keeps this one.")
    ],
    "object.shared.small": (s) =>
      echo(s, "echo.orbit.shared_object_noticed")
        ? L("The brass tag has been moved from its nail to the table. Whoever moved it didn't hang it back.")
        : L("A small brass tag lies on the table, away from anything."),
    "object.room.fan": [L("It still works perfectly. Some things don't mean anything."), L("Perfectly.")]
  },

  /* ------------------------------------------------------------- DAWN */
  A1: {
    "object.shared.lantern": [L("Still lit, though the sky no longer needs it."), L("Still lit.")],
    "object.garden.flower": [L("Still closed. Not holding anything back; just not finished."), L("Still closed.")],
    "object.caretaker.register": [L("No new entries. The Caretaker has put the pen down."), L("The pen lies where it was set.")]
  },
  A2: {
    "object.shared.lantern": [L("The lantern burns steadily. Nobody has to hold it."), L("Steady.")]
  },
  A3: {
    "object.room.drawer": [L("A drawer, half-open, with nothing in it that wasn't put there on purpose.")],
    "object.shared.small": [L("The brass tag, quiet on its string.")],
    "object.shared.lantern": [L("Set down at last. It doesn't mind.")]
  }
};

export function pickCopy(scene: string, object: string, s: StoryState, n: number): Line | null {
  const entry = copy[scene]?.[object];
  if (!entry) return null;
  const v = typeof entry === "function" ? entry(s, n) : entry;
  if (Array.isArray(v)) return v[Math.min(n, v.length - 1)] ?? null;
  return v;
}

/** The Caretaker, when spoken to directly. Practical, kind, dry. */
export const caretakerTalk: Record<string, Line[]> = {
  D1: [
    C("We close soon. If you're staying, mind the west path. It loses the light first."),
    C("There's a lantern on the hook by the door. People borrow it and bring it back. Mostly."),
    C("Take your time. The garden isn't going anywhere tonight."),
    C("I've done this round for years. You notice who looks at what.")
  ],
  D3: [C("Past the glasshouse the path loses its lamps. There's a lantern on the hook. Take it, or hand it along.")],
  O1: [
    C("They're in more often now. I've started setting out two cups. Habit, mostly."),
    C("I don't ask. It isn't my business. But it's hard not to notice who wipes their boots."),
    C("I leave the lantern where it's easy to find now. Nobody asked me to.")
  ],
  H1: [C("Late tonight. Most nights are, lately."), C("The two of them keep different hours than they used to. I only write down what I see.")],
  A1: [C("Dawn comes early here. I'll be in the back."), C("They're both here. That hasn't happened before.")]
};

export const caretakerOrbit: Record<string, string[]> = {
  "caretaker.orbit.deep_familiar": [
    "Same two, most nights. One stops to read the register on the way in. The other checks the lantern is lit.",
    "I've stopped pretending I don't notice."
  ],
  "caretaker.orbit.register": [
    "You've read the book. Then you've seen it: they're in more often. Same hours, give or take.",
    "I only write down what I see."
  ],
  "caretaker.orbit.lantern_familiar": [
    "That lantern's been carried more than once now. I've started leaving it where it's easy to find.",
    "Don't tell them."
  ],
  "caretaker.orbit.lantern": [
    "Somebody keeps carrying that lantern out and bringing it back.",
    "I didn't use to leave it so close to the door."
  ],
  "caretaker.orbit.default": [
    "They've both started using this place often.",
    "That's all I can honestly say."
  ]
};

/**
 * H5 — the Caretaker's limit. The core truth is identical on every route:
 * seeing arrivals and departures is not the same as knowing what happened inside two people.
 */
export const caretakerHoursLead: Record<string, string> = {
  "caretaker.hours.fragments_and_light":
    "I know when the gate opened and when it closed. I know someone left a lantern burning in an empty room.",
  "caretaker.hours.arrival_and_signal":
    "I know who came in, and who had already gone. I know a phone buzzed somewhere and nobody answered it.",
  "caretaker.hours.arrival_and_time":
    "I know the hours: who came in, and who had already gone by then. I know the clock was the loudest thing in the room.",
  "caretaker.hours.light_only": "I know a lantern was left burning. I know the hours the gate keeps.",
  "caretaker.hours.default": "I know who walks in, who walks out, and what the book says."
};
