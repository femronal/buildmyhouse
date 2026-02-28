import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type UnverifiedGC = {
  id: string;
  userId: string;
  name: string;
  verified?: boolean;
  specialty: string;
  location?: string | null;
  email?: string;
  user?: { id: string; fullName: string; email: string; phone?: string | null };
  createdAt: string;
  documents: string[];
  hasUploadedAllVerificationDocuments: boolean;
  uploadedRequiredDocumentCount: number;
  requiredDocumentCount: number;
  missingRequiredDocuments: string[];
  verificationDocuments: Array<{
    type: string;
    title: string;
    description: string;
    uploaded: boolean;
    fileUrl?: string | null;
    expiryYear?: string | null;
    uploadedAt?: string | null;
  }>;
};

export function useUnverifiedGCs() {
  return useQuery({
    queryKey: ['admin-unverified-gcs'],
    queryFn: () => api.get<UnverifiedGC[]>('/contractors/admin/unverified-gcs'),
  });
}

export function useVerifyGC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.post(`/contractors/admin/${userId}/verify`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-unverified-gcs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contractors'] });
    },
  });
}
