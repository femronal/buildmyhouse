export type StageEvidence = {
  name: string;
  doneWhen: string;
  evidence: string[];
};

const GENERIC_DONE = /finished and photographed|seen the finished work/i;

export function cleanEvidence(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const checks: string[] = [];
  for (const item of items) {
    const text = String(item || '').replace(/\s+/g, ' ').trim();
    if (text.length < 8) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    checks.push(text.length > 240 ? `${text.slice(0, 237).trim()}...` : text);
    if (checks.length >= 6) break;
  }
  return checks;
}

export function fallbackEvidence(name: string, doneWhen: string): string[] {
  const stage = String(name || '').trim() || 'this stage';
  const objective = String(doneWhen || '').replace(/\s+/g, ' ').trim();
  return [
    objective
      ? `Confirm this is true on site: ${objective.replace(/\.$/, '')}.`
      : `Confirm “${stage}” is finished the way the signed quote describes it.`,
    `Compare the work with the signed quote for “${stage}”, including the materials, quantities, and locations named there.`,
    `Look for unfinished work, damage, or a substitution the quote did not include.`,
    `The photos and videos should show that finished work, not a different part of the project.`,
  ];
}

export function storedEvidence(phase: any): string[] {
  return cleanEvidence(phase?.evidenceToReview || phase?.evidence);
}

export function reviewForStage(stage: { name?: string; doneWhen?: string; description?: string; evidence?: string[]; evidenceToReview?: string[] }, phase?: any): { objective: string; checks: string[] } {
  const name = String(phase?.name || stage?.name || '').trim();
  const objective = String(phase?.doneWhen || phase?.description || stage?.doneWhen || stage?.description || '').replace(/\s+/g, ' ').trim()
    || `This stage is done when ${name || 'the work'} matches the signed quote.`;
  const stored = storedEvidence(phase).length >= 2 ? storedEvidence(phase) : storedEvidence(stage);
  return {
    objective,
    checks: stored.length >= 2 ? stored : fallbackEvidence(name, objective),
  };
}

export function parseDescribedStages(raw: unknown): StageEvidence[] {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const stages = Array.isArray((parsed as any)?.stages) ? (parsed as any).stages : [];
  return stages
    .map((stage: any) => ({
      name: String(stage?.name || '').replace(/\s+/g, ' ').trim(),
      doneWhen: String(stage?.doneWhen || '').replace(/\s+/g, ' ').trim(),
      evidence: cleanEvidence(stage?.evidence),
    }))
    .filter((stage: StageEvidence) => stage.name && stage.evidence.length >= 2);
}

function sameName(left: string, right: string): boolean {
  return left.replace(/\s+/g, ' ').trim().toLowerCase() === right.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function applyDescribedEvidence<T extends { name: string; doneWhen: string; evidence?: string[] }>(
  stages: T[],
  described: StageEvidence[] | null | undefined,
): T[] {
  const describedList = described || [];
  const anyNameMatch = stages.some((stage) => describedList.some((item) => sameName(item.name, stage.name)));
  return stages.map((stage, index) => {
    const byName = describedList.find((item) => sameName(item.name, stage.name));
    const match = byName || (!anyNameMatch && describedList.length === stages.length ? describedList[index] : undefined);
    const checks = cleanEvidence(match?.evidence);
    const current = String(stage.doneWhen || '').trim();
    const replacement = String(match?.doneWhen || '').trim();
    const doneWhen = (!current || GENERIC_DONE.test(current)) && replacement ? replacement : current;
    const existing = cleanEvidence(stage.evidence);
    return {
      ...stage,
      doneWhen: doneWhen || current,
      evidence: checks.length >= 2 ? checks : existing.length >= 2 ? existing : fallbackEvidence(stage.name, doneWhen || current),
    };
  });
}

export function phaseNeedsEvidence(phase: any): boolean {
  return storedEvidence(phase).length < 2;
}
