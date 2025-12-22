import { api } from '@/lib/api';

export interface UploadPlanData {
  name: string;
  address: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  budget: number;
}

export const planService = {
  /**
   * Upload plan PDF and process with AI
   */
  uploadPlan: async (planData: UploadPlanData, pdfFile: any) => {
    const formData = new FormData();
    
    console.log('📄 PDF File object:', pdfFile);
    console.log('📄 PDF File URI:', pdfFile.uri);
    console.log('📄 PDF File name:', pdfFile.name);
    
    // Add PDF file - backend expects field name 'planPdf'
    // For React Native web, expo-document-picker returns a file object
    // We need to fetch the file and create a proper File/Blob
    let fileToUpload: File | Blob;
    
    try {
      if (pdfFile.uri) {
        // Fetch the file from the URI
        const response = await fetch(pdfFile.uri);
        const blob = await response.blob();
        // Create a File object with the correct name and type
        fileToUpload = new File([blob], pdfFile.name || 'plan.pdf', { 
          type: 'application/pdf' 
        });
        console.log('✅ Created File object from URI');
      } else if (pdfFile instanceof File) {
        // Already a File object
        fileToUpload = pdfFile;
        console.log('✅ Using existing File object');
      } else if (pdfFile instanceof Blob) {
        // Convert Blob to File
        fileToUpload = new File([pdfFile], pdfFile.name || 'plan.pdf', { 
          type: 'application/pdf' 
        });
        console.log('✅ Converted Blob to File');
      } else {
        // Fallback: try to use as-is
        fileToUpload = pdfFile as any;
        console.log('⚠️ Using file as-is (may not work)');
      }
    } catch (error) {
      console.error('❌ Error preparing file:', error);
      throw new Error('Failed to prepare PDF file for upload');
    }
    
    formData.append('planPdf', fileToUpload);

    // Add plan data as strings (FormData only accepts strings)
    // Backend will transform them to numbers using @Type(() => Number)
    formData.append('name', planData.name);
    formData.append('address', planData.address);
    
    if (planData.street) formData.append('street', planData.street);
    if (planData.city) formData.append('city', planData.city);
    if (planData.state) formData.append('state', planData.state);
    if (planData.zipCode) formData.append('zipCode', planData.zipCode);
    if (planData.country) formData.append('country', planData.country);
    
    // Convert numbers to strings for FormData
    // Backend ValidationPipe with transform:true will convert them back
    if (planData.latitude !== undefined && planData.latitude !== null) {
      formData.append('latitude', planData.latitude.toString());
    }
    if (planData.longitude !== undefined && planData.longitude !== null) {
      formData.append('longitude', planData.longitude.toString());
    }
    formData.append('budget', planData.budget.toString());

    console.log('📤 FormData prepared:');
    console.log('  - planPdf:', fileToUpload.name, fileToUpload.size, 'bytes');
    console.log('  - name:', planData.name);
    console.log('  - budget:', planData.budget.toString());
    console.log('  - latitude:', planData.latitude?.toString());
    console.log('  - longitude:', planData.longitude?.toString());

    // For FormData, don't set Content-Type header - browser will set it automatically with boundary
    const response = await api.post('/plans/upload', formData);
    
    console.log('📥 Upload response:', response);
    
    // Response structure: { project: { id, ... }, aiAnalysis: {...} }
    return response;
  },

  /**
   * Get project with AI analysis
   */
  getProjectAnalysis: async (projectId: string) => {
    const response = await api.get(`/plans/${projectId}/analysis`);
    // Backend returns the project directly, not wrapped in data
    return response;
  },
};
