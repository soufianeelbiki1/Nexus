# Cloud deployment checklist

Nexus is the recruiter-facing operations console for AtlasPay.

## Verified backend

As of 2026-09-01:

- AtlasPay API is deployed on Railway at `https://atlaspay-production-b780.up.railway.app`.
- Railway health checks pass after redeploy.
- The API is connected to the Neon `atlaspay-demo` PostgreSQL project.
- Root migrations, Java authorization tables and deterministic demo observations are present.
- The Java authorization service is deployed separately on Railway with no public domain and a passing `/actuator/health` check.
- The operational API remains bearer-protected; credentials are never committed to Git.

## Vercel

- Connect the repository's main branch to the Vercel production project.
- Keep preview deployments isolated from production variables.
- Configure these as server-side variables only:
  - `ATLASPAY_API_BASE_URL=https://atlaspay-production-b780.up.railway.app`;
  - `ATLASPAY_API_TOKEN), using the same secret as Railway's `ATLASPAY_OPS_TOKEN`;
  - `ATLASPAY_API_TIMEOUT_MS=3000`.
- Keep the bearer token out of browser bundles and client-side logs.
- Make the recruiter-facing production deployment publicly readable; deployment protection must not require a Vercel account.
- Verify GET `/api/health` reports `atlaspay-live`.
- Verify a failed live API call renders an unavailable state and never falls back to fixture values.
- Verify a malformed snapshot renders a contract/error state.

## Neon preview workflow

Preview deployments should use an isolated Neon database branch or a read-only deterministic dataset. Never point a preview deployment at the production branch.

The database branch and Vercel deployment must be traceable through environment metadata so a reviewer can reproduce which version produced a screenshot or demo result.

## Evidence to publish

Capture:

- the public Nexus URL;
- the public portfolio URL;
- a short AtlasPay-to-Nexus walkthrough;
- one successful live snapshot;
- one controlled backend failure showing the unavailable state;
- the CI run that verifies the integrated path.

The application is a payment-system simulation and must not be described as processing real money or connecting to a live card network.
