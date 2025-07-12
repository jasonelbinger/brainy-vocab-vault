import { VocabularyCard, ReviewSession, StudySettings } from "@shared/schema";

const STORAGE_KEYS = {
  VOCABULARY_CARDS: 'vocab_cards',
  REVIEW_SESSIONS: 'review_sessions',
  STUDY_SETTINGS: 'study_settings',
  DAILY_STATS: 'daily_stats',
} as const;

export class LocalStorage {
  static saveVocabularyCards(cards: VocabularyCard[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VOCABULARY_CARDS, JSON.stringify(cards));
    } catch (error) {
      console.error('Failed to save vocabulary cards to localStorage:', error);
    }
  }

  static getVocabularyCards(): VocabularyCard[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VOCABULARY_CARDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load vocabulary cards from localStorage:', error);
      return [];
    }
  }

  static saveReviewSessions(sessions: ReviewSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEW_SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save review sessions to localStorage:', error);
    }
  }

  static getReviewSessions(): ReviewSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REVIEW_SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load review sessions from localStorage:', error);
      return [];
    }
  }

  static saveStudySettings(settings: StudySettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDY_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save study settings to localStorage:', error);
    }
  }

  static getStudySettings(): StudySettings | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDY_SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load study settings from localStorage:', error);
      return null;
    }
  }

  static clear(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  static export(): string {
    try {
      const data = {
        vocabularyCards: this.getVocabularyCards(),
        reviewSessions: this.getReviewSessions(),
        studySettings: this.getStudySettings(),
        exportDate: new Date().toISOString(),
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      return '';
    }
  }

  static import(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.vocabularyCards) {
        this.saveVocabularyCards(data.vocabularyCards);
      }
      
      if (data.reviewSessions) {
        this.saveReviewSessions(data.reviewSessions);
      }
      
      if (data.studySettings) {
        this.saveStudySettings(data.studySettings);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}
