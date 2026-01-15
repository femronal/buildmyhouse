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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface StageMedia {
  id: string;
  stageId: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  order: number;
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamMemberData {
  name: string;
  role: string;
  phone?: string;
  email?: string;
  dailyRate?: number;
  rateType?: 'daily' | 'hourly' | 'fixed';
  startDate?: Date;
  endDate?: Date;
  photoUrl?: string;
  invoiceUrl?: string;
  notes?: string;
}

export interface CreateMaterialData {
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  supplier?: string;
  supplierContact?: string;
  receiptUrl?: string;
  photoUrl?: string;
  deliveryDate?: Date;
  notes?: string;
}

export interface CreateMediaData {
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  order?: number;
}

export interface CreateDocumentData {
  type: 'receipt' | 'invoice' | 'contract' | 'other';
  name: string;
  url: string;
  category?: 'team' | 'material' | 'general';
  relatedId?: string;
  notes?: string;
}

export const stageDocumentationService = {
  // Team Members
  addTeamMember: async (projectId: string, stageId: string, data: CreateTeamMemberData): Promise<StageTeamMember> => {
    const response = await api.post(`/projects/${projectId}/stages/${stageId}/team-members`, data);
    return response;
  },

  getTeamMembers: async (projectId: string, stageId: string): Promise<StageTeamMember[]> => {
    const response = await api.get(`/projects/${projectId}/stages/${stageId}/team-members`);
    return Array.isArray(response) ? response : (response.data || []);
  },

  updateTeamMember: async (teamMemberId: string, data: Partial<CreateTeamMemberData>): Promise<StageTeamMember> => {
    const response = await api.patch(`/projects/stages/team-members/${teamMemberId}`, data);
    return response;
  },

  deleteTeamMember: async (teamMemberId: string): Promise<void> => {
    await api.delete(`/projects/stages/team-members/${teamMemberId}`);
  },

  // Materials
  addMaterial: async (projectId: string, stageId: string, data: CreateMaterialData): Promise<StageMaterial> => {
    const response = await api.post(`/projects/${projectId}/stages/${stageId}/materials`, data);
    return response;
  },

  getMaterials: async (projectId: string, stageId: string): Promise<StageMaterial[]> => {
    const response = await api.get(`/projects/${projectId}/stages/${stageId}/materials`);
    return Array.isArray(response) ? response : (response.data || []);
  },

  updateMaterial: async (materialId: string, data: Partial<CreateMaterialData>): Promise<StageMaterial> => {
    const response = await api.patch(`/projects/stages/materials/${materialId}`, data);
    return response;
  },

  deleteMaterial: async (materialId: string): Promise<void> => {
    try {
      await api.delete(`/projects/stages/materials/${materialId}`);
    } catch (error: any) {
      console.error('❌ [stageDocumentationService] Delete failed:', error);
      throw error;
    }
  },

  // Media
  addMedia: async (projectId: string, stageId: string, data: CreateMediaData): Promise<StageMedia> => {
    const response = await api.post(`/projects/${projectId}/stages/${stageId}/media`, data);
    return response;
  },

  getMedia: async (projectId: string, stageId: string): Promise<StageMedia[]> => {
    const response = await api.get(`/projects/${projectId}/stages/${stageId}/media`);
    return Array.isArray(response) ? response : (response.data || []);
  },

  updateMedia: async (mediaId: string, data: Partial<CreateMediaData>): Promise<StageMedia> => {
    const response = await api.patch(`/projects/stages/media/${mediaId}`, data);
    return response;
  },

  deleteMedia: async (mediaId: string): Promise<void> => {
    await api.delete(`/projects/stages/media/${mediaId}`);
  },

  // Documents
  addDocument: async (projectId: string, stageId: string, data: CreateDocumentData): Promise<StageDocument> => {
    const response = await api.post(`/projects/${projectId}/stages/${stageId}/documents`, data);
    return response;
  },

  getDocuments: async (projectId: string, stageId: string): Promise<StageDocument[]> => {
    const response = await api.get(`/projects/${projectId}/stages/${stageId}/documents`);
    return Array.isArray(response) ? response : (response.data || []);
  },

  updateDocument: async (documentId: string, data: Partial<CreateDocumentData>): Promise<StageDocument> => {
    const response = await api.patch(`/projects/stages/documents/${documentId}`, data);
    return response;
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await api.delete(`/projects/stages/documents/${documentId}`);
  },
};

