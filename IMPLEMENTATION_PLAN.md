# Production Implementation Plan: Praveen Tech Bytes

## 1. Goal

Implement a production content pipeline that discovers timely technology stories, verifies them, creates original publication-ready drafts, and opens a review pull request in the Docusaurus site.

The implementation is complete only when a scheduled run can produce a traceable, fact-checked draft package in `pravin080317/staticgenerativeai-praveensite` without publishing or merging it automatically.

## 2. Required result

Each successful run must provide:

1. A ranked candidate report covering all configured topics.
2. Zero or more selected articles based on evidence and editorial value.
3. For every selected article:
   - Docusaurus Markdown with valid front matter
   - LinkedIn draft
   - X draft
   - claim-to-source evidence map
   - editorial review decision and confidence
4. A branch and pull request in the Docusaurus repository.
5. A run summary containing selected, rejected, held and duplicate stories.
6. Structured logs and retained run metadata for troubleshooting and audit.

A run with no sufficiently strong story is a valid outcome. The pipeline must not manufacture content to meet a quota.

## 3. Editorial disposition: choose the right output

The route/review agent must classify each verified candidate into exactly one disposition:

| Disposition | When to use it | Generated output | Approval result |
|---|---|---|---|
| Full article | The change needs explanation, architectural context, examples, risks or implementation guidance | Docusaurus Markdown article plus LinkedIn and X promotion drafts | Merge the Docusaurus PR to publish the article |
| Social brief | The news is useful but does not justify a full article | Short LinkedIn draft, X draft, canonical link and optional licensed/approved image reference | Human copies/publishes the approved draft; it is not added as a Docusaurus article |
| Hold | Evidence, timing or significance is uncertain | Review note with missing evidence and recheck date | No publication |
| Reject | Duplicate, weak, unsafe, irrelevant or unsupported | Rejection reason retained in the run manifest | No publication |

The system must not create a long article merely to fill the site. Conversely, a material story must not be reduced to a headline when readers need technical explanation.

### Full-article package

- article Markdown in the Docusaurus content path
- LinkedIn promotion draft
- X promotion draft
- source and claim map
- suggested image brief or reusable source image with licensing/provenance recorded
- editorial review record

### Social-brief package

- clear headline/hook
- two or three lines explaining why the update matters
- canonical source link
- LinkedIn-specific draft
- X-specific draft
- image reference only when usage rights and provenance are recorded
- evidence and editorial review record

Social-only files must live in a path excluded from the Docusaurus build and must never appear as website articles.

## 4. Approval and publishing model

GitHub is the single system of record for drafts and approvals. SharePoint is not required for the production workflow.

### Article approval

1. The runner opens or updates a content PR in `pravin080317/staticgenerativeai-praveensite`.
2. The PR contains the article, evidence, review result and social drafts.
3. CI validates content, links, secrets and the production Docusaurus build.
4. The owner reviews the rendered preview and evidence.
5. Requested changes return the draft to the pipeline or are committed to the PR.
6. Only a human merge counts as approval.
7. Merge to `master` triggers the existing Azure Static Web Apps deployment.
8. Deployment status and final article URL are added to the run record.

### Social approval

Social drafts remain review artifacts. Approval is recorded explicitly in the PR using the agreed review status or label. Initial production operation is manual publishing: the owner copies the approved LinkedIn/X content after the article URL is live.

No LinkedIn or X publishing token is required for the initial implementation. Automated social publishing is a separate controlled capability and must not be enabled without:

- explicit owner authorization
- supported official platform API access
- a protected GitHub environment with required human approval
- separate least-privilege secrets
- dry-run preview of the exact text, link and media
- idempotency preventing duplicate posts
- retained platform post ID and audit record

Approval of an article does not silently approve its social posts. Each output has an explicit status: DRAFT, CHANGES_REQUESTED, APPROVED, PUBLISHED or CANCELLED.

### Docusaurus delivery path

```text
Scheduled collection
  -> candidate routing and verification
  -> reviewer disposition
  -> generated Markdown and social drafts
  -> Docusaurus pull request
  -> CI build and Azure preview
  -> human review and merge
  -> Azure Static Web Apps production deployment
  -> optional manual social publishing
```

## 3. Production boundaries

- Public information only.
- ScrapeCreators is a discovery and extraction source, not the authority for factual claims.
- Material claims must be verified against accessible primary sources.
- The pipeline creates drafts only.
- It must never merge a PR, deploy the site, publish to LinkedIn or publish to X.
- Secrets must never be committed, logged or copied into generated artifacts.
- Existing Docusaurus content must never be overwritten.
- Generated branches and files must be deterministic and collision-safe.

## 5. Architecture

### 5.1 Scheduler and runner

A GitHub Actions workflow in this repository will run daily and support manual dispatch.

The runner will be an executable application, not a collection of prompts. It will:

1. Load and validate configuration.
2. Acquire a run lock.
3. Collect candidate stories.
4. Normalize and deduplicate candidates.
5. Route candidates by topic.
6. Invoke specialist analysis.
7. verify claims and sources.
8. Apply the editorial gate.
9. render the publication package.
10. Validate generated files.
11. Create or update a content branch.
12. Open one review PR.
13. Record the run result.

Use Node.js with a pinned active LTS version and a committed lockfile. All commands must be non-interactive and return meaningful exit codes.

### 5.2 Collection layer

Use ScrapeCreators API adapters for:

- YouTube search, channel videos, video details and transcripts
- LinkedIn company posts and selected public posts
- X/Twitter public tweets and tweet details
- Reddit search and discussions when relevant
- supported public trend/search endpoints

Also support primary-source feeds and URLs:

- official product blogs and documentation
- release notes
- GitHub releases and security advisories
- vendor security advisories
- standards bodies and research publications

Every collected item must be normalized into a common candidate schema:

- stable ID
- canonical URL
- platform/source
- title or hook
- author/publisher
- published timestamp
- collected timestamp
- engagement signals when available
- raw topic hints
- summary/excerpt
- source payload reference
- content fingerprint

Adapters must implement timeouts, bounded retries with backoff, rate-limit handling and schema validation.

### 5.3 Topic routing

Route candidates to one primary owner:

| Topic | Primary agent | Coverage |
|---|---|---|
| Testing | `testing-content-agent` | tools, automation, performance, defensive pen testing, quality and agentic testing |
| AI & Agentic | `ai-agentic-content-agent` | AI, agents, RAG, evaluations, safety and instructive failures |
| Cloud | `cloud-content-agent` | cloud architecture, Kubernetes, platforms, SRE and FinOps |
| Azure | `azure-content-agent` | Azure, Microsoft Foundry, integration, data, identity and governance |
| Security & Delivery | `security-delivery-content-agent` | security, DevSecOps, supply chain, CI/CD and deployment |

Cross-topic items may have a secondary reviewer, but exactly one agent owns the draft.

Routing must use explicit rules first and model classification second. Record the routing reason.

### 5.4 Deduplication and state

Prevent duplicate coverage using:

- canonical URL
- normalized title similarity
- content fingerprint
- entity/event/version/date comparison
- previously published Docusaurus content
- open content PRs
- retained run history

State must record candidate status: discovered, duplicate, rejected, held, selected, drafted or published-after-human-merge.

Retention must be sufficient to prevent recycling old stories. State updates must be atomic and recoverable.

### 5.5 Evidence and fact checking

For every material claim, retain:

- claim ID and exact claim
- supporting URL
- source publisher and type
- source publication/update date
- relevant evidence excerpt or structured field
- verification status
- verifier timestamp

Rules:

- Social content may identify a story but cannot alone verify a technical claim.
- Prefer official documentation, release notes, repositories, advisories and original research.
- Preview/GA status, versions, regions, pricing, benchmark conditions, CVEs and exploit status require direct verification.
- Conflicting sources result in HOLD unless the article explicitly and accurately explains the conflict.
- Unsupported claims must be removed or marked unresolved; they cannot reach APPROVE.

### 5.6 Editorial gate

The `tech-content-editor` is the final route, review and fact-check gate.

It returns:

- APPROVE
- REVISE
- HOLD
- REJECT

Only APPROVE may create or update a content PR. The editor must also assign FULL_ARTICLE or SOCIAL_BRIEF. REVISE returns to the owning agent for a bounded number of corrections. HOLD and REJECT remain in the run report.

Editorial checks include accuracy, usefulness, originality, structure, accessibility, title quality, hook quality, tone, source quality and platform-specific formatting.

Humour or curiosity may be used lightly, but must never weaken accuracy or trivialize security incidents.

### 5.7 Content rendering

Article output must match the Docusaurus site's agreed schema and topic navigation.

Required front matter:

- title
- slug
- description
- authors
- tags
- topic
- date
- draft

Required article structure:

1. clear, specific title
2. concise opening hook
3. what changed
4. why it matters
5. practical implications
6. limitations or risks
7. what to do next
8. sources

LinkedIn and X drafts must be platform-specific rather than shortened copies of the article. Both must point to the final article URL placeholder and remain draft artifacts.

### 5.8 Cross-repository pull request

Use a GitHub App or fine-grained token with minimum required permissions:

- read this repository
- read/write contents in the Docusaurus repository
- read/write pull requests in the Docusaurus repository

For each approved run:

- create branch `content/YYYY-MM-DD/<run-id>`
- write new files only under agreed generated-content paths
- run validation before push
- open one PR with the run summary, topics, sources and editorial decisions
- apply labels identifying generated draft content
- never enable auto-merge

Rerunning the same run ID must update the existing branch/PR rather than create duplicates.

## 6. Repository structure

```text
config/
  publication.yml
  sources.yml
schemas/
  candidate.schema.json
  evidence.schema.json
  review.schema.json
  run.schema.json
src/
  adapters/
  collection/
  routing/
  deduplication/
  agents/
  verification/
  editorial/
  rendering/
  github/
  state/
  observability/
tests/
  unit/
  integration/
  contract/
  fixtures/
.github/workflows/
  daily-publication.yml
  validate.yml
artifacts/
  .gitkeep
```

Runtime artifacts must not be committed to the main branch.

## 7. Configuration and secrets

Required secrets:

- `SCRAPECREATORS_API_KEY`
- model provider credentials
- cross-repository GitHub credential when the workflow token is insufficient

Configuration must define:

- timezone and schedule
- lookback window
- enabled sources
- topic queries and source allowlists
- maximum candidates and articles
- model names and token/cost ceilings
- retry and timeout policies
- Docusaurus repository and paths
- confidence thresholds
- notification behavior

Startup must fail fast when configuration is invalid or required secrets are absent.

## 8. Reliability and operational controls

- Prevent overlapping scheduled runs using GitHub Actions concurrency.
- Set job and request timeouts.
- Retry transient failures only.
- Continue with unaffected sources when one optional adapter fails.
- Fail before PR creation if evidence, rendering or validation is incomplete.
- Make state and PR operations idempotent.
- Redact credentials and sensitive headers from logs.
- Preserve a machine-readable run manifest.
- Provide manual rerun from a known run ID.
- Pin actions by immutable version or commit SHA.
- Apply dependency and secret scanning.
- Define monthly dependency maintenance.

## 9. Observability

Each run must report:

- run ID and trigger
- duration by stage
- sources attempted/succeeded/failed
- API requests, rate limits and retry counts
- candidates collected, deduplicated, routed and selected
- editorial outcomes
- model usage and estimated cost
- files generated
- target branch and PR URL
- final outcome and failure category

Logs must be useful without exposing full sensitive payloads. Upload the sanitized run manifest and validation report as workflow artifacts.

## 10. Validation strategy

Testing is part of the production implementation, not a substitute for it.

### Unit tests

- normalization
- canonical URL handling
- routing rules
- fingerprints and similarity thresholds
- evidence rules
- front-matter and slug generation
- social format constraints
- redaction

### Contract tests

Validate recorded fixtures against adapter schemas without consuming live credits on every build.

### Integration tests

Use mocked external services to verify the complete run, including retries, partial source failure, no-story outcome and PR idempotency.

### Controlled live verification

A manually triggered workflow may use real APIs with strict candidate and cost limits. It must target a non-publishing branch and still require human approval.

### Docusaurus validation

Before opening a PR:

- validate front matter and required fields
- reject duplicate slugs
- validate internal links
- run the site's content catalogue validation
- run the Docusaurus production build
- scan generated files for secrets

## 11. Delivery stages and acceptance criteria

### Stage 1: Runner foundation

Deliver configuration loading, schemas, logging, run IDs, locking, state interface and CI validation.

Accepted when invalid configuration fails clearly, concurrent runs are blocked, and a deterministic empty run produces a valid manifest.

### Stage 2: Source collection

Deliver production adapters for the agreed YouTube, LinkedIn, X and primary-source inputs.

Accepted when adapters normalize real responses, respect limits, retain provenance and tolerate an optional source failure.

### Stage 3: Routing and deduplication

Deliver topic ownership, historical comparison and duplicate prevention.

Accepted when known duplicate fixtures are consistently rejected and routing decisions include an auditable reason.

### Stage 4: Specialist generation

Integrate the five specialist skills with structured inputs and outputs.

Accepted when each agent produces schema-valid evidence, article and social drafts, and refuses insufficient evidence.

### Stage 5: Reviewer and fact checker

Implement the editorial decision loop and claim-level verification.

Accepted when unsupported, stale, conflicting and incorrectly classified claims cannot receive APPROVE.

### Stage 6: Docusaurus PR delivery

Implement rendering, target-site validation and idempotent cross-repository PR creation.

Accepted when an approved run opens exactly one valid review PR, a rerun updates it, and no publish/merge operation exists in code.

### Stage 7: Scheduled production operation

Enable the daily workflow, dashboards/artifacts, failure reporting, cost limits and runbook.

Accepted after consecutive scheduled runs demonstrate stable execution, correct no-story behavior, traceable sources and reviewable output without manual repair.

## 12. Definition of done

The work is done only when:

- the daily workflow is enabled
- all five specialist routes operate
- the editorial gate blocks weak or unsupported content
- duplicate stories are prevented
- generated content builds successfully in the actual Docusaurus repository
- one idempotent review PR is created for approved daily output
- LinkedIn and X remain drafts
- no code path can auto-merge or auto-publish
- logs, manifests and evidence allow every article claim to be traced
- security scanning and operational documentation are in place
- the owner can review, request revision, merge or reject without editing pipeline internals
- every candidate is explicitly classified as full article, social brief, hold or reject
- Docusaurus publication occurs only through human PR merge and the existing Azure Static Web Apps pipeline
- social publishing remains manual unless a separately authorized protected publishing stage is implemented

## 13. Reviewer conclusions

The existing fork is suitable as the skill and social research foundation, but it is not yet an executable production system. The implementation must not be described as complete after adding prompts, a sample workflow or a successful isolated API call.

The critical engineering work is the deterministic runner, evidence model, state and deduplication, bounded agent contracts, editorial enforcement, target-site build validation, idempotent PR delivery and production operations.

Implementation should follow the stages above in order. The schedule must remain disabled until Stages 1-6 meet their acceptance criteria. Once enabled, human review remains the permanent publication boundary.
