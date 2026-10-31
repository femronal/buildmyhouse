import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Platform } from 'react-native';
import { prepareImageForUpload } from '@/lib/image-upload';

type UploadProfilePictureInput = {
  uri: string;
  name: string;
  type: string;
};

export function useUploadProfilePicture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: UploadProfilePictureInput) => {
      let preparedFile = file;
      if ((file?.type || '').startsWith('image/')) {
        const prepared = await prepareImageForUpload({
          uri: file.uri,
          fileName: file.name,
          mimeType: file.type,
          name: file.name,
        });
        preparedFile = {
          uri: prepared.uri,
          name: prepared.fileName || file.name,
          type: prepared.mimeType || file.type,
        };
      }

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const res = await fetch(preparedFile.uri);
        const blob = await res.blob();
        formData.append('file', blob, preparedFile.name);
      } else {
        formData.append('file', {
          uri: preparedFile.uri,
          name: preparedFile.name,
          type: preparedFile.type,
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
