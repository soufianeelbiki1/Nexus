export class AtlasPayContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AtlasPayContractError";
  }
}

export type SectionState = "available" | "unavailable";
export type SnapshotHealth = "healthy" | "degraded" | "critical";
export type AtlasPayDataState = "fresh" | "partial";

export interface AtlasPayOperatorSnapshot {
  provenance: {
    source: "atlaspay-api";
    generated_at: string;
    contract_version: "v1";
  };
  health: SnapshotHealth;
  data_state: AtlasPayDataState;
  payments: {
    state: SectionState;
    total: number | null;
    by_status: Record<string, number> | null;
    operations: number | null;
    reason: string | null;
  };
  ledger: {
    state: SectionState;
    balanced: boolean | null;
    discrepancies: number | null;
    discrepancy_kinds: Record<string, number> | null;
    inspected_at: string | null;
    reason: string | null;
  };
  outbox: {
    state: SectionState;
    unpublished: number | null;
    poison_messages: number | null;
    oldest_unpublished_age_seconds: number | null;
    reason: string | null;
  };
  network: {
    state: SectionState;
    reason: string | null;
  };
  incidents: string[];
  missing_sections: string[];
}

type JsonObject = Record<string, unknown>;

function object(value: unknown, path: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AtlasPayContractError(`${path} must be an object`);
  }
  return value as JsonObject;
}

function text(value: unknown, path: string): string {
  if (typeof value !== "string") throw new AtlasPayContractError(`${path} must be a string`);
  return value;
}

function nullableText(value: unknown, path: string): string | null {
  return value === null ? null : text(value, path);
}

function nonNegative(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new AtlasPayContractError(`${path} must be a finite non-negative number`);
  }
  return value;
}

function nullableNonNegative(value: unknown, path: string): number | null {
  return value === null ? null : nonNegative(value, path);
}

function nullableBoolean(value: unknown, path: string): boolean | null {
  if (value === null) return null;
  if (typeof value !== "boolean") throw new AtlasPayContractError(`${path} must be a boolean or null`);
  return value;
}

function literal<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new AtlasPayContractError(`${path} has an unsupported value`);
  }
  return value as T;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new AtlasPayContractError(`${path} must be an array`);
  return value.map((entry, index) => text(entry, `${path}[${index}]`));
}

function nullableCounterMap(value: unknown, path: string): Record<string, number> | null {
  if (value === null) return null;
  const map = object(value, path);
  return Object.fromEntries(
    Object.entries(map).map(([key, entry]) => [key, nonNegative(entry, `${path}.${key}`)]),
  );
}

function requireAvailableFields(
  state: SectionState,
  values: Array<[string, unknown]>,
): void {
  if (state !== "available") return;
  for (const [path, value] of values) {
    if (value === null) throw new AtlasPayContractError(`${path} cannot be null when section is available`);
  }
}

export function parseAtlasPayOperatorSnapshot(value: unknown): AtlasPayOperatorSnapshot {
  const root = object(value, "snapshot");
  const provenance = object(root.provenance, "snapshot.provenance");
  const payments = object(root.payments, "snapshot.payments");
  const ledger = object(root.ledger, "snapshot.ledger");
  const outbox = object(root.outbox, "snapshot.outbox");
  const network = object(root.network, "snapshot.network");

  const paymentState = literal(payments.state, ["available", "unavailable"], "snapshot.payments.state");
  const paymentTotal = nullableNonNegative(payments.total, "snapshot.payments.total");
  const paymentStatuses = nullableCounterMap(payments.by_status, "snapshot.payments.by_status");
  const paymentOperations = nullableNonNegative(payments.operations, "snapshot.payments.operations");
  requireAvailableFields(paymentState, [
    ["snapshot.payments.total", paymentTotal],
    ["snapshot.payments.by_status", paymentStatuses],
    ["snapshot.payments.operations", paymentOperations],
  ]);

  const ledgerState = literal(ledger.state, ["available", "unavailable"], "snapshot.ledger.state");
  const ledgerBalanced = nullableBoolean(ledger.balanced, "snapshot.ledger.balanced");
  const discrepancies = nullableNonNegative(ledger.discrepancies, "snapshot.ledger.discrepancies");
  const discrepancyKinds = nullableCounterMap(
    ledger.discrepancy_kinds,
    "snapshot.ledger.discrepancy_kinds",
  );
  const inspectedAt = nullableText(ledger.inspected_at, "snapshot.ledger.inspected_at");
  requireAvailableFields(ledgerState, [
    ["snapshot.ledger.balanced", ledgerBalanced],
    ["snapshot.ledger.discrepancies", discrepancies],
    ["snapshot.ledger.discrepancy_kinds", discrepancyKinds],
    ["snapshot.ledger.inspected_at", inspectedAt],
  ]);

  const outboxState = literal(outbox.state, ["available", "unavailable"], "snapshot.outbox.state");
  const unpublished = nullableNonNegative(outbox.unpublished, "snapshot.outbox.unpublished");
  const poisonMessages = nullableNonNegative(outbox.poison_messages, "snapshot.outbox.poison_messages");
  const oldestAge = nullableNonNegative(
    outbox.oldest_unpublished_age_seconds,
    "snapshot.outbox.oldest_unpublished_age_seconds",
  );
  requireAvailableFields(outboxState, [
    ["snapshot.outbox.unpublished", unpublished],
    ["snapshot.outbox.poison_messages", poisonMessages],
    ["snapshot.outbox.oldest_unpublished_age_seconds", oldestAge],
  ]);

  return {
    provenance: {
      source: literal(provenance.source, ["atlaspay-api"], "snapshot.provenance.source"),
      generated_at: text(provenance.generated_at, "snapshot.provenance.generated_at"),
      contract_version: literal(
        provenance.contract_version,
        ["v1"],
        "snapshot.provenance.contract_version",
      ),
    },
    health: literal(root.health, ["healthy", "degraded", "critical"], "snapshot.health"),
    data_state: literal(root.data_state, ["fresh", "partial"], "snapshot.data_state"),
    payments: {
      state: paymentState,
      total: paymentTotal,
      by_status: paymentStatuses,
      operations: paymentOperations,
      reason: nullableText(payments.reason, "snapshot.payments.reason"),
    },
    ledger: {
      state: ledgerState,
      balanced: ledgerBalanced,
      discrepancies,
      discrepancy_kinds: discrepancyKinds,
      inspected_at: inspectedAt,
      reason: nullableText(ledger.reason, "snapshot.ledger.reason"),
    },
    outbox: {
      state: outboxState,
      unpublished,
      poison_messages: poisonMessages,
      oldest_unpublished_age_seconds: oldestAge,
      reason: nullableText(outbox.reason, "snapshot.outbox.reason"),
    },
    network: {
      state: literal(network.state, ["available", "unavailable"], "snapshot.network.state"),
      reason: nullableText(network.reason, "snapshot.network.reason"),
    },
    incidents: stringArray(root.incidents, "snapshot.incidents"),
    missing_sections: stringArray(root.missing_sections, "snapshot.missing_sections"),
  };
}

export interface AtlasPayApiSourceOptions {
  baseUrl: string;
  token: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class AtlasPayApiSource {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AtlasPayApiSourceOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.token = options.token;
    this.timeoutMs = options.timeoutMs ?? 3000;
    this.fetchImpl = options.fetchImpl ?? fetch;

    if (!this.baseUrl) throw new Error("AtlasPay API baseUrl must not be empty");
    if (!this.token) throw new Error("AtlasPay API token must not be empty");
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new Error("AtlasPay API timeoutMs must be positive");
    }
  }

  async load(): Promise<AtlasPayOperatorSnapshot> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/v1/ops/snapshot`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`AtlasPay operational API returned HTTP ${response.status}`);
      }
      return parseAtlasPayOperatorSnapshot(await response.json());
    } finally {
      clearTimeout(timeout);
    }
  }
}
