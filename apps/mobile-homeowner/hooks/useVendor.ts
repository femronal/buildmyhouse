import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorService, CreateMaterialData } from '@/services/vendorService';

export function useMyMaterials() {
  return useQuery({
    queryKey: ['my-materials'],
    queryFn: () => vendorService.getMyMaterials(),
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMaterialData) => vendorService.createMaterial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateMaterialData> }) => 
      vendorService.updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vendorService.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}
