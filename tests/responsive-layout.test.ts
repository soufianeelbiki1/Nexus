import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("live route diagnostics stack their long values at phone width", async () => {
  const [component, stylesheet] = await Promise.all([
    readFile(new URL("../app/live-operator-snapshot.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(component, /className="issuer route-row"/);
  assert.match(stylesheet, /@media \(max-width: 520px\)[\s\S]*\.route-row \{ grid-template-columns: 1fr; \}/);
  assert.match(stylesheet, /\.route-row \.issuer-metric \{ text-align: left; \}/);
});
