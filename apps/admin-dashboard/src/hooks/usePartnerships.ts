'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, auth } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export type PartnershipError = Error & { status?: number; body?: { leadId?: string; leadRef?: string; warning?: boolean; message?: string } };

async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.message === 'string' ? data.message : Array.isArray(data?.message) ? data.message.join(' ') : 'Could not save this.';
    const error = new Error(message) as PartnershipError;
    error.status = response.status;
    error.body = data;
    throw error;
  }
  return data as T;
}

function queryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

export function usePartnershipSummary(params: { ownerId?: string; category?: string }) {
  return useQuery({
    queryKey: ['partnerships-summary', params],
    queryFn: () => api.get<any>(`/admin/partnerships/summary${queryString(params)}`),
  });
}

export function usePartnershipToday(params: { ownerId?: string; category?: string }) {
  return useQuery({
    queryKey: ['partnerships-today', params],
    queryFn: () => api.get<any>(`/admin/partnerships/today${queryString(params)}`),
  });
}

export function usePartnershipLeads(params: { q?: string; stage?: string; status?: string; category?: string; ownerId?: string }) {
  return useQuery({
    queryKey: ['partnerships-leads', params],
    queryFn: () => api.get<any[]>(`/admin/partnerships/leads${queryString(params)}`),
  });
}

export function usePartnershipLead(id: string) {
  return useQuery({
    queryKey: ['partnerships-lead', id],
    queryFn: () => api.get<any>(`/admin/partnerships/leads/${id}`),
    enabled: !!id,
  });
}

export function usePartnershipOwners() {
  return useQuery({
    queryKey: ['partnerships-owners'],
    queryFn: () => api.get<{ id: string; fullName: string; email: string }[]>('/admin/partnerships/owners'),
  });
}

export function usePartnershipMutations(leadId?: string) {
  const client = useQueryClient();
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ['partnerships-summary'] });
    await client.invalidateQueries({ queryKey: ['partnerships-today'] });
    await client.invalidateQueries({ queryKey: ['partnerships-leads'] });
    if (leadId) await client.invalidateQueries({ queryKey: ['partnerships-lead', leadId] });
  };
  return {
    refresh,
    createLead: useMutation({ mutationFn: (body: unknown) => send<any>('POST', '/admin/partnerships/leads', body), onSuccess: refresh }),
    updateLead: useMutation({ mutationFn: ({ id, body }: { id: string; body: unknown }) => send('PATCH', `/admin/partnerships/leads/${id}`, body), onSuccess: refresh }),
    changeStage: useMutation({ mutationFn: ({ id, body }: { id: string; body: unknown }) => send('POST', `/admin/partnerships/leads/${id}/stage`, body), onSuccess: refresh }),
    logTouch: useMutation({ mutationFn: ({ id, body }: { id: string; body: unknown }) => send<any>('POST', `/admin/partnerships/leads/${id}/touches`, body), onSuccess: refresh }),
    addContact: useMutation({ mutationFn: ({ id, body }: { id: string; body: unknown }) => send('POST', `/admin/partnerships/leads/${id}/contacts`, body), onSuccess: refresh }),
    updateContact: useMutation({ mutationFn: ({ id, body }: { id: string; body: unknown }) => send('PATCH', `/admin/partnerships/contacts/${id}`, body), onSuccess: refresh }),
    addMeeting: useMutation({ mutationFn: ({ id, body }: { id: string; body: unknown }) => send('POST', `/admin/partnerships/leads/${id}/meetings`, body), onSuccess: refresh }),
    updateMeeting: useMutation({ mutationFn: ({ id, body }: { id: string; body: unknown }) => send('PATCH', `/admin/partnerships/meetings/${id}`, body), onSuccess: refresh }),
  };
}

export async function uploadPartnershipSheet(path: 'preview' | 'commit', file: File, payload?: unknown) {
  const form = new FormData();
  form.append('file', file);
  if (payload) form.append('payload', JSON.stringify(payload));
  const headers: Record<string, string> = {};
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/admin/partnerships/import/${path}`, { method: 'POST', headers, body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'The sheet could not be read.');
  return data;
}
