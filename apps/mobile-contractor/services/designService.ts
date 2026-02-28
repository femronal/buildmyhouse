import { api } from '@/lib/api';
import { uploadFile } from '@/utils/fileUpload';

export interface DesignImage {
  url: string;
  label?: string;
  order?: number;
}

export interface CreateDesignData {
  name: string;
  description?: string;
  planType?: 'homebuilding' | 'renovation' | 'interior_design';
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  estimatedCost: number;
  floors?: number;
  estimatedDuration?: string;
  rooms?: string;
  materials?: string;
  features?: string;
  constructionPhases?: string;
  images: Array<{ uri: string; label?: string; order?: number }>;
}

export const designService = {
  /**
   * Create a new design with images.
   * Uploads images first, then sends JSON to backend (which expects proper types).
   */
  createDesign: async (designData: CreateDesignData, imageUris: Array<{ uri: string; label?: string }>) => {
    // 1. Upload each image to /upload/image and collect URLs
    const imageResults: Array<{ url: string; label?: string; order: number }> = [];
    for (let i = 0; i < imageUris.length; i++) {
      const img = imageUris[i];
      const uploadedUrl = await uploadFile(img.uri, 'image');
      // Backend returns full URL; store path for portability (backend serves from /uploads)
      const urlPath = uploadedUrl.startsWith('http') ? new URL(uploadedUrl).pathname : uploadedUrl;
      imageResults.push({
        url: urlPath,
        label: img.label || `Image ${i + 1}`,
        order: i,
      });
    }

    // 2. Build JSON payload with correct types (numbers, not strings)
    const payload = {
      name: designData.name.trim(),
      description: designData.description?.trim() || undefined,
      planType: designData.planType || 'homebuilding',
      bedrooms: Number(designData.bedrooms),
      bathrooms: Number(designData.bathrooms),
      squareFootage: Number(designData.squareFootage),
      estimatedCost: Number(designData.estimatedCost),
      floors: designData.floors ? Number(designData.floors) : undefined,
      estimatedDuration: designData.estimatedDuration?.trim() || undefined,
      rooms: designData.rooms?.trim() || undefined,
      materials: designData.materials?.trim() || undefined,
      features: designData.features?.trim() || undefined,
      constructionPhases: designData.constructionPhases?.trim() || undefined,
      images: imageResults,
    };

    try {
      const response = await api.post('/designs', payload);
      return response;
    } catch (error: any) {
      console.error('❌ [designService] Error creating design:', error);
      throw error;
    }
  },

  /**
   * Get all designs (for homeowner explore page)
   */
  getAllDesigns: async () => {
    const response = await api.get('/designs');
    return response;
  },

  /**
   * Get my designs (for GC)
   */
  getMyDesigns: async () => {
    const response = await api.get('/designs/my-designs');
    return response;
  },

  /**
   * Delete a design
   */
  deleteDesign: async (designId: string) => {
    try {
      const response = await api.delete(`/designs/${designId}`);
      return response;
    } catch (error: any) {
      console.error('❌ [designService] Error deleting design:', error);
      throw error;
    }
  },

  /**
   * Update a design
   */
  updateDesign: async (designId: string, updateData: {
    name?: string;
    description?: string;
    planType?: 'homebuilding' | 'renovation' | 'interior_design';
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    estimatedCost?: number;
    isActive?: boolean;
  }) => {
    const response = await api.patch(`/designs/${designId}`, updateData);
    return response;
  },
};

