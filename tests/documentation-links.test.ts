import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const documents = ["README.md", "docs/LOCAL_DEMO.md"];

function localTargets(markdown: string): string[] {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1].trim())
    .filter((target) => target && !target.startsWith("#") && !/^[a-z]+:/i.test(target))
    .map((target) => decodeURIComponent(target.split("#", 1)[0]));
}

test("recruiter and operator documentation keeps every local link resolvable", () => {
  let checked = 0;

  for (const document of documents) {
    const source = resolve(repositoryRoot, document);
    const directory = dirname(source);
    const targets = localTargets(readFileSync(source, "utf8"));

    for (const target of targets) {
      const destination = resolve(directory, target);
      assert.ok(
        destination === repositoryRoot || destination.startsWith(`${repositoryRoot}${sep}`),
        `${document} link escapes the repository: ${target}`,
      );
      assert.ok(existsSync(destination), `${document} has a broken local link: ${target}`);
      checked += 1;
    }
  }

  assert.ok(checked >= 5, "expected the documentation entry points to expose useful evidence links");
});
