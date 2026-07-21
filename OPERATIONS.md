# Governed patent matter operations

## Intended use and limits

The governed API tracks scoped legal matters, sources, effective jurisdictional rules, documents, deadlines, privilege/redaction, literature requests, evidence, and independent review. It is not legal advice. Counsel owns deadline and filing decisions; registry and literature snapshots must be confirmed against authoritative sources.

## Data and integrations

Signed tenant claims enforce matter scope. Registry, filing, e-signature, case, document, identity, notification, and scientific-literature operations remain approval-gated outbox records with request-bound idempotency, bounded retries, replay protection, and reconciliation. Provider credentials are secret references. Audit events are append-only; privileged exports are limited to creator, approver, or administrator scope.

## Deploy, rollback, and recovery

Run `./start.sh check`, back up PostgreSQL, and apply the additive migration only with `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate`. Roll back code without dropping matter or audit tables. Restore from a verified backup, re-check every deadline and registry status, and replay only original outbox requests. Rotate JWT and provider secrets centrally, restart, and invalidate tokens.

Legal holds override ordinary erasure. Otherwise erasure completes only after provider receipts. Alert on deadline changes, adverse cases, privilege/redaction gaps, self-review, registry divergence, dead letters, and unauthorized matter access.
