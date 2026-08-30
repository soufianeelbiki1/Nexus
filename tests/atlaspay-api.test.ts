import assert from "node:assert/strict";
import test from "node:test";

import {
  AtlasPayApiSource,
  AtlasPayContractError,
  parseAtlasPayOperatorSnapshot,
} from "../lib/atlaspay-api";

const validSnapshot = {
  provenance: {
    source: "atlaspay-api",
    generated_at: "2026-08-30T08:42:00Z",
    contract_version: "v1",
  },
  health: "degraded",
  data_state: "partial",
  payments: {
    state: "available",
    total: 12,
    by_status: { pending: 2, captured: 10 },
    operations: 10,
    reason: null,
  },
  ledger: {
    state: "available",
    balanced: true,
    discrepancies: 0,
    discrepancy_kinds: {},
    inspected_at: "2026-08-30T08:42:00Z",
    reason: null,
  },
  outbox: {
    state: "available",
    unpublished: 2,
    poison_messages: 0,
    oldest_unpublished_age_seconds: 4.5,
    reason: null,
  },
  network: {
    state: "unavailable",
    reason: "network observations are not durably snapshotted",
  },
  incidents: [],
  missing_sections: ["network"],
};

test("strict parser preserves measured values and unavailable network state", () => {
  const snapshot = parseAtlasPayOperatorSnapshot(validSnapshot);

  assert.equal(snapshot.provenance.contract_version, "v1");
  assert.equal(snapshot.payments.total, 12);
  assert.equal(snapshot.ledger.balanced, true);
  assert.equal(snapshot.outbox.oldest_unpublished_age_seconds, 4.5);
  assert.equal(snapshot.network.state, "unavailable");
  assert.deepEqual(snapshot.missing_sections, ["network"]);
});

test("available sections cannot smuggle unknown values as null", () => {
  const invalid = structuredClone(validSnapshot);
  invalid.outbox.unpublished = null as unknown as number;

  assert.throws(
    () => parseAtlasPayOperatorSnapshot(invalid),
    (error) =>
      error instanceof AtlasPayContractError &&
      error.message.includes("snapshot.outbox.unpublished cannot be null"),
  );
});

test("unavailable durable sections retain null rather than fabricated zero", () => {
  const unavailable = structuredClone(validSnapshot);
  unavailable.payments = {
    state: "unavailable",
    total: null as unknown as number,
    by_status: null as unknown as Record<string, number>,
    operations: null as unknown as number,
    reason: "database unavailable",
  };

  const parsed = parseAtlasPayOperatorSnapshot(unavailable);

  assert.equal(parsed.payments.state, "unavailable");
  assert.equal(parsed.payments.total, null);
  assert.equal(parsed.payments.by_status, null);
  assert.equal(parsed.payments.operations, null);
});

test("API source sends bearer credentials and validates the response", async () => {
  let receivedUrl = "";
  let authorization = "";
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    receivedUrl = String(input);
    authorization = new Headers(init?.headers).get("authorization") ?? "";
    return new Response(JSON.stringify(validSnapshot), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  const source = new AtlasPayApiSource({
    baseUrl: "https://atlaspay.example/",
    token: "operator-secret",
    fetchImpl,
  });
  const snapshot = await source.load();

  assert.equal(receivedUrl, "https://atlaspay.example/v1/ops/snapshot");
  assert.equal(authorization, "Bearer operator-secret");
  assert.equal(snapshot.outbox.unpublished, 2);
});

test("API source fails closed on non-success response without fixture fallback", async () => {
  const fetchImpl = (async () => new Response("unauthorized", { status: 401 })) as typeof fetch;
  const source = new AtlasPayApiSource({
    baseUrl: "https://atlaspay.example",
    token: "wrong-secret",
    fetchImpl,
  });

  await assert.rejects(source.load(), /HTTP 401/);
});

test("API source rejects malformed successful responses", async () => {
  const fetchImpl = (async () =>
    new Response(JSON.stringify({ health: "healthy" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
  const source = new AtlasPayApiSource({
    baseUrl: "https://atlaspay.example",
    token: "operator-secret",
    fetchImpl,
  });

  await assert.rejects(source.load(), AtlasPayContractError);
});
