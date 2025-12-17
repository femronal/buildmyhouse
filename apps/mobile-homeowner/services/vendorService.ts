import { api } from '@/lib/api';

export interface CreateMaterialData {
  name: string;
  brand: string;
  description?: string;
  category: string;
  price: number;
  unit: string;
  stock?: number;
  imageUrl?: string;
}

export const vendorService = {
  // Create material
  createMaterial: async (data: CreateMaterialData) => {
    return api.post('/marketplace/materials', data);
  },

  // Get vendor's materials
  getMyMaterials: async () => {
    return api.get('/marketplace/materials/vendor/my');
  },

  // Update material
  updateMaterial: async (id: string, data: Partial<CreateMaterialData>) => {
    return api.patch(`/marketplace/materials/${id}`, data);
  },

  // Delete material
  deleteMaterial: async (id: string) => {
    return api.delete(`/marketplace/materials/${id}`);
  },
};
