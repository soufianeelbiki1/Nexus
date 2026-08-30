import type {
  DataState,
  NetworkDisposition,
  OperationalSnapshot,
  SnapshotHealth,
} from "./operations";

export class SnapshotContractError extends Error {}

function object(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new SnapshotContractError(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string") throw new SnapshotContractError(`${path} must be a string`);
  return value;
}

function number(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new SnapshotContractError(`${path} must be a finite number`);
  }
  return value;
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") throw new SnapshotContractError(`${path} must be a boolean`);
  return value;
}

function nullableString(value: unknown, path: string): string | null {
  return value === null ? null : string(value, path);
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  const candidate = string(value, path);
  if (!allowed.includes(candidate as T)) {
    throw new SnapshotContractError(`${path} has unsupported value ${candidate}`);
  }
  return candidate as T;
}

function strings(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new SnapshotContractError(`${path} must be an array`);
  return value.map((item, index) => string(item, `${path}[${index}]`));
}

const healthValues = ["healthy", "degraded", "critical"] as const satisfies readonly SnapshotHealth[];
const dataStateValues = ["fresh", "stale", "partial", "unavailable"] as const satisfies readonly DataState[];
const dispositionValues = [
  "accepted",
  "timed_out",
  "late",
  "duplicate",
  "mismatched",
] as const satisfies readonly NetworkDisposition[];
const routeStates = ["healthy", "degraded", "unavailable"] as const;
const reversalReasons = ["timeout", "late_response", "operator"] as const;

export function parseOperationalSnapshot(payload: unknown): OperationalSnapshot {
  const root = object(payload, "snapshot");
  const provenance = object(root.provenance, "snapshot.provenance");
  const authorizations = object(root.authorizations, "snapshot.authorizations");
  const ledger = object(root.ledger, "snapshot.ledger");
  const outbox = object(root.outbox, "snapshot.outbox");

  if (!Array.isArray(root.issuers)) throw new SnapshotContractError("snapshot.issuers must be an array");
  if (!Array.isArray(root.networkTransactions)) {
    throw new SnapshotContractError("snapshot.networkTransactions must be an array");
  }

  return {
    provenance: {
      source: enumValue(provenance.source, ["atlaspay-fixture", "atlaspay-api"] as const, "snapshot.provenance.source"),
      sourceCommit: string(provenance.sourceCommit, "snapshot.provenance.sourceCommit"),
      generatedAt: string(provenance.generatedAt, "snapshot.provenance.generatedAt"),
      contractVersion: enumValue(provenance.contractVersion, ["v1"] as const, "snapshot.provenance.contractVersion"),
    },
    health: enumValue(root.health, healthValues, "snapshot.health"),
    dataState: enumValue(root.dataState, dataStateValues, "snapshot.dataState"),
    authorizations: {
      total: number(authorizations.total, "snapshot.authorizations.total"),
      approved: number(authorizations.approved, "snapshot.authorizations.approved"),
      declined: number(authorizations.declined, "snapshot.authorizations.declined"),
      timedOut: number(authorizations.timedOut, "snapshot.authorizations.timedOut"),
      lateResponses: number(authorizations.lateResponses, "snapshot.authorizations.lateResponses"),
      duplicates: number(authorizations.duplicates, "snapshot.authorizations.duplicates"),
    },
    issuers: root.issuers.map((value, index) => {
      const issuer = object(value, `snapshot.issuers[${index}]`);
      return {
        issuerId: string(issuer.issuerId, `snapshot.issuers[${index}].issuerId`),
        authorizationRate: number(issuer.authorizationRate, `snapshot.issuers[${index}].authorizationRate`),
        p95LatencyMs: number(issuer.p95LatencyMs, `snapshot.issuers[${index}].p95LatencyMs`),
        timedOut: number(issuer.timedOut, `snapshot.issuers[${index}].timedOut`),
        routeState: enumValue(issuer.routeState, routeStates, `snapshot.issuers[${index}].routeState`),
      };
    }),
    networkTransactions: root.networkTransactions.map((value, index) => {
      const transaction = object(value, `snapshot.networkTransactions[${index}]`);
      return {
        id: string(transaction.id, `snapshot.networkTransactions[${index}].id`),
        issuerId: string(transaction.issuerId, `snapshot.networkTransactions[${index}].issuerId`),
        stan: string(transaction.stan, `snapshot.networkTransactions[${index}].stan`),
        rrn: string(transaction.rrn, `snapshot.networkTransactions[${index}].rrn`),
        disposition: enumValue(
          transaction.disposition,
          dispositionValues,
          `snapshot.networkTransactions[${index}].disposition`,
        ),
        latencyMs:
          transaction.latencyMs === null
            ? null
            : number(transaction.latencyMs, `snapshot.networkTransactions[${index}].latencyMs`),
        reversalStan: nullableString(
          transaction.reversalStan,
          `snapshot.networkTransactions[${index}].reversalStan`,
        ),
        reversalRrn: nullableString(
          transaction.reversalRrn,
          `snapshot.networkTransactions[${index}].reversalRrn`,
        ),
        reversalReason:
          transaction.reversalReason === null
            ? null
            : enumValue(
                transaction.reversalReason,
                reversalReasons,
                `snapshot.networkTransactions[${index}].reversalReason`,
              ),
      };
    }),
    ledger: {
      balanced: boolean(ledger.balanced, "snapshot.ledger.balanced"),
      discrepancies: number(ledger.discrepancies, "snapshot.ledger.discrepancies"),
      lastReconciledAt: string(ledger.lastReconciledAt, "snapshot.ledger.lastReconciledAt"),
    },
    outbox: {
      unpublished: number(outbox.unpublished, "snapshot.outbox.unpublished"),
      poisonMessages: number(outbox.poisonMessages, "snapshot.outbox.poisonMessages"),
      oldestUnpublishedAgeSeconds: number(
        outbox.oldestUnpublishedAgeSeconds,
        "snapshot.outbox.oldestUnpublishedAgeSeconds",
      ),
    },
    incidents: strings(root.incidents, "snapshot.incidents"),
    missingSections: strings(root.missingSections, "snapshot.missingSections"),
  };
}
