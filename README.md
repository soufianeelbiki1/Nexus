# Nexus

Nexus is a Next.js/TypeScript operations console for AtlasPay. It reads a versioned operational snapshot, validates it at runtime and renders unavailable or degraded states when the backend cannot provide reliable data.

The repository supports both a fixture mode for local UI development and an authenticated AtlasPay API mode. Once live mode is configured, a failed API call does not fall back to fixture numbers.

## Current views

- payment status and operation counts;
- ledger reconciliation state;
- outbox backlog and poison-event age;
- incidents and missing sections;
- transaction filtering;
- read-only reconciliation workflows.

Issuer/route and richer transaction drill-down still use fixture data because AtlasPay does not yet persist the network history required for those live views.

## Data source behavior

```text
No AtlasPay API configured
  -> fixture mode

AtlasPay API configured
  -> authenticated request
  -> runtime validation
  -> ready / stale / partial / unavailable
```

The live client uses bearer authentication, bounded request timeouts and `no-store` fetches. Partial environment configuration is treated as an error rather than silently selecting fixture mode.

## Environment variables

```text
ATLASPAY_API_BASE_URL
ATLASPAY_API_TOKEN
ATLASPAY_API_TIMEOUT_MS   # optional
```

## Local development

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

GitHub Actions runs the TypeScript tests, typecheck and production build.

## Limitations

- there is no verified public deployment yet;
- live issuer latency and authorization-rate history are unavailable until AtlasPay persists those observations;
- the UI does not automatically repair ledger state or replay outbox events;
- fixture telemetry is for local contract/UI development only.

## Roadmap

1. Extend the AtlasPay operator API with durable authorization/network aggregates.
2. Replace fixture-only issuer and transaction views with validated live data.
3. Add a one-command AtlasPay + Nexus demo environment with seeded failure scenarios.
4. Add deployment and observability documentation once the demo environment is stable.
