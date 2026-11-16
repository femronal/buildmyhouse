export type StageView = {
  id: string;
  name: string;
  status: string;
  order: number;
  estimatedCost?: number | null;
  actualCost?: number | null;
  estimatedDuration?: string | null;
  startDate?: string | null;
  completionDate?: string | null;
  submittedForApprovalAt?: string | null;
};

export type ApiProject = {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  state?: string | null;
  status: string;
  riskLevel?: 'low' | 'medium' | 'high';
  progress: number;
  budget: number;
  spent: number;
  updatedAt?: string;
  currentStage?: string | null;
  projectType?: string | null;
  externalPaymentLink?: string | null;
  paymentConfirmationStatus?: 'not_declared' | 'declared' | 'confirmed' | 'rejected' | string;
  paymentRef?: string;
  generalContractorId?: string | null;
  archivedAt?: string | null;
  managedByAdmin?: boolean;
  needsExtraMonitoring?: boolean;
  createdAt?: string;
  attention?: {
    reasons: string[];
    dormant: boolean;
    hasConfirmedMoney: boolean;
    lastActivityAt: string;
  };
  homeowner?: { fullName?: string | null; email?: string | null } | null;
  generalContractor?: {
    fullName?: string | null;
    email?: string | null;
    contractorProfile?: { verified?: boolean; name?: string | null } | null;
  } | null;
  projectRequests?: {
    contractor?: {
      fullName?: string | null;
      contractorProfile?: { verified?: boolean; name?: string | null } | null;
    } | null;
  }[] | null;
  stages?: StageView[] | null;
  planRequestStep?: { step?: number; state?: string; label?: string } | null;
  aiAnalysis?: {
    fundingInvoice?: {
      reference?: string;
      receipt?: { url?: string; fileName?: string } | null;
    } | null;
  } | null;
};

export type ProjectView = {
  id: string;
  name: string;
  address: string;
  location: string;
  city?: string | null;
  state?: string | null;
  homeowner: string;
  homeownerEmail?: string | null;
  gc: string;
  gcEmail?: string | null;
  generalContractorId?: string | null;
  status: string;
  rawStatus: string;
  risk: 'low' | 'medium' | 'high';
  progress: number;
  budget: number;
  spent: number;
  lastUpdate: string;
  lastActivityAt: string;
  quietDays: number;
  dormant: boolean;
  hasConfirmedMoney: boolean;
  reasons: string[];
  gcVerified: boolean;
  needsExtraMonitoring: boolean;
  nextMilestone: string;
  projectType?: string | null;
  externalPaymentLink?: string | null;
  paymentConfirmationStatus?: string | null;
  paymentRef?: string;
  archivedAt?: string | null;
  managedByAdmin?: boolean;
  stages?: StageView[] | null;
  planRequestStep?: { step?: number; state?: string; label?: string } | null;
  fundingReference?: string | null;
  fundingReceiptUrl?: string | null;
};
