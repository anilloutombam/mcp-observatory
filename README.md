# MCP Failure Observatory

MCP Failure Observatory is a public interface for exploring how Model Context Protocol implementations behave under real failure scenarios.

It turns the reports and evidence produced by [MCP Failure Lab](https://github.com/anilloutombam/mcp-failure-lab) into structured compatibility data: Test Runs, Findings, implementation histories, transport outcomes, and side-by-side comparisons.

**Live site:** [observatory.mcplab.dev](https://observatory.mcplab.dev)

This project was created as the second DEV Challenge submission in the MCP Failure Lab project series. The submission is the starting point for an actively maintained compatibility intelligence project, not a frozen demo.

## What you can explore

- A compatibility overview across implementations and scenarios
- Filterable Test Runs with version, transport, status, evidence, and dates
- Individual Test Run pages with observations, evidence, and reviewed Findings
- Findings with upstream issue and evidence-comment links
- Implementation pages with version and compatibility history
- Comparisons across implementations, versions, scenarios, and transports
- Published methodology, status meanings, data sources, and limitations

The “Run New Test” action is intentionally hidden. The Observatory currently presents imported results; it does not yet provide a secure test-orchestration backend.

## How the projects fit together

```text
MCP Failure Lab
  runs deterministic failure scenarios
  produces public reports and evidence
            │
            ▼
Import and backfill scripts
  normalize reports into structured records
            │
            ▼
Sanity
  stores implementations, scenarios, Test Runs,
  evidence, Findings, and upstream reporting state
            │
            ▼
MCP Failure Observatory
  queries and presents the published dataset
```

MCP Failure Lab remains the source of the testing methodology and raw compatibility reports. The Observatory is the searchable, linked presentation layer.

## Technology

- Next.js App Router
- React and TypeScript
- Sanity and GROQ
- Vercel

The repository also includes an embedded Sanity Studio at `/studio` for managing the existing project content.

## Data model

The core Sanity documents are:

- **Implementation** — an MCP SDK, server, client, proxy, or gateway
- **Scenario** — the failure or compatibility behavior being exercised
- **Test Run** — one recorded implementation, version, scenario, transport, and outcome
- **Evidence** — observations and raw supporting material attached to a Test Run
- **Finding** — a reviewed conclusion with upstream reporting information

Jev is not modeled as an MCP implementation. Future Jev work will use a separate decision-experiment model.

## Local development

Requirements:

- Node.js
- npm
- Access to a Sanity project and dataset

Install dependencies:

```bash
npm install
```

Copy the example environment file and provide your Sanity values:

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SANITY_PROJECT_ID="your-project-id"
NEXT_PUBLIC_SANITY_DATASET="production"
NEXT_PUBLIC_SANITY_API_VERSION="2026-09-26"
NEXT_PUBLIC_SENTRY_DSN=""
```

Sentry monitoring is optional. When enabled, the Observatory uses a 5% trace
sample rate, disables session replay and default personal data collection, and
removes request bodies, headers, cookies, user data, and URL query strings from
events. Set `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` in Vercel only
if you want production source-map uploads.

Start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data imports and backfills

Import and backfill commands write to Sanity. They require this additional server-only value:

```dotenv
SANITY_API_WRITE_TOKEN="your-write-token"
```

Available commands:

```bash
npm run import:upstream-findings
npm run import:lifecycle-compatibility
npm run backfill:findings
npm run backfill:implementation-repositories
```

Use a token with only the permissions required for the target dataset. Never commit `.env.local` or a Sanity write token.

## Status meanings

Test Run statuses describe the recorded result for one specific version, transport, environment, and scenario:

- **Passed** — observed behavior matched the test expectation
- **Failed** — observed behavior did not match the expectation
- **Needs review** — the recorded result still needs human interpretation
- **Unsupported** — the required capability is not supported by that combination
- **Not run** — no completed result was produced
- **Not applicable** — the scenario does not apply to that combination

Finding reporting states distinguish issues opened by MCP Failure Lab, evidence added to existing issues, unreported findings, resolved issues, and behavior that is not actionable upstream.

See the full [methodology and limitations](https://observatory.mcplab.dev/methodology) before drawing broad conclusions from the data.

## Limitations

- Results apply only to the recorded implementation version, transport, environment, and scenario.
- A missing result means no record is available; it does not mean the implementation failed.
- New implementation releases may behave differently.
- Timing values are evidence from a test environment, not general performance benchmarks.
- The dataset is selective and does not cover every MCP capability or implementation.
- A verified Finding was reviewed against its evidence; it does not imply upstream maintainer agreement.

## Deployment

The public application is deployed on Vercel at `observatory.mcplab.dev`.

The deployment requires the public Sanity environment variables listed above. The production domain must also be allowed in the Sanity project’s CORS origins for Studio access.

## Roadmap

- Shareable filter, comparison, and pagination URLs
- Automated UI, query, and importer tests
- Privacy-friendly analytics and error monitoring
- Automated imports from MCP Failure Lab
- Continued accessibility and responsive-layout review
- A separate model and interface for Jev decision experiments
- A secure backend workflow for running new tests

## Contributing

Issues and focused pull requests are welcome. When changing compatibility data, include the public source report or upstream evidence that supports the change. Keep raw testing claims in MCP Failure Lab and structured presentation changes in this repository.

## License

This project is licensed under the [MIT License](LICENSE).
