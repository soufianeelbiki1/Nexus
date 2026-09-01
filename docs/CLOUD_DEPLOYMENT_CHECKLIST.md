# Cloud deployment checklist

Nexus is the recruiter-facing operations console for AtlasPay.

## Vercel

- Connect the repository's main branch to the Vercel production project.
- Keep preview deployments isolated from production variables.
- Configure these as server-side variables only:
  - ATLASPAY_API_BASE_URL;
  - ATLASPAY_API_TOKEN;
  - ATLASPAY_API_TIMEOUT_MS.
- Keep the bearer token out of browser bundles and client-side logs.
- Make the recruiter-facing production deployment publicly readable; deployment protection must not require a Vercel account.
- Verify GET /api/health reports atlaspay-live.
- Verify a failed live API call renders an unavailable state and never falls back to fixture values.
- Verify a malformed snapshot renders a contract/error state.

## Neon preview workflow

Preview deployments should use an isolated Neon database branch or a read-only deterministic dataset. Never point a preview deployment at the production branch.

The database branch and Vercel deployment must be traceable through environment metadata so a reviewer can reproduce which version produced a screenshot or demo result.

## Railway backend verification

- AtlasPay is reachable through a stable HTTPS URL.
- The URL is configured in ATLASPAY_API_BASE_URL.
- The operational token is configured independently on Railway and Vercel.
- AtlasPay health checks pass after a cold start and redeploy.
- Nexus can display durable accepted, timeout/late-response and local-failure observations.
- The UI shows the data source and environment clearly.

## Evidence to publish

Capture:

- the public Nexus URL;
- the public portfolio URL;
- a short AtlasPay-to-Nexus walkthrough;
- one successful live snapshot;
- one controlled backend failure showing the unavailable state;
- the CI run that verifies the integrated path.

The application is a payment-system simulation and must not be described as processing real money or connecting to a live card network.
