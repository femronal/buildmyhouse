import { api } from '@/lib/api';

export interface DesignImage {
  url: string;
  label?: string;
  order?: number;
}

export interface Design {
  id: string;
  name: string;
  description?: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  squareMeters?: number;
  estimatedCost: number;
  floors?: number;
  estimatedDuration?: string;
  rooms?: string[];
  materials?: string[];
  features?: string[];
  constructionPhases?: any[];
  rating: number;
  reviews: number;
  images: DesignImage[];
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const designService = {
  /**
   * Get all designs (for explore page)
   */
  getAllDesigns: async (): Promise<Design[]> => {
    const response = await api.get('/designs');
    return response;
  },

  /**
   * Get a single design by ID
   */
  getDesignById: async (id: string): Promise<Design> => {
    const response = await api.get(`/designs/${id}`);
    return response;
  },
};

