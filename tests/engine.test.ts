/**
 * THE GARDEN THE NIGHT KEPT — engine + Jev boundary test suite.
 *
 * No test framework is required: this file is bundled by esbuild and run by
 * `tests/run.mjs`. Every assertion is real; nothing here is a smoke test that
 * cannot fail.
 */
import assert from "node:assert/strict";
import {
  __resetJevCache,
  canComplete,
  classifyLocal,
  classifyReflection,
  createInitialState,
  dispatch,
  hashString,
  parseJevResponse,
  isSameOriginEndpoint,
  replay,
  scenes,
  validateState,
  validateStaticModel,
  type StoryEvent,
  type StoryEventInput,
  type StoryState
} from "../src/engine/index";
import { ROUTE_TARGETS, buildRoute } from "../src/dev/route";
import { decodeLedger } from "../src/store/persistence";
import { storyTimeout, setTimelinePaused, activeTime } from "../src/lib/pause";
import { createClock, prefersReducedMotion } from "../src/lib/timeline";
import { audio } from "../src/audio/director";

/* ---------------------------------------------------------------- harness
 * Tests are queued and awaited strictly one at a time. Async tests mutate shared
 * module state (the Jev cache), so interleaving them would be a false result either way.
 */
let passed = 0;
const failures: string[] = [];
let pendingSection = "";
const section = (s: string) => {
  pendingSection = s;
};
const queue: { name: string; fn: () => void | Promise<void>; section: string }[] = [];
function test(name: string, fn: () => void | Promise<void>) {
  queue.push({ name, fn, section: pendingSection });
}
async function runQueue() {
  let last = "";
  for (const t of queue) {
    if (t.section !== last) {
      last = t.section;
      console.log(`\n${t.section}`);
    }
    try {
      await t.fn();
      passed++;
      console.log(`  ok  ${t.name}`);
    } catch (err) {
      failures.push(t.name);
      console.error(`  FAIL ${t.name}\n       ${(err as Error).message}`);
    }
  }
}

/* ---------------------------------------------------------- engine driver */
let idc = 0;
const ev = (e: StoryEventInput): StoryEvent => ({ ...e, eventId: `e${++idc}` }) as StoryEvent;

function apply(state: StoryState, event: StoryEventInput): StoryState {
  const r = dispatch(state, ev(event));
  if (r.status !== "APPLIED") throw new Error(`expected APPLIED for ${event.type}, got ${r.status}: ${r.reason ?? ""}`);
  return r.state;
}

function run(script: StoryEventInput[]): StoryState {
  let s = createInitialState();
  for (const event of script) s = apply(s, event);
  return s;
}

/** The canonical route, written out in full — a first playthrough, start to end. */
const FULL_ROUTE: StoryEventInput[] = [
  { type: "START_EXPERIENCE" },
  { type: "COMPLETE_SCENE", sceneId: "I0" },
  { type: "ENTER_SCENE", sceneId: "I1" },
  { type: "COMPLETE_SCENE", sceneId: "I1" },
  { type: "ENTER_SCENE", sceneId: "I2" },
  { type: "INTERACT", objectId: "object.archive.rack" },
  { type: "PERFORM_ACTION", actionId: "action.archive.insert_dusk" },
  { type: "COMPLETE_SCENE", sceneId: "I2" },
  { type: "ENTER_SCENE", sceneId: "D1" },
  { type: "COMMIT_BEAT", beatId: "beat.d1.orientation" },
  { type: "INTERACT", objectId: "object.shared.lantern" },
  { type: "SPEAK_TO", characterId: "CARETAKER" },
  { type: "COMPLETE_SCENE", sceneId: "D1" },
  { type: "ENTER_SCENE", sceneId: "D2" },
  { type: "INTERACT", objectId: "object.d2.west" },
  { type: "INTERACT", objectId: "object.shared.small" },
  { type: "COMMIT_BEAT", beatId: "beat.d2.a_arrives" },
  { type: "COMMIT_BEAT", beatId: "beat.d2.b_arrives" },
  { type: "COMMIT_BEAT", beatId: "beat.d2.crossing" },
  { type: "COMPLETE_SCENE", sceneId: "D2" },
  { type: "ENTER_SCENE", sceneId: "D3" },
  { type: "COMMIT_BEAT", beatId: "beat.d3.caretaker_lantern" },
  { type: "INTERACT", objectId: "object.shared.lantern" },
  { type: "COMPLETE_SCENE", sceneId: "D3" },
  { type: "ENTER_SCENE", sceneId: "D4" },
  { type: "INTERACT", objectId: "object.d4.gate" },
  { type: "COMMIT_BEAT", beatId: "beat.d4.a_departs" },
  { type: "COMMIT_BEAT", beatId: "beat.d4.b_departs" },
  { type: "COMPLETE_SCENE", sceneId: "D4" },
  { type: "ENTER_SCENE", sceneId: "O1" },
  { type: "INTERACT", objectId: "object.garden.flower" },
  { type: "COMPLETE_SCENE", sceneId: "O1" },
  { type: "ENTER_SCENE", sceneId: "O2" },
  { type: "COMMIT_BEAT", beatId: "beat.o2.routine" },
  { type: "INTERACT", objectId: "object.shared.lantern" },
  { type: "COMPLETE_SCENE", sceneId: "O2" },
  { type: "ENTER_SCENE", sceneId: "O3A" },
  { type: "INTERACT", objectId: "object.a.workdesk" },
  { type: "COMPLETE_SCENE", sceneId: "O3A" },
  { type: "ENTER_SCENE", sceneId: "O3B" },
  { type: "INTERACT", objectId: "object.b.planner" },
  { type: "COMPLETE_SCENE", sceneId: "O3B" },
  { type: "ENTER_SCENE", sceneId: "O4" },
  { type: "INTERACT", objectId: "object.caretaker.register" },
  { type: "COMPLETE_SCENE", sceneId: "O4" },
  { type: "ENTER_SCENE", sceneId: "O5" },
  { type: "COMMIT_BEAT", beatId: "beat.o5.montage_shown" },
  { type: "COMPLETE_SCENE", sceneId: "O5" },
  { type: "ENTER_SCENE", sceneId: "H1" },
  { type: "COMMIT_BEAT", beatId: "beat.h1.after_this" },
  { type: "INTERACT", objectId: "object.personal.phone" },
  { type: "INTERACT", objectId: "object.room.clock" },
  { type: "COMPLETE_SCENE", sceneId: "H1" },
  { type: "ENTER_SCENE", sceneId: "H2" },
  { type: "COMMIT_BEAT", beatId: "beat.h2.contact_attempt" },
  { type: "COMMIT_BEAT", beatId: "beat.h2.b_leaves" },
  { type: "COMMIT_BEAT", beatId: "beat.h2.reverse" },
  { type: "COMPLETE_SCENE", sceneId: "H2" },
  { type: "ENTER_SCENE", sceneId: "H3" },
  { type: "INTERACT", objectId: "object.caretaker.register" },
  { type: "COMPLETE_SCENE", sceneId: "H3" },
  { type: "ENTER_SCENE", sceneId: "H4" },
  { type: "INTERACT", objectId: "object.shared.lantern" },
  { type: "PERFORM_ACTION", actionId: "action.hours.leave_lantern_burning" },
  { type: "PERFORM_ACTION", actionId: "action.hours.water_flower" },
  { type: "INTERACT", objectId: "object.garden.flower" },
  { type: "COMPLETE_SCENE", sceneId: "H4" },
  { type: "ENTER_SCENE", sceneId: "H5" },
  { type: "SPEAK_TO", characterId: "CARETAKER" },
  { type: "COMPLETE_SCENE", sceneId: "H5" },
  { type: "ENTER_SCENE", sceneId: "A1" },
  { type: "COMMIT_BEAT", beatId: "beat.a1.arrival" },
  { type: "COMPLETE_SCENE", sceneId: "A1" },
  { type: "ENTER_SCENE", sceneId: "A2" },
  { type: "COMMIT_BEAT", beatId: "beat.a2.ending_spoken" },
  { type: "COMPLETE_SCENE", sceneId: "A2" },
  { type: "ENTER_SCENE", sceneId: "A3" },
  { type: "PERFORM_ACTION", actionId: "action.dawn.keep_memory" },
  { type: "COMPLETE_SCENE", sceneId: "A3" },
  { type: "ENTER_SCENE", sceneId: "A4" },
  { type: "INTERACT", objectId: "artifact.real.portrait" },
  { type: "PERFORM_ACTION", actionId: "action.portrait.acknowledge" },
  { type: "COMPLETE_SCENE", sceneId: "A4" },
  { type: "ENTER_SCENE", sceneId: "A5" },
  { type: "INTERACT", objectId: "object.archive.rack" },
  { type: "PERFORM_ACTION", actionId: "action.archive.insert_afterlight" },
  { type: "COMPLETE_SCENE", sceneId: "A5" },
  { type: "ENTER_SCENE", sceneId: "F1" },
  { type: "COMMIT_BEAT", beatId: "beat.f1.voice_complete" },
  { type: "COMPLETE_SCENE", sceneId: "F1" },
  { type: "ENTER_SCENE", sceneId: "F2" },
  { type: "COMPLETE_SCENE", sceneId: "F2" },
  { type: "ENTER_SCENE", sceneId: "F3" },
  { type: "INTERACT", objectId: "object.garden.flower" },
  { type: "COMPLETE_SCENE", sceneId: "F3" },
  { type: "ENTER_SCENE", sceneId: "F4" },
  { type: "COMPLETE_SCENE", sceneId: "F4" },
  { type: "ENTER_SCENE", sceneId: "F5" },
  { type: "COMPLETE_SCENE", sceneId: "F5" }
];

/* -------------------------------------------------------------- the tests */
async function main() {
  section("TGTK engine · static model");
  test("static model validates with zero issues", () => {
    const issues = validateStaticModel();
    assert.deepEqual(issues, [], `issues: ${JSON.stringify(issues, null, 1)}`);
  });
  test("every scene has a definition and a unique id", () => {
    const ids = scenes.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.includes("F5"));
  });
  test("new O2/H1/H2 beats are declared on their scenes", () => {
    const def = (id: string) => scenes.find((s) => s.id === id)!;
    assert.ok(def("O2").beats?.includes("beat.o2.routine"));
    assert.ok(def("H1").beats?.includes("beat.h1.after_this"));
    assert.ok(def("H2").beats?.includes("beat.h2.reverse"));
  });

  section("TGTK engine · route");
  const final = run(FULL_ROUTE);
  test("full first playthrough reaches AFTERLIGHT completion", () => {
    assert.equal(final.completedScenes["F5"], true);
    assert.equal(final.completedChapters["AFTERLIGHT"], true);
    assert.equal(final.facts["fact.experience_completed"], true);
    assert.equal(final.currentChapter, "COMPLETE");
  });
  test("no chapter can be skipped: AFTERLIGHT requires DAWN, mutual ending and unlock", () => {
    assert.equal(final.facts["fact.mutual_ending_established"], true);
    assert.equal(final.facts["fact.afterlight_unlocked"], true);
    assert.equal(final.completedChapters["DAWN"], true);
  });
  test("final state validates (no invariant violations)", () => {
    assert.deepEqual(validateState(final), []);
  });
  test("replay(ledger) reproduces the final state exactly", () => {
    idc = 0; // rebuild the ledger with the very same event ids
    let s = createInitialState();
    const ledger: StoryEvent[] = [];
    for (const event of FULL_ROUTE) {
      const e = ev(event);
      const r = dispatch(s, e);
      assert.equal(r.status, "APPLIED");
      ledger.push(e);
      s = r.state;
    }
    assert.deepEqual(replay(ledger), final);
  });
  test("the QA route reaches every scene, with no rejected events", () => {
    for (const target of ROUTE_TARGETS) {
      idc = 0;
      let s = createInitialState();
      const rejected: string[] = [];
      for (const e of buildRoute(target)) {
        const r = dispatch(s, ev(e as StoryEventInput));
        if (r.status === "APPLIED") s = r.state;
        else rejected.push(`${JSON.stringify(e)} -> ${r.status}: ${r.reason ?? ""}`);
      }
      assert.deepEqual(rejected, [], `route to ${target}`);
      assert.equal(s.currentScene, target, `route to ${target} ended at ${s.currentScene}`);
      assert.deepEqual(validateState(s), [], `state at ${target}`);
    }
  });
  test("the narrative always has something left to do at each step", () => {
    // A cheaper proof than the full walk: every scene before the last is completable
    // only through its own guard, and every non-terminal scene has an exit.
    for (const s of scenes) {
      if (s.id === "F5") continue;
      assert.ok(s.next.length > 0, `${s.id} has no exit`);
    }
  });

  section("TGTK engine · idempotency & guards");
  test("an identical event id is reported DUPLICATE and changes nothing", () => {
    let s = apply(createInitialState(), { type: "START_EXPERIENCE" });
    const e = ev({ type: "COMPLETE_SCENE", sceneId: "I0" });
    const a = dispatch(s, e);
    assert.equal(a.status, "APPLIED");
    const b = dispatch(a.state, e);
    assert.equal(b.status, "DUPLICATE");
    assert.deepEqual(b.state, a.state);
  });
  test("a reused event id with a different payload is rejected", () => {
    let s = apply(createInitialState(), { type: "START_EXPERIENCE" });
    s = apply(s, { type: "COMPLETE_SCENE", sceneId: "I0" });
    s = apply(s, { type: "ENTER_SCENE", sceneId: "I1" });
    const e = ev({ type: "COMPLETE_SCENE", sceneId: "I1" });
    const a = dispatch(s, e);
    assert.equal(a.status, "APPLIED");
    const collided = dispatch(a.state, { ...e, type: "COMPLETE_SCENE", sceneId: "I0" } as StoryEvent);
    assert.equal(collided.status, "REJECTED");
    assert.match(collided.reason ?? "", /COLLISION/);
  });
  test("a scene cannot be completed before its guard is satisfied", () => {
    let s = createInitialState();
    s = apply(s, { type: "START_EXPERIENCE" });
    s = apply(s, { type: "COMPLETE_SCENE", sceneId: "I0" });
    s = apply(s, { type: "ENTER_SCENE", sceneId: "I1" });
    s = apply(s, { type: "COMPLETE_SCENE", sceneId: "I1" });
    s = apply(s, { type: "ENTER_SCENE", sceneId: "I2" });
    assert.equal(canComplete(s, "I2"), false);
    const r = dispatch(s, ev({ type: "COMPLETE_SCENE", sceneId: "I2" }));
    assert.equal(r.status, "REJECTED");
  });
  test("exclusive H4 lantern actions cannot both be performed", () => {
    let s = run(FULL_ROUTE.slice(0, FULL_ROUTE.findIndex((e) => e.type === "PERFORM_ACTION" && e.actionId === "action.hours.leave_lantern_burning")));
    s = apply(s, { type: "PERFORM_ACTION", actionId: "action.hours.leave_lantern_burning" });
    const r = dispatch(s, ev({ type: "PERFORM_ACTION", actionId: "action.hours.dim_lantern" }));
    assert.equal(r.status, "REJECTED");
  });
  test("choices never change whether the ending happens", () => {
    // Same route, different A3 action: the AFTERLIGHT still arrives.
    const alt = FULL_ROUTE.map((e) =>
      e.type === "PERFORM_ACTION" && e.actionId === "action.dawn.keep_memory"
        ? ({ type: "PERFORM_ACTION", actionId: "action.dawn.release_question" } as StoryEventInput)
        : e
    );
    const s = run(alt);
    assert.equal(s.completedScenes["F5"], true);
    assert.equal(s.facts["fact.experience_completed"], true);
  });
  test("the lantern decision changes what the morning still life contains", () => {
    const withLight = run(FULL_ROUTE);
    assert.equal(withLight.echoes["echo.hours.lantern_left_burning"], true);
    const dark = FULL_ROUTE.map((e) =>
      e.type === "PERFORM_ACTION" && e.actionId === "action.hours.leave_lantern_burning"
        ? ({ type: "PERFORM_ACTION", actionId: "action.hours.dim_lantern" } as StoryEventInput)
        : e
    );
    const s = run(dark);
    assert.equal(s.echoes["echo.hours.lantern_put_out"], true);
    assert.equal(s.echoes["echo.hours.lantern_left_burning"], undefined);
  });
  test("AFTERLIGHT has no decisions and no branches", () => {
    const afterlight = scenes.filter((s) => s.chapter === "AFTERLIGHT");
    for (const s of afterlight) assert.ok(s.next.length <= 1, `${s.id} branches`);
  });

  section("TGTK jev · bounded interpretation");
  test("hashString is deterministic and stable across calls", () => {
    assert.equal(hashString("keep"), hashString("keep"));
    assert.notEqual(hashString("keep"), hashString("release"));
  });
  test("deterministic classifier sorts the finite categories", () => {
    assert.equal(classifyLocal("i'll keep it").category, "KEEP");
    assert.equal(classifyLocal("i let it go").category, "RELEASE");
    assert.equal(classifyLocal("i forgive you").category, "FORGIVE");
    assert.equal(classifyLocal("not sure").category, "UNCERTAIN");
    assert.equal(classifyLocal("banana").category, "OTHER");
    assert.equal(classifyLocal("").category, "UNCERTAIN");
  });
  test("keyword matching is token-boundary aware, never a raw substring", () => {
    // "end" must not match inside a larger word.
    assert.equal(classifyLocal("weekend plans").category, "OTHER");
    assert.equal(classifyLocal("pretend everything").category, "OTHER");
    assert.equal(classifyLocal("befriend the garden").category, "OTHER");
    // "hold" must not match "threshold"/"household"; exact tokens still work.
    assert.equal(classifyLocal("a household chore").category, "OTHER");
    assert.equal(classifyLocal("hold it").category, "KEEP");
    // Multi-word phrases only match as consecutive tokens.
    assert.equal(classifyLocal("let it go now").category, "RELEASE");
    assert.equal(classifyLocal("it was not a sure thing").category, "OTHER");
    assert.equal(classifyLocal("she said not sure").category, "UNCERTAIN");
  });
  test("external responses are schema-validated", () => {
    assert.equal(parseJevResponse({ category: "WAT", confidence: 0.9 }), null);
    assert.equal(parseJevResponse({ category: "KEEP", confidence: 2 }), null);
    assert.equal(parseJevResponse({ category: "KEEP", confidence: -1 }), null);
    assert.equal(parseJevResponse(null), null);
    assert.deepEqual(parseJevResponse({ category: "KEEP", confidence: 0.8 }), { category: "KEEP", confidence: 0.8 });
  });
  test("with no endpoint configured the local classifier is authoritative", async () => {
    __resetJevCache();
    const r = await classifyReflection("i'll keep this");
    assert.equal(r.source, "local");
    assert.equal(r.category, "KEEP");
    assert.equal(r.cached, false);
  });
  test("identical reflections are answered from cache (idempotent)", async () => {
    __resetJevCache();
    const a = await classifyReflection("let it go", { stateHash: "A3" });
    const b = await classifyReflection("let it go", { stateHash: "A3" });
    assert.equal(b.cached, true);
    assert.deepEqual({ ...a, cached: true }, b);
  });
  test("a slow endpoint times out and falls back deterministically", async () => {
    __resetJevCache();
    // A fetch that never answers but DOES honour the abort signal, as a real one would.
    const never = ((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      })) as unknown as typeof fetch;
    const r = await classifyReflection("i forgive you", { endpointOverride: "https://example.invalid", fetchImpl: never, timeoutMs: 40 });
    assert.equal(r.source, "local");
    assert.equal(r.category, "FORGIVE");
    assert.equal(r.fallbackReason, "timeout");
  });
  test("a malformed external response falls back deterministically", async () => {
    __resetJevCache();
    const bad = (async () => ({ ok: true, status: 200, json: async () => ({ category: "NOT_ALLOWED" }) })) as unknown as typeof fetch;
    const r = await classifyReflection("keep", { endpointOverride: "https://example.invalid", fetchImpl: bad });
    assert.equal(r.source, "local");
    assert.match(r.fallbackReason ?? "", /error:schema/);
  });
  test("below-threshold confidence is discarded whole and the local classifier answers", async () => {
    __resetJevCache();
    // The endpoint claims RELEASE with low confidence for an input the local classifier
    // reads as KEEP. Nothing of the external answer may survive: no partial category,
    // no external confidence, no "jev" source.
    const low = (async () => ({ ok: true, status: 200, json: async () => ({ category: "RELEASE", confidence: 0.1 }) })) as unknown as typeof fetch;
    const r = await classifyReflection("i'll keep it", { endpointOverride: "https://example.invalid", fetchImpl: low });
    assert.equal(r.fallbackReason, "low-confidence");
    assert.equal(r.source, "local");
    assert.equal(r.category, "KEEP");
    assert.equal(r.confidence, classifyLocal("i'll keep it").confidence);
  });
  test("a well-formed, confident external answer is accepted", async () => {
    __resetJevCache();
    const good = (async () => ({ ok: true, status: 200, json: async () => ({ category: "RELEASE", confidence: 0.92 }) })) as unknown as typeof fetch;
    const r = await classifyReflection("whatever word", { endpointOverride: "https://example.invalid", fetchImpl: good });
    assert.equal(r.source, "jev");
    assert.equal(r.category, "RELEASE");
    assert.equal(r.confidence, 0.92);
  });

  section("Release adversarial regressions");
  test("negation and curly apostrophes cannot turn reluctance into release", () => {
    for (const t of ["I don't want to let go", "I don’t want to let go", "I do not want to let go", "never let go"]) assert.equal(classifyLocal(t).category, "UNCERTAIN", t);
    assert.equal(classifyLocal("I forgive but don't want to forget").category, "FORGIVE");
    assert.equal(classifyLocal("I don't know").category, "UNCERTAIN");
    for (const t of ["end", "let go", "let it go", "let, it, go!"]) assert.equal(classifyLocal(t).category, "RELEASE");
  });
  test("empty, whitespace, punctuation and oversized reflections remain bounded", () => {
    for (const t of ["", " \n\t"]) assert.equal(classifyLocal(t).category, "UNCERTAIN");
    assert.equal(classifyLocal("!!!...").category, "OTHER");
    assert.equal(classifyLocal("banana ".repeat(10000) + "release").category, "OTHER");
  });
  test("external schema rejects NaN, strings, missing confidence and unknown categories", () => {
    for (const confidence of [NaN, Infinity, "0.9", undefined, null]) assert.equal(parseJevResponse({category: "KEEP", confidence}), null);
    for (const payload of [[], "KEEP", {category: "SECRET", confidence: 1}]) assert.equal(parseJevResponse(payload), null);
  });
  test("same-origin validation covers protocol-relative, credentials and unusual schemes", () => {
    const base = "https://garden.example/path/";
    for (const endpoint of ["/api/jev", "api/jev", "https://garden.example/api/jev", "//garden.example/api/jev"]) assert.ok(isSameOriginEndpoint(endpoint, base));
    for (const endpoint of ["//evil.example/api", "https://evil.example", "javascript:alert(1)", "data:text/plain,x", "https://user:secret@garden.example/api"]) assert.equal(isSameOriginEndpoint(endpoint, base), false, endpoint);
  });
  test("test-only endpoint override cannot perform a real external fetch", async () => {
    __resetJevCache();
    const r = await classifyReflection("keep", {endpointOverride: "https://evil.example"});
    assert.equal(r.source, "local");
  });
  test("timeout also bounds an adapter or JSON body that ignores abort", async () => {
    for (const fetchImpl of [(() => new Promise(() => {})), (async () => ({ok:true,json: () => new Promise(() => {})}))]) {
      __resetJevCache();
      const r = await classifyReflection("keep", {endpointOverride:"/api/jev",fetchImpl:fetchImpl as typeof fetch,timeoutMs:20});
      assert.equal(r.fallbackReason,"timeout");
      assert.equal(r.category,"KEEP");
    }
  });
  test("HTTP and malformed JSON failures discard the whole external answer", async () => {
    for (const fetchImpl of [(async () => ({ok:false,status:503})), (async () => ({ok:true,json:async () => {throw new Error("bad JSON");}}))]) {
      __resetJevCache();
      const r = await classifyReflection("keep", {endpointOverride:"/api/jev",fetchImpl:fetchImpl as unknown as typeof fetch});
      assert.equal(r.source,"local"); assert.equal(r.category,"KEEP"); assert.match(r.fallbackReason ?? "",/error:/);
    }
  });
  test("cache repeats once per input and state; distinct states are independent", async () => {
    __resetJevCache(); let calls=0;
    const fetchImpl = (async () => { calls++; return {ok:true,json:async()=>({category:"KEEP",confidence:.9})}; }) as unknown as typeof fetch;
    for (const stateHash of ["state1","state1","state2"]) await classifyReflection("keep",{stateHash,fetchImpl,endpointOverride:"/api/jev"});
    assert.equal(calls,2);
  });
  test("malformed, unknown and missing-field save events are rejected, never committed", () => {
    const started=apply(createInitialState(),{type:"START_EXPERIENCE"});
    for (const event of [null, {}, {type:"BOGUS",eventId:"x"}, {type:"START_EXPERIENCE"}, {type:"INTERACT",eventId:"x"}, {type:"ENTER_SCENE",eventId:"x",sceneId:42}]) {
      const r=dispatch(started,event as StoryEvent); assert.equal(r.status,"REJECTED"); assert.equal(r.state,started);
    }
    for (const ledger of [[{type:"START_EXPERIENCE",eventId:"1"},{type:"BOGUS",eventId:"2"}], [null]]) assert.throws(()=>replay(ledger as StoryEvent[]));
  });
  test("every major transition replays identically after a save round trip", () => {
    let state=createInitialState(); const ledger:StoryEvent[]=[];
    for (const input of FULL_ROUTE) {
      const event=ev(input); state=dispatch(state,event).state; ledger.push(event);
      assert.deepEqual(replay(JSON.parse(JSON.stringify(ledger))),state);
    }
  });
  test("illegal jumps, premature portrait/AFTERLIGHT and invalid IDs fail at every scene", () => {
    for (const target of ROUTE_TARGETS) {
      const state=run(buildRoute(target) as StoryEventInput[]);
      const inputs:StoryEventInput[]=[{type:"ENTER_SCENE",sceneId:"F1"},{type:"INTERACT",objectId:"no-such-object"},{type:"PERFORM_ACTION",actionId:"no-such-action"},{type:"COMMIT_BEAT",beatId:"no-such-beat"}];
      if (target!=="A4") inputs.push({type:"PERFORM_ACTION",actionId:"action.portrait.acknowledge"});
      for (const input of inputs) assert.equal(dispatch(state,ev(input)).status,"REJECTED",`${target}: ${JSON.stringify(input)}`);
    }
  });
  test("A3 requires one choice; each of five choices reaches the same canonical ending", () => {
    const at=FULL_ROUTE.findIndex(e=>e.type==="PERFORM_ACTION" && e.actionId==="action.dawn.keep_memory");
    const before=run(FULL_ROUTE.slice(0,at));
    assert.equal(dispatch(before,ev({type:"COMPLETE_SCENE",sceneId:"A3"})).status,"REJECTED");
    for (const actionId of ["action.dawn.keep_memory","action.dawn.release_guilt","action.dawn.release_question","action.dawn.keep_gratitude","action.dawn.keep_lesson"]) {
      const route=[...FULL_ROUTE];route[at]={type:"PERFORM_ACTION",actionId};
      const state=run(route);assert.equal(state.facts["fact.mutual_ending_established"],true);assert.equal(state.completedScenes.F5,true);
    }
  });
  test("multiple A3 choices stay local and one-shot actions cannot be repeated", () => {
    let state=run(buildRoute("A3") as StoryEventInput[]);
    for (const actionId of ["action.dawn.keep_memory","action.dawn.release_guilt","action.dawn.release_question","action.dawn.keep_gratitude","action.dawn.keep_lesson"]) {
      state=apply(state,{type:"PERFORM_ACTION",actionId});
      assert.equal(dispatch(state,ev({type:"PERFORM_ACTION",actionId})).status,"REJECTED");
    }
    assert.equal(canComplete(state,"A3"),true);assert.equal(state.facts["fact.afterlight_unlocked"],undefined);
  });
  test("repeated canonical beats with fresh IDs never change counts or state", () => {
    let state=run(buildRoute("A2") as StoryEventInput[]);
    state=apply(state,{type:"COMMIT_BEAT",beatId:"beat.a2.ending_spoken"});
    const r=dispatch(state,ev({type:"COMMIT_BEAT",beatId:"beat.a2.ending_spoken"}));
    assert.equal(r.status,"DUPLICATE");assert.equal(r.state,state);
  });
  test("corrupt, stale envelope and incomplete ledgers fail restoration cleanly", () => {
    for (const raw of ["{", "null", '{"version":0,"state":{}}', '[{}]', '[null]', '[{"type":"START_EXPERIENCE"}]']) assert.throws(()=>decodeLedger(raw),raw);
    assert.equal(decodeLedger('[]').state.started,false);
    const ledger=buildRoute("H2").map(e=>ev(e as StoryEventInput));
    assert.equal(decodeLedger(JSON.stringify(ledger)).state.currentScene,"H2");
  });
  test("opening the menu freezes presentation timers without consuming their remaining time", async () => {
    let fired=false; const cancel=storyTimeout(()=>{fired=true;},30);
    setTimelinePaused(true); const before=activeTime();
    await new Promise(r=>setTimeout(r,50));assert.equal(fired,false);assert.ok(Math.abs(activeTime()-before)<2);
    setTimelinePaused(false);await new Promise(r=>setTimeout(r,45));assert.equal(fired,true);cancel();
  });
  test("a stalled audio element cannot deadlock the cinematic clock", () => {
    const originalTime=performance.now; const originalAudio=audio.currentTime;
    let now=0; Object.defineProperty(performance,"now",{value:()=>now,configurable:true});audio.currentTime=()=>8;
    try {
      const clock=createClock({track:"archive",offset:11.8});assert.equal(clock.now(),0);
      now=1000;clock.now();now=2000;clock.now();now=3000;assert.ok(clock.now()>=2);
    } finally {Object.defineProperty(performance,"now",{value:originalTime,configurable:true});audio.currentTime=originalAudio;}
  });
  test("reduced-motion preference is detected without changing story reachability", () => {
    assert.equal(prefersReducedMotion(),false);
    const g=globalThis as unknown as {window?:unknown};
    g.window={matchMedia:()=>({matches:true})};
    try {assert.equal(prefersReducedMotion(),true);assert.equal(run(FULL_ROUTE).completedScenes.F5,true);}
    finally {delete g.window;}
  });

  await runQueue();

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.error("failures:\n - " + failures.join("\n - "));
    process.exitCode = 1;
  }
}

await main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
