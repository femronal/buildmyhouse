import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Platform } from 'react-native';
import { ensureImageWithinUploadLimit } from '@/lib/image-upload';

type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  pictureUrl?: string | null;
  role: string;
  verified: boolean;
  profileSetupCompleted?: boolean;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  homeownerTermsAcceptedAt?: string | null;
  gcTermsAcceptedAt?: string | null;
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
      let preparedFile = file;
      if ((file?.type || '').startsWith('image/')) {
        const prepared = await ensureImageWithinUploadLimit({
          uri: file.uri,
          fileName: file.name,
          mimeType: file.type,
          name: file.name,
        });
        if (prepared.exceedsLimit) {
          throw new Error('Image too large. Please choose an image below 50MB.');
        }
        preparedFile = {
          uri: prepared.asset.uri,
          name: prepared.asset.fileName || file.name,
          type: prepared.asset.mimeType || file.type,
        };
      }

      const formData = new FormData();
      if (Platform.OS === 'web') {
        // On web, multer expects an actual Blob/File part.
        const res = await fetch(preparedFile.uri);
        const blob = await res.blob();
        formData.append('file', blob, preparedFile.name);
      } else {
        // React Native FormData file type
        formData.append('file', {
          uri: preparedFile.uri,
          name: preparedFile.name,
          type: preparedFile.type,
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

