# Nexus

### Payment operations console · Next.js / TypeScript

Nexus helps an operator investigate payment status, reconciliation, delivery backlogs and network failures in [AtlasPay](https://github.com/soufianeelbiki1/AtlasPay).

It reads a versioned operational snapshot, validates it at runtime and makes stale, partial or unavailable data visible in the interface. The project connects frontend decisions to backend reliability: an operator needs to know both what happened and whether the current view can be trusted.

[Local demo](docs/LOCAL_DEMO.md) · [API contract and loading](lib/atlaspay-api.ts) · [Tests](tests/) · [CI](https://github.com/soufianeelbiki1/Nexus/actions)

## A short walkthrough

1. Start the [integrated local demo](docs/LOCAL_DEMO.md).
2. Inspect the seeded accepted, timeout and late-response observations.
3. Compare network dispositions with reconciliation and outbox summaries.
4. Stop the local AtlasPay service and refresh the console to inspect unavailable-source behaviour.
5. Restart the service and inspect the recovered view.

The data represents deterministic payment simulations. The local walkthrough runs without a hosted account or paid API.

## Design decisions

| Operator need | Implementation |
| --- | --- |
| Know whether the data is usable | Explicit ready, stale, partial and unavailable source states |
| Detect an unexpected backend response | Runtime validation of the versioned snapshot |
| Inspect payment-network trouble | Route, issuer and acquirer breakdowns |
| Keep service credentials out of the browser | Server-side API requests with bearer authentication |
| Inspect failure behaviour locally | Fixture mode plus a containerised integration demo |

The repository supports both fixture mode for local UI development and authenticated AtlasPay API mode. Once live mode is configured, a failed API call does not fall back to fixture numbers.

## Current views

- payment status and operation counts;
- ledger reconciliation state;
- outbox backlog and poison-event age;
- durable network observation counts and dispositions;
- route/issuer/acquirer latency, timeout, late-response and delivery-unknown breakdowns;
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

## Integrated local demo

Clone AtlasPay and Nexus as sibling directories, then run the complete demo stack from Nexus:

```bash
docker compose -f compose.demo.yml up --build
```

The Compose stack starts PostgreSQL, runs AtlasPay migrations, seeds deterministic authorization/network scenarios, starts the AtlasPay API and connects Nexus to the protected operational snapshot. Open `http://localhost:3000` for Nexus and `http://localhost:8000/docs` for AtlasPay OpenAPI.

See [`docs/LOCAL_DEMO.md`](docs/LOCAL_DEMO.md) for the scenario walkthrough, failure demonstration, reset commands and direct snapshot inspection.

The same stack is exercised by GitHub Actions: CI builds both applications, starts the Compose services, verifies the authenticated AtlasPay snapshot and checks that the seeded accepted, timeout and late-response observations are present.

## Run against AtlasPay manually

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
npm ci
npm run dev
```

The live network panels should show the persisted accepted, timed-out and late-response dispositions plus privacy-safe route/issuer/acquirer breakdowns from AtlasPay. The known-local transport failure is counted as an observation but has no authorization disposition. These are deterministic simulation scenarios, not card-network traffic.

## Demo deployment topology

As last rechecked on 13 September 2026, Vercel reported the public `main`
deployment ready at Nexus commit `7553f6a211104c5290e7c546dc0c12e107add24a`.
The AtlasPay Python API and separate private Java authorization service were
configured on Railway against the same Neon PostgreSQL project; their latest
deployments still referenced AtlasPay commit
`7990d04f2485b9cf46ab5c540b0418a128b48a7b`.

This is a simulation/demo topology, not evidence of production users, real-money
traffic or permanent hosting. Railway is on a finite trial, so future public
availability is not guaranteed. The review branch is separate from the public
`main` deployment. When available, Nexus uses server-side configuration to reach
the protected AtlasPay API; the variables below are required when reproducing it.

## Environment variables

```text
ATLASPAY_API_BASE_URL
ATLASPAY_API_TOKEN
ATLASPAY_API_TIMEOUT_MS   # optional
```

## Local development

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

GitHub Actions runs the TypeScript tests, typecheck, production build, runtime container build and integrated AtlasPay/Nexus smoke test.

## Limitations

- the live deployment is a verified simulation path, not a card-network or real-money integration;
- current network summaries are aggregate operational facts rather than a full network-message history;
- the UI does not automatically repair ledger state or replay outbox events;
- fixture telemetry is for local contract/UI development only.

## Roadmap

1. Replace the remaining fixture-only transaction drill-down fields with privacy-safe durable backend facts.
2. Add Prometheus/Grafana-ready local observability views for the integrated stack.
3. Extend the live walkthrough with transaction correlation and bounded-retention diagnostics.
