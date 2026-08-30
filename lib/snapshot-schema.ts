import type { OperationalSnapshot } from "./operations";

export class SnapshotContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotContractError";
  }
}

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

function rate(value: unknown, path: string): number {
  const parsed = number(value, path);
  if (parsed < 0 || parsed > 1) throw new SnapshotContractError(`${path} must be between 0 and 1`);
  return parsed;
}

function nonNegative(value: unknown, path: string): number {
  const parsed = number(value, path);
  if (parsed < 0) throw new SnapshotContractError(`${path} must be non-negative`);
  return parsed;
}

function literal<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new SnapshotContractError(`${path} has an unsupported value`);
  }
  return value as T;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new SnapshotContractError(`${path} must be an array`);
  return value.map((entry, index) => string(entry, `${path}[${index}]`));
}

export function parseOperationalSnapshot(value: unknown): OperationalSnapshot {
  const root = object(value, "snapshot");
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
      source: literal(provenance.source, ["atlaspay-fixture", "atlaspay-api"], "snapshot.provenance.source"),
      sourceCommit: string(provenance.sourceCommit, "snapshot.provenance.sourceCommit"),
      generatedAt: string(provenance.generatedAt, "snapshot.provenance.generatedAt"),
      contractVersion: literal(provenance.contractVersion, ["v1"], "snapshot.provenance.contractVersion"),
    },
    health: literal(root.health, ["healthy", "degraded", "critical"], "snapshot.health"),
    dataState: literal(root.dataState, ["fresh", "stale", "partial", "unavailable"], "snapshot.dataState"),
    authorizations: {
      total: nonNegative(authorizations.total, "snapshot.authorizations.total"),
      approved: nonNegative(authorizations.approved, "snapshot.authorizations.approved"),
      declined: nonNegative(authorizations.declined, "snapshot.authorizations.declined"),
      timedOut: nonNegative(authorizations.timedOut, "snapshot.authorizations.timedOut"),
      lateResponses: nonNegative(authorizations.lateResponses, "snapshot.authorizations.lateResponses"),
      duplicates: nonNegative(authorizations.duplicates, "snapshot.authorizations.duplicates"),
    },
    issuers: root.issuers.map((entry, index) => {
      const issuer = object(entry, `snapshot.issuers[${index}]`);
      return {
        issuerId: string(issuer.issuerId, `snapshot.issuers[${index}].issuerId`),
        authorizationRate: rate(issuer.authorizationRate, `snapshot.issuers[${index}].authorizationRate`),
        p95LatencyMs: nonNegative(issuer.p95LatencyMs, `snapshot.issuers[${index}].p95LatencyMs`),
        timedOut: nonNegative(issuer.timedOut, `snapshot.issuers[${index}].timedOut`),
        routeState: literal(
          issuer.routeState,
          ["healthy", "degraded", "unavailable"],
          `snapshot.issuers[${index}].routeState`,
        ),
      };
    }),
    networkTransactions: root.networkTransactions.map((entry, index) => {
      const transaction = object(entry, `snapshot.networkTransactions[${index}]`);
      const latencyMs =
        transaction.latencyMs === null
          ? null
          : nonNegative(transaction.latencyMs, `snapshot.networkTransactions[${index}].latencyMs`);
      const reversalReason =
        transaction.reversalReason === null
          ? null
          : literal(
              transaction.reversalReason,
              ["timeout", "late_response", "operator"],
              `snapshot.networkTransactions[${index}].reversalReason`,
            );
      const reversalStan =
        transaction.reversalStan === null
          ? null
          : string(transaction.reversalStan, `snapshot.networkTransactions[${index}].reversalStan`);
      const reversalRrn =
        transaction.reversalRrn === null
          ? null
          : string(transaction.reversalRrn, `snapshot.networkTransactions[${index}].reversalRrn`);
      const reversalNulls = [reversalReason, reversalStan, reversalRrn].filter(
        (value) => value === null,
      ).length;
      if (reversalNulls !== 0 && reversalNulls !== 3) {
        throw new SnapshotContractError(
          `snapshot.networkTransactions[${index}] reversal fields must be present together`,
        );
      }
      return {
        id: string(transaction.id, `snapshot.networkTransactions[${index}].id`),
        issuerId: string(transaction.issuerId, `snapshot.networkTransactions[${index}].issuerId`),
        stan: string(transaction.stan, `snapshot.networkTransactions[${index}].stan`),
        rrn: string(transaction.rrn, `snapshot.networkTransactions[${index}].rrn`),
        disposition: literal(
          transaction.disposition,
          ["accepted", "timed_out", "late", "duplicate", "mismatched"],
          `snapshot.networkTransactions[${index}].disposition`,
        ),
        latencyMs,
        reversalStan,
        reversalRrn,
        reversalReason,
      };
    }),
    ledger: {
      balanced: boolean(ledger.balanced, "snapshot.ledger.balanced"),
      discrepancies: nonNegative(ledger.discrepancies, "snapshot.ledger.discrepancies"),
      lastReconciledAt: string(ledger.lastReconciledAt, "snapshot.ledger.lastReconciledAt"),
    },
    outbox: {
      unpublished: nonNegative(outbox.unpublished, "snapshot.outbox.unpublished"),
      poisonMessages: nonNegative(outbox.poisonMessages, "snapshot.outbox.poisonMessages"),
      oldestUnpublishedAgeSeconds: nonNegative(
        outbox.oldestUnpublishedAgeSeconds,
        "snapshot.outbox.oldestUnpublishedAgeSeconds",
      ),
    },
    incidents: stringArray(root.incidents, "snapshot.incidents"),
    missingSections: stringArray(root.missingSections, "snapshot.missingSections"),
  };
}
