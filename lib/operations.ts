export type SnapshotHealth = "healthy" | "degraded" | "critical";
export type DataState = "fresh" | "stale" | "partial" | "unavailable";
export type NetworkDisposition = "accepted" | "timed_out" | "late" | "duplicate" | "mismatched";

export interface Provenance {
  source: "atlaspay-fixture" | "atlaspay-api";
  sourceCommit: string;
  generatedAt: string;
  contractVersion: "v1";
}

export interface AuthorizationMetrics {
  total: number;
  approved: number;
  declined: number;
  timedOut: number;
  lateResponses: number;
  duplicates: number;
}

export interface IssuerMetric {
  issuerId: string;
  authorizationRate: number;
  p95LatencyMs: number;
  timedOut: number;
  routeState: "healthy" | "degraded" | "unavailable";
}

export interface NetworkTransaction {
  id: string;
  issuerId: string;
  stan: string;
  rrn: string;
  disposition: NetworkDisposition;
  latencyMs: number | null;
  reversalStan: string | null;
  reversalRrn: string | null;
  reversalReason: "timeout" | "late_response" | "operator" | null;
}

export interface LedgerHealth {
  balanced: boolean;
  discrepancies: number;
  lastReconciledAt: string;
}

export interface OutboxHealth {
  unpublished: number;
  poisonMessages: number;
  oldestUnpublishedAgeSeconds: number;
}

export interface OperationalSnapshot {
  provenance: Provenance;
  health: SnapshotHealth;
  dataState: DataState;
  authorizations: AuthorizationMetrics;
  issuers: IssuerMetric[];
  networkTransactions: NetworkTransaction[];
  ledger: LedgerHealth;
  outbox: OutboxHealth;
  incidents: string[];
  missingSections: string[];
}

export type SnapshotLoadResult =
  | { state: "ready"; snapshot: OperationalSnapshot }
  | { state: "stale"; snapshot: OperationalSnapshot; ageSeconds: number }
  | { state: "partial"; snapshot: OperationalSnapshot; missingSections: string[] }
  | { state: "unavailable"; reason: string };

export function classifyFreshness(
  generatedAt: string,
  now: Date,
  staleAfterSeconds = 90,
): DataState {
  const generated = new Date(generatedAt);
  if (Number.isNaN(generated.getTime())) return "unavailable";
  const ageSeconds = (now.getTime() - generated.getTime()) / 1000;
  return ageSeconds > staleAfterSeconds ? "stale" : "fresh";
}

export function approvalRate(metrics: AuthorizationMetrics): number {
  return metrics.total === 0 ? 0 : metrics.approved / metrics.total;
}
