/**
 * Test runner. Bundles the TypeScript suite with esbuild (already present as a
 * Vite dependency) and executes it with Node — no additional test framework.
 *
 *   node tests/run.mjs            # run the suite
 *   node tests/run.mjs --keep     # keep the intermediate bundle for inspection
 */
import { build } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const keep = process.argv.includes("--keep");
const dir = mkdtempSync(path.join(tmpdir(), "tgtk-tests-"));
const outfile = path.join(dir, "bundle.mjs");

try {
  await build({
    entryPoints: ["tests/engine.test.ts"],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    sourcemap: false,
    logLevel: "warning"
  });
  await import(pathToFileURL(outfile).href);
} finally {
  if (!keep) rmSync(dir, { recursive: true, force: true });
  else console.log(`\n[bundle kept at ${outfile}]`);
}
