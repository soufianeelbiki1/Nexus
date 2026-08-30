# Nexus operating brief

Nexus is the AtlasPay operator control plane, not a decorative dashboard. It must consume real, versioned operational contracts from AtlasPay: authorization outcomes, issuer/acquirer latency, reversals, ledger/reconciliation status, outbox lag, incidents, and diagnostics.

## Guardrails

- Inspect AtlasPay APIs and CI before adding UI.
- Prefer a typed modular application with explicit read models and degraded states.
- Never fabricate live metrics, topology, or exactly-once claims.
- Add contract fixtures and accessibility checks before visual polish.
- Record cross-repository API decisions as ADRs.
- Once live AtlasPay configuration is present, fail closed on configuration, transport, authentication, or contract errors; never silently replace failed live data with fixtures.

## Current state

- Next.js 16.3.3, React 19.2.8, and strict TypeScript 7 foundation.
- Typed fixture operational snapshot contract with explicit provenance, health, freshness/partial state, issuer metrics, ledger reconciliation, outbox backlog, incidents, and unavailable sections.
- Typed snapshot source/loader boundary with ready, stale, partial, and unavailable outcomes; unavailable sources render no telemetry values.
- Runtime fixture snapshot validation rejects malformed provenance, counters, issuer rates, transaction/reversal correlation, ledger, outbox, and unsupported contract values before telemetry reaches the UI.
- Provenance-bound AtlasPay fixture remains available only for contract development when no live API environment is configured; it is explicitly labeled as non-production telemetry.
- AtlasPay v1 operational API client validates the producer's durable payments, ledger, outbox, network availability, incidents, and missing-section contract; it uses bearer authentication, no-store fetches, and bounded timeout.
- Runtime source selection uses `ATLASPAY_API_BASE_URL`, `ATLASPAY_API_TOKEN`, and optional `ATLASPAY_API_TIMEOUT_MS`. Partial/malformed live configuration fails closed rather than selecting fixture mode.
- When live API mode is configured, the page consumes AtlasPay directly. API/transport/contract failure renders an unavailable state with no fixture fallback.
- The live view renders only fields AtlasPay actually exposes durably: payment totals/status distribution, payment operation counts, ledger reconciliation state, outbox backlog/poison age, producer incidents, and missing sections. Network analytics remain unavailable when AtlasPay reports them unavailable.
- The richer issuer-route and transaction drill-down remains fixture-only contract-development UI until AtlasPay publishes a durable network/authorization snapshot contract.
- Read-only ledger reconciliation and outbox workflows remain explicit; Nexus does not auto-repair accounting state, replay events, delete poison messages, or claim external delivery guarantees.
- Responsive UI and GitHub Actions gates cover TypeScript tests, typecheck, and production build.

## Next slice

Extend AtlasPay's durable operator contract with real authorization/network read models: authorization outcomes, timed-out/late counts, issuer-route state, p95 latency from a durable aggregation source, and transaction/reversal correlation summaries. Then extend the strict Nexus API parser and replace the fixture-only issuer/transaction drill-down with those live sections. Preserve nullable/unavailable semantics for every metric that is not durably measurable.
