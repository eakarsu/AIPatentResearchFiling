'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate } = require('../domain.cjs');

const valid = () => ({
  matter: { id: 'm1', jurisdiction: 'US', ownerId: 'counsel-1', ruleSetVersion: 'uspto-v4', effectiveAt: '2026-07-18', permissionScope: 'matter-team', retentionPolicyVersion: 'rp-v2' },
  sources: [{ id: 's1', registryRef: 'uspto:patent:1', version: 'v1', sha256: 'a'.repeat(64), capturedAt: '2026-07-18T00:00:00Z', rightsBasis: 'public-record' }],
  rules: [{ id: 'rule-1', version: 'v3', jurisdiction: 'US', effectiveFrom: '2026-01-01', sourceIds: ['s1'] }],
  deadlines: [{ id: 'deadline-1', ruleId: 'rule-1', dueAt: '2026-08-18', ownerId: 'docket-1', calculationVersion: 'calc-v2', status: 'open' }],
  documents: [{ id: 'doc-1', version: 'v1', sha256: 'b'.repeat(64), ownerId: 'counsel-1', privileged: true, redactionVersion: 'redact-v1' }],
  literature: [{ id: 'lit-1', databaseRef: 'crossref', version: '2026-07', citation: 'doi:10.1/example', retrieved: false }],
  fixtures: { jurisdiction: true, effectiveDate: true, conflictingSource: true, privilege: true, redaction: true, deadline: true, adverseCase: true },
  review: { qualifiedReviewerId: 'counsel-2', nonAdviceAcknowledged: true }
});

test('accepts provenance-bound independently reviewed patent matter', () => assert.deepEqual(evaluate(valid()).errors, []));
test('blocks self-review and retrieved literature side effect', () => { const input = valid(); input.review.qualifiedReviewerId = 'counsel-1'; input.literature[0].retrieved = true; assert.ok(evaluate(input).errors.length >= 2); });
