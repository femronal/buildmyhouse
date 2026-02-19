import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Platform } from 'react-native';

type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  pictureUrl?: string | null;
  role: string;
  verified: boolean;
  phone?: string | null;
  createdAt: string;
};

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
        // On web, multer expects an actual Blob/File part.
        const res = await fetch(file.uri);
        const blob = await res.blob();
        formData.append('file', blob, file.name);
      } else {
        // React Native FormData file type
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      }
      return api.post('/auth/me/picture', formData);
    },
    onMutate: async (file) => {
      await queryClient.cancelQueries({ queryKey: ['currentUser'] });
      const previous = queryClient.getQueryData<CurrentUser>(['currentUser']);
      if (previous) {
        // Optimistically show the selected image immediately
        queryClient.setQueryData<CurrentUser>(['currentUser'], {
          ...previous,
          pictureUrl: file.uri,
        });
      }
      return { previous };
    },
    onError: (_err, _file, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['currentUser'], ctx.previous);
      }
    },
    onSuccess: (updatedUser: CurrentUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

