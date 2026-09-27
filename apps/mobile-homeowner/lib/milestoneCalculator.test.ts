import { milestoneCalculatorConfig } from '@/lib/milestoneCalculator.config';
import {
  addStage,
  buildDefaultStages,
  computePlan,
  fixIt,
  nudge,
  planStatus,
  removeStage,
  splitEvenly,
  sumPct,
} from '@/lib/milestoneCalculator';

function money(total: number, contingency: number, stages: { pct: number; name: string }[]) {
  const plan = computePlan(
    total,
    contingency,
    stages.map((stage) => stage.pct),
  );
  return stages.map((stage, index) => ({
    name: stage.name,
    pct: stage.pct,
    amount: plan.amounts[index],
    paidSoFar: plan.paidSoFar[index],
    stillInControl: plan.stillInControl[index],
  }));
}

describe('milestone calculator', () => {
  it('matches the worked example after two removals', () => {
    let stages = buildDefaultStages('new-build');
    const walls = stages.findIndex((stage) => stage.key === 'Wall/Ceiling Preparation');
    stages = removeStage(stages, walls);
    const outside = stages.findIndex((stage) => stage.key === 'Exterior & Landscaping');
    stages = removeStage(stages, outside);

    expect(stages.map((stage) => stage.pct)).toEqual([30, 25, 24, 21]);
    const plan = computePlan(10_000_000, 10, stages.map((stage) => stage.pct));
    expect(plan.keptAside).toBe(1_000_000);
    expect(plan.forStages).toBe(9_000_000);
    expect(money(10_000_000, 10, stages)).toEqual([
      { name: 'Site preparation & foundation', pct: 30, amount: 2_700_000, paidSoFar: 2_700_000, stillInControl: 7_300_000 },
      { name: 'Framing & structure', pct: 25, amount: 2_250_000, paidSoFar: 4_950_000, stillInControl: 5_050_000 },
      { name: 'Pipes, wiring & plumbing (rough-in)', pct: 24, amount: 2_160_000, paidSoFar: 7_110_000, stillInControl: 2_890_000 },
      { name: 'Interior finishes', pct: 21, amount: 1_890_000, paidSoFar: 9_000_000, stillInControl: 1_000_000 },
    ]);
    expect(plan.amounts.reduce((sum, amount) => sum + amount, 0)).toBe(9_000_000);
    expect(plan.stillInControl[plan.stillInControl.length - 1]).toBe(plan.keptAside);
  });

  it('puts rounding on the last stage so the amounts add up exactly', () => {
    const plan = computePlan(1_000_003, 0, [34, 33, 33]);
    expect(plan.amounts.reduce((sum, amount) => sum + amount, 0)).toBe(1_000_003);
    expect(plan.forStages).toBe(1_000_003);
  });

  it('splits 7 stages evenly with the remainder on the first stages', () => {
    const stages = splitEvenly(buildDefaultStages('new-build').concat(buildDefaultStages('interior').slice(0, 1)));
    expect(stages).toHaveLength(7);
    expect(stages.map((stage) => stage.pct)).toEqual([15, 15, 14, 14, 14, 14, 14]);
    expect(sumPct(stages)).toBe(100);
  });

  it('keeps every default split at exactly 100', () => {
    for (const project of milestoneCalculatorConfig.projectTypes) {
      expect(project.stages.reduce((sum, stage) => sum + stage.pct, 0)).toBe(100);
      expect(planStatus(buildDefaultStages(project.id)).ok).toBe(true);
    }
  });

  it('stays at 100 or flags a warning, and Fix it always restores 100', () => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (const project of milestoneCalculatorConfig.projectTypes) {
      let stages = buildDefaultStages(project.id);
      let last = 0;
      for (let turn = 0; turn < 200; turn += 1) {
        const roll = rand();
        if (roll < 0.45) {
          const index = Math.floor(rand() * stages.length);
          const delta = rand() < 0.5 ? 1 : -1;
          const next = nudge(stages, index, delta as 1 | -1);
          if (next !== stages) last = index;
          stages = next;
        } else if (roll < 0.6) {
          stages = splitEvenly(stages);
        } else if (roll < 0.7) {
          stages = buildDefaultStages(project.id);
          last = 0;
        } else if (roll < 0.85 && stages.length < 8) {
          stages = addStage(stages, 'New stage', ['Photos/Videos', 'Progress update']);
          last = stages.length - 1;
        } else if (stages.length > 3) {
          const index = Math.floor(rand() * stages.length);
          stages = removeStage(stages, index);
          last = Math.min(last, stages.length - 1);
        }
        const status = planStatus(stages);
        expect(status.total === 100 || !status.ok).toBe(true);
      }
      stages = fixIt(stages, last);
      const fixed = planStatus(stages);
      expect(fixed.total).toBe(100);
      expect(fixed.ok).toBe(true);
      expect(stages.every((stage) => stage.pct >= 1 && stage.pct <= 90)).toBe(true);
    }
  });
});
