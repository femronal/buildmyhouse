export type JobStepKey =
  | 'request_sent'
  | 'inspection'
  | 'fund'
  | 'in_progress'
  | 'completed'
  | 'declined'
  | 'paused';

export function contractorName(project: any): string | null {
  if (project?.generalContractor?.fullName) return project.generalContractor.fullName;
  const requests = Array.isArray(project?.projectRequests) ? project.projectRequests : [];
  const gcRequests = requests.filter((request: any) => !request?.stageId);
  const chosen =
    gcRequests.find((request: any) => request?.status === 'accepted') ||
    gcRequests.find((request: any) => request?.status === 'pending');
  return chosen?.contractor?.fullName || null;
}

export function isDeclinedProject(project: any): boolean {
  const requests = (Array.isArray(project?.projectRequests) ? project.projectRequests : []).filter(
    (request: any) => !request?.stageId,
  );
  if (requests.length === 0) return false;
  if (project?.status === 'active' || project?.status === 'pending_payment' || project?.status === 'inspection') {
    return false;
  }
  return requests.every((request: any) => request?.status === 'rejected');
}

export function jobStep(project: any): { key: JobStepKey; label: string; detail: string } {
  if (project?.designId && project?.planRequestStep?.label) {
    return {
      key: project.planRequestStep.state === 'declined' ? 'declined' : 'request_sent',
      label: `Step ${project.planRequestStep.step} of 6`,
      detail: project.planRequestStep.label,
    };
  }
  if (project?.status === 'completed' || Number(project?.progress || 0) >= 100) {
    return { key: 'completed', label: 'Completed', detail: 'This project is complete.' };
  }
  if (project?.status === 'paused') {
    return { key: 'paused', label: 'Paused', detail: 'This project is paused.' };
  }
  if (isDeclinedProject(project)) {
    return { key: 'declined', label: 'Declined', detail: 'A contractor declined this project.' };
  }
  if (project?.status === 'active') {
    return {
      key: 'in_progress',
      label: 'Work in progress',
      detail: project?.currentStage || 'Work is underway.',
    };
  }
  if (project?.status === 'pending_payment') {
    return {
      key: 'fund',
      label: 'Fund project',
      detail: 'Your quote is agreed. Fund your project to start.',
    };
  }
  if (project?.status === 'inspection') {
    return {
      key: 'inspection',
      label: 'Inspection',
      detail: 'Your contractor will inspect the property. The price is agreed after that.',
    };
  }
  return {
    key: 'request_sent',
    label: 'Request sent',
    detail: 'Waiting for the contractor to accept.',
  };
}
