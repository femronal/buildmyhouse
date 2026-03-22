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
    mutationFn: async ({
      userId,
      verified,
      force,
    }: {
      userId: string;
      verified: boolean;
      force?: boolean;
    }) => {
      try {
        return await api.patch(`/contractors/admin/${userId}/verification`, {
          verified,
          force: !!force,
        });
      } catch (error: any) {
        const message = String(error?.message || '');
        const endpointMissing =
          message.includes('Cannot PATCH') || message.includes('404');

        if (endpointMissing && verified) {
          try {
            // Legacy backend compatibility.
            return await api.post(`/contractors/admin/${userId}/verify`, {
              force: !!force,
            });
          } catch {
            // Continue to next fallback below.
          }
        }

        if (endpointMissing && !verified) {
          try {
            // Newer generic users endpoint fallback.
            return await api.patch(`/users/${userId}/verification`, { verified });
          } catch {
            // Continue to next fallback below.
          }
        }

        if (endpointMissing && !verified) {
          throw new Error(
            'Disapprove requires the latest backend version. Deploy backend updates and try again.',
          );
        }

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-unverified-gcs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contractors'] });
      queryClient.invalidateQueries({ queryKey: ['gc-profile'] });
    },
  });
}
