import { atlasPayFixture } from "../data/atlaspay-snapshot";
import { approvalRate } from "../lib/operations";
import { buildTriageSummary, filterTransactions } from "../lib/operator-read-model";
import { FixtureSnapshotSource, loadOperationalSnapshot } from "../lib/snapshot-loader";

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const result = await loadOperationalSnapshot(new FixtureSnapshotSource(atlasPayFixture), {
    now: new Date(),
  });

  if (result.state === "unavailable") {
    return (
      <main className="shell">
        <p className="eyebrow">AtlasPay operator control plane</p>
        <h1>Nexus</h1>
        <section className="panel unavailable" role="alert">
          <h2>Operational snapshot unavailable</h2>
          <p>{result.reason}</p>
          <p>No telemetry values are rendered while source integrity is unknown.</p>
        </section>
      </main>
    );
  }

  const snapshot = result.snapshot;
  const rate = approvalRate(snapshot.authorizations);
  const transactions = filterTransactions(snapshot.networkTransactions, query);
  const triage = buildTriageSummary(snapshot);
  const loadMessage =
    result.state === "partial"
      ? `Partial contract: ${result.missingSections.join(" · ")}`
      : result.state === "stale"
        ? `Snapshot is ${result.ageSeconds}s old`
        : "Snapshot freshness is within the configured window";

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">AtlasPay operator control plane</p>
          <h1>Nexus</h1>
          <p className="lede">
            Read-only operational view with runtime-validated provenance, degraded states,
            and no fabricated live-telemetry claims.
          </p>
        </div>
        <div className={`status status-${snapshot.health}`}>
          <span>{snapshot.health}</span>
          <strong>{result.state} data</strong>
        </div>
      </header>

      <div className={`load-state load-state-${result.state}`} role="status">
        {loadMessage}
      </div>

      <section className="provenance" aria-label="Snapshot provenance">
        <span>Contract {snapshot.provenance.contractVersion}</span>
        <span>Source: {snapshot.provenance.source}</span>
        <span>AtlasPay: {snapshot.provenance.sourceCommit.slice(0, 12)}</span>
        <span>Generated: {new Date(snapshot.provenance.generatedAt).toLocaleString("en-GB")}</span>
      </section>

      <section className="metrics" aria-label="Authorization overview">
        <article>
          <p>Authorization rate</p>
          <strong>{pct(rate)}</strong>
          <small>{snapshot.authorizations.approved.toLocaleString()} approved</small>
        </article>
        <article>
          <p>Timeouts</p>
          <strong>{snapshot.authorizations.timedOut}</strong>
          <small>{snapshot.authorizations.lateResponses} late responses</small>
        </article>
        <article>
          <p>Outbox backlog</p>
          <strong>{snapshot.outbox.unpublished}</strong>
          <small>{snapshot.outbox.poisonMessages} poison message</small>
        </article>
        <article>
          <p>Ledger</p>
          <strong>{snapshot.ledger.balanced ? "Balanced" : "Review"}</strong>
          <small>{snapshot.ledger.discrepancies} discrepancies</small>
        </article>
      </section>

      <section className="grid">
        <article className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Issuer routes</p>
              <h2>Authorization health</h2>
            </div>
            <span>{snapshot.issuers.length} routes</span>
          </div>
          <div className="issuer-list">
            {snapshot.issuers.map((issuer) => (
              <div className="issuer" key={issuer.issuerId}>
                <div>
                  <strong>{issuer.issuerId}</strong>
                  <small>{issuer.timedOut} timeouts</small>
                </div>
                <div className="issuer-metric">
                  <strong>{pct(issuer.authorizationRate)}</strong>
                  <small>
                    {issuer.routeState === "unavailable"
                      ? "latency unavailable"
                      : `${issuer.p95LatencyMs} ms p95`}
                  </small>
                </div>
                <span className={`pill pill-${issuer.routeState}`}>{issuer.routeState}</span>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel incidents">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Operator attention</p>
              <h2>Incidents</h2>
            </div>
            <span>{snapshot.incidents.length}</span>
          </div>
          {snapshot.incidents.map((incident) => (
            <div className="incident" key={incident}>{incident}</div>
          ))}
          <div className="missing">
            <strong>Unavailable in this contract</strong>
            <p>{snapshot.missingSections.join(" · ")}</p>
          </div>
        </aside>
      </section>

      <section className="panel triage-panel" aria-label="Read-only operations triage">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Read-only operations</p>
            <h2>Reconciliation & outbox triage</h2>
          </div>
          <span>No mutation controls</span>
        </div>
        <div className="triage-grid">
          <div>
            <small>Reconciliation</small>
            <strong>{triage.reconciliationState}</strong>
          </div>
          <div>
            <small>Outbox</small>
            <strong>{triage.outboxState}</strong>
          </div>
          <div>
            <small>Oldest unpublished</small>
            <strong>{snapshot.outbox.oldestUnpublishedAgeSeconds}s</strong>
          </div>
        </div>
        <ul className="triage-notes">
          {triage.notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
        <p className="readonly-note">
          Nexus surfaces evidence only. Replay or accounting repair remains an explicit AtlasPay
          operator action and is never triggered from this fixture-backed view.
        </p>
      </section>

      <section className="panel transaction-panel" aria-label="Network transaction drilldown">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Network correlation</p>
            <h2>Recent transaction outcomes</h2>
          </div>
          <span>{transactions.length} of {snapshot.networkTransactions.length} records</span>
        </div>
        <form className="transaction-search" method="get">
          <label htmlFor="transaction-query">Search issuer, STAN, RRN, outcome or reversal</label>
          <div>
            <input
              id="transaction-query"
              name="q"
              defaultValue={query}
              placeholder="issuer-bank-b or 234567"
              autoComplete="off"
            />
            <button type="submit">Filter</button>
          </div>
        </form>
        <div className="transaction-list">
          {transactions.length === 0 ? (
            <p className="empty-state">No transaction records match this filter.</p>
          ) : transactions.map((transaction) => (
            <article className="transaction" key={transaction.id}>
              <div>
                <strong>{transaction.issuerId}</strong>
                <small>STAN {transaction.stan} · RRN {transaction.rrn}</small>
              </div>
              <div>
                <span className={`pill disposition-${transaction.disposition}`}>
                  {transaction.disposition.replace("_", " ")}
                </span>
                <small>
                  {transaction.latencyMs === null ? "latency unavailable" : `${transaction.latencyMs} ms`}
                </small>
              </div>
              <div>
                <strong>{transaction.reversalReason ? "Reversal linked" : "No reversal"}</strong>
                <small>
                  {transaction.reversalReason
                    ? `${transaction.reversalReason.replace("_", " ")} · STAN ${transaction.reversalStan} · RRN ${transaction.reversalRrn}`
                    : "No reversal correlation in snapshot"}
                </small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
