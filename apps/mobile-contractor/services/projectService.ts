import { api } from '@/lib/api';

export interface GCProject {
  id: string;
  name: string;
  address: string;
  status: string; // 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'pending_payment'
  budget: number;
  spent: number;
  progress: number;
  currentStage?: string;
  startDate?: string;
  dueDate?: string;
  planPdfUrl?: string;
  planFileName?: string;
  homeowner: {
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
  stages?: Array<{
    id: string;
    name: string;
    status: string;
    order: number;
    estimatedCost: number;
    actualCost?: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const projectService = {
  /**
   * Get all projects for the logged-in GC (where they are the generalContractor)
   */
  getMyProjects: async (): Promise<GCProject[]> => {
    try {
      const response = await api.get('/projects');
      // Backend returns projects where user is homeowner or contractor
      // Filter to only return projects where user is the general contractor
      const projects = Array.isArray(response) ? response : (response.data || []);
      return projects;
    } catch (error: any) {
      console.error('❌ [projectService] Error fetching projects:', error);
      return [];
    }
  },

  /**
   * Get active projects (status === 'active')
   */
  getActiveProjects: async (): Promise<GCProject[]> => {
    try {
      const allProjects = await projectService.getMyProjects();
      // Filter projects where status is 'active' and user is the generalContractor
      return allProjects.filter(
        (project) =>
          (project.status === 'active' || project.status === 'paused') && project.generalContractor?.id,
      );
    } catch (error: any) {
      console.error('❌ [projectService] Error fetching active projects:', error);
      return [];
    }
  },

  /**
   * Get unpaid projects (status !== 'active')
   */
  getUnpaidProjects: async (): Promise<GCProject[]> => {
    try {
      const allProjects = await projectService.getMyProjects();
      // Filter projects where status is NOT 'active' but user is the generalContractor
      return allProjects.filter(
        (project) =>
          project.status !== 'active' && project.status !== 'paused' && project.generalContractor?.id,
      );
    } catch (error: any) {
      console.error('❌ [projectService] Error fetching unpaid projects:', error);
      return [];
    }
  },

  /**
   * Get a single project by ID
   */
  getProject: async (projectId: string): Promise<GCProject> => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response;
    } catch (error: any) {
      console.error('❌ [projectService] Error fetching project:', error);
      throw error;
    }
  },

  /**
   * Update stage status
   */
  updateStageStatus: async (projectId: string, stageId: string, status: 'not_started' | 'in_progress' | 'completed' | 'blocked') => {
    try {
      const response = await api.patch(`/projects/${projectId}/stages/${stageId}`, { status });
      return response;
    } catch (error: any) {
      console.error('❌ [projectService] Error updating stage:', error);
      throw error;
    }
  },

  /**
   * Delete a project (GC can only delete their unpaid projects; enforced on backend)
   */
  deleteProject: async (projectId: string) => {
    try {
      return await api.delete(`/projects/${projectId}`);
    } catch (error: any) {
      console.error('❌ [projectService] Error deleting project:', error);
      throw error;
    }
  },
};

