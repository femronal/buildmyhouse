import { api } from '@/lib/api';

export interface ProjectRequest {
  id: string;
  projectId: string;
  contractorId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  estimatedBudget?: number;
  estimatedDuration?: string;
  gcNotes?: string;
  sentAt: string;
  respondedAt?: string;
  project?: {
    id: string;
    name: string;
    address: string;
    budget: number;
    homeowner?: {
      id: string;
      fullName: string;
      email: string;
      phone?: string;
    };
    generalContractor?: {
      id: string;
      fullName: string;
      email: string;
      phone?: string;
    };
  };
  contractor?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface AcceptedContractor {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  imageUrl?: string;
  specialty?: string;
  type?: string;
  projectId: string;
  projectName: string;
  requestId?: string;
}

export const requestService = {
  /**
   * Get sent requests by GC (requests sent by the GC that are pending)
   */
  getSentRequests: async (): Promise<ProjectRequest[]> => {
    try {
      const response = await api.get('/contractors/requests/sent');
      return Array.isArray(response) ? response : (response.data || []);
    } catch (error: any) {
      console.error('❌ [requestService] Error fetching sent requests:', error);
      return [];
    }
  },

  /**
   * Get accepted counterparts for GC (homeowners)
   */
  getAcceptedContractors: async (): Promise<AcceptedContractor[]> => {
    try {
      const response = await api.get('/contractors/requests/accepted');
      return Array.isArray(response) ? response : (response.data || []);
    } catch (error: any) {
      console.error('❌ [requestService] Error fetching accepted contractors:', error);
      return [];
    }
  },

  // Subcontractor/vendor request flows removed for MVP

  /**
   * Delete a rejected request (GC only)
   */
  deleteRequest: async (requestId: string) => {
    try {
      const response = await api.delete(`/contractors/requests/${requestId}`);
      return response;
    } catch (error: any) {
      console.error('❌ [requestService] Error deleting request:', error);
      throw error;
    }
  },

  // Subcontractor accepted-projects flow removed for MVP
};

