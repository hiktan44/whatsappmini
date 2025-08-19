import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Contact, ContactGroup } from '@/lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

// Contact Hooks
export function useContacts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!user?.id
  });
}

export function useCreateContact() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactData: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contactData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Kişi başarıyla eklendi!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kişi eklenirken hata oluştu');
    }
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Contact> }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Kişi başarıyla güncellendi!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kişi güncellenirken hata oluştu');
    }
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Kişi başarıyla silindi!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kişi silinirken hata oluştu');
    }
  });
}

// Contact Groups Hooks
export function useContactGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contact-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('contact_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContactGroup[];
    },
    enabled: !!user?.id
  });
}

export function useCreateContactGroup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupData: Omit<ContactGroup, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('contact_groups')
        .insert({
          ...groupData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
      toast.success('Grup başarıyla oluşturuldu!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Grup oluşturulurken hata oluştu');
    }
  });
}

// Bulk import contacts
export function useBulkImportContacts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contacts: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
      if (!user?.id) throw new Error('User not authenticated');

      const contactsWithUserId = contacts.map(contact => ({
        ...contact,
        user_id: user.id
      }));

      const { data, error } = await supabase
        .from('contacts')
        .insert(contactsWithUserId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(`${data.length} kişi başarıyla içe aktarıldı!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kişiler içe aktarılırken hata oluştu');
    }
  });
}
