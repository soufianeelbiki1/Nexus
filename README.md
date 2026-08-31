# Nexus

Nexus is a Next.js/TypeScript operations console for AtlasPay. It reads a versioned operational snapshot, validates it at runtime and renders unavailable or degraded states when the backend cannot provide reliable data.

The repository supports both a fixture mode for local UI development and an authenticated AtlasPay API mode. Once live mode is configured, a failed API call does not fall back to fixture numbers.

## Current views

- payment status and operation counts;
- ledger reconciliation state;
- outbox backlog and poison-event age;
- durable network observation counts and dispositions;
- timeout and late-response counts;
- p95 network elapsed time;
- incidents and missing sections;
- transaction filtering;
- read-only reconciliation workflows.

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

## Run against AtlasPay locally

Start from a migrated AtlasPay PostgreSQL database and generate the deterministic network scenarios in the AtlasPay repository:

```bash
export DATABASE_URL=postgresql://atlaspay:atlaspay@localhost:5432/atlaspay
python -m app.migrations
python -m app.demo_network --reset
export ATLASPAY_OPS_TOKEN=local-demo-token
uvicorn app.main:app --reload
```

Then start Nexus with live mode enabled:

```bash
export ATLASPAY_API_BASE_URL=http://localhost:8000
export ATLASPAY_API_TOKEN=local-demo-token
npm install
npm run dev
```

The live network panel should show the persisted accepted, timed-out and late-response dispositions from AtlasPay. The known-local transport failure is counted as an observation but has no authorization disposition. These are deterministic simulation scenarios, not card-network traffic.

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
- current network summaries are aggregate operational facts rather than a full network-message history;
- the UI does not automatically repair ledger state or replay outbox events;
- fixture telemetry is for local contract/UI development only.

## Roadmap

1. Add route/issuer breakdowns to the durable AtlasPay network contract.
2. Replace the remaining fixture-only transaction drill-down fields with durable backend facts.
3. Package AtlasPay, PostgreSQL and Nexus into a simpler local multi-service demo.
4. Add deployment and observability documentation once that environment is stable.
