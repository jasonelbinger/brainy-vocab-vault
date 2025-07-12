import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CardTemplate, InsertCardTemplate } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useCardTemplates() {
  return useQuery<CardTemplate[]>({
    queryKey: ['/api/card-templates'],
  });
}

export function useCardTemplate(id: number) {
  return useQuery<CardTemplate>({
    queryKey: ['/api/card-templates', id],
    enabled: !!id,
  });
}

export function useDefaultCardTemplate() {
  return useQuery<CardTemplate>({
    queryKey: ['/api/card-templates/default'],
  });
}

export function useCreateCardTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: InsertCardTemplate) => {
      const response = await apiRequest('POST', '/api/card-templates', template);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/card-templates'] });
    },
  });
}

export function useUpdateCardTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, template }: { id: number; template: Partial<InsertCardTemplate> }) => {
      const response = await apiRequest('PUT', `/api/card-templates/${id}`, template);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/card-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/card-templates', id] });
    },
  });
}

export function useDeleteCardTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/card-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/card-templates'] });
    },
  });
}