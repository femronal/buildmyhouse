import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ContractorCertification {
  id: string;
  name: string;
  fileUrl: string;
  documentType?: string | null;
  expiryYear?: string | null;
  createdAt: string;
}

export interface GCProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  pictureUrl?: string | null;
  verified: boolean;
  location?: string | null;
  specialty: string;
  experienceYears?: number | null;
  experience?: string | null;
  rating: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalEarnings: number;
  certifications?: ContractorCertification[];
  verificationRequiredDocuments?: Array<{
    type: string;
    title: string;
    description: string;
    uploaded: boolean;
    fileUrl?: string | null;
    expiryYear?: string | null;
    uploadedAt?: string | null;
  }>;
  verificationUploadedDocuments?: ContractorCertification[];
  verificationUploadedCount?: number;
  verificationRequiredCount?: number;
  verificationMissingDocuments?: string[];
  hasUploadedAllVerificationDocuments?: boolean;
}

export function useGCProfile() {
  return useQuery<GCProfile>({
    queryKey: ['gc-profile'],
    queryFn: () => api.get('/contractors/profile'),
    staleTime: 60 * 1000,
  });
}

export function useUpdateGCProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { experienceYears?: number }) =>
      api.patch('/contractors/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-profile'] });
    },
  });
}

export function useCreateCertification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; fileUrl: string; expiryYear?: string }) =>
      api.post('/contractors/certifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-profile'] });
    },
  });
}

export function useDeleteCertification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/contractors/certifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-profile'] });
    },
  });
}

export function useUpsertVerificationDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentType: string; fileUrl: string; expiryYear?: string }) =>
      api.post('/contractors/verification-documents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gc-profile'] });
    },
  });
}
