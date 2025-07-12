import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReviewSession, StudySettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { calculateNextReviewDate } from "@/lib/spaced-repetition";

export function useDueReviewSessions() {
  return useQuery<ReviewSession[]>({
    queryKey: ['/api/review-sessions/due'],
  });
}

export function useActiveReviewSessions() {
  return useQuery<ReviewSession[]>({
    queryKey: ['/api/review-sessions/active'],
  });
}

export function useStudySettings() {
  return useQuery<StudySettings>({
    queryKey: ['/api/study-settings'],
  });
}

export function useUpdateStudySettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<StudySettings>) => {
      const response = await apiRequest('PUT', '/api/study-settings', settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-settings'] });
    },
  });
}

export function useUpdateReviewSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      correct, 
      settings 
    }: { 
      id: number; 
      correct: boolean; 
      settings: StudySettings;
    }) => {
      // Get current session to calculate next review
      const sessionResponse = await apiRequest('GET', `/api/review-sessions/${id}`);
      const currentSession = await sessionResponse.json();
      
      const { nextLevel, nextReviewDate } = calculateNextReviewDate(
        currentSession.masteryLevel || 0,
        correct,
        {
          level0Interval: settings.level0Interval || 0,
          level1Interval: settings.level1Interval || 1,
          level2Interval: settings.level2Interval || 3,
          level3Interval: settings.level3Interval || 7,
          level4Interval: settings.level4Interval || 30,
        }
      );
      
      const updates = {
        masteryLevel: nextLevel,
        nextReviewDate: nextReviewDate.toISOString(),
        reviewCount: (currentSession.reviewCount || 0) + 1,
        correctCount: correct ? (currentSession.correctCount || 0) + 1 : (currentSession.correctCount || 0),
        lastReviewed: new Date().toISOString(),
      };
      
      const response = await apiRequest('PUT', `/api/review-sessions/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/review-sessions'] });
    },
  });
}

export function useMasteryLevelCounts() {
  return useQuery<{level0: number, level1: number, level2: number, level3: number, level4: number}>({
    queryKey: ['/api/analytics/mastery-levels'],
  });
}

export function useRecentActivity() {
  return useQuery<Array<{type: string, word: string, timestamp: Date, details: string}>>({
    queryKey: ['/api/analytics/recent-activity'],
  });
}
