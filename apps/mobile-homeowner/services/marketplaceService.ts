import { api } from '@/lib/api';

export interface Material {
  id: string;
  name: string;
  brand: string;
  description?: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  rating: number;
  reviews: number;
  verified: boolean;
  imageUrl?: string;
  vendor: {
    id: string;
    fullName: string;
  };
  createdAt: string;
}

export interface Contractor {
  id: string;
  userId: string;
  name: string;
  specialty: string;
  description?: string;
  location?: string;
  rating: number;
  reviews: number;
  projects: number;
  verified: boolean;
  imageUrl?: string;
  hiringFee: number;
  type: string;
  user: {
    id: string;
    email: string;
    phone?: string;
  };
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  user: {
    id: string;
    fullName: string;
  };
  createdAt: string;
}

export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: 'price' | 'rating' | 'reviews' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const marketplaceService = {
  // Materials
  getMaterials: async (params: SearchParams = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    return api.get(`/marketplace/materials?${queryParams.toString()}`);
  },

  getMaterial: async (id: string): Promise<Material> => {
    return api.get(`/marketplace/materials/${id}`);
  },

  // Contractors
  getContractors: async (params: SearchParams = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    return api.get(`/marketplace/contractors?${queryParams.toString()}`);
  },

  getContractor: async (id: string): Promise<Contractor> => {
    return api.get(`/marketplace/contractors/${id}`);
  },

  // Search
  search: async (params: SearchParams) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    return api.get(`/marketplace/search?${queryParams.toString()}`);
  },

  getSearchSuggestions: async (query: string) => {
    return api.get(`/marketplace/search/suggestions?query=${encodeURIComponent(query)}`);
  },

  getPopularItems: async () => {
    return api.get('/marketplace/search/popular');
  },

  // Reviews
  createReview: async (data: {
    materialId?: string;
    contractorId?: string;
    rating: number;
    comment?: string;
  }) => {
    return api.post('/marketplace/reviews', data);
  },

  getMaterialReviews: async (materialId: string, page: number = 1) => {
    return api.get(`/marketplace/reviews/material/${materialId}?page=${page}`);
  },

  getContractorReviews: async (contractorId: string, page: number = 1) => {
    return api.get(`/marketplace/reviews/contractor/${contractorId}?page=${page}`);
  },
};


