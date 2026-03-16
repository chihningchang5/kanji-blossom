import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VocabularyItem {
  id: string;
  word: string;
  reading: string;
  translation: string;
  level: string;
  created_at: string;
}

export function useVocabulary() {
  return useQuery({
    queryKey: ['vocabulary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VocabularyItem[];
    },
  });
}

export function useDailyWords() {
  return useQuery({
    queryKey: ['daily-words', new Date().toDateString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*');
      if (error) throw error;
      const items = data as VocabularyItem[];
      // Shuffle and pick 5
      const shuffled = items.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 5);
    },
  });
}

export function useAddVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<VocabularyItem, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('vocabulary').insert(item);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocabulary'] }),
  });
}

export function useUpdateVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...item }: Omit<VocabularyItem, 'created_at'>) => {
      const { error } = await supabase.from('vocabulary').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocabulary'] }),
  });
}

export function useBulkImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Omit<VocabularyItem, 'id' | 'created_at'>[]) => {
      const { error } = await supabase.from('vocabulary').insert(items);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocabulary'] }),
  });
}
