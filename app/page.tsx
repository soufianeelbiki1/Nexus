import { atlasPayFixture } from "../data/atlaspay-snapshot";
import { approvalRate } from "../lib/operations";

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function Home() {
  const snapshot = atlasPayFixture;
  const rate = approvalRate(snapshot.authorizations);

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">AtlasPay operator control plane</p>
          <h1>Nexus</h1>
          <p className="lede">
            Read-only operational view with explicit provenance, degraded states, and no
            fabricated live-telemetry claims.
          </p>
        </div>
        <div className={`status status-${snapshot.health}`}>
          <span>{snapshot.health}</span>
          <strong>{snapshot.dataState} data</strong>
        </div>
      </header>

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
    </main>
  );
}
