# Project instructions

These instructions apply to every directory in this repository and are intended to persist across development sessions.

## Product scope

Notifica Fight is an Android app for following combat-sports events. Keep it focused on schedules, cards, results, favorites, and notifications. Do not add social, betting, fantasy, chat, premium, user accounts, live transport, or machine-learning features unless explicitly requested.

The current milestone is the **Upcoming Events vertical slice**:

PostgreSQL -> NestJS REST API -> Android repository -> Room -> ViewModel -> Compose.

External providers, ingestion, admin, worker jobs, FCM scheduling, fights, and results are later milestones.

## Engineering priorities

Apply these in order: correctness, security, clarity, maintainability, testability, performance, extensibility.

- Follow KISS, YAGNI, DRY, SOLID, separation of concerns, least privilege, secure by default, and fail securely.
- Prefer explicit code. Do not create speculative abstractions, generic repositories, base services/controllers, unnecessary interfaces, CQRS, event sourcing, microservices, GraphQL, or premature queues/caches.
- Use English for code and identifiers. Documentation may be Portuguese or English, but keep each document internally consistent.
- Keep changes small and scoped. Do not reformat or refactor unrelated code.
- Never add real secrets, private provider keys, FCM tokens, authorization headers, or credentials to source control or logs.
- Do not use factual real-world event fixtures unless they come from a defined, authorized source. Development fixtures must be visibly marked as fictional.

## Architecture boundaries

- `platform/`: pnpm workspace for NestJS API; worker and admin are added only when their milestone begins.
- `android/`: independent Gradle Android project. It consumes only the versioned REST API and shares no TypeScript models.
- Public content endpoints are read-only. Administrative mutations will live under `/v1/admin` with OIDC and server-side RBAC when implemented.
- Prisma is used directly for simple persistence. Add repository ports only for an actual domain/testability boundary; never add `BaseRepository<T>`.
- Store timestamps in UTC and event timezone as an explicit IANA identifier. Convert to device-local time on Android.
- Android is offline-friendly: network data is validated/mapped, persisted in Room, then observed by UI. UI never calls Retrofit directly.
- Production Android builds must reject cleartext traffic. Emulator development may use an explicit debug-only network security configuration.

## Required checks before handoff

Run the relevant format/lint, typecheck/compile, tests, Prisma validation/migration checks, and Android build/tests when the environment supports them. Review for secrets, security regressions, accidental complexity, duplication, and unused code. Clearly report anything the local WSL environment could not verify.

Do not commit or push unless the user explicitly requests it. The current project owner has requested incremental commits and pushes to `git@github.com:luscanascimento/notifica-fight.git`; keep doing so until that instruction is revoked.
