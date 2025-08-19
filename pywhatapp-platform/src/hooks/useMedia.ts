import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, MediaFile } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

export function useMediaFiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['media-files', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MediaFile[];
    },
    enabled: !!user?.id
  });
}

export function useUploadMedia() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Determine file type
      let fileType = 'document';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type.startsWith('audio/')) fileType = 'audio';

      const { data, error } = await supabase.functions.invoke('media-upload', {
        body: {
          fileData: base64Data,
          fileName: file.name,
          fileType,
          userId: user.id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      toast.success('Dosya başarıyla yüklendi!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Dosya yüklenirken hata oluştu');
    }
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      toast.success('Dosya başarıyla silindi!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Dosya silinirken hata oluştu');
    }
  });
}

export function useMediaStats() {
  const { data: mediaFiles } = useMediaFiles();

  return {
    totalFiles: mediaFiles?.length || 0,
    images: mediaFiles?.filter(file => file.file_type === 'image').length || 0,
    videos: mediaFiles?.filter(file => file.file_type === 'video').length || 0,
    audios: mediaFiles?.filter(file => file.file_type === 'audio').length || 0,
    documents: mediaFiles?.filter(file => file.file_type === 'document').length || 0,
    totalSize: mediaFiles?.reduce((sum, file) => sum + file.file_size, 0) || 0
  };
}
