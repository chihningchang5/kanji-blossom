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
  is_public: boolean;
  user_id: string | null;
  examples: ExampleSentence[];
  created_at: string;
  learned_at: string | null;
}

export function useVocabulary() {
  return useQuery({
    queryKey: ['vocabulary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .order('level', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as VocabularyItem[];
    },
  });
}

const DAILY_WORDS_KEY = 'daily-words-ids';
const DAILY_WORDS_DATE_KEY = 'daily-words-date';

export function useDailyWords() {
  return useQuery({
    queryKey: ['daily-words', new Date().toDateString()],
    queryFn: async () => {
      const today = new Date().toDateString();
      const storedDate = localStorage.getItem(DAILY_WORDS_DATE_KEY);
      const storedIds = localStorage.getItem(DAILY_WORDS_KEY);

      if (storedDate === today && storedIds) {
        const ids: string[] = JSON.parse(storedIds);
        const { data, error } = await supabase
          .from('vocabulary')
          .select('*')
          .in('id', ids);
        if (error) throw error;
        const items = data as unknown as VocabularyItem[];
        const stillValid = items.filter(w => !w.is_learned);
        if (stillValid.length > 0) return stillValid;
      }

      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('is_learned', false);
      if (error) throw error;
      const items = data as unknown as VocabularyItem[];
      const shuffled = items.sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, 5);

      localStorage.setItem(DAILY_WORDS_DATE_KEY, today);
      localStorage.setItem(DAILY_WORDS_KEY, JSON.stringify(picked.map(w => w.id)));

      return picked;
    },
    staleTime: Infinity,
    gcTime: Infinity,
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
        .order('level', { ascending: false })
        .order('learned_at', { ascending: false });
      if (error) throw error;
      return data as unknown as VocabularyItem[];
    },
  });
}

export function useAddVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { word: string; reading: string; translation: string; level: string; examples: ExampleSentence[]; is_public?: boolean; user_id?: string }) => {
      const { error } = await supabase.from('vocabulary').upsert(item as any, { onConflict: 'word,reading' });
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

export function useDeleteVocabulary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vocabulary').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocabulary'] }),
  });
}

export function useBulkImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { word: string; reading: string; translation: string; level: string; examples: ExampleSentence[]; is_public?: boolean }[]) => {
      const { error } = await supabase.from('vocabulary').upsert(items as any, { onConflict: 'word,reading' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocabulary'] }),
  });
}
