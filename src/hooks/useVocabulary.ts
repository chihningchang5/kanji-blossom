import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExampleSentence {
  sentence: string;
  reading: string;
  translation: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  reading: string;
  translation: string;
  level: string;
  is_learned: boolean;
  examples: ExampleSentence[];
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
      return data as unknown as VocabularyItem[];
    },
  });
}

export function useDailyWords() {
  return useQuery({
    queryKey: ['daily-words', new Date().toDateString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('is_learned', false);
      if (error) throw error;
      const items = data as unknown as VocabularyItem[];
      const shuffled = items.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 5);
    },
  });
}

export function useLearnedWords() {
  return useQuery({
    queryKey: ['learned-words'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('is_learned', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as VocabularyItem[];
    },
  });
}

export function useAddVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<VocabularyItem, 'id' | 'created_at' | 'is_learned'>) => {
      const { error } = await supabase.from('vocabulary').insert(item as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocabulary'] }),
  });
}

export function useUpdateVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...item }: Partial<VocabularyItem> & { id: string }) => {
      const { error } = await supabase.from('vocabulary').update(item as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocabulary'] });
      qc.invalidateQueries({ queryKey: ['daily-words'] });
      qc.invalidateQueries({ queryKey: ['learned-words'] });
    },
  });
}

export function useToggleLearned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_learned }: { id: string; is_learned: boolean }) => {
      const { error } = await supabase.from('vocabulary').update({ is_learned }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocabulary'] });
      qc.invalidateQueries({ queryKey: ['daily-words'] });
      qc.invalidateQueries({ queryKey: ['learned-words'] });
    },
  });
}

export function useBulkImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Omit<VocabularyItem, 'id' | 'created_at' | 'is_learned'>[]) => {
      const { error } = await supabase.from('vocabulary').insert(items as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocabulary'] }),
  });
}
