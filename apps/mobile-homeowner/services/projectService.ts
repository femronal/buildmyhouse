import { api } from '@/lib/api';

export interface RecommendedGC {
  id: string;
  userId: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  projects: number;
  verified: boolean;
  location: string;
  matchScore: number;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export const projectService = {
  /**
   * Get recommended GCs for a project
   */
  getRecommendedGCs: async (projectId: string): Promise<RecommendedGC[]> => {
    try {
      // API client returns response.json() which is the direct data from NestJS
      const response = await api.get(`/contractors/recommend/${projectId}`);
      
      // NestJS returns the array directly, not wrapped
      const gcList = Array.isArray(response) ? response : [];
      return gcList;
    } catch (error: any) {
      // Return empty array on error so UI doesn't break
      return [];
    }
  },

  /**
   * Send project requests to selected GCs
   */
  sendGCRequests: async (projectId: string, contractorIds: string[]) => {
    const response = await api.post('/contractors/requests/send', {
      projectId,
      contractorIds,
    });
    return response.data;
  },

  /**
   * Check if any GC has accepted the project
   */
  checkGCAcceptance: async (projectId: string) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      
      // Handle both direct response and nested data
      const project = response.data || response;
      const hasAccepted = !!project.generalContractorId;
      
      return {
        hasAcceptedGC: hasAccepted,
        project,
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Activate project (start building)
   */
  activateProject: async (projectId: string) => {
    const response = await api.patch(`/projects/${projectId}`, {
      status: 'active',
      startDate: new Date().toISOString(),
    });
    return response.data;
  },
};
