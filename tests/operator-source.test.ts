import assert from "node:assert/strict";
import test from "node:test";

import { atlasPayApiConfigFromEnvironment } from "../lib/operator-source";

test("no AtlasPay API environment keeps explicit fixture development mode", () => {
  assert.equal(atlasPayApiConfigFromEnvironment({}), null);
});

test("complete AtlasPay API environment enables live mode", () => {
  const config = atlasPayApiConfigFromEnvironment({
    ATLASPAY_API_BASE_URL: " https://atlaspay.example/ ",
    ATLASPAY_API_TOKEN: " operator-secret ",
    ATLASPAY_API_TIMEOUT_MS: "4500",
  });

  assert.deepEqual(config, {
    baseUrl: "https://atlaspay.example/",
    token: "operator-secret",
    timeoutMs: 4500,
  });
});

test("live mode defaults to a bounded three-second API timeout", () => {
  const config = atlasPayApiConfigFromEnvironment({
    ATLASPAY_API_BASE_URL: "https://atlaspay.example",
    ATLASPAY_API_TOKEN: "operator-secret",
  });

  assert.equal(config?.timeoutMs, 3000);
});

test("partial API configuration fails closed instead of falling back to fixture telemetry", () => {
  assert.throws(
    () =>
      atlasPayApiConfigFromEnvironment({
        ATLASPAY_API_BASE_URL: "https://atlaspay.example",
      }),
    /must be configured together; refusing fixture fallback/,
  );
});

test("invalid API timeout fails closed", () => {
  assert.throws(
    () =>
      atlasPayApiConfigFromEnvironment({
        ATLASPAY_API_BASE_URL: "https://atlaspay.example",
        ATLASPAY_API_TOKEN: "operator-secret",
        ATLASPAY_API_TIMEOUT_MS: "0",
      }),
    /positive integer/,
  );
});
