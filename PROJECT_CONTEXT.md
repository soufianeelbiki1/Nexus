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
- Provenance-bound AtlasPay fixture for contract development; it is explicitly labeled as non-production telemetry.
- Operator overview workflow with authorization rate, timeouts/late responses, outbox state, ledger status, issuer-route health, incidents, missing-data disclosure, and source state.
- Network transaction drill-down with issuer, STAN/RRN, coordinator disposition, latency availability, and one-to-one reversal correlation/reason.
- Responsive UI and GitHub Actions gates for TypeScript and production build.

## Next slice

Move the snapshot contract into an explicit cross-repository JSON/API schema with runtime validation rather than compile-time types alone. Add transaction filtering/search and a reconciliation/outbox operator workflow while preserving read-only behavior and provenance. Do not claim live telemetry until AtlasPay exposes a verified endpoint and Nexus consumes it successfully.
