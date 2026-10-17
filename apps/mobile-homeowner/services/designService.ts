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
  planType?: 'homebuilding' | 'renovation' | 'interior_design';
  projectTypeTag?: 'repair' | 'upgrades' | 'renovation' | 'full_builds';
  projectTypeFilter?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFootage?: number | null;
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
    pictureUrl?: string | null;
    contractorProfile?: {
      id: string;
      name: string;
      specialty?: string | null;
      description?: string | null;
      location?: string | null;
      rating?: number | null;
      reviews?: number | null;
      projects?: number | null;
      verified?: boolean | null;
      imageUrl?: string | null;
    } | null;
  };
  createdAt: string;
  updatedAt: string;
}

export type DesignCardPage = {
  items: Design[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  serverFiltered: boolean;
};

export const designService = {
  /**
   * Get all designs (for explore page)
   */
  getAllDesigns: async (): Promise<Design[]> => {
    const response = await api.get('/designs');
    return response;
  },

  listCatalog: async (params: {
    page: number;
    limit: number;
    tab: string;
    q?: string;
    location?: string;
    tag?: string;
  }): Promise<DesignCardPage> => {
    const search = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
      tab: params.tab,
    });
    if (params.q?.trim()) search.set('q', params.q.trim());
    if (params.location?.trim()) search.set('location', params.location.trim());
    if (params.tag?.trim()) search.set('tag', params.tag.trim());
    const response = await api.get(`/designs?${search.toString()}`);
    if (Array.isArray(response)) {
      return {
        items: response,
        page: 1,
        limit: response.length,
        total: response.length,
        hasMore: false,
        serverFiltered: false,
      };
    }
    return { ...response, serverFiltered: true };
  },

  /**
   * Get a single design by ID
   */
  getDesignById: async (id: string): Promise<Design> => {
    const response = await api.get(`/designs/${id}`);
    return response;
  },
};

