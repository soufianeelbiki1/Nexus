import type {
  NetworkDisposition,
  NetworkTransaction,
  OperationalSnapshot,
} from "./operations";

export interface TransactionFilter {
  query?: string;
  disposition?: NetworkDisposition | "all";
}

export type OperatorCheckSeverity = "ok" | "warning" | "critical";

export interface OperatorCheck {
  id: "ledger-reconciliation" | "outbox-delivery";
  severity: OperatorCheckSeverity;
  title: string;
  summary: string;
  operatorAction: string;
}

export function filterTransactions(
  transactions: NetworkTransaction[],
  filter: TransactionFilter,
): NetworkTransaction[] {
  const query = filter.query?.trim().toLowerCase() ?? "";
  const disposition = filter.disposition ?? "all";

  return transactions.filter((transaction) => {
    if (disposition !== "all" && transaction.disposition !== disposition) {
      return false;
    }
    if (!query) return true;

    const searchable = [
      transaction.id,
      transaction.issuerId,
      transaction.stan,
      transaction.rrn,
      transaction.reversalStan ?? "",
      transaction.reversalRrn ?? "",
      transaction.reversalReason ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });
}

export function buildOperatorChecks(snapshot: OperationalSnapshot): OperatorCheck[] {
  const ledger: OperatorCheck =
    snapshot.ledger.balanced && snapshot.ledger.discrepancies === 0
      ? {
          id: "ledger-reconciliation",
          severity: "ok",
          title: "Ledger reconciliation",
          summary:
            "Balanced with 0 discrepancies at " + snapshot.ledger.lastReconciledAt + ".",
          operatorAction:
            "No intervention required; preserve the reconciliation evidence.",
        }
      : {
          id: "ledger-reconciliation",
          severity: "critical",
          title: "Ledger reconciliation",
          summary:
            "balanced=" +
            String(snapshot.ledger.balanced) +
            "; discrepancies=" +
            String(snapshot.ledger.discrepancies) +
            ".",
          operatorAction:
            "Investigate source records and reconciliation evidence; do not mutate accounting history automatically.",
        };

  let outbox: OperatorCheck;
  if (snapshot.outbox.poisonMessages > 0) {
    outbox = {
      id: "outbox-delivery",
      severity: "critical",
      title: "Outbox delivery",
      summary:
        String(snapshot.outbox.poisonMessages) +
        " poison message(s); " +
        String(snapshot.outbox.unpublished) +
        " unpublished event(s).",
      operatorAction:
        "Inspect retained failure metadata and retry policy before any bounded replay; do not discard poison events.",
    };
  } else if (snapshot.outbox.unpublished > 0) {
    outbox = {
      id: "outbox-delivery",
      severity: "warning",
      title: "Outbox delivery",
      summary:
        String(snapshot.outbox.unpublished) +
        " unpublished event(s); oldest age " +
        String(snapshot.outbox.oldestUnpublishedAgeSeconds) +
        "s.",
      operatorAction:
        "Check publisher health and backlog age; external publication remains at-least-once.",
    };
  } else {
    outbox = {
      id: "outbox-delivery",
      severity: "ok",
      title: "Outbox delivery",
      summary: "No unpublished or poison events in the current snapshot.",
      operatorAction: "No intervention required.",
    };
  }

  return [ledger, outbox];
}
