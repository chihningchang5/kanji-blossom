import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthReady } from './useAuthReady';

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
  last_reviewed_at: string | null;
}

// Merge vocabulary rows with per-user progress
async function fetchVocabWithProgress(userId: string | null): Promise<VocabularyItem[]> {
  const { data: vocab, error: ve } = await supabase
    .from('vocabulary')
    .select('*')
    .order('level', { ascending: false })
    .order('created_at', { ascending: false });
  if (ve) throw ve;

  if (!userId) return (vocab as unknown as VocabularyItem[]).map(v => ({ ...v, is_learned: false, learned_at: null, last_reviewed_at: null }));

  const { data: progress, error: pe } = await supabase
    .from('user_word_progress')
    .select('*')
    .eq('user_id', userId);
  if (pe) throw pe;

  const progressMap = new Map<string, any>();
  (progress || []).forEach((p: any) => progressMap.set(p.vocabulary_id, p));

  return (vocab as unknown as VocabularyItem[]).map(v => {
    const p = progressMap.get(v.id);
    return {
      ...v,
      is_learned: p?.is_learned ?? false,
      learned_at: p?.learned_at ?? null,
      last_reviewed_at: p?.last_reviewed_at ?? null,
    };
  });
}

export function useVocabulary() {
  const { user, isReady } = useAuthReady();
  return useQuery({
    queryKey: ['vocabulary', user?.id ?? 'anon'],
    queryFn: () => fetchVocabWithProgress(user?.id ?? null),
    enabled: isReady,
  });
}

const DAILY_WORDS_KEY = 'daily-words-ids';
const DAILY_WORDS_DATE_KEY = 'daily-words-date';

export function useDailyWords() {
  const { user, isReady } = useAuthReady();
  return useQuery({
    queryKey: ['daily-words', user?.id ?? 'anon', new Date().toDateString()],
    queryFn: async () => {
      const allWithProgress = await fetchVocabWithProgress(user?.id ?? null);
      const today = new Date().toDateString();
      const storedDate = localStorage.getItem(DAILY_WORDS_DATE_KEY);
      const storedIds = localStorage.getItem(DAILY_WORDS_KEY);

      if (storedDate === today && storedIds) {
        const ids: string[] = JSON.parse(storedIds);
        const idSet = new Set(ids);
        const items = allWithProgress.filter(w => idSet.has(w.id));
        if (items.length > 0) return items;
      }

      const unlearned = allWithProgress.filter(w => !w.is_learned);
      const shuffled = unlearned.sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, 5);

      localStorage.setItem(DAILY_WORDS_DATE_KEY, today);
      localStorage.setItem(DAILY_WORDS_KEY, JSON.stringify(picked.map(w => w.id)));

      return picked;
    },
    enabled: isReady,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useLearnedWords() {
  const { user, isReady } = useAuthReady();
  return useQuery({
    queryKey: ['learned-words', user?.id ?? 'anon'],
    queryFn: async () => {
      const all = await fetchVocabWithProgress(user?.id ?? null);
      return all
        .filter(w => w.is_learned)
        .sort((a, b) => {
          const la = a.learned_at ? new Date(a.learned_at).getTime() : 0;
          const lb = b.learned_at ? new Date(b.learned_at).getTime() : 0;
          return lb - la;
        });
    },
    enabled: isReady && !!user,
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
      // Only update vocabulary-level fields, not progress fields
      const { is_learned, learned_at, last_reviewed_at, ...vocabFields } = item as any;
      const { error } = await supabase.from('vocabulary').update(vocabFields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocabulary'] });
      qc.invalidateQueries({ queryKey: ['daily-words'] });
      qc.invalidateQueries({ queryKey: ['learned-words'] });
    },
  });
}

// Toggle learned state via user_word_progress (per-user)
export function useToggleLearned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_learned }: { id: string; is_learned: boolean }) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_word_progress')
        .upsert(
          { user_id: userId, vocabulary_id: id, is_learned } as any,
          { onConflict: 'user_id,vocabulary_id' }
        );
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

// Mark words as reviewed (per-user)
export function useMarkReviewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const now = new Date().toISOString();
      // Upsert progress rows with last_reviewed_at
      for (const vocabId of ids) {
        const { error } = await supabase
          .from('user_word_progress')
          .upsert(
            { user_id: userId, vocabulary_id: vocabId, last_reviewed_at: now } as any,
            { onConflict: 'user_id,vocabulary_id' }
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learned-words'] });
    },
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
