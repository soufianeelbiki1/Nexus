# AtlasPay + Nexus local demo

This demo starts PostgreSQL, migrates AtlasPay, inserts deterministic network scenarios, starts the AtlasPay API and connects Nexus to the authenticated operational snapshot.

## Layout

Clone the repositories next to each other:

```text
workspace/
├── AtlasPay/
└── Nexus/
```

From `workspace/Nexus` run:

```bash
docker compose -f compose.demo.yml up --build
```

Then open:

- Nexus: `http://localhost:3000`
- AtlasPay OpenAPI: `http://localhost:8000/docs`

The default `local-demo-token` is only for this local stack. Override it with `ATLASPAY_OPS_TOKEN` if desired.

## What the seed creates

`atlaspay-seed` runs `python -m app.demo_network --reset` after migrations complete. The deterministic scenarios include:

1. an accepted authorization response;
2. an ambiguous timeout that creates reversal correlation;
3. a late original response after the timeout;
4. a known-local transport failure.

AtlasPay writes operational metadata for these scenarios to PostgreSQL. Nexus reads the resulting protected snapshot over the internal Compose network.

The demo does not represent live card-network traffic and does not store PAN, DE55, STAN, RRN or raw network payloads in the network-observation table.

## Useful checks

View service state:

```bash
docker compose -f compose.demo.yml ps
```

Inspect the AtlasPay snapshot directly:

```bash
curl -H "Authorization: Bearer ${ATLASPAY_OPS_TOKEN:-local-demo-token}" \
  http://localhost:8000/v1/ops/snapshot
```

Follow API logs:

```bash
docker compose -f compose.demo.yml logs -f atlaspay
```

Follow Nexus logs:

```bash
docker compose -f compose.demo.yml logs -f nexus
```

Re-run only the deterministic scenario seed:

```bash
docker compose -f compose.demo.yml run --rm atlaspay-seed
```

## Reset

Stop services while retaining the database volume:

```bash
docker compose -f compose.demo.yml down
```

Remove the demo database too:

```bash
docker compose -f compose.demo.yml down -v
```

## Failure behavior worth demonstrating

A useful interview walkthrough is to first show the healthy seeded stack and then demonstrate that Nexus does not invent data when AtlasPay is unavailable:

```bash
docker compose -f compose.demo.yml stop atlaspay
```

Refresh Nexus after the API becomes unavailable. The UI should render the unavailable/degraded source state instead of silently switching to fixture telemetry. Start AtlasPay again with:

```bash
docker compose -f compose.demo.yml start atlaspay
```
