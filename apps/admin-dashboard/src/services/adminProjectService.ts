import { api } from '@/lib/api';

export interface StageTeamMember {
  id: string;
  stageId: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  dailyRate?: number;
  rateType?: 'daily' | 'hourly' | 'fixed';
  startDate?: string;
  endDate?: string;
  photoUrl?: string;
  invoiceUrl?: string;
  notes?: string;
}

export interface StageMaterial {
  id: string;
  stageId: string;
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  supplier?: string;
  supplierContact?: string;
  receiptUrl?: string;
  photoUrl?: string;
  deliveryDate?: string;
  notes?: string;
}

export interface StageMedia {
  id: string;
  stageId: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  order: number;
}

export interface StageDocument {
  id: string;
  stageId: string;
  type: 'receipt' | 'invoice' | 'contract' | 'other';
  name: string;
  url: string;
  category?: 'team' | 'material' | 'general';
  relatedId?: string;
  notes?: string;
}

export type CreateTeamMemberData = {
  name: string;
  role: string;
  phone?: string;
  email?: string;
  dailyRate?: number;
  rateType?: 'daily' | 'hourly' | 'fixed';
  notes?: string;
  photoUrl?: string;
  invoiceUrl?: string;
};

export type CreateMaterialData = {
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  supplier?: string;
  supplierContact?: string;
  receiptUrl?: string;
  photoUrl?: string;
  notes?: string;
};

export type CreateMediaData = {
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  order?: number;
};

export type CreateDocumentData = {
  type: 'receipt' | 'invoice' | 'contract' | 'other';
  name: string;
  url: string;
  category?: 'team' | 'material' | 'general';
  notes?: string;
};

export const stageDocumentationService = {
  addTeamMember: (projectId: string, stageId: string, data: CreateTeamMemberData) =>
    api.post<StageTeamMember>(`/projects/${projectId}/stages/${stageId}/team-members`, data),

  updateTeamMember: (teamMemberId: string, data: Partial<CreateTeamMemberData>) =>
    api.patch<StageTeamMember>(`/projects/stages/team-members/${teamMemberId}`, data),

  deleteTeamMember: (teamMemberId: string) =>
    api.delete(`/projects/stages/team-members/${teamMemberId}`),

  addMaterial: (projectId: string, stageId: string, data: CreateMaterialData) =>
    api.post<StageMaterial>(`/projects/${projectId}/stages/${stageId}/materials`, data),

  updateMaterial: (materialId: string, data: Partial<CreateMaterialData>) =>
    api.patch<StageMaterial>(`/projects/stages/materials/${materialId}`, data),

  deleteMaterial: (materialId: string) =>
    api.delete(`/projects/stages/materials/${materialId}`),

  addMedia: (projectId: string, stageId: string, data: CreateMediaData) =>
    api.post<StageMedia>(`/projects/${projectId}/stages/${stageId}/media`, data),

  updateMedia: (mediaId: string, data: Partial<CreateMediaData>) =>
    api.patch<StageMedia>(`/projects/stages/media/${mediaId}`, data),

  deleteMedia: (mediaId: string) => api.delete(`/projects/stages/media/${mediaId}`),

  addDocument: (projectId: string, stageId: string, data: CreateDocumentData) =>
    api.post<StageDocument>(`/projects/${projectId}/stages/${stageId}/documents`, data),

  updateDocument: (documentId: string, data: Partial<CreateDocumentData>) =>
    api.patch<StageDocument>(`/projects/stages/documents/${documentId}`, data),

  deleteDocument: (documentId: string) =>
    api.delete(`/projects/stages/documents/${documentId}`),
};

export type AdminProjectStage = {
  id: string;
  name: string;
  status: string;
  order: number;
  estimatedCost: number;
  actualCost?: number | null;
  estimatedDuration: string;
  startDate?: string | null;
  completionDate?: string | null;
  teamMembers?: StageTeamMember[];
  materials?: StageMaterial[];
  media?: StageMedia[];
  documents?: StageDocument[];
};

export type AdminProject = {
  id: string;
  name: string;
  address: string;
  status: string;
  progress: number;
  budget: number;
  spent: number;
  currentStage?: string | null;
  projectType?: string | null;
  managedByAdmin?: boolean;
  aiAnalysis?: Record<string, unknown> | null;
  homeowner?: { fullName?: string | null; email?: string | null } | null;
  generalContractor?: { fullName?: string | null; email?: string | null } | null;
  stages?: AdminProjectStage[];
};

export type UpdateStageDetailsPayload = {
  name?: string;
  description?: string;
  order?: number;
  estimatedCost?: number;
  actualCost?: number;
  estimatedDuration?: string;
  startDate?: string | null;
  completionDate?: string | null;
};

export type UpdateProjectScopePayload = {
  description?: string;
  scopeSummary?: string;
  rooms?: string[];
  features?: string[];
  materials?: string[];
  projectImageUrls?: string[];
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  floors?: number;
  estimatedDuration?: string;
};

export const adminProjectService = {
  getProject: (projectId: string) => api.get<AdminProject>(`/projects/${projectId}`),

  updateProject: (projectId: string, data: Record<string, unknown>) =>
    api.patch<AdminProject>(`/projects/${projectId}`, data),

  updateScope: (projectId: string, data: UpdateProjectScopePayload) =>
    api.patch<AdminProject>(`/projects/${projectId}/scope`, data),

  updateStageStatus: (
    projectId: string,
    stageId: string,
    status: 'not_started' | 'in_progress' | 'completed' | 'blocked',
  ) => api.patch(`/projects/${projectId}/stages/${stageId}`, { status }),

  updateStageDetails: (projectId: string, stageId: string, data: UpdateStageDetailsPayload) =>
    api.patch(`/projects/${projectId}/stages/${stageId}/details`, data),
};
