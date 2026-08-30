import type { NetworkTransaction, OperationalSnapshot } from "./operations";

export interface TriageSummary {
  reconciliationState: "clean" | "review";
  outboxState: "healthy" | "backlog" | "poison";
  notes: string[];
}

export function filterTransactions(
  transactions: NetworkTransaction[],
  query: string,
): NetworkTransaction[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return transactions;

  return transactions.filter((transaction) =>
    [
      transaction.id,
      transaction.issuerId,
      transaction.stan,
      transaction.rrn,
      transaction.disposition,
      transaction.reversalStan ?? "",
      transaction.reversalRrn ?? "",
      transaction.reversalReason ?? "",
    ].some((value) => value.toLowerCase().includes(normalized)),
  );
}

export function buildTriageSummary(snapshot: OperationalSnapshot): TriageSummary {
  const notes: string[] = [];
  const reconciliationState =
    snapshot.ledger.balanced && snapshot.ledger.discrepancies === 0 ? "clean" : "review";

  if (reconciliationState === "review") {
    notes.push(
      `${snapshot.ledger.discrepancies} reconciliation discrepancy item(s) require AtlasPay review`,
    );
  } else {
    notes.push("Latest snapshot reports balanced ledger state with no reconciliation discrepancies");
  }

  let outboxState: TriageSummary["outboxState"] = "healthy";
  if (snapshot.outbox.poisonMessages > 0) {
    outboxState = "poison";
    notes.push(`${snapshot.outbox.poisonMessages} poison outbox message(s) require explicit inspection`);
  } else if (snapshot.outbox.unpublished > 0) {
    outboxState = "backlog";
    notes.push(`${snapshot.outbox.unpublished} unpublished outbox event(s) remain queued`);
  } else {
    notes.push("No unpublished outbox events are reported in the snapshot");
  }

  return { reconciliationState, outboxState, notes };
}
