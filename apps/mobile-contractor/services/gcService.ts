import { api } from '@/lib/api';

export interface PendingRequest {
  id: string;
  projectId: string;
  status: string;
  sentAt: string;
  project: {
    id: string;
    name: string;
    address: string;
    budget: number;
    planPdfUrl?: string;
    planFileName?: string;
    aiAnalysis?: any;
    homeowner: {
      id: string;
      fullName: string;
      email: string;
      phone?: string;
    };
  };
}

export interface AcceptRequestData {
  estimatedBudget?: number;
  estimatedDuration?: string;
  gcNotes?: string;
}

export const gcService = {
  getPendingRequests: async (): Promise<PendingRequest[]> => {
    try {
      const response = await api.get('/contractors/requests/pending');
      const result = response.data || response || [];
      return result;
    } catch (error) {
      console.error('❌ [gcService] Error fetching pending requests:', error);
      return [];
    }
  },

  acceptRequest: async (requestId: string, data: AcceptRequestData) => {
    try {
      const endpoint = `/contractors/requests/${requestId}/accept`;
      const response = await api.post(endpoint, data);
      // Backend returns the data directly (NestJS wraps it)
      return response;
    } catch (error: any) {
      console.error('❌ [gcService] Accept error:', error);
      if (error?.response) {
        console.error('❌ [gcService] Error response:', error.response);
      }
      throw error;
    }
  },

  rejectRequest: async (requestId: string) => {
    return api.post(`/contractors/requests/${requestId}/reject`, {});
  },

  getEarnings: async (): Promise<GCEarningsProject[]> => {
    const response = await api.get('/contractors/earnings');
    return Array.isArray(response) ? response : [];
  },
};

export interface GCEarningsProject {
  id: string;
  name: string;
  status: string;
  budget: number;
  earned: number;
  pending: number;
  progress: number;
  currentStage?: string;
  dueDate?: string;
  startDate?: string;
  clientName: string;
  materialsTotal: number;
  teamTotal: number;
  recordedCosts: number;
  stageBreakdown: Array<{ name: string; estimatedCost: number; status: string }>;
  payments: Array<{ id: string; amount: number; method: string; stageId: string | null; createdAt: string }>;
}



