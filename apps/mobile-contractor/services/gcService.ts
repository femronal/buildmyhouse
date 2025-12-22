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
    console.log('🔄 [gcService] Fetching pending requests...');
    try {
      const response = await api.get('/contractors/requests/pending');
      console.log('✅ [gcService] Raw API response:', response);
      console.log('📦 [gcService] Response data:', response.data);
      console.log('📊 [gcService] Array length:', (response.data || response || []).length);
      const result = response.data || response || [];
      console.log('✅ [gcService] Returning:', result.length, 'requests');
      return result;
    } catch (error) {
      console.error('❌ [gcService] Error fetching pending requests:', error);
      return [];
    }
  },

  acceptRequest: async (requestId: string, data: AcceptRequestData) => {
    console.log('📤 [gcService] Accepting request:', requestId);
    console.log('📊 [gcService] Request data:', {
      estimatedBudget: data.estimatedBudget,
      estimatedDuration: data.estimatedDuration,
      gcNotesLength: data.gcNotes?.length || 0,
    });
    try {
      const endpoint = `/contractors/requests/${requestId}/accept`;
      console.log('🌐 [gcService] Calling endpoint:', endpoint);
      console.log('📦 [gcService] Sending data:', JSON.stringify(data, null, 2));
      
      const response = await api.post(endpoint, data);
      console.log('✅ [gcService] Accept response received:', response);
      console.log('✅ [gcService] Response type:', typeof response);
      console.log('✅ [gcService] Response keys:', Object.keys(response || {}));
      
      // Backend returns the data directly (NestJS wraps it)
      return response;
    } catch (error: any) {
      console.error('❌ [gcService] Accept error:', error);
      console.error('❌ [gcService] Error type:', typeof error);
      console.error('❌ [gcService] Error message:', error?.message);
      console.error('❌ [gcService] Error stack:', error?.stack);
      if (error?.response) {
        console.error('❌ [gcService] Error response:', error.response);
      }
      throw error;
    }
  },

  rejectRequest: async (requestId: string) => {
    return api.post(`/contractors/requests/${requestId}/reject`, {});
  },
};
