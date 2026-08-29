# Nexus operating brief

Nexus is the AtlasPay operator control plane, not a decorative dashboard. It must consume real, versioned operational contracts from AtlasPay: authorization outcomes, issuer/acquirer latency, reversals, ledger/reconciliation status, outbox lag, incidents, and diagnostics.

## Guardrails

- Inspect AtlasPay APIs and CI before adding UI.
- Prefer a typed modular application with explicit read models and degraded states.
- Never fabricate live metrics, topology, or exactly-once claims.
- Add contract fixtures and accessibility checks before visual polish.
- Record cross-repository API decisions as ADRs.

## Next slice

Define a read-only operational snapshot contract in AtlasPay (or an exported fixture with provenance), then build one operator workflow around it with loading, stale, partial, and error states.
