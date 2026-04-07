import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Reward {
  id: string;
  image_url: string;
  description: string;
  unlock_days: number;
  created_at: string;
}

export function useRewards() {
  return useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('unlock_days', { ascending: true });
      if (error) throw error;
      return data as Reward[];
    },
  });
}

export function useAddReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { image_url: string; description: string; unlock_days: number }) => {
      const { error } = await supabase.from('rewards').insert(item);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rewards'] }),
  });
}

export function useDeleteReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rewards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rewards'] }),
  });
}
