import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VocabularyCard, InsertVocabularyCard } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useVocabularyCards() {
  return useQuery<VocabularyCard[]>({
    queryKey: ['/api/vocabulary-cards'],
  });
}

export function useVocabularyCard(id: number) {
  return useQuery<VocabularyCard>({
    queryKey: [`/api/vocabulary-cards/${id}`],
    enabled: !!id,
  });
}

export function useCreateVocabularyCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (card: InsertVocabularyCard) => {
      const response = await apiRequest('POST', '/api/vocabulary-cards', card);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary-cards'] });
    },
  });
}

export function useUpdateVocabularyCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, card }: { id: number; card: Partial<InsertVocabularyCard> }) => {
      const response = await apiRequest('PUT', `/api/vocabulary-cards/${id}`, card);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary-cards', id] });
    },
  });
}

export function useDeleteVocabularyCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/vocabulary-cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary-cards'] });
    },
  });
}
