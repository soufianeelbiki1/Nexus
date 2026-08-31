import assert from "node:assert/strict";
import test from "node:test";

import {
  AtlasPayApiSource,
  AtlasPayContractError,
  type AtlasPayOperatorSnapshot,
  parseAtlasPayOperatorSnapshot,
} from "../lib/atlaspay-api";

const validSnapshot = {
  provenance: {
    source: "atlaspay-api",
    generated_at: "2026-08-30T08:42:00Z",
    contract_version: "v1",
  },
  health: "degraded",
  data_state: "fresh",
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
    state: "available",
    observations: 4,
    by_disposition: { accepted: 1, timed_out: 1, late: 1 },
    timeouts: 1,
    late_responses: 1,
    p95_latency_ms: 2000,
    reason: null,
  },
  incidents: [],
  missing_sections: [],
};

test("strict parser preserves durable AtlasPay measurements", () => {
  const snapshot = parseAtlasPayOperatorSnapshot(validSnapshot);

  assert.equal(snapshot.provenance.contract_version, "v1");
  assert.equal(snapshot.payments.total, 12);
  assert.equal(snapshot.ledger.balanced, true);
  assert.equal(snapshot.outbox.oldest_unpublished_age_seconds, 4.5);
  assert.equal(snapshot.network.state, "available");
  assert.equal(snapshot.network.observations, 4);
  assert.equal(snapshot.network.timeouts, 1);
  assert.equal(snapshot.network.late_responses, 1);
  assert.equal(snapshot.network.p95_latency_ms, 2000);
  assert.deepEqual(snapshot.missing_sections, []);
});

test("available sections cannot smuggle unknown values as null", () => {
  const invalid = structuredClone(validSnapshot);
  invalid.network.p95_latency_ms = null as unknown as number;

  assert.throws(
    () => parseAtlasPayOperatorSnapshot(invalid),
    (error) =>
      error instanceof AtlasPayContractError &&
      error.message.includes("snapshot.network.p95_latency_ms cannot be null"),
  );
});

test("unavailable sections retain null rather than fabricated zero", () => {
  const unavailable = structuredClone(validSnapshot) as unknown as AtlasPayOperatorSnapshot;
  unavailable.network = {
    state: "unavailable",
    observations: null,
    by_disposition: null,
    timeouts: null,
    late_responses: null,
    p95_latency_ms: null,
    reason: "network history unavailable",
  };

  const parsed = parseAtlasPayOperatorSnapshot(unavailable);

  assert.equal(parsed.network.state, "unavailable");
  assert.equal(parsed.network.observations, null);
  assert.equal(parsed.network.p95_latency_ms, null);
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
  assert.equal(snapshot.network.by_disposition?.accepted, 1);
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
