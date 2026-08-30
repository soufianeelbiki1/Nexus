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
- Provenance-bound AtlasPay fixture for contract development; it is explicitly labeled as non-production telemetry.
- First operator overview workflow with authorization rate, timeouts/late responses, outbox state, ledger status, issuer-route health, incidents, and missing-data disclosure.
- Responsive UI and GitHub Actions gates for TypeScript and production build.

## Next slice

Replace direct fixture import with a typed snapshot loader that has explicit loading, stale, partial, and unavailable/error behavior. Add an operator drill-down for issuer/network transactions and reversal correlation while preserving source provenance and never presenting fixture values as live telemetry.
