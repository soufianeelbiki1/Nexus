import type { OperationalSnapshot } from "../lib/operations";

// Seed fixture derived from AtlasPay's documented operational model at this commit.
// Values are illustrative contract data for UI development, not production telemetry.
export const atlasPayFixture: OperationalSnapshot = {
  provenance: {
    source: "atlaspay-fixture",
    sourceCommit: "04bcfee85c5f3e027e06dda45948562a0ad28197",
    generatedAt: "2026-08-30T03:00:00Z",
    contractVersion: "v1",
  },
  health: "degraded",
  dataState: "partial",
  authorizations: {
    total: 12840,
    approved: 11892,
    declined: 781,
    timedOut: 121,
    lateResponses: 31,
    duplicates: 15,
  },
  issuers: [
    {
      issuerId: "issuer-bank-a",
      authorizationRate: 0.947,
      p95LatencyMs: 382,
      timedOut: 23,
      routeState: "healthy",
    },
    {
      issuerId: "issuer-bank-b",
      authorizationRate: 0.901,
      p95LatencyMs: 811,
      timedOut: 71,
      routeState: "degraded",
    },
    {
      issuerId: "issuer-bank-c",
      authorizationRate: 0.922,
      p95LatencyMs: 0,
      timedOut: 27,
      routeState: "unavailable",
    },
  ],
  ledger: {
    balanced: true,
    discrepancies: 0,
    lastReconciledAt: "2026-08-30T02:59:41Z",
  },
  outbox: {
    unpublished: 14,
    poisonMessages: 1,
    oldestUnpublishedAgeSeconds: 47,
  },
  incidents: [
    "issuer-bank-b latency above operator threshold",
    "1 outbox event reached the automatic retry ceiling",
  ],
  missingSections: ["Kafka consumer lag", "live topology"],
};
