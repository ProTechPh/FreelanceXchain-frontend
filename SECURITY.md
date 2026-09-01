# Security Policy

## Scope

This repository contains the FreelanceXchain web frontend (Next.js). Reports
about the API backend belong in the
[FreelanceXchain-api](https://github.com/ProTechPh/FreelanceXchain-api)
repository.

In scope:

- Cross-site scripting, CSRF, or clickjacking in the frontend
- Authentication or session handling flaws in the browser client
- Leakage of tokens, keys, or personal data through the client bundle
- Supply-chain issues in this project's dependency tree

Out of scope:

- Findings that only affect a local development server
- Missing hardening headers with no demonstrated impact
- Automated scanner output without a working proof of concept
- Denial of service through traffic volume

## Supported Versions

FreelanceXchain is a continuously deployed application rather than a set of
released versions. Only the current `main` branch and the live deployment are
supported. Fixes ship forward; there are no backports to earlier commits.

## Reporting a Vulnerability

Report security issues **privately** through GitHub's private vulnerability
reporting:

1. Open the [Security tab](https://github.com/ProTechPh/FreelanceXchain-frontend/security)
2. Click **Report a vulnerability**
3. Describe the issue, its impact, and the steps to reproduce it

Please do **not** open a public issue, pull request, or discussion for a
security bug.

A useful report includes:

- The affected page, route, or component
- Reproduction steps or a proof of concept
- What an attacker gains, and any preconditions they need
- The browser and version you observed it on

## What to Expect

| Stage | Target |
| --- | --- |
| Acknowledgement of your report | 3 business days |
| Initial assessment and severity | 7 business days |
| Fix or mitigation for high severity | 30 days |
| Fix or mitigation for other severity | Next regular release cycle |

We will keep you updated as the report progresses, tell you plainly if we
decide not to act and why, and credit you in the advisory when a fix ships
unless you would rather stay anonymous.

Please give us a reasonable chance to ship a fix before disclosing publicly.

## Automated Security Checks

This repository runs:

- **CodeQL** static analysis on every push to `main` and every pull request
- **Dependabot** for dependency and security updates
- **CI** enforcing lint, typecheck, unit, contract, and browser tests
