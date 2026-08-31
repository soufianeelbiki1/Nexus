import type { AtlasPayOperatorSnapshot } from "../lib/atlaspay-api";

function count(value: number | null): string {
  return value === null ? "Unavailable" : value.toLocaleString("en-GB");
}

function sectionDetail(state: "available" | "unavailable", reason: string | null): string {
  if (state === "available") return "Durable AtlasPay snapshot";
  return reason ?? "Section unavailable";
}

export function LiveOperatorSnapshot({
  snapshot,
  now,
  staleAfterSeconds = 90,
}: {
  snapshot: AtlasPayOperatorSnapshot;
  now: Date;
  staleAfterSeconds?: number;
}) {
  const generatedAt = new Date(snapshot.provenance.generated_at);
  const ageSeconds = Math.max(0, Math.floor((now.getTime() - generatedAt.getTime()) / 1000));
  const freshnessState =
    snapshot.data_state === "partial"
      ? "partial"
      : ageSeconds > staleAfterSeconds
        ? "stale"
        : "ready";
  const loadMessage =
    snapshot.data_state === "partial"
      ? `Partial live contract: ${snapshot.missing_sections.join(" · ") || "producer marked partial"}`
      : freshnessState === "stale"
        ? `Live snapshot is ${ageSeconds}s old`
        : `Live AtlasPay snapshot is ${ageSeconds}s old`;

  const paymentStatuses = Object.entries(snapshot.payments.by_status ?? {}).sort((left, right) =>
    left[0].localeCompare(right[0]),
  );
  const networkDispositions = Object.entries(snapshot.network.by_disposition ?? {}).sort(
    (left, right) => left[0].localeCompare(right[0]),
  );

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">AtlasPay operator control plane</p>
          <h1>Nexus</h1>
          <p className="lede">
            Live, read-only AtlasPay operational data. Unavailable sections stay unavailable;
            Nexus does not replace them with fixture values or invented zeroes.
          </p>
        </div>
        <div className={`status status-${snapshot.health}`}>
          <span>{snapshot.health}</span>
          <strong>{freshnessState} live data</strong>
        </div>
      </header>

      <div className={`load-state load-state-${freshnessState}`} role="status">
        {loadMessage}
      </div>

      <section className="provenance" aria-label="Snapshot provenance">
        <span>Contract {snapshot.provenance.contract_version}</span>
        <span>Source: {snapshot.provenance.source}</span>
        <span>Mode: authenticated API</span>
        <span>Generated: {generatedAt.toLocaleString("en-GB")}</span>
      </section>

      <section className="metrics" aria-label="Durable AtlasPay overview">
        <article>
          <p>Payments</p>
          <strong>{count(snapshot.payments.total)}</strong>
          <small>
            {snapshot.payments.operations === null
              ? sectionDetail(snapshot.payments.state, snapshot.payments.reason)
              : `${snapshot.payments.operations.toLocaleString("en-GB")} operations`}
          </small>
        </article>
        <article>
          <p>Ledger</p>
          <strong>
            {snapshot.ledger.balanced === null
              ? "Unavailable"
              : snapshot.ledger.balanced
                ? "Balanced"
                : "Review"}
          </strong>
          <small>
            {snapshot.ledger.discrepancies === null
              ? sectionDetail(snapshot.ledger.state, snapshot.ledger.reason)
              : `${snapshot.ledger.discrepancies.toLocaleString("en-GB")} discrepancies`}
          </small>
        </article>
        <article>
          <p>Outbox backlog</p>
          <strong>{count(snapshot.outbox.unpublished)}</strong>
          <small>
            {snapshot.outbox.poison_messages === null
              ? sectionDetail(snapshot.outbox.state, snapshot.outbox.reason)
              : `${snapshot.outbox.poison_messages.toLocaleString("en-GB")} poison messages`}
          </small>
        </article>
        <article>
          <p>Network observations</p>
          <strong>{count(snapshot.network.observations)}</strong>
          <small>
            {snapshot.network.state === "available"
              ? `${count(snapshot.network.timeouts)} timeouts · ${count(snapshot.network.late_responses)} late`
              : sectionDetail(snapshot.network.state, snapshot.network.reason)}
          </small>
        </article>
      </section>

      <section className="grid">
        <article className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Durable payment state</p>
              <h2>Status distribution</h2>
            </div>
            <span>{paymentStatuses.length} statuses</span>
          </div>
          {snapshot.payments.state === "available" ? (
            <div className="issuer-list">
              {paymentStatuses.map(([status, value]) => (
                <div className="issuer" key={status}>
                  <div>
                    <strong>{status}</strong>
                    <small>Persisted payment status</small>
                  </div>
                  <div className="issuer-metric">
                    <strong>{value.toLocaleString("en-GB")}</strong>
                    <small>payments</small>
                  </div>
                </div>
              ))}
              {paymentStatuses.length === 0 ? (
                <div className="missing">
                  <strong>No status rows</strong>
                  <p>The producer returned an available section with an empty status map.</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="missing">
              <strong>Payments unavailable</strong>
              <p>{snapshot.payments.reason ?? "AtlasPay did not expose durable payment data."}</p>
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Durable network history</p>
              <h2>Authorization outcomes</h2>
            </div>
            <span>
              {snapshot.network.p95_latency_ms === null
                ? "p95 unavailable"
                : `p95 ${Math.round(snapshot.network.p95_latency_ms).toLocaleString("en-GB")} ms`}
            </span>
          </div>
          {snapshot.network.state === "available" ? (
            <div className="issuer-list">
              {networkDispositions.map(([disposition, value]) => (
                <div className="issuer" key={disposition}>
                  <div>
                    <strong>{disposition}</strong>
                    <small>Persisted network disposition</small>
                  </div>
                  <div className="issuer-metric">
                    <strong>{value.toLocaleString("en-GB")}</strong>
                    <small>observations</small>
                  </div>
                </div>
              ))}
              {networkDispositions.length === 0 ? (
                <div className="missing">
                  <strong>No network observations yet</strong>
                  <p>Run AtlasPay&apos;s deterministic local network demo to populate this view.</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="missing">
              <strong>Network history unavailable</strong>
              <p>{snapshot.network.reason ?? "AtlasPay did not expose durable network data."}</p>
            </div>
          )}
        </article>
      </section>

      <section className="grid">
        <aside className="panel incidents">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Producer-reported state</p>
              <h2>Incidents</h2>
            </div>
            <span>{snapshot.incidents.length}</span>
          </div>
          {snapshot.incidents.length > 0 ? (
            snapshot.incidents.map((incident) => (
              <div className="incident" key={incident}>
                {incident}
              </div>
            ))
          ) : (
            <div className="missing">
              <strong>No incidents reported</strong>
              <p>This means the current snapshot contains no producer-reported incidents.</p>
            </div>
          )}
          <div className="missing">
            <strong>Unavailable in this live contract</strong>
            <p>{snapshot.missing_sections.join(" · ") || "None"}</p>
          </div>
        </aside>

        <article className="panel operator-check">
          <div>
            <p className="eyebrow">Network diagnostics</p>
            <h2>Timeout and late-response state</h2>
          </div>
          <p>
            {snapshot.network.state === "available"
              ? `${count(snapshot.network.timeouts)} timeout observations and ${count(snapshot.network.late_responses)} late responses. p95 elapsed time is ${count(snapshot.network.p95_latency_ms)} ms.`
              : snapshot.network.reason ?? "Network history is unavailable."}
          </p>
          <strong>Timeouts preserve delivery ambiguity; they are not treated as proof of remote failure.</strong>
        </article>
      </section>

      <section className="operator-checks" aria-label="Live section diagnostics">
        <article className="panel operator-check">
          <div>
            <p className="eyebrow">Read-only workflow</p>
            <h2>Outbox delivery health</h2>
          </div>
          <p>
            {snapshot.outbox.state === "available"
              ? `${count(snapshot.outbox.unpublished)} unpublished events; oldest age ${count(snapshot.outbox.oldest_unpublished_age_seconds)} seconds.`
              : snapshot.outbox.reason ?? "Outbox data is unavailable."}
          </p>
          <strong>No replay or deletion action is exposed from Nexus.</strong>
        </article>
        <article className="panel operator-check">
          <div>
            <p className="eyebrow">Read-only workflow</p>
            <h2>Ledger reconciliation</h2>
          </div>
          <p>
            {snapshot.ledger.state === "available"
              ? `Last inspected ${snapshot.ledger.inspected_at ? new Date(snapshot.ledger.inspected_at).toLocaleString("en-GB") : "unknown"}; discrepancies ${count(snapshot.ledger.discrepancies)}.`
              : snapshot.ledger.reason ?? "Ledger data is unavailable."}
          </p>
          <strong>Discrepancies require investigation; Nexus does not auto-repair accounting state.</strong>
        </article>
      </section>
    </main>
  );
}
