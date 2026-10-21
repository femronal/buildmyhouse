export type PlanStepViewer = 'homeowner' | 'gc' | 'admin';
export type PlanStepState = 'current' | 'waiting_other_side' | 'late' | 'done' | 'declined';
export type PlanStepActor = 'gc' | 'homeowner' | 'admin' | 'none';

const LATE_MS = 48 * 60 * 60 * 1000;

export const PLAN_STEP_LABELS = [
  'Request sent',
  'Contractor contact',
  'Inspection',
  'Quote agreed',
  'BMH check',
  'Accepted',
] as const;

function timeOf(value: unknown): number | null {
  if (!value) return null;
  const time = new Date(value as string).getTime();
  return Number.isFinite(time) ? time : null;
}

export function getPlanRequestStep(
  request: any,
  _project: any,
  viewer: PlanStepViewer = 'homeowner',
  now: Date = new Date(),
) {
  const contacted = !!request?.contactedAt;
  const contactConfirmed = !!request?.homeownerConfirmedContactAt;
  const inspected = !!request?.inspectedAt;
  const inspectionConfirmed = !!request?.homeownerConfirmedInspectionAt;
  const quoteReady = !!request?.quoteGeneratedAt;
  const quoteAccepted = !!request?.homeownerAcceptedQuoteAt;
  const rework = request?.bmhCheckResult === 'too_high' || request?.bmhCheckResult === 'too_low';
  const fair = request?.bmhCheckResult === 'fair';
  const accepted = request?.status === 'accepted';
  const declined = request?.status === 'rejected';

  let step = 1;
  let actor: PlanStepActor = 'gc';
  let since: unknown = request?.sentAt;

  if (!contacted) {
    step = 1;
    actor = 'gc';
    since = request?.sentAt;
  } else if (!contactConfirmed) {
    step = 2;
    actor = 'homeowner';
    since = request?.contactedAt;
  } else if (!inspected) {
    step = 3;
    actor = 'gc';
    since = request?.homeownerConfirmedContactAt;
  } else if (!inspectionConfirmed) {
    step = 3;
    actor = 'homeowner';
    since = request?.inspectedAt;
  } else if (!quoteReady || rework) {
    step = 4;
    actor = 'gc';
    since = rework ? request?.bmhCheckAt : request?.homeownerConfirmedInspectionAt;
  } else if (!quoteAccepted) {
    step = 4;
    actor = 'homeowner';
    since = request?.quoteGeneratedAt;
  } else if (!fair) {
    step = 5;
    actor = 'admin';
    since = request?.homeownerAcceptedQuoteAt;
  } else if (!accepted) {
    step = 6;
    actor = 'gc';
    since = request?.bmhCheckAt;
  } else {
    step = 6;
    actor = 'none';
    since = request?.respondedAt || request?.bmhCheckAt;
  }

  const disputed = Number(request?.homeownerDisputedStep) === step;
  const sinceTime = timeOf(since);
  const lateByTime = actor !== 'none' && sinceTime != null && now.getTime() - sinceTime >= LATE_MS;
  const late = !declined && !accepted && (disputed || lateByTime);
  const isPlan = !!_project?.designId;
  const done = accepted && (!isPlan || fair);

  let state: PlanStepState = 'current';
  if (declined) state = 'declined';
  else if (done && step === 6 && actor === 'none') state = 'done';
  else if (late) state = 'late';
  else if (viewer === 'admin') state = 'current';
  else if (viewer === 'homeowner' && actor !== 'homeowner') state = 'waiting_other_side';
  else if (viewer === 'gc' && actor !== 'gc') state = 'waiting_other_side';

  return {
    step,
    state,
    actor,
    label: PLAN_STEP_LABELS[step - 1],
    lateReason: state === 'late'
      ? disputed
        ? 'The homeowner said this step did not happen.'
        : 'No progress for 48 hours.'
      : undefined,
    inspectionAlreadyHappened: !!(request?.homeownerConfirmedInspectionAt || request?.inspectedAt),
  };
}
