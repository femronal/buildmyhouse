import { api } from '@/lib/api';
import { Project } from '@buildmyhouse/shared-types';

export interface CreateProjectData {
  name: string;
  address: string;
  budget: number;
  startDate?: string;
  dueDate?: string;
  generalContractorId?: string;
}

export interface UpdateProjectData {
  name?: string;
  address?: string;
  budget?: number;
  spent?: number;
  progress?: number;
  currentStage?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  startDate?: string;
  dueDate?: string;
  generalContractorId?: string;
}

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    return api.get('/projects');
  },

  getProject: async (id: string): Promise<Project> => {
    return api.get(`/projects/${id}`);
  },

  createProject: async (data: CreateProjectData): Promise<Project> => {
    return api.post('/projects', data);
  },

  updateProject: async (id: string, data: UpdateProjectData): Promise<Project> => {
    return api.patch(`/projects/${id}`, data);
  },

  deleteProject: async (id: string): Promise<void> => {
    return api.delete(`/projects/${id}`);
  },
};