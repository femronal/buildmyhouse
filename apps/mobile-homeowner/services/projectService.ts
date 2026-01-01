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
   * Get a single project by ID
   */
  getProject: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}`);
    // API returns the project directly
    return response;
  },

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

  /**
   * Save project for later (pending payment)
   */
  saveProjectForLater: async (projectId: string, projectData: any) => {
    // Use PATCH endpoint to update project status to pending_payment
    const response = await api.patch(`/projects/${projectId}`, {
      status: 'pending_payment',
    });
    return response.data;
  },

  /**
   * Get pending projects (projects waiting for payment)
   */
  getPendingProjects: async () => {
    const response = await api.get('/projects?status=pending_payment');
    return response.data || response;
  },

  /**
   * Get active projects (projects that have been paid for)
   */
  getActiveProjects: async () => {
    const response = await api.get('/projects?status=active');
    return response.data || response;
  },

  /**
   * Delete pending project
   */
  deletePendingProject: async (projectId: string) => {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  },

  /**
   * Create project from design and send request to GC
   */
  createProjectFromDesign: async (data: {
    designId: string;
    address: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    console.log('📤 [projectService] Creating project from design:', data);
    try {
      const response = await api.post('/projects/from-design', data);
      console.log('✅ [projectService] Project created successfully:', response);
      return response.data || response;
    } catch (error: any) {
      console.error('❌ [projectService] Error creating project from design:', error);
      throw error;
    }
  },
};
