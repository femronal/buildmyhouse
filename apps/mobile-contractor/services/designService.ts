import { api } from '@/lib/api';
import { Platform } from 'react-native';

export interface DesignImage {
  url: string;
  label?: string;
  order?: number;
}

export interface CreateDesignData {
  name: string;
  description?: string;
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
   * Create a new design with images
   */
  createDesign: async (designData: CreateDesignData, imageUris: Array<{ uri: string; label?: string }>) => {
    const formData = new FormData();
    
    // Add design data fields
    formData.append('name', designData.name);
    if (designData.description) {
      formData.append('description', designData.description);
    }
    formData.append('bedrooms', designData.bedrooms.toString());
    formData.append('bathrooms', designData.bathrooms.toString());
    formData.append('squareFootage', designData.squareFootage.toString());
    formData.append('estimatedCost', designData.estimatedCost.toString());
    if (designData.floors) {
      formData.append('floors', designData.floors.toString());
    }
    if (designData.estimatedDuration) {
      formData.append('estimatedDuration', designData.estimatedDuration);
    }
    if (designData.rooms) {
      formData.append('rooms', designData.rooms);
    }
    if (designData.materials) {
      formData.append('materials', designData.materials);
    }
    if (designData.features) {
      formData.append('features', designData.features);
    }
    if (designData.constructionPhases) {
      formData.append('constructionPhases', designData.constructionPhases);
    }

    // For React Native, append images with uri, type, and name
    // Handle web and native platforms differently
    for (let index = 0; index < imageUris.length; index++) {
      const img = imageUris[index];
      
      // Extract filename from URI (handle both file:// and http:// URIs)
      let filename = img.uri.split('/').pop() || `image-${Date.now()}.jpg`;
      
      // Remove query parameters if any
      filename = filename.split('?')[0];
      
      // Determine MIME type from extension or default to jpeg
      const match = /\.(\w+)$/.exec(filename);
      let type = 'image/jpeg'; // default
      if (match) {
        const ext = match[1].toLowerCase();
        if (ext === 'png') type = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
        else if (ext === 'webp') type = 'image/webp';
      }
      
      // For web platform, we need to fetch and convert to Blob/File
      if (Platform.OS === 'web') {
        try {
          const response = await fetch(img.uri);
          const blob = await response.blob();
          const file = new File([blob], filename || `image-${Date.now()}-${index}.jpg`, { type });
          
          formData.append('images', file);
        } catch (error) {
          console.error(`❌ [designService] Failed to process image ${index + 1}:`, error);
          // Fallback to native format
          formData.append('images', {
            uri: img.uri,
            type,
            name: filename || `image-${Date.now()}-${index}.jpg`,
          } as any);
        }
      } else {
        // Native platform - use React Native FormData format
        const imageData = {
          uri: img.uri,
          type,
          name: filename || `image-${Date.now()}-${index}.jpg`,
        };
        
        formData.append('images', imageData as any);
      }
      
      // Add label if provided
      if (img.label) {
        formData.append('imageLabels', img.label);
      }
    }

    try {
      const response = await api.post('/designs', formData);
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

