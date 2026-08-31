# Vercel deployment

Nexus can be deployed safely before AtlasPay is publicly available, then switched to live mode by attaching server-side environment variables.

## Fixture demo mode

With no AtlasPay API variables configured, Nexus renders the deterministic contract fixture already tracked in this repository. The UI labels the source as fixture data and does not present those values as live telemetry.

Use this mode for the first public Vercel deployment.

## Live AtlasPay mode

Configure these Vercel server environment variables together:

- `ATLASPAY_API_BASE_URL` — public HTTPS base URL for AtlasPay.
- `ATLASPAY_API_TOKEN` — same bearer token configured as `ATLASPAY_OPS_TOKEN` on AtlasPay.
- `ATLASPAY_API_TIMEOUT_MS` — optional positive timeout, default `3000`.

If only part of the live configuration is present, Nexus refuses fixture fallback and renders an unavailable state. If AtlasPay returns an invalid contract, times out, or rejects authentication, Nexus also renders unavailable instead of substituting fixture telemetry.

## Health

`GET /api/health` returns a small deployment status response and reports whether the current server runtime is using `fixture-demo` or `atlaspay-live` configuration.

## Vercel import

The repository is a standard Next.js application and includes `vercel.json` only to make framework intent explicit. Import `soufianeelbiki1/Nexus` into Vercel with the repository root as the project root. No build overrides are required.

After AtlasPay is deployed, add the live environment variables and redeploy Nexus. The application contract does not require browser-side access to the AtlasPay bearer token.
