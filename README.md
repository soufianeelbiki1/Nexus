# Nexus

**Typed Next.js operator control plane for AtlasPay with fail-closed live data handling, operational diagnostics, and explicit unavailable states.**

Nexus is the full-stack product/UI layer of the AtlasPay ecosystem. It is designed as an operator console rather than a decorative dashboard: operational data is validated against versioned contracts, live API failures do not silently fall back to fixtures, and metrics that AtlasPay cannot durably expose remain explicitly unavailable.

> The repository includes fixture-backed contract-development views and live AtlasPay integration. Fixture telemetry is labeled non-production and is never substituted after a configured live source fails.

## What is implemented

- Next.js App Router + React + strict TypeScript application.
- Typed operational snapshot schema covering payment status, ledger reconciliation, outbox health, incidents, freshness, provenance, and unavailable sections.
- Runtime validation before telemetry reaches the UI.
- AtlasPay operational API client with bearer authentication, bounded timeout, no-store fetches, and contract validation.
- Environment-driven live source selection using `ATLASPAY_API_BASE_URL`, `ATLASPAY_API_TOKEN`, and optional `ATLASPAY_API_TIMEOUT_MS`.
- Fail-closed behavior for partial configuration, authentication, transport, and contract failures.
- Explicit `ready`, `stale`, `partial`, and `unavailable` states.
- Live rendering for durable AtlasPay payment, ledger, outbox, incident, and missing-section data.
- Transaction filtering and reconciliation workflows in the operator UI.
- Fixture-only issuer/route and transaction drill-down retained as contract-development views until AtlasPay publishes durable network read models.
- Responsive operator interface with automated TypeScript tests, typecheck, production build, and GitHub Actions CI.

## Why fail-closed matters

A monitoring console becomes dangerous when it displays plausible demo data after a real producer fails. Nexus therefore distinguishes two modes:

```text
No live API configured
    -> explicit fixture / contract-development mode

Live API configured
    -> AtlasPay only
       -> valid response: render durable telemetry
       -> error / timeout / malformed contract: render unavailable state
       -> never substitute fixture values
```

This keeps the operator's mental model aligned with what is actually known.

## Architecture

```text
AtlasPay operator API
        |
        v
Authenticated API client
        |
        v
Runtime contract validation
        |
        v
Operator source / loader
        |
        +--> ready
        +--> stale
        +--> partial
        +--> unavailable
        |
        v
Next.js operational views
  | payment lifecycle
  | ledger reconciliation
  | outbox health
  | incidents
  | transaction workflows
```

Fixture data passes through the same contract boundary for deterministic development and tests, but retains provenance identifying it as non-production telemetry.

## Local development

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

For live mode, configure the AtlasPay operator endpoint and token in the environment. Incomplete live configuration intentionally fails closed.

## Truthfulness boundaries

Nexus does not:

- fabricate live issuer latency or network telemetry;
- claim external message delivery guarantees;
- auto-repair ledger/reconciliation state;
- replay poison events automatically;
- silently replace failed live API data with fixtures.

Network/issuer drill-down remains unavailable in live mode until AtlasPay exposes a durable read model for those metrics.

## Portfolio signal

Nexus demonstrates:

- full-stack TypeScript/React/Next.js engineering;
- runtime API-contract validation and typed integration boundaries;
- operational UX for degraded and unavailable states;
- authentication-aware server-side data access;
- production-minded observability semantics rather than mock dashboard metrics;
- cross-repository frontend/backend contract design with AtlasPay.

## Next engineering milestone

Extend AtlasPay's durable operator contract with authorization/network aggregates, issuer-route state, timeout/late-response counts, and transaction/reversal correlations; then replace the remaining fixture-only network views with validated live sections.
