# Security

## Reporting

Please do not publish suspected vulnerabilities in a public issue. Use GitHub's private vulnerability reporting feature when it is available for this repository. If private reporting is unavailable, contact the repository owner through the contact information on the GitHub profile before disclosing details publicly.

Include the affected component, reproduction steps, expected impact and the relevant version or commit.

## Security-sensitive boundaries

Nexus handles an authenticated operator API token on the server side and validates AtlasPay responses before rendering them. Live-source failures are not replaced with fixture telemetry. Secrets must be supplied through runtime environment configuration and must not be committed to the repository or exposed to client-side code.

The project does not claim an external security certification or production deployment.

## Supported version

Security fixes are applied to the current `main` branch. Older commits and development branches are not maintained as supported releases.
