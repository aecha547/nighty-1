/**
 * JEV — the optional, bounded interpretation layer.
 *
 * ARCHITECTURE (from the handoff, verbatim in spirit):
 *
 *   DETERMINISTIC STORY ENGINE
 *        ↓
 *   OPTIONAL JEV ADAPTER          ← this file
 *        ↓
 *   BOUNDED CLASSIFICATION
 *        ↓
 *   AUTHORED RESULT              ← a PRE-WRITTEN line chosen by category
 *
 * This module can NEVER:
 *   decide the ending · invent anyone's feelings · decide forgiveness · generate canonical
 *   dialogue · control navigation · unlock AFTERLIGHT · change facts · replace scene guards.
 *
 * It may only take ONE optional short free-text reflection and sort it into a finite
 * set of categories, so the caller can pick between lines that were already written.
 *
 * Guarantees implemented here:
 *   · finite, schema-validated allowed outputs
 *   · hard timeout with a clean abort
 *   · confidence threshold — below it the external answer is DISCARDED WHOLE and the
 *     deterministic local classifier answers instead (never a partially-trusted result)
 *   · idempotency + caching keyed by (input hash, state hash)
 *   · a deterministic offline fallback that is ALWAYS present and always authoritative
 *   · no credentials in browser code: the adapter is off unless opted in at build time,
 *     and when on it only ever calls a SAME-ORIGIN endpoint (default `/api/jev`)
 *
 * External activation is DISABLED unless VITE_JEV_ALLOW=1 is set at build time. The adapter
 * then POSTs to same-origin `/api/jev` (overridable with VITE_JEV_ENDPOINT, which must also
 * resolve same-origin — a cross-origin URL is refused so that no third-party boundary or
 * credential can ever be introduced from client-side Vite env). Any provider key belongs to
 * that server route, never to this bundle. With no opt-in, the deterministic classifier alone
 * answers — which is the intended production behaviour.
 */

export const JEV_CATEGORIES = ["KEEP", "RELEASE", "FORGIVE", "UNCERTAIN", "OTHER"] as const;
export type JevCategory = (typeof JEV_CATEGORIES)[number];

export interface JevResult {
  category: JevCategory;
  /** below the confidence threshold this is the LOCAL confidence, not the external one */
  confidence: number;
  source: "local" | "jev";
  cached: boolean;
  /** present when an external call was attempted and fell back */
  fallbackReason?: string;
}

export const JEV_MAX_INPUT = 120;
export const JEV_MIN_CONFIDENCE = 0.55;
export const JEV_DEFAULT_TIMEOUT_MS = 1500;

/** FNV-1a. Deterministic, tiny, and good enough to key a cache. */
export function hashString(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function normalizeReflection(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // fold typographic apostrophes: "don't"
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, JEV_MAX_INPUT)
    .toLowerCase();
}

const KEYWORDS: Record<Exclude<JevCategory, "OTHER">, string[]> = {
  KEEP: [
    "keep", "kept", "holding", "hold", "carry", "carried", "remember", "memory", "memories",
    "mine", "stay", "stays", "staying", "cherish", "treasure", "grateful", "gratitude", "warm"
  ],
  RELEASE: [
    "release", "let go", "letgo", "let it go", "free", "freed", "drop", "set down", "setdown",
    "leave", "leaving", "left", "gone", "goodbye", "good bye", "end", "ending", "finished",
    "move on", "moving on", "done", "close", "closed", "rest"
  ],
  FORGIVE: [
    "forgive", "forgiven", "forgiveness", "sorry", "apology", "apologise", "apologize",
    "pardon", "excuse", "no blame", "peace", "peaceful", "okay now", "it's ok", "its ok"
  ],
  UNCERTAIN: [
    "not sure", "unsure", "maybe", "don't know", "dont know", "do not know", "uncertain",
    "unclear", "perhaps", "who knows", "hard to say", "no idea", "confused", "somewhere between"
  ]
};

/**
 * Tokenise on non-letters (apostrophes stay: "i'll", "don't" are single tokens).
 * Keyword matching happens on these tokens so a keyword can never match INSIDE a larger
 * word — "end" must not match "weekend", "pretend" or "befriend".
 */
function tokenize(text: string): string[] {
  return text.match(/[a-z']+/g) ?? [];
}

/** Consecutive-token phrase match: "let it go" matches only those three tokens in order. */
function hasPhrase(tokens: string[], phrase: string): boolean {
  const parts = phrase.split(" ");
  if (parts.length === 1) return tokens.includes(parts[0]);
  for (let i = 0; i + parts.length <= tokens.length; i++) {
    let hit = true;
    for (let j = 0; j < parts.length; j++) {
      if (tokens[i + j] !== parts[j]) {
        hit = false;
        break;
      }
    }
    if (hit) return true;
  }
  return false;
}

function affirmedPhrase(tokens: string[], phrase: string): boolean {
  const parts = phrase.split(" ");
  return tokens.some((_, i) => parts.every((p, j) => tokens[i + j] === p) &&
    !tokens.slice(Math.max(0, i - 4), i).reverse().some((p, j, before) =>
      ["not", "never", "no", "don't", "dont", "can't", "cannot", "won't"].includes(p) &&
      !before.slice(0, j).some((word) => ["but", "however"].includes(word))));
}

/**
 * The deterministic classifier. It is the authority whenever Jev is unavailable, disabled,
 * slow, low-confidence, or returns something that is not in the allowed set. It never throws.
 */
export function classifyLocal(text: string): { category: JevCategory; confidence: number } {
  const t = normalizeReflection(text);
  if (!t) return { category: "UNCERTAIN", confidence: 0.4 };
  const tokens = tokenize(t);

  const scores: Record<string, number> = {};
  let best: JevCategory = "OTHER";
  let bestScore = 0;
  let runnerUp = 0;
  let negated = false;

  for (const [category, words] of Object.entries(KEYWORDS) as [Exclude<JevCategory, "OTHER">, string[]][]) {
    let score = 0;
    for (const w of words) {
      const matched = hasPhrase(tokens, w);
      const affirmed = category === "UNCERTAIN" ? matched : affirmedPhrase(tokens, w);
      if (matched && !affirmed) negated = true;
      if (affirmed) score += w.includes(" ") ? 2 : 1;
    }
    scores[category] = score;
    if (score > bestScore) {
      runnerUp = bestScore;
      bestScore = score;
      best = category;
    } else if (score > runnerUp) {
      runnerUp = score;
    }
  }

  if (bestScore === 0) return { category: negated ? "UNCERTAIN" : "OTHER", confidence: 0.35 };
  const margin = (bestScore - runnerUp) / Math.max(1, bestScore);
  const confidence = Math.min(0.95, 0.5 + margin * 0.35 + Math.min(bestScore, 3) * 0.05);
  return { category: best, confidence };
}

export function isJevCategory(value: unknown): value is JevCategory {
  return typeof value === "string" && (JEV_CATEGORIES as readonly string[]).includes(value);
}

/** Schema-validate an external response. Anything unexpected is rejected outright. */
export function parseJevResponse(payload: unknown): { category: JevCategory; confidence: number } | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (!isJevCategory(p.category)) return null;
  if (typeof p.confidence !== "number" || !Number.isFinite(p.confidence)) return null;
  const confidence = p.confidence;
  if (confidence < 0 || confidence > 1) return null;
  return { category: p.category, confidence };
}

/* ------------------------------ configuration ------------------------------ */

interface JevEnv {
  endpoint: string;
  allowed: boolean;
  timeoutMs: number;
}

/**
 * Same-origin server route. Server-side implementation is deferred (it is the part that may
 * hold a credential); the browser only ever sees a first-party path.
 */
export const JEV_SAME_ORIGIN_ENDPOINT = "/api/jev";

function readEnv(): JevEnv {
  const env = (import.meta.env ?? {}) as Record<string, string | undefined>;
  return {
    endpoint: env.VITE_JEV_ENDPOINT?.trim() || JEV_SAME_ORIGIN_ENDPOINT,
    allowed: env.VITE_JEV_ALLOW === "1",
    timeoutMs: JEV_DEFAULT_TIMEOUT_MS
  };
}

/**
 * True only when explicitly opted in at build time AND the endpoint resolves same-origin.
 * Disabled by default: this is the production posture until `/api/jev` exists.
 */
export function isJevEnabled(): boolean {
  const { endpoint, allowed } = readEnv();
  if (!allowed) return false;
  if (!endpoint) return false;
  return typeof location !== "undefined" && isSameOriginEndpoint(endpoint, location.href);
}

export function isSameOriginEndpoint(endpoint: string, base: string): boolean {
  try {
    const url = new URL(endpoint, base);
    return ["http:", "https:"].includes(url.protocol) && url.origin === new URL(base).origin && !url.username && !url.password;
  } catch { return false; }
}

/**
 * Feature flag for the optional free-text reflection UI in A3.
 * OFF unless VITE_JEV_REFLECTION=1 is set at build/dev time: the team plays A3 first and
 * decides later whether free text helps or weakens the scene. The adapter code stays intact
 * either way — the flag only controls whether the input is ever offered to the reader.
 */
export function isReflectionUiEnabled(): boolean {
  const env = (import.meta.env ?? {}) as Record<string, string | undefined>;
  return env.VITE_JEV_REFLECTION === "1";
}

/* --------------------------------- caching --------------------------------- */

const cache = new Map<string, JevResult>();

/** Tests only. */
export function __resetJevCache(): void {
  cache.clear();
}

export interface ClassifyOptions {
  /** presentation-only context; folded into the cache key, never into story state */
  stateHash?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  /**
   * TEST-ONLY seam: pretend an external endpoint is configured so the bounded
   * network path (timeout, schema validation, threshold, fallback) is exercisable.
   * Application code must never pass this.
   */
  endpointOverride?: string;
}

/**
 * Classify one optional reflection.
 *
 * Always resolves. Never throws. Never mutates anything.
 * Idempotent for the same (input, stateHash): the second call returns the cached result.
 */
export async function classifyReflection(text: string, options: ClassifyOptions = {}): Promise<JevResult> {
  const normalized = normalizeReflection(text);
  // Retain exact values as well as hashes: a hash collision must never reuse another reading.
  const key = JSON.stringify([hashString(normalized), hashString(options.stateHash ?? ""), normalized, options.stateHash ?? ""]);
  const hit = cache.get(key);
  if (hit) return { ...hit, cached: true };

  const local = classifyLocal(normalized);
  const finish = (result: Omit<JevResult, "cached">): JevResult => {
    const stored: JevResult = { ...result, cached: false };
    cache.set(key, stored);
    return stored;
  };

  const enabled = options.endpointOverride ? !!options.fetchImpl : isJevEnabled();
  if (!enabled) {
    return finish({ category: local.category, confidence: local.confidence, source: "local" });
  }

  const endpoint = options.endpointOverride ?? readEnv().endpoint;
  const timeoutMs = options.timeoutMs ?? JEV_DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error("timeout")); }, timeoutMs);
  });
  try {
    const doFetch = options.fetchImpl ?? fetch;
    const request = async () => {
    const res = await doFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: normalized, allowed: JEV_CATEGORIES, inputHash: hashString(normalized), stateHash: options.stateHash ?? "" }),
      signal: controller.signal,
      redirect: "error"
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return parseJevResponse(await res.json());
    };
    const parsed = await Promise.race([request(), deadline]);
    if (!parsed) throw new Error("schema");
    if (parsed.confidence < JEV_MIN_CONFIDENCE) {
      // NOT partially trusted: the whole external answer is discarded and the deterministic
      // local classifier decides, exactly as if the call had failed.
      return finish({
        category: local.category,
        confidence: local.confidence,
        source: "local",
        fallbackReason: "low-confidence"
      });
    }
    return finish({ category: parsed.category, confidence: parsed.confidence, source: "jev" });
  } catch (err) {
    return finish({
      category: local.category,
      confidence: local.confidence,
      source: "local",
      fallbackReason: controller.signal.aborted ? "timeout" : `error:${(err as Error).message}`
    });
  } finally {
    clearTimeout(timer!);
  }
}
