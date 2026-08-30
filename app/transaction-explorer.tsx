"use client";

import { useMemo, useState } from "react";

import type { NetworkDisposition, NetworkTransaction } from "../lib/operations";
import { filterTransactions } from "../lib/operator-workflows";

const dispositions: Array<NetworkDisposition | "all"> = [
  "all",
  "accepted",
  "timed_out",
  "late",
  "duplicate",
  "mismatched",
];

export function TransactionExplorer({
  transactions,
}: {
  transactions: NetworkTransaction[];
}) {
  const [query, setQuery] = useState("");
  const [disposition, setDisposition] = useState<NetworkDisposition | "all">("all");
  const filtered = useMemo(
    () => filterTransactions(transactions, { query, disposition }),
    [transactions, query, disposition],
  );

  return (
    <section className="panel transaction-panel" aria-label="Network transaction drilldown">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Network correlation</p>
          <h2>Recent transaction outcomes</h2>
        </div>
        <span>
          {filtered.length} of {transactions.length} fixture records
        </span>
      </div>

      <div className="transaction-filters" role="search">
        <label>
          Search
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Issuer, STAN, RRN, reversal…"
          />
        </label>
        <label>
          Outcome
          <select
            value={disposition}
            onChange={(event) =>
              setDisposition(event.target.value as NetworkDisposition | "all")
            }
          >
            {dispositions.map((value) => (
              <option key={value} value={value}>
                {value.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="transaction-list">
        {filtered.length === 0 ? (
          <p className="empty-state">No transactions match the current filter.</p>
        ) : (
          filtered.map((transaction) => (
            <article className="transaction" key={transaction.id}>
              <div>
                <strong>{transaction.issuerId}</strong>
                <small>
                  STAN {transaction.stan} · RRN {transaction.rrn}
                </small>
              </div>
              <div>
                <span className={"pill disposition-" + transaction.disposition}>
                  {transaction.disposition.replace("_", " ")}
                </span>
                <small>
                  {transaction.latencyMs === null
                    ? "latency unavailable"
                    : String(transaction.latencyMs) + " ms"}
                </small>
              </div>
              <div>
                <strong>{transaction.reversalReason ? "Reversal linked" : "No reversal"}</strong>
                <small>
                  {transaction.reversalReason
                    ? transaction.reversalReason.replace("_", " ") +
                      " · STAN " +
                      transaction.reversalStan +
                      " · RRN " +
                      transaction.reversalRrn
                    : "No reversal correlation in snapshot"}
                </small>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
