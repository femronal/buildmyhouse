/**
 * Clarifying-question engine (deterministic core).
 * Doc: docs/price-checker/CLARIFYING_QUESTION_ENGINE.md
 *
 * Progressive disclosure: only 'always' questions plus conditional questions
 * whose dependencies are satisfied are shown. Admin-only and
 * professional-review questions are never shown to end users.
 */
import { ClarifyingQuestion, ProductFamily } from './types';

export type AnswerValue = string | undefined;
export type Answers = Readonly<Record<string, AnswerValue>>;

export const UNKNOWN_ANSWER = 'unknown';

/** Questions currently visible to an end user given their answers so far. */
export function selectVisibleQuestions(family: ProductFamily, answers: Answers): ClarifyingQuestion[] {
  return family.questions.filter((question) => {
    if (question.requirement === 'admin_only' || question.requirement === 'professional_review') {
      return false;
    }
    if (question.requirement === 'conditional') {
      const dep = question.dependsOn;
      if (!dep) return false; // malformed conditional — hide rather than confuse
      const answer = answers[dep.questionId];
      return answer !== undefined && dep.valueIn.includes(answer);
    }
    return true;
  });
}

/** Required questions still unanswered (unknown counts as answered when allowed). */
export function missingRequiredQuestions(family: ProductFamily, answers: Answers): ClarifyingQuestion[] {
  return selectVisibleQuestions(family, answers).filter((question) => {
    if (question.requirement === 'optional') return false;
    const answer = answers[question.id];
    if (answer === undefined || answer === '') return true;
    if (answer === UNKNOWN_ANSWER && !question.allowUnknown) return true;
    return false;
  });
}

export type UnknownOutcome =
  | 'broadened_low_confidence_research'
  | 'admin_clarification'
  | 'photo_identification'
  | 'quotation_extraction'
  | 'professional_assistance'
  | 'insufficient_specification';

/**
 * Deterministic outcome routing when a user answers "I don't know" on a
 * price-changing question.
 */
export function resolveUnknownOutcome(question: ClarifyingQuestion, context: {
  hasPhoto: boolean;
  hasQuotation: boolean;
  unknownCount: number;
}): UnknownOutcome {
  if (!question.allowUnknown) {
    return 'insufficient_specification';
  }
  if (context.hasQuotation) return 'quotation_extraction';
  if (context.hasPhoto) return 'photo_identification';
  if (context.unknownCount >= 3) return 'admin_clarification';
  if (question.requirement === 'always') return 'broadened_low_confidence_research';
  return 'broadened_low_confidence_research';
}

/**
 * Detect contradictory answers: an answer to a conditional question whose
 * dependency is no longer satisfied (e.g. user changed an earlier answer).
 */
export function findContradictions(family: ProductFamily, answers: Answers): string[] {
  const contradictions: string[] = [];
  for (const question of family.questions) {
    if (question.requirement !== 'conditional' || !question.dependsOn) continue;
    const answered = answers[question.id] !== undefined;
    const dep = answers[question.dependsOn.questionId];
    const depSatisfied = dep !== undefined && question.dependsOn.valueIn.includes(dep);
    if (answered && !depSatisfied) {
      contradictions.push(question.id);
    }
  }
  return contradictions;
}
