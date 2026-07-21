'use strict';
function evaluate(input = {}) {
  const errors = [], matter = input.matter || {}, sources = input.sources || [], deadlines = input.deadlines || [];
  if (!matter.id || !matter.jurisdiction || !matter.ownerId || !matter.ruleSetVersion ||
      !matter.effectiveAt || !matter.permissionScope || !matter.retentionPolicyVersion) {
    errors.push('scoped matter, jurisdiction, owner, effective rule set, and retention policy required');
  }
  const sourceIds = new Set();
  for (const source of sources) {
    if (!source.id || sourceIds.has(String(source.id)) || !source.registryRef || !source.version ||
        !/^[a-f0-9]{64}$/i.test(source.sha256 || '') || !source.capturedAt || !source.rightsBasis ||
        source.privileged && !source.accessScope) errors.push(`source ${source.id || '?'} lacks authoritative provenance or privilege scope`);
    sourceIds.add(String(source.id));
  }
  for (const rule of input.rules || []) if (!rule.id || !rule.version || rule.jurisdiction !== matter.jurisdiction ||
      Date.parse(rule.effectiveFrom) > Date.parse(matter.effectiveAt) ||
      rule.effectiveTo && Date.parse(rule.effectiveTo) < Date.parse(matter.effectiveAt) ||
      !Array.isArray(rule.sourceIds) || rule.sourceIds.some((id) => !sourceIds.has(String(id)))) errors.push('inapplicable or unsupported rule');
  for (const deadline of deadlines) if (!deadline.id || !deadline.ruleId || Number.isNaN(Date.parse(deadline.dueAt)) ||
      !deadline.ownerId || !deadline.calculationVersion || deadline.status === 'missed') errors.push('deadline invalid or adverse');
  for (const document of input.documents || []) if (!document.id || !document.version || !document.sha256 ||
      !document.ownerId || document.privileged && !document.redactionVersion) errors.push('document privilege/version evidence incomplete');
  for (const literature of input.literature || []) if (!literature.id || !literature.databaseRef ||
      !literature.version || !literature.citation || literature.retrieved === true) errors.push('literature request must remain cited and queued');
  const fixtures = input.fixtures || {};
  for (const key of ['jurisdiction','effectiveDate','conflictingSource','privilege','redaction','deadline','adverseCase']) {
    if (fixtures[key] !== true) errors.push(`reviewed fixture ${key} not passed`);
  }
  if (!input.review?.qualifiedReviewerId || input.review.qualifiedReviewerId === matter.ownerId ||
      input.review.nonAdviceAcknowledged !== true) errors.push('independent qualified non-advice review required');
  return { errors, result: { sourceCount: sources.length, deadlineCount: deadlines.length,
    queuedLiterature: (input.literature || []).length, fixtureCount: Object.values(fixtures).filter(Boolean).length,
    decision: errors.length ? 'revise' : 'reviewable' },
    assumptions: ['registry snapshots and deadlines require counsel confirmation'],
    uncertainty: { nonLegalAdvice: true, counselApprovalRequired: true, registriesNotConnected: true } };
}
module.exports = { evaluate };
