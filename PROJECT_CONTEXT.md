# Nexus operating brief

Nexus is the AtlasPay operator control plane, not a decorative dashboard. It must consume real, versioned operational contracts from AtlasPay: authorization outcomes, issuer/acquirer latency, reversals, ledger/reconciliation status, outbox lag, incidents, and diagnostics.

## Guardrails

- Inspect AtlasPay APIs and CI before adding UI.
- Prefer a typed modular application with explicit read models and degraded states.
- Never fabricate live metrics, topology, or exactly-once claims.
- Add contract fixtures and accessibility checks before visual polish.
- Record cross-repository API decisions as ADRs.

## Current state

- Next.js 16.3.3, React 19.2.8, and strict TypeScript 7 foundation.
- Typed operational snapshot contract with explicit provenance, health, freshness/partial state, issuer metrics, ledger reconciliation, outbox backlog, incidents, and unavailable sections.
- Typed snapshot source/loader boundary with ready, stale, partial, and unavailable outcomes; unavailable sources render no telemetry values.
- Runtime snapshot validation rejects malformed provenance, counters, issuer rates, transaction/reversal correlation, ledger, outbox, and unsupported contract values before telemetry reaches the UI.
- Provenance-bound AtlasPay fixture for contract development; it is explicitly labeled as non-production telemetry.
- Operator overview workflow with authorization rate, timeouts/late responses, outbox state, ledger status, issuer-route health, incidents, missing-data disclosure, and source state.
- Network transaction drill-down with issuer, STAN/RRN, coordinator disposition, latency availability, and one-to-one reversal correlation/reason.
- Responsive UI and GitHub Actions gates for TypeScript and production build.

## Next slice

Publish the validated snapshot shape as a cross-repository AtlasPay JSON/API contract, then add transaction filtering/search and reconciliation/outbox operator workflows. Preserve read-only behavior and provenance; do not claim live telemetry until AtlasPay exposes a verified endpoint and Nexus consumes it successfully.
