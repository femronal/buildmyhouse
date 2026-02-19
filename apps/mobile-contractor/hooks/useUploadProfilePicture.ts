import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Platform } from 'react-native';

type UploadProfilePictureInput = {
  uri: string;
  name: string;
  type: string;
};

export function useUploadProfilePicture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: UploadProfilePictureInput) => {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const res = await fetch(file.uri);
        const blob = await res.blob();
        formData.append('file', blob, file.name);
      } else {
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      }
      return api.post('/auth/me/picture', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['gc-profile'] });
    },
  });
}
