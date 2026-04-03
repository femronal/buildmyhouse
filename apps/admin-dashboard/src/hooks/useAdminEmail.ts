import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AdminEmailAudience =
  | 'all_users'
  | 'all_gcs'
  | 'all_homeowners'
  | 'specific_users';

export type SendBulkEmailPayload = {
  audience: AdminEmailAudience;
  subject: string;
  html?: string;
  text?: string;
  recipients?: string[];
};

export type SendBulkEmailResult = {
  audience: AdminEmailAudience;
  totalRecipients: number;
  sent: number;
  failed: number;
  failedRecipients: string[];
};

export type AudienceCounts = {
  allUsers: number;
  allGcs: number;
  allHomeowners: number;
};

export function useAdminEmailAudienceCounts() {
  return useQuery({
    queryKey: ['admin-email-audience-counts'],
    queryFn: () => api.get<AudienceCounts>('/admin/emails/audience-counts'),
    refetchOnWindowFocus: true,
  });
}

export function useSendBulkEmail() {
  return useMutation({
    mutationFn: (payload: SendBulkEmailPayload) =>
      api.post<SendBulkEmailResult>('/admin/emails/send', payload),
  });
}

