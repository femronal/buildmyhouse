export type StageEvidenceItem = {
  id: string;
  stageLabel: string;
  date: string;
  explanation: string;
  imageUrl: string;
};

export type VerificationCheckItem = {
  label: string;
  status: 'verified' | 'in_review' | 'pending';
  note?: string;
};

export type ContractorVerificationSummaryData = {
  contractorLabel: string;
  checks: VerificationCheckItem[];
  note: string;
};

export type MilestonePaymentItem = {
  stageName: string;
  completionDefinition: string;
  requiredEvidence: string[];
  paymentTrigger: string;
};

export type DocumentationSampleItem = {
  title: string;
  caption: string;
  description: string;
};

export type ChatTimelineItem = {
  at: string;
  actor: 'homeowner' | 'contractor' | 'buildmyhouse';
  message: string;
  type: 'update' | 'question' | 'evidence' | 'approval';
};

export type ProofOfProcessDemoContent = {
  stageEvidenceGallery: StageEvidenceItem[];
  contractorVerification: ContractorVerificationSummaryData;
  milestonePaymentBreakdown: MilestonePaymentItem[];
  documentationSamples: DocumentationSampleItem[];
  chatTimeline: ChatTimelineItem[];
};

