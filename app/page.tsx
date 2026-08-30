import { atlasPayFixture } from "../data/atlaspay-snapshot";
import { AtlasPayApiSource } from "../lib/atlaspay-api";
import { approvalRate } from "../lib/operations";
import { buildOperatorChecks } from "../lib/operator-workflows";
import { atlasPayApiConfigFromEnvironment } from "../lib/operator-source";
import { FixtureSnapshotSource, loadOperationalSnapshot } from "../lib/snapshot-loader";
import { LiveOperatorSnapshot } from "./live-operator-snapshot";
import { TransactionExplorer } from "./transaction-explorer";

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function UnavailableSnapshot({ reason }: { reason: string }) {
  return (
    <main className="shell">
      <p className="eyebrow">AtlasPay operator control plane</p>
      <h1>Nexus</h1>
      <section className="panel unavailable" role="alert">
        <h2>Operational snapshot unavailable</h2>
        <p>{reason}</p>
        <p>No telemetry values are rendered while source integrity is unknown.</p>
      </section>
    </main>
  );
}

export default async function Home() {
  let apiConfig;
  try {
    apiConfig = atlasPayApiConfigFromEnvironment({
      ATLASPAY_API_BASE_URL: process.env.ATLASPAY_API_BASE_URL,
      ATLASPAY_API_TOKEN: process.env.ATLASPAY_API_TOKEN,
      ATLASPAY_API_TIMEOUT_MS: process.env.ATLASPAY_API_TIMEOUT_MS,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "invalid AtlasPay API configuration";
    return <UnavailableSnapshot reason={reason} />;
  }

  if (apiConfig) {
    try {
      const snapshot = await new AtlasPayApiSource(apiConfig).load();
      const generatedAt = new Date(snapshot.provenance.generated_at);
      if (Number.isNaN(generatedAt.getTime())) {
        return <UnavailableSnapshot reason="AtlasPay API snapshot generated_at is invalid" />;
      }
      return <LiveOperatorSnapshot snapshot={snapshot} now={new Date()} />;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown AtlasPay API failure";
      return <UnavailableSnapshot reason={reason} />;
    }
  }

  const result = await loadOperationalSnapshot(new FixtureSnapshotSource(atlasPayFixture), {
    now: new Date(),
  });

  if (result.state === "unavailable") {
    return <UnavailableSnapshot reason={result.reason} />;
  }

  const snapshot = result.snapshot;
  const rate = approvalRate(snapshot.authorizations);
  const operatorChecks = buildOperatorChecks(snapshot);
  const loadMessage =
    result.state === "partial"
      ? `Fixture contract: ${result.missingSections.join(" · ")}`
      : result.state === "stale"
        ? `Fixture snapshot is ${result.ageSeconds}s old`
        : "Fixture freshness is within the configured window";

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">AtlasPay operator control plane</p>
          <h1>Nexus</h1>
          <p className="lede">
            Contract-development fixture mode. Configure AtlasPay API credentials to switch to
            live durable operational data; fixture values are never used as a live fallback.
          </p>
        </div>
        <div className={`status status-${snapshot.health}`}>
          <span>{snapshot.health}</span>
          <strong>{result.state} fixture data</strong>
        </div>
      </header>

      <div className={`load-state load-state-${result.state}`} role="status">
        {loadMessage}
      </div>

      <section className="provenance" aria-label="Snapshot provenance">
        <span>Contract {snapshot.provenance.contractVersion}</span>
        <span>Source: {snapshot.provenance.source}</span>
        <span>Mode: contract fixture</span>
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
            <div className="incident" key={incident}>
              {incident}
            </div>
          ))}
          <div className="missing">
            <strong>Unavailable in this fixture contract</strong>
            <p>{snapshot.missingSections.join(" · ")}</p>
          </div>
        </aside>
      </section>

      <section className="operator-checks" aria-label="Reconciliation and outbox workflow">
        {operatorChecks.map((check) => (
          <article
            className={"panel operator-check operator-check-" + check.severity}
            key={check.id}
          >
            <div>
              <p className="eyebrow">Read-only workflow</p>
              <h2>{check.title}</h2>
            </div>
            <p>{check.summary}</p>
            <strong>{check.operatorAction}</strong>
          </article>
        ))}
      </section>

      <TransactionExplorer transactions={snapshot.networkTransactions} />
    </main>
  );
}
