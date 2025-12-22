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
    planPdfUrl: string;
    aiAnalysis: any;
    homeowner: {
      id: string;
      fullName: string;
      email: string;
      phone: string;
    };
  };
}

export interface AcceptRequestData {
  estimatedBudget?: number;
  estimatedDuration?: string;
  gcNotes?: string;
}

export const gcService = {
  /**
   * Get pending requests for the current GC
   */
  getPendingRequests: async (): Promise<PendingRequest[]> => {
    try {
      const response = await api.get('/contractors/requests/pending');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return []; // Return empty array on error
    }
  },

  /**
   * Accept a project request
   */
  acceptRequest: async (requestId: string, data: AcceptRequestData) => {
    const response = await api.post(`/contractors/requests/${requestId}/accept`, data);
    return response.data;
  },

  /**
   * Reject a project request
   */
  rejectRequest: async (requestId: string, reason?: string) => {
    const response = await api.post(`/contractors/requests/${requestId}/reject`, {
      reason,
    });
    return response.data;
  },
};
