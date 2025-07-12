import { 
  vocabularyCards, 
  reviewSessions, 
  studySettings, 
  dailyStats,
  cardTemplates,
  users,
  classrooms,
  sharedDecks,
  sharedDeckCards,
  sharedDeckAccess,
  deckImports,
  type VocabularyCard,
  type InsertVocabularyCard,
  type ReviewSession,
  type InsertReviewSession,
  type StudySettings,
  type InsertStudySettings,
  type DailyStats,
  type InsertDailyStats,
  type CardTemplate,
  type InsertCardTemplate,
  type FieldConfig,
  type User,
  type UpsertUser,
  type SharedDeck,
  type InsertSharedDeck,
  type SharedDeckCard,
  type InsertSharedDeckCard,
  type SharedDeckAccess,
  type InsertSharedDeckAccess,
  type DeckImport,
  type InsertDeckImport,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, desc, gte } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<any>;
  upsertUser(user: any): Promise<any>;
  
  // Role and classroom management
  setUserRole(userId: string, role: "student" | "teacher"): Promise<void>;
  getUserRole(userId: string): Promise<"student" | "teacher">;
  clearUserData(userId: string): Promise<void>;
  
  // Classroom management
  createClassroom(name: string, teacherEmail: string): Promise<any>;
  getClassroomByCode(classCode: string): Promise<any>;
  joinClassroom(userId: string, classCode: string): Promise<void>;
  getClassroomStudents(classroomId: number): Promise<any[]>;
  
  // Teacher functions
  assignWordsToStudent(teacherId: string, studentId: string, words: any[]): Promise<void>;
  resetSystemForNewSemester(teacherId: string): Promise<void>;

  // Card Templates
  getCardTemplate(id: number): Promise<CardTemplate | undefined>;
  getAllCardTemplates(): Promise<CardTemplate[]>;
  getStudentCardTemplates(): Promise<CardTemplate[]>;
  getDefaultCardTemplate(): Promise<CardTemplate>;
  createCardTemplate(template: InsertCardTemplate): Promise<CardTemplate>;
  updateCardTemplate(id: number, template: Partial<InsertCardTemplate>): Promise<CardTemplate>;
  deleteCardTemplate(id: number): Promise<void>;

  // Vocabulary Cards (now with userId)
  getVocabularyCard(id: number, userId: string): Promise<VocabularyCard | undefined>;
  getAllVocabularyCards(userId: string): Promise<VocabularyCard[]>;
  createVocabularyCard(card: InsertVocabularyCard, userId: string): Promise<VocabularyCard>;
  updateVocabularyCard(id: number, card: Partial<InsertVocabularyCard>, userId: string): Promise<VocabularyCard>;
  deleteVocabularyCard(id: number, userId: string): Promise<void>;

  // Review Sessions (now with userId)
  getReviewSession(id: number, userId: string): Promise<ReviewSession | undefined>;
  getReviewSessionByCard(cardId: number, cardType: string, userId: string): Promise<ReviewSession | undefined>;
  getActiveReviewSessions(userId: string): Promise<ReviewSession[]>;
  getDueReviewSessions(userId: string): Promise<ReviewSession[]>;
  createReviewSession(session: InsertReviewSession, userId: string): Promise<ReviewSession>;
  updateReviewSession(id: number, session: Partial<InsertReviewSession>, userId: string): Promise<ReviewSession>;
  
  // Study Settings (now with userId)
  getStudySettings(userId: string): Promise<StudySettings>;
  updateStudySettings(settings: Partial<InsertStudySettings>, userId: string): Promise<StudySettings>;
  
  // Daily Stats (now with userId)
  getDailyStats(date: Date, userId: string): Promise<DailyStats | undefined>;
  createOrUpdateDailyStats(stats: InsertDailyStats, userId: string): Promise<DailyStats>;
  getStatsDateRange(startDate: Date, endDate: Date, userId: string): Promise<DailyStats[]>;

  // Analytics (now with userId)
  getMasteryLevelCounts(userId: string): Promise<{level0: number, level1: number, level2: number, level3: number, level4: number}>;
  getRecentActivity(userId: string): Promise<Array<{type: string, word: string, timestamp: Date, details: string}>>;

  // Teacher Assignments (replacing shared decks)
  getTeacherAssignments(userId: string): Promise<any[]>;
  getAssignmentByCode(assignmentCode: string): Promise<any>;
  importTeacherAssignment(assignmentId: number, userId: string): Promise<any>;
  getTeacherCollections(userId: string): Promise<any[]>;
  createTeacherAssignment(assignment: any, teacherId: string): Promise<any>;

  // Keep legacy shared deck methods for gradual migration
  getSharedDeck(id: number): Promise<any>;
  getAllPublicSharedDecks(): Promise<any[]>;
  getUserSharedDecks(userId: string): Promise<any[]>;
  getSharedDeckByCode(shareCode: string): Promise<any>;
  createSharedDeck(deck: any, userId: string): Promise<any>;
  updateSharedDeck(id: number, deck: any, userId: string): Promise<any>;
  deleteSharedDeck(id: number, userId: string): Promise<void>;
  getSharedDeckCards(deckId: number): Promise<any[]>;
  addCardToSharedDeck(deckId: number, cardId: number, userId: string): Promise<any>;
  removeCardFromSharedDeck(deckId: number, cardId: number, userId: string): Promise<void>;
  importSharedDeck(deckId: number, userId: string): Promise<any>;
  getSharedDeckAccess(deckId: number, userId: string): Promise<any>;
  grantSharedDeckAccess(deckId: number, userId: string, accessLevel: string, granterId: string): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private classrooms: Map<number, any>;
  private cardTemplates: Map<number, CardTemplate>;
  private vocabularyCards: Map<number, VocabularyCard>;
  private reviewSessions: Map<number, ReviewSession>;
  private studySettings: StudySettings;
  private dailyStats: Map<string, DailyStats>;
  private sharedDecks: Map<number, SharedDeck>;
  private sharedDeckCards: Map<number, SharedDeckCard[]>;
  private sharedDeckAccess: Map<number, SharedDeckAccess[]>;
  private deckImports: Map<string, DeckImport[]>;
  private currentTemplateId: number;
  private currentCardId: number;
  private currentSessionId: number;
  private currentStatsId: number;
  private currentSharedDeckId: number;
  private currentClassroomId: number;
  private recentActivity: Array<{type: string, word: string, timestamp: Date, details: string, userId?: string}>;

  constructor() {
    this.users = new Map();
    this.classrooms = new Map();
    this.cardTemplates = new Map();
    this.vocabularyCards = new Map();
    this.reviewSessions = new Map();
    this.dailyStats = new Map();
    this.sharedDecks = new Map();
    this.sharedDeckCards = new Map();
    this.sharedDeckAccess = new Map();
    this.deckImports = new Map();
    this.currentTemplateId = 1;
    this.currentCardId = 1;
    this.currentSessionId = 1;
    this.currentStatsId = 1;
    this.currentSharedDeckId = 1;
    this.currentClassroomId = 1;
    this.recentActivity = [];
    
    // Create limited template set
    this.createLimitedTemplates();
    
    // Default settings
    this.studySettings = {
      id: 1,
      userId: "default-user",
      dailyGoal: 20,
      newCardsPerDay: 5,
      autoPlayAudio: true,
      level0Interval: 0,
      level1Interval: 1,
      level2Interval: 3,
      level3Interval: 7,
      level4Interval: 30,
      enableDictionaryApi: true,
    };
  }

  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existingUser = this.users.get(user.id);
    
    if (existingUser) {
      // Update existing user
      const updatedUser = {
        ...existingUser,
        ...user,
        updatedAt: new Date(),
      };
      this.users.set(user.id, updatedUser);
      return updatedUser;
    } else {
      // Create new user with empty database
      const newUser: User = {
        id: user.id,
        email: user.email || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        profileImageUrl: user.profileImageUrl || null,
        role: user.role || "student",
        classroomId: user.classroomId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(user.id, newUser);
      
      // Ensure clean slate for new users
      await this.clearUserData(user.id);
      return newUser;
    }
  }
  
  async setUserRole(userId: string, role: "student" | "teacher"): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.role = role;
      this.users.set(userId, user);
    }
  }
  
  async getUserRole(userId: string): Promise<"student" | "teacher"> {
    const user = this.users.get(userId);
    return user?.role || "student";
  }
  
  async clearUserData(userId: string): Promise<void> {
    // Clear all user-specific data
    const userCards = Array.from(this.vocabularyCards.values()).filter(card => card.userId === userId);
    userCards.forEach(card => this.vocabularyCards.delete(card.id));
    
    const userSessions = Array.from(this.reviewSessions.values()).filter(session => session.userId === userId);
    userSessions.forEach(session => this.reviewSessions.delete(session.id));
    
    // Clear activity log for this user
    this.recentActivity = this.recentActivity.filter(activity => activity.userId !== userId);
    
    // Clear stats
    const userStatsKeys = Array.from(this.dailyStats.keys()).filter(key => key.includes(userId));
    userStatsKeys.forEach(key => this.dailyStats.delete(key));
  }
  
  async createClassroom(name: string, teacherEmail: string): Promise<any> {
    const classCode = this.generateClassCode();
    const classroom = {
      id: this.currentClassroomId++,
      name,
      classCode,
      teacherEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.classrooms.set(classroom.id, classroom);
    return classroom;
  }
  
  async getClassroomByCode(classCode: string): Promise<any> {
    return Array.from(this.classrooms.values()).find(c => c.classCode === classCode);
  }
  
  async joinClassroom(userId: string, classCode: string): Promise<void> {
    const classroom = await this.getClassroomByCode(classCode);
    if (classroom) {
      const user = this.users.get(userId);
      if (user) {
        user.classroomId = classroom.id;
        this.users.set(userId, user);
      }
    }
  }
  
  async getClassroomStudents(classroomId: number): Promise<any[]> {
    return Array.from(this.users.values()).filter(u => u.classroomId === classroomId);
  }
  
  async assignWordsToStudent(teacherId: string, studentId: string, words: any[]): Promise<void> {
    // Implementation for assigning words to students
    words.forEach(word => {
      const newCard: VocabularyCard = {
        id: this.currentCardId++,
        userId: studentId,
        templateId: word.templateId || 1,
        word: word.word,
        partOfSpeech: word.partOfSpeech || null,
        definition: word.definition || "",
        characteristics: word.characteristics || "",
        examples: word.examples || "",
        nonExamples: word.nonExamples || "",
        personalConnection: word.personalConnection || "",
        customFields: word.customFields || {},
        imageUrls: word.imageUrls || [],
        audioUrl: word.audioUrl || null,
        pronunciationKey: word.pronunciationKey || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.vocabularyCards.set(newCard.id, newCard);
      
      // Create review session
      const reviewSession: ReviewSession = {
        id: this.currentSessionId++,
        userId: studentId,
        cardId: newCard.id,
        masteryLevel: 0,
        lastReviewed: new Date(),
        nextReviewDate: new Date(),
        reviewCount: 0,
        correctCount: 0,
        cardType: "recognition",
        isActive: true,
      };
      this.reviewSessions.set(reviewSession.id, reviewSession);
    });
  }
  
  async resetSystemForNewSemester(teacherId: string): Promise<void> {
    // Clear all student data for teacher's classroom
    const teacherUser = this.users.get(teacherId);
    if (teacherUser?.role === "teacher") {
      // Find all students in teacher's classroom
      const students = Array.from(this.users.values()).filter(u => 
        u.classroomId && u.role === "student"
      );
      
      // Clear data for each student
      for (const student of students) {
        await this.clearUserData(student.id);
      }
    }
  }
  
  private generateClassCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private createSampleCards() {
    const sampleCards = [
      {
        word: "resilient",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Able to recover quickly from difficulties; tough and flexible",
          characteristics: "Bounces back from setbacks\\nAdapts to change well\\nMaintains positive attitude\\nLearns from failure",
          examples: "A resilient person who overcame job loss\\nResilient plants that survive drought\\nA resilient community after disaster",
          synonyms: "Tough, flexible, adaptable, hardy, strong, durable"
        }
      },
      {
        word: "ephemeral",
        partOfSpeech: "adjective", 
        customFields: {
          definition: "Lasting for a very short time; temporary",
          characteristics: "Brief duration\\nQuickly fading\\nMomentary existence\\nShort-lived beauty",
          examples: "Ephemeral flowers that bloom for one day\\nThe ephemeral nature of childhood\\nEphemeral internet trends",
          synonyms: "Temporary, fleeting, brief, transient, momentary, short-lived"
        }
      },
      {
        word: "ubiquitous",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Present, appearing, or found everywhere",
          characteristics: "Exists everywhere\\nCommonly seen\\nWidespread presence\\nHard to avoid",
          examples: "Smartphones are ubiquitous in modern society\\nUbiquitous security cameras in the city\\nThe ubiquitous presence of social media",
          synonyms: "Everywhere, widespread, common, universal, omnipresent, pervasive"
        }
      },
      {
        word: "meticulous",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Showing great attention to detail; very careful and precise",
          characteristics: "Extremely careful\\nPays attention to details\\nThorough in work\\nPrecise and accurate",
          examples: "A meticulous scientist recording data\\nMeticulous planning for the wedding\\nShe was meticulous about her appearance",
          synonyms: "Careful, precise, thorough, detailed, exact, scrupulous"
        }
      },
      {
        word: "ambiguous",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Having more than one possible meaning; unclear or vague",
          characteristics: "Multiple meanings\\nUnclear intent\\nOpen to interpretation\\nLacks precision",
          examples: "An ambiguous statement from the politician\\nAmbiguous instructions that confused students\\nThe ending of the movie was ambiguous",
          synonyms: "Unclear, vague, confusing, uncertain, indefinite, equivocal"
        }
      },
      {
        word: "catalyst",
        partOfSpeech: "noun",
        customFields: {
          definition: "A person or thing that causes or accelerates change or action",
          characteristics: "Triggers change\\nSpeeds up processes\\nCauses reactions\\nInfluences outcomes",
          examples: "The protest was a catalyst for reform\\nA catalyst that speeds chemical reactions\\nHer speech was the catalyst for action",
          synonyms: "Trigger, spark, stimulus, agent, cause, motivator"
        }
      },
      {
        word: "pragmatic",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Dealing with things practically rather than idealistically",
          characteristics: "Practical approach\\nFocuses on results\\nRealistic thinking\\nAction-oriented",
          examples: "A pragmatic solution to the problem\\nPragmatic voters who focus on issues\\nHis pragmatic approach to business",
          synonyms: "Practical, realistic, sensible, down-to-earth, logical, reasonable"
        }
      },
      {
        word: "eloquent",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Fluent and persuasive in speaking or writing",
          characteristics: "Speaks beautifully\\nPersuasive communication\\nClear expression\\nMoving words",
          examples: "An eloquent speech that moved the audience\\nThe eloquent lawyer convinced the jury\\nHer eloquent writing style",
          synonyms: "Articulate, fluent, persuasive, expressive, well-spoken, graceful"
        }
      },
      {
        word: "innovative",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Introducing new ideas; original and creative in thinking",
          characteristics: "Creates new ideas\\nThinks outside the box\\nOriginal approach\\nForward-thinking",
          examples: "An innovative app design\\nInnovative teaching methods\\nThe company's innovative solutions",
          synonyms: "Creative, original, inventive, groundbreaking, novel, pioneering"
        }
      },
      {
        word: "tenacious",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Holding firmly to something; persistent and determined",
          characteristics: "Never gives up\\nPersistent effort\\nStrong determination\\nHolds on tightly",
          examples: "A tenacious athlete who trained daily\\nTenacious in pursuing her goals\\nThe tenacious reporter uncovered the truth",
          synonyms: "Persistent, determined, stubborn, resolute, steadfast, unwavering"
        }
      },
      {
        word: "versatile",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Able to adapt or be adapted to many different functions or activities",
          characteristics: "Multi-talented\\nAdaptable to situations\\nFlexible abilities\\nMany uses",
          examples: "A versatile actor who plays many roles\\nVersatile tools for different jobs\\nShe's versatile in sports and academics",
          synonyms: "Flexible, adaptable, multi-skilled, all-around, diverse, capable"
        }
      },
      {
        word: "gregarious",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Fond of the company of others; sociable",
          characteristics: "Enjoys social gatherings\\nLikes being around people\\nOutgoing personality\\nFriendly nature",
          examples: "A gregarious person who loves parties\\nGregarious animals that live in groups\\nHis gregarious personality made him popular",
          synonyms: "Sociable, outgoing, friendly, social, extroverted, companionable"
        }
      },
      {
        word: "skeptical",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Having doubts or reservations; not easily convinced",
          characteristics: "Questions claims\\nDoubtful attitude\\nSeeks evidence\\nCritical thinking",
          examples: "Skeptical about the new treatment\\nA skeptical scientist demanding proof\\nSkeptical of online reviews",
          synonyms: "Doubtful, questioning, suspicious, wary, cynical, distrustful"
        }
      },
      {
        word: "frivolous",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Not having any serious purpose or value; trivial",
          characteristics: "Lacks seriousness\\nTrivial importance\\nPlayful nature\\nNot meaningful",
          examples: "A frivolous lawsuit with no merit\\nFrivolous spending on unnecessary items\\nFrivolous conversation about celebrities",
          synonyms: "Trivial, silly, unimportant, superficial, petty, meaningless"
        }
      },
      {
        word: "profound",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Very great or intense; having deep meaning or significance",
          characteristics: "Deep meaning\\nGreat intensity\\nSignificant impact\\nThought-provoking",
          examples: "A profound philosophical question\\nProfound grief after the loss\\nThe book had a profound effect on readers",
          synonyms: "Deep, intense, significant, meaningful, important, substantial"
        }
      },
      {
        word: "indifferent",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Having no particular interest or sympathy; unconcerned",
          characteristics: "Shows no interest\\nLacks concern\\nUncaring attitude\\nNeutral feelings",
          examples: "Indifferent to the outcome of the game\\nAn indifferent response to criticism\\nIndifferent about fashion trends",
          synonyms: "Unconcerned, apathetic, uninterested, neutral, detached, aloof"
        }
      },
      {
        word: "spontaneous",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Done without planning; natural and unforced",
          characteristics: "Unplanned actions\\nNatural response\\nImmediate reaction\\nInstinctive behavior",
          examples: "A spontaneous decision to travel\\nSpontaneous applause from the audience\\nHer spontaneous laughter was contagious",
          synonyms: "Unplanned, impulsive, natural, instinctive, automatic, impromptu"
        }
      },
      {
        word: "comprehensive",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Including or dealing with all or nearly all elements or aspects",
          characteristics: "Covers everything\\nAll-inclusive approach\\nDetailed coverage\\nNothing left out",
          examples: "A comprehensive study of climate change\\nComprehensive insurance coverage\\nComprehensive exam covering all topics",
          synonyms: "Complete, thorough, extensive, all-inclusive, detailed, exhaustive"
        }
      },
      {
        word: "deliberate",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Done consciously and intentionally; careful and unhurried",
          characteristics: "Intentional action\\nCareful planning\\nThoughtful approach\\nPurposeful behavior",
          examples: "A deliberate attempt to mislead\\nDeliberate movements of the dancer\\nDeliberate choice of words",
          synonyms: "Intentional, purposeful, calculated, planned, conscious, methodical"
        }
      },
      {
        word: "substantial",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Of considerable importance, size, or worth; significant",
          characteristics: "Large in size\\nImportant value\\nSignificant amount\\nConsiderable impact",
          examples: "A substantial donation to charity\\nSubstantial evidence of wrongdoing\\nSubstantial improvements in performance",
          synonyms: "Significant, considerable, large, important, major, sizeable"
        }
      },
      {
        word: "arbitrary",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Based on random choice rather than reason or system",
          characteristics: "Random decisions\\nNo logical basis\\nUnpredictable choices\\nLacks reasoning",
          examples: "An arbitrary rule with no explanation\\nArbitrary deadlines that change daily\\nArbitrary punishment for minor mistakes",
          synonyms: "Random, unreasonable, capricious, unpredictable, irrational, whimsical"
        }
      },
      {
        word: "efficient",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Working in a well-organized way; achieving maximum productivity",
          characteristics: "Well-organized\\nMaximum output\\nMinimal waste\\nEffective methods",
          examples: "An efficient worker who completes tasks quickly\\nEfficient use of resources\\nEfficient transportation system",
          synonyms: "Productive, effective, organized, streamlined, optimal, economical"
        }
      },
      {
        word: "abstract",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Existing in thought or as an idea but not having physical existence",
          characteristics: "Not physical\\nConceptual ideas\\nTheoretical nature\\nMental concepts",
          examples: "Abstract concepts like love and justice\\nAbstract art with no realistic forms\\nAbstract mathematical theories",
          synonyms: "Theoretical, conceptual, intangible, non-physical, ideational, philosophical"
        }
      },
      {
        word: "dynamic",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Characterized by constant change, activity, or progress",
          characteristics: "Constantly changing\\nFull of energy\\nActive movement\\nProgressive nature",
          examples: "A dynamic leader who inspires change\\nThe dynamic economy grows rapidly\\nDynamic weather patterns",
          synonyms: "Energetic, active, changing, vigorous, lively, progressive"
        }
      },
      {
        word: "authentic",
        partOfSpeech: "adjective",
        customFields: {
          definition: "Genuine and original; not false or copied",
          characteristics: "Real and genuine\\nOriginal source\\nNot fake\\nTruthful nature",
          examples: "An authentic antique from the 1800s\\nAuthentic Italian cuisine\\nAuthentic emotions, not pretend",
          synonyms: "Genuine, real, original, legitimate, true, valid"
        }
      }
    ];

    // Create cards for default test user
    const testUserId = "44655184"; // The user ID from the logs
    
    sampleCards.forEach((cardData, index) => {
      const cardId = this.currentCardId++;
      const now = new Date();
      
      // Add sample images to some cards
      let imageUrls: string[] = [];
      if (cardData.word === "resilient") {
        imageUrls = ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"];
      } else if (cardData.word === "catalyst") {
        imageUrls = ["https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop"];
      } else if (cardData.word === "dynamic") {
        imageUrls = ["https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop"];
      } else if (cardData.word === "versatile") {
        imageUrls = ["https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&h=300&fit=crop"];
      } else if (cardData.word === "authentic") {
        imageUrls = ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"];
      }

      const newCard: VocabularyCard = {
        id: cardId,
        userId: testUserId,
        templateId: 1, // Classic Frayer template
        word: cardData.word,
        partOfSpeech: cardData.partOfSpeech,
        customFields: cardData.customFields,
        imageUrls: imageUrls,
        audioUrl: "",
        pronunciationKey: "",
        createdAt: now,
        updatedAt: now,
      };
      
      this.vocabularyCards.set(cardId, newCard);
      
      // Create review session for each card - RESET SRS: All cards due for review
      const sessionId = this.currentSessionId++;
      const masteryLevel = 0; // Reset all to level 0 for testing
      // All cards due now for testing - set to 10 minutes ago
      const nextReviewDate = new Date(now.getTime() - (10 * 60 * 1000));
      
      const reviewSession: ReviewSession = {
        id: sessionId,
        userId: testUserId,
        cardId: cardId,
        cardType: "vocabulary",
        masteryLevel: masteryLevel,
        lastReviewed: new Date(now.getTime() - (60 * 60 * 1000)), // Last reviewed 1 hour ago
        nextReview: nextReviewDate,
        reviewCount: 0, // Reset review count for fresh testing
        successRate: 0, // Reset success rate
        isActive: true, // Mark as active for review
        createdAt: now,
        updatedAt: now,
      };
      
      this.reviewSessions.set(sessionId, reviewSession);
      
      // Add to recent activity
      this.addRecentActivity("add", cardData.word, `Added "${cardData.word}" card`);
    });
    
    console.log(`Created ${sampleCards.length} sample vocabulary cards for testing`);
  }

  private createLimitedTemplates() {
    // 1. Classic Frayer Model with fifth quadrant for images
    const classicFrayerFields: FieldConfig[] = [
      { id: 'definition', name: 'Definition', type: 'textarea', required: true, order: 1 },
      { id: 'characteristics', name: 'What It Is', type: 'textarea', required: true, order: 2, placeholder: 'Describe the main features or traits of this word...' },
      { id: 'examples', name: 'How It\'s Used', type: 'textarea', required: true, order: 3, placeholder: 'Show how the word is used in sentences or real-life situations...' },
      { id: 'nonExamples', name: 'What It\'s Not', type: 'textarea', required: true, order: 4, placeholder: 'Show situations where the word doesn\'t apply or what it is not...' },
      { id: 'personalConnection', name: 'Personal Connection', type: 'textarea', required: true, order: 5, placeholder: 'How does this word connect to your life or help you remember it?' },
      { id: 'image', name: 'Visual Aid', type: 'image', required: false, order: 6 },
    ];

    const classicTemplate: CardTemplate = {
      id: 1,
      name: 'Classic Frayer Model',
      description: 'Traditional four-quadrant model with definition, characteristics, examples, and non-examples, plus visual aid.',
      isDefault: true,
      fields: classicFrayerFields as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 2. Definition-Image-Synonyms Model
    const definitionImageFields: FieldConfig[] = [
      { id: 'definition', name: 'Definition', type: 'textarea', required: true, order: 1 },
      { id: 'image', name: 'Visual Aid', type: 'image', required: false, order: 2 },
      { id: 'examples', name: 'Example Sentence', type: 'textarea', required: true, order: 3 },
      { id: 'synonyms', name: 'Synonyms', type: 'textarea', required: true, order: 4 },
      { id: 'personalConnection', name: 'Personal Connection', type: 'textarea', required: true, order: 5 },
    ];

    const definitionImageTemplate: CardTemplate = {
      id: 2,
      name: 'Definition-Image-Synonyms',
      description: 'Simple model focusing on definition, visual aid, example sentence, and synonyms.',
      isDefault: false,
      fields: definitionImageFields as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 3. Prefix-Root-Suffix Model
    const prefixRootFields: FieldConfig[] = [
      { id: 'definition', name: 'Definition', type: 'textarea', required: true, order: 1 },
      { id: 'prefix', name: 'Prefix', type: 'text', required: false, order: 2 },
      { id: 'root', name: 'Root', type: 'text', required: true, order: 3 },
      { id: 'suffix', name: 'Suffix', type: 'text', required: false, order: 4 },
      { id: 'examples', name: 'Related Words', type: 'textarea', required: true, order: 5 },
      { id: 'personalConnection', name: 'Memory Device', type: 'textarea', required: true, order: 6 },
    ];

    const prefixRootTemplate: CardTemplate = {
      id: 3,
      name: 'Prefix-Root-Suffix',
      description: 'Morphological analysis focusing on word parts and related vocabulary.',
      isDefault: false,
      fields: prefixRootFields as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 4. Word-What It Is-What It Isn't Model (Teacher only)
    const wordWhatIsFields: FieldConfig[] = [
      { id: 'definition', name: 'Definition', type: 'textarea', required: true, order: 1 },
      { id: 'whatItIs', name: 'What It Is', type: 'textarea', required: true, order: 2 },
      { id: 'whatItIsnt', name: 'What It Isn\'t', type: 'textarea', required: true, order: 3 },
      { id: 'examples', name: 'Visual Example', type: 'textarea', required: true, order: 4 },
      { id: 'personalConnection', name: 'Usage Note', type: 'textarea', required: true, order: 5 },
    ];

    const wordWhatIsTemplate: CardTemplate = {
      id: 4,
      name: 'Word-What It Is-What It Isn\'t',
      description: 'Simple contrast model perfect for concrete nouns and clear concepts.',
      isDefault: false,
      fields: wordWhatIsFields as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 5. Student Choice Model (Teacher only)
    const studentChoiceFields: FieldConfig[] = [
      { id: 'definition', name: 'Definition', type: 'textarea', required: true, order: 1 },
      { id: 'personalConnection', name: 'Personal Connection', type: 'textarea', required: true, order: 2 },
      { id: 'examples', name: 'Your Choice 1', type: 'textarea', required: true, order: 3, placeholder: 'Examples, synonyms, word parts, or anything that helps you remember' },
      { id: 'characteristics', name: 'Your Choice 2', type: 'textarea', required: true, order: 4, placeholder: 'Visual description, sentence, or memory trick' },
      { id: 'image', name: 'Optional Image', type: 'image', required: false, order: 5 },
    ];

    const studentChoiceTemplate: CardTemplate = {
      id: 5,
      name: 'Student Choice',
      description: 'Flexible template allowing students to choose their own learning approach.',
      isDefault: false,
      fields: studentChoiceFields as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 6. Greek/Latin Root Frayer Model (Teacher only)
    const greekLatinFields: FieldConfig[] = [
      { id: 'definition', name: 'Modern Definition', type: 'textarea', required: true, order: 1 },
      { id: 'root', name: 'Root Meaning', type: 'text', required: true, order: 2 },
      { id: 'characteristics', name: 'Etymology', type: 'textarea', required: true, order: 3 },
      { id: 'examples', name: 'Word Family', type: 'textarea', required: true, order: 4 },
      { id: 'nonExamples', name: 'Academic Examples', type: 'textarea', required: true, order: 5 },
      { id: 'personalConnection', name: 'Memory Trick', type: 'textarea', required: true, order: 6 },
    ];

    const greekLatinTemplate: CardTemplate = {
      id: 6,
      name: 'Greek/Latin Root Frayer Model',
      description: 'Deep dive into classical roots with etymology and word families.',
      isDefault: false,
      fields: greekLatinFields as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 7. Prefix/Suffix Frayer Model (Teacher only)
    const prefixSuffixFields: FieldConfig[] = [
      { id: 'definition', name: 'Meaning', type: 'textarea', required: true, order: 1 },
      { id: 'characteristics', name: 'Origin', type: 'textarea', required: true, order: 2 },
      { id: 'examples', name: 'Word Examples', type: 'textarea', required: true, order: 3 },
      { id: 'nonExamples', name: 'Non-Examples', type: 'textarea', required: true, order: 4, placeholder: 'Words that look similar but don\'t contain this word part' },
      { id: 'personalConnection', name: 'Guidance Note', type: 'textarea', required: true, order: 5, placeholder: 'Some words may not have obvious word parts - focus on words that do!' },
    ];

    const prefixSuffixTemplate: CardTemplate = {
      id: 7,
      name: 'Prefix/Suffix Frayer Model',
      description: 'Specialized for learning word parts as vocabulary units.',
      isDefault: false,
      fields: prefixSuffixFields as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cardTemplates.set(1, classicTemplate);
    this.cardTemplates.set(2, definitionImageTemplate);
    this.cardTemplates.set(3, prefixRootTemplate);
    this.cardTemplates.set(4, wordWhatIsTemplate);
    this.cardTemplates.set(5, studentChoiceTemplate);
    this.cardTemplates.set(6, greekLatinTemplate);
    this.cardTemplates.set(7, prefixSuffixTemplate);
    this.currentTemplateId = 8;
  }

  async getCardTemplate(id: number): Promise<CardTemplate | undefined> {
    return this.cardTemplates.get(id);
  }

  async getAllCardTemplates(): Promise<CardTemplate[]> {
    return Array.from(this.cardTemplates.values());
  }

  // Get templates for students (first 3 only)
  async getStudentCardTemplates(): Promise<CardTemplate[]> {
    return Array.from(this.cardTemplates.values()).slice(0, 3);
  }

  // Get templates for teachers (all 7)
  async getTeacherCardTemplates(): Promise<CardTemplate[]> {
    return Array.from(this.cardTemplates.values());
  }

  async getDefaultCardTemplate(): Promise<CardTemplate> {
    const defaultTemplate = Array.from(this.cardTemplates.values()).find(t => t.isDefault);
    return defaultTemplate || this.cardTemplates.get(1)!;
  }

  async createCardTemplate(template: InsertCardTemplate): Promise<CardTemplate> {
    const id = this.currentTemplateId++;
    const now = new Date();
    const newTemplate: CardTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.cardTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateCardTemplate(id: number, template: Partial<InsertCardTemplate>): Promise<CardTemplate> {
    const existing = this.cardTemplates.get(id);
    if (!existing) throw new Error('Template not found');
    
    const updated = { ...existing, ...template, updatedAt: new Date() };
    this.cardTemplates.set(id, updated);
    return updated;
  }

  async deleteCardTemplate(id: number): Promise<void> {
    this.cardTemplates.delete(id);
  }

  async getVocabularyCard(id: number, userId: string): Promise<VocabularyCard | undefined> {
    const card = this.vocabularyCards.get(id);
    if (card && card.userId === userId) {
      return card;
    }
    return undefined;
  }

  async getAllVocabularyCards(userId: string): Promise<VocabularyCard[]> {
    return Array.from(this.vocabularyCards.values()).filter(card => card.userId === userId);
  }

  async createVocabularyCard(card: InsertVocabularyCard, userId: string): Promise<VocabularyCard> {
    const id = this.currentCardId++;
    const now = new Date();
    const defaultTemplate = await this.getDefaultCardTemplate();
    
    const newCard: VocabularyCard = {
      ...card,
      id,
      userId: userId, // Use the passed userId parameter
      templateId: card.templateId || defaultTemplate.id,
      partOfSpeech: card.partOfSpeech || null,
      personalConnection: card.personalConnection || null,
      customFields: card.customFields || null,
      imageUrls: card.imageUrls || [],
      audioUrl: card.audioUrl || null,
      pronunciationKey: card.pronunciationKey || null,
      createdAt: now,
      updatedAt: now,
    };
    this.vocabularyCards.set(id, newCard);
    
    // Create initial review sessions for both card types
    await this.createReviewSession({
      userId: userId, // Use the passed userId parameter
      cardId: id,
      masteryLevel: 0,
      nextReviewDate: now,
      reviewCount: 0,
      correctCount: 0,
      cardType: 'recognition',
      isActive: true,
    }, userId);
    
    await this.createReviewSession({
      userId: userId, // Use the passed userId parameter
      cardId: id,
      masteryLevel: 0,
      nextReviewDate: now,
      reviewCount: 0,
      correctCount: 0,
      cardType: 'production',
      isActive: true,
    }, userId);

    this.addRecentActivity('add', card.word, 'New word added to deck');
    return newCard;
  }

  async updateVocabularyCard(id: number, card: Partial<InsertVocabularyCard>, userId: string): Promise<VocabularyCard> {
    const existing = this.vocabularyCards.get(id);
    if (!existing || existing.userId !== userId) throw new Error('Card not found');
    
    const updated = { ...existing, ...card, updatedAt: new Date() };
    this.vocabularyCards.set(id, updated);
    return updated;
  }

  async deleteVocabularyCard(id: number, userId: string): Promise<void> {
    const existing = this.vocabularyCards.get(id);
    if (!existing || existing.userId !== userId) throw new Error('Card not found');
    
    this.vocabularyCards.delete(id);
    // Remove associated review sessions
    for (const [sessionId, session] of this.reviewSessions) {
      if (session.cardId === id && session.userId === userId) {
        this.reviewSessions.delete(sessionId);
      }
    }
  }

  async getReviewSession(id: number, userId: string): Promise<ReviewSession | undefined> {
    const session = this.reviewSessions.get(id);
    return session && session.userId === userId ? session : undefined;
  }

  async getReviewSessionByCard(cardId: number, cardType: string, userId: string): Promise<ReviewSession | undefined> {
    return Array.from(this.reviewSessions.values()).find(
      session => session.cardId === cardId && session.cardType === cardType && session.userId === userId
    );
  }

  async getActiveReviewSessions(userId: string): Promise<ReviewSession[]> {
    return Array.from(this.reviewSessions.values()).filter(session => session.isActive && session.userId === userId);
  }

  async getDueReviewSessions(userId: string): Promise<ReviewSession[]> {
    const now = new Date();
    return Array.from(this.reviewSessions.values()).filter(
      session => session.isActive && session.nextReview <= now && session.userId === userId
    );
  }

  async createReviewSession(session: InsertReviewSession, userId: string): Promise<ReviewSession> {
    const id = this.currentSessionId++;
    const newSession: ReviewSession = {
      ...session,
      id,
      userId: userId,
      lastReviewed: new Date(),
    };
    this.reviewSessions.set(id, newSession);
    return newSession;
  }

  async updateReviewSession(id: number, session: Partial<InsertReviewSession>, userId: string): Promise<ReviewSession> {
    const existing = this.reviewSessions.get(id);
    if (!existing || existing.userId !== userId) throw new Error('Review session not found');
    
    const updated = { ...existing, ...session, lastReviewed: new Date() };
    this.reviewSessions.set(id, updated);
    return updated;
  }

  async getStudySettings(userId: string): Promise<StudySettings> {
    return this.studySettings;
  }

  async updateStudySettings(settings: Partial<InsertStudySettings>, userId: string): Promise<StudySettings> {
    this.studySettings = { ...this.studySettings, ...settings };
    return this.studySettings;
  }

  async getDailyStats(date: Date): Promise<DailyStats | undefined> {
    const dateKey = date.toISOString().split('T')[0];
    return this.dailyStats.get(dateKey);
  }

  async createOrUpdateDailyStats(stats: InsertDailyStats): Promise<DailyStats> {
    const dateKey = stats.date.toISOString().split('T')[0];
    const existing = this.dailyStats.get(dateKey);
    
    if (existing) {
      const updated = { ...existing, ...stats };
      this.dailyStats.set(dateKey, updated);
      return updated;
    } else {
      const newStats: DailyStats = {
        ...stats,
        id: this.currentStatsId++,
      };
      this.dailyStats.set(dateKey, newStats);
      return newStats;
    }
  }

  async getStatsDateRange(startDate: Date, endDate: Date): Promise<DailyStats[]> {
    const result: DailyStats[] = [];
    for (const stats of this.dailyStats.values()) {
      if (stats.date >= startDate && stats.date <= endDate) {
        result.push(stats);
      }
    }
    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getMasteryLevelCounts(userId: string): Promise<{level0: number, level1: number, level2: number, level3: number, level4: number}> {
    const counts = { level0: 0, level1: 0, level2: 0, level3: 0, level4: 0 };
    
    for (const session of this.reviewSessions.values()) {
      if (session.isActive && session.userId === userId) {
        switch (session.masteryLevel) {
          case 0: counts.level0++; break;
          case 1: counts.level1++; break;
          case 2: counts.level2++; break;
          case 3: counts.level3++; break;
          case 4: counts.level4++; break;
        }
      }
    }
    
    return counts;
  }

  async getRecentActivity(userId: string): Promise<Array<{type: string, word: string, timestamp: Date, details: string}>> {
    return [...this.recentActivity].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  }

  private addRecentActivity(type: string, word: string, details: string) {
    this.recentActivity.push({
      type,
      word,
      timestamp: new Date(),
      details,
    });
    
    // Keep only last 50 activities - rolling log, no automatic reset
    if (this.recentActivity.length > 50) {
      this.recentActivity = this.recentActivity.slice(-50);
    }
  }

  // Shared Deck Methods
  async getSharedDeck(id: number): Promise<SharedDeck | undefined> {
    return this.sharedDecks.get(id);
  }

  async getAllPublicSharedDecks(): Promise<SharedDeck[]> {
    return Array.from(this.sharedDecks.values()).filter(deck => deck.isPublic);
  }

  async getUserSharedDecks(userId: string): Promise<SharedDeck[]> {
    return Array.from(this.sharedDecks.values()).filter(deck => deck.creatorId === userId);
  }

  async getSharedDeckByCode(shareCode: string): Promise<SharedDeck | undefined> {
    return Array.from(this.sharedDecks.values()).find(deck => deck.shareCode === shareCode);
  }

  async createSharedDeck(deck: InsertSharedDeck, userId: string): Promise<SharedDeck> {
    const shareCode = this.generateShareCode();
    const newDeck: SharedDeck = {
      id: this.currentSharedDeckId++,
      ...deck,
      creatorId: userId,
      shareCode,
      cardCount: 0,
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.sharedDecks.set(newDeck.id, newDeck);
    this.sharedDeckCards.set(newDeck.id, []);
    this.sharedDeckAccess.set(newDeck.id, []);
    
    this.addRecentActivity("shared", deck.name, "Created shared deck");
    return newDeck;
  }

  async updateSharedDeck(id: number, deck: Partial<InsertSharedDeck>, userId: string): Promise<SharedDeck> {
    const existingDeck = this.sharedDecks.get(id);
    if (!existingDeck || existingDeck.creatorId !== userId) {
      throw new Error("Shared deck not found or access denied");
    }

    const updatedDeck = {
      ...existingDeck,
      ...deck,
      updatedAt: new Date(),
    };

    this.sharedDecks.set(id, updatedDeck);
    return updatedDeck;
  }

  async deleteSharedDeck(id: number, userId: string): Promise<void> {
    const deck = this.sharedDecks.get(id);
    if (!deck || deck.creatorId !== userId) {
      throw new Error("Shared deck not found or access denied");
    }

    this.sharedDecks.delete(id);
    this.sharedDeckCards.delete(id);
    this.sharedDeckAccess.delete(id);
  }

  async getSharedDeckCards(deckId: number): Promise<VocabularyCard[]> {
    const deckCards = this.sharedDeckCards.get(deckId) || [];
    const cards: VocabularyCard[] = [];
    
    for (const deckCard of deckCards) {
      const card = this.vocabularyCards.get(deckCard.cardId);
      if (card) {
        cards.push(card);
      }
    }
    
    return cards.sort((a, b) => {
      const aOrder = deckCards.find(dc => dc.cardId === a.id)?.order || 0;
      const bOrder = deckCards.find(dc => dc.cardId === b.id)?.order || 0;
      return aOrder - bOrder;
    });
  }

  async addCardToSharedDeck(deckId: number, cardId: number, userId: string): Promise<SharedDeckCard> {
    const deck = this.sharedDecks.get(deckId);
    if (!deck || deck.creatorId !== userId) {
      throw new Error("Shared deck not found or access denied");
    }

    const deckCards = this.sharedDeckCards.get(deckId) || [];
    const existingCard = deckCards.find(dc => dc.cardId === cardId);
    
    if (existingCard) {
      throw new Error("Card already exists in deck");
    }

    const newDeckCard: SharedDeckCard = {
      id: Date.now(),
      deckId,
      cardId,
      order: deckCards.length,
      createdAt: new Date(),
    };

    deckCards.push(newDeckCard);
    this.sharedDeckCards.set(deckId, deckCards);

    deck.cardCount = deckCards.length;
    this.sharedDecks.set(deckId, deck);

    return newDeckCard;
  }

  async removeCardFromSharedDeck(deckId: number, cardId: number, userId: string): Promise<void> {
    const deck = this.sharedDecks.get(deckId);
    if (!deck || deck.creatorId !== userId) {
      throw new Error("Shared deck not found or access denied");
    }

    const deckCards = this.sharedDeckCards.get(deckId) || [];
    const filteredCards = deckCards.filter(dc => dc.cardId !== cardId);
    
    this.sharedDeckCards.set(deckId, filteredCards);
    
    deck.cardCount = filteredCards.length;
    this.sharedDecks.set(deckId, deck);
  }

  async importSharedDeck(deckId: number, userId: string): Promise<DeckImport> {
    const deck = this.sharedDecks.get(deckId);
    if (!deck) {
      throw new Error("Shared deck not found");
    }

    const deckCards = await this.getSharedDeckCards(deckId);
    let importedCount = 0;

    for (const card of deckCards) {
      const newCard: InsertVocabularyCard = {
        word: card.word,
        definition: card.definition,
        characteristics: card.characteristics,
        examples: card.examples,
        nonExamples: card.nonExamples,
        imageUrls: card.imageUrls,
        audioUrl: card.audioUrl,
        templateId: card.templateId,
        customFields: card.customFields,
        userId,
      };
      
      await this.createVocabularyCard(newCard, userId);
      importedCount++;
    }

    const userImports = this.deckImports.get(userId) || [];
    const importRecord: DeckImport = {
      id: Date.now(),
      userId,
      deckId,
      importedAt: new Date(),
      cardsImported: importedCount,
    };
    
    userImports.push(importRecord);
    this.deckImports.set(userId, userImports);

    deck.downloadCount += 1;
    this.sharedDecks.set(deckId, deck);

    this.addRecentActivity("imported", deck.name, `Imported ${importedCount} cards`);
    
    return importRecord;
  }

  async getSharedDeckAccess(deckId: number, userId: string): Promise<SharedDeckAccess | undefined> {
    const accessList = this.sharedDeckAccess.get(deckId) || [];
    return accessList.find(access => access.userId === userId);
  }

  async grantSharedDeckAccess(deckId: number, userId: string, accessLevel: string, granterId: string): Promise<SharedDeckAccess> {
    const deck = this.sharedDecks.get(deckId);
    if (!deck || deck.creatorId !== granterId) {
      throw new Error("Shared deck not found or access denied");
    }

    const accessList = this.sharedDeckAccess.get(deckId) || [];
    const existingAccess = accessList.find(access => access.userId === userId);
    
    if (existingAccess) {
      existingAccess.accessLevel = accessLevel;
      return existingAccess;
    }

    const newAccess: SharedDeckAccess = {
      id: Date.now(),
      deckId,
      userId,
      accessLevel,
      grantedAt: new Date(),
      grantedBy: granterId,
    };

    accessList.push(newAccess);
    this.sharedDeckAccess.set(deckId, accessList);

    return newAccess;
  }

  // Teacher Assignment Methods
  async getTeacherAssignments(userId: string): Promise<any[]> {
    // Return assignments sent to this student (mock data for now)
    const sampleAssignments = [
      {
        id: 1,
        name: "Week 1 Vocabulary",
        description: "First week vocabulary assignment",
        cardCount: 10,
        teacherName: "Ms. Johnson",
        assignmentCode: "VOCAB123",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        completedAt: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        name: "Science Terms",
        description: "Biology vocabulary for Chapter 3",
        cardCount: 15,
        teacherName: "Mr. Smith", 
        assignmentCode: "SCIENCE456",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        completedAt: null,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];
    return sampleAssignments;
  }

  async getAssignmentByCode(assignmentCode: string): Promise<any> {
    // Check created assignments first
    const createdAssignments = Array.from(this.sharedDecks.values()).filter(deck => deck.isAssignment);
    let found = createdAssignments.find(a => a.assignmentCode === assignmentCode);
    
    if (found) {
      return found;
    }
    
    // Check sample assignments
    const sampleAssignments = await this.getTeacherAssignments('any');
    found = sampleAssignments.find(a => a.assignmentCode === assignmentCode);
    
    return found;
  }

  async importTeacherAssignment(assignmentId: number, userId: string): Promise<any> {
    // Import some sample cards for the assignment
    const sampleWords = ["analyze", "synthesize", "evaluate", "comprehend", "interpret"];
    let cardsImported = 0;
    
    for (const word of sampleWords) {
      await this.createVocabularyCard({
        word,
        definition: `Definition of ${word} from teacher assignment`,
        characteristics: `Key features of ${word}`,
        examples: `Example: The student will ${word} the data`,
        nonExamples: `Non-example: Opposite of ${word}`,
        customFields: {},
        templateId: 1
      }, userId);
      cardsImported++;
    }
    
    return { cardsImported };
  }

  async getTeacherCollections(userId: string): Promise<any[]> {
    // Return collections created by this teacher (for teacher interface)
    return Array.from(this.sharedDecks.values()).filter(deck => deck.creatorId === userId);
  }

  async createTeacherAssignment(assignment: any, teacherId: string): Promise<any> {
    // Create new assignment with proper structure
    const newAssignment = {
      id: this.currentSharedDeckId++,
      name: assignment.name,
      description: assignment.description || "",
      teacherName: "Current Teacher", // Would get from user profile
      assignmentCode: this.generateShareCode(),
      cardCount: 0,
      dueDate: assignment.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      createdBy: teacherId,
      isAssignment: true,
      studentsAssigned: 0,
    };
    
    // Store in shared decks for now (would be separate assignments table in database)
    this.sharedDecks.set(newAssignment.id, newAssignment);
    
    console.log(`Created assignment "${newAssignment.name}" with code ${newAssignment.assignmentCode}`);
    return newAssignment;
  }

  // Reset SRS system to make cards due for review
  async resetSRSSystem(userId: string): Promise<void> {
    // Make first 10 cards due for review with different mastery levels
    const cardIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const now = new Date();
    const masteryLevels = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4];
    
    cardIds.forEach((cardId, index) => {
      // Update existing review sessions to be due
      const sessions = Array.from(this.reviewSessions.values()).filter(s => s.cardId === cardId && s.userId === userId);
      sessions.forEach(session => {
        session.masteryLevel = masteryLevels[index];
        session.nextReviewDate = new Date(now.getTime() - (index + 1) * 60 * 60 * 1000); // Due 1-10 hours ago
        session.correctCount = session.masteryLevel;
        session.incorrectCount = 0;
        session.lastReviewedAt = new Date(now.getTime() - (24 - index) * 60 * 60 * 1000);
        session.updatedAt = now;
        this.reviewSessions.set(session.id, session);
      });
    });
    
    console.log("SRS system reset - 10 cards are now due for review with varied mastery levels");
  }

  private generateShareCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeDefaultTemplate();
  }

  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  private async initializeDefaultTemplate() {
    try {
      const existing = await db.select().from(cardTemplates).where(eq(cardTemplates.isDefault, true));
      if (existing.length === 0) {
        await this.createDefaultTemplate();
      }
    } catch (error) {
      console.log("Default template will be created on first use");
    }
  }

  private async createDefaultTemplate() {
    // Create all 7 template variations
    const templates = [
      {
        name: 'Classic Frayer Model',
        description: 'Learn words by looking at what they mean, what makes them special, examples of when to use them, and examples of when NOT to use them. This helps you really understand the word.',
        isDefault: true,
        fields: [
          { id: 'definition', name: 'Definition', type: 'textarea', required: true, order: 1, placeholder: 'What does this word mean?' },
          { id: 'characteristics', name: 'Characteristics', type: 'textarea', required: true, order: 2, placeholder: 'What are the key features or qualities?' },
          { id: 'examples', name: 'Examples', type: 'textarea', required: true, order: 3, placeholder: 'Give specific examples' },
          { id: 'nonExamples', name: 'Non-Examples', type: 'textarea', required: true, order: 4, placeholder: 'What are some non-examples?' },
        ]
      },
      {
        name: 'Definition-Image-Sentence-Synonyms',
        description: 'Learn words by writing what they mean, adding a picture, using them in a sentence, and finding words that mean the same thing. Pictures help you remember better!',
        isDefault: false,
        fields: [
          { id: 'definition', name: 'Definition', type: 'textarea', required: true, order: 1, placeholder: 'What does this word mean?' },
          { id: 'image', name: 'Visual Representation', type: 'image', required: true, order: 2, placeholder: 'Upload an image that represents this word' },
          { id: 'exampleSentence', name: 'Example Sentence', type: 'textarea', required: true, order: 3, placeholder: 'Use the word in a sentence' },
          { id: 'synonyms', name: 'Synonyms/Antonyms', type: 'textarea', required: true, order: 4, placeholder: 'Find these on the Merriam-Webster definition page' },
        ]
      },
      {
        name: 'Prefix-Root-Suffix',
        description: 'Break apart words into their pieces (beginning, middle, end) to understand how they work. This helps you figure out new words by knowing what each part means.',
        isDefault: false,
        fields: [
          { id: 'prefix', name: 'Prefix', type: 'text', required: true, order: 1, placeholder: 'Word beginning (write "none" if no prefix)' },
          { id: 'root', name: 'Root Word', type: 'text', required: true, order: 2, placeholder: 'Main part of the word' },
          { id: 'suffix', name: 'Suffix', type: 'text', required: true, order: 3, placeholder: 'Word ending (write "none" if no suffix)' },
          { id: 'wordConstruction', name: 'How Parts Create Meaning', type: 'textarea', required: true, order: 4, placeholder: 'Note: Not all words have prefixes or suffixes. Some words may not break down into parts. Explain how the parts work together to create the word\'s meaning.' },
        ]
      },
      {
        name: 'Word-What It Is-What It Isn\'t',
        description: 'Learn words by understanding exactly what they mean and what they don\'t mean. This helps you avoid confusing similar words and really know the difference.',
        isDefault: false,
        fields: [
          { id: 'whatItIs', name: 'What It Is', type: 'textarea', required: true, order: 1, placeholder: 'Describe what this word represents' },
          { id: 'whatItIsnt', name: 'What It Isn\'t', type: 'textarea', required: true, order: 2, placeholder: 'Clarify what this word does NOT mean' },
          { id: 'examples', name: 'Examples', type: 'textarea', required: true, order: 3, placeholder: 'Give specific examples' },
        ]
      },
      {
        name: 'Student Choice',
        description: 'Make the word yours! Connect it to your life, create pictures in your mind, and find related words. This helps you remember because it\'s personal to you.',
        isDefault: false,
        fields: [
          { id: 'personalConnection', name: 'Personal Connection', type: 'textarea', required: true, order: 1, placeholder: 'How does this word relate to your life?' },
          { id: 'visualOrExample', name: 'Visual Description or Example', type: 'textarea', required: true, order: 2, placeholder: 'Describe a mental image or give an example' },
          { id: 'wordFamily', name: 'Word Family', type: 'textarea', required: true, order: 3, placeholder: 'Related words, synonyms, or word variations - find these on the Merriam-Webster definition page' },
        ]
      },
      {
        name: 'Greek/Latin Root Frayer Model',
        description: 'Learn powerful word roots from Greek and Latin that help you understand thousands of words. Once you know these roots, you can figure out lots of new words!',
        isDefault: false,
        fields: [
          { id: 'rootDefinition', name: 'Definition of Root', type: 'textarea', required: true, order: 1, placeholder: 'What is the root\'s meaning?' },
          { id: 'exampleWords', name: 'Example Words', type: 'textarea', required: true, order: 2, placeholder: 'List several words that use this root' },
          { id: 'wordFunction', name: 'How It Works in Words', type: 'textarea', required: true, order: 3, placeholder: 'How does the root change the meaning of words?' },
        ]
      },
      {
        name: 'Prefix/Suffix Frayer Model',
        description: 'Study word beginnings (prefixes) and endings (suffixes) to understand how they change word meanings. This helps you decode new words!',
        isDefault: false,
        fields: [
          { id: 'affixDefinition', name: 'What It Means', type: 'textarea', required: true, order: 1, placeholder: 'What the prefix/suffix means' },
          { id: 'exampleWords', name: 'Example Words', type: 'textarea', required: true, order: 2, placeholder: 'List words that use this prefix or suffix' },
          { id: 'meaningChange', name: 'How It Changes Words', type: 'textarea', required: true, order: 3, placeholder: 'How does adding this prefix or suffix change the meaning?' },
        ]
      }
    ];

    for (const template of templates) {
      await db.insert(cardTemplates).values({
        name: template.name,
        description: template.description,
        isDefault: template.isDefault,
        fields: template.fields as any,
      });
    }
  }

  // Card Templates
  async getCardTemplate(id: number): Promise<CardTemplate | undefined> {
    const [template] = await db.select().from(cardTemplates).where(eq(cardTemplates.id, id));
    return template || undefined;
  }

  async getAllCardTemplates(): Promise<CardTemplate[]> {
    return await db.select().from(cardTemplates);
  }

  async getStudentCardTemplates(): Promise<CardTemplate[]> {
    // Return only the first 3 templates for students
    return await db.select().from(cardTemplates).limit(3);
  }

  async getDefaultCardTemplate(): Promise<CardTemplate> {
    const [template] = await db.select().from(cardTemplates).where(eq(cardTemplates.isDefault, true));
    if (!template) {
      await this.createDefaultTemplate();
      const [newTemplate] = await db.select().from(cardTemplates).where(eq(cardTemplates.isDefault, true));
      return newTemplate;
    }
    return template;
  }

  async createCardTemplate(template: InsertCardTemplate): Promise<CardTemplate> {
    const [newTemplate] = await db.insert(cardTemplates).values(template).returning();
    return newTemplate;
  }

  async updateCardTemplate(id: number, template: Partial<InsertCardTemplate>): Promise<CardTemplate> {
    const [updatedTemplate] = await db.update(cardTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(cardTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteCardTemplate(id: number): Promise<void> {
    await db.delete(cardTemplates).where(eq(cardTemplates.id, id));
  }

  // Role and classroom management
  async setUserRole(userId: string, role: "student" | "teacher"): Promise<void> {
    await db.update(users)
      .set({ role })
      .where(eq(users.id, userId));
  }

  async getUserRole(userId: string): Promise<"student" | "teacher"> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.role || "student";
  }

  async clearUserData(userId: string): Promise<void> {
    // Clear user's vocabulary cards and review sessions
    await db.delete(vocabularyCards).where(eq(vocabularyCards.userId, userId));
    await db.delete(reviewSessions).where(eq(reviewSessions.userId, userId));
  }

  async createClassroom(name: string, teacherEmail: string): Promise<any> {
    const classCode = this.generateClassCode();
    const [classroom] = await db.insert(classrooms).values({
      name,
      classCode,
      teacherEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return classroom;
  }

  async getClassroomByCode(classCode: string): Promise<any> {
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.classCode, classCode));
    return classroom;
  }

  async joinClassroom(userId: string, classCode: string): Promise<void> {
    const classroom = await this.getClassroomByCode(classCode);
    if (classroom) {
      await db.update(users)
        .set({ classroomId: classroom.id })
        .where(eq(users.id, userId));
    }
  }

  async getClassroomStudents(classroomId: number): Promise<any[]> {
    return await db.select().from(users).where(eq(users.classroomId, classroomId));
  }

  async assignWordsToStudent(teacherId: string, studentId: string, words: any[]): Promise<void> {
    for (const word of words) {
      const [newCard] = await db.insert(vocabularyCards).values({
        userId: studentId,
        templateId: word.templateId || 1,
        word: word.word,
        partOfSpeech: word.partOfSpeech || null,
        definition: word.definition || "",
        characteristics: word.characteristics || "",
        examples: word.examples || "",
        nonExamples: word.nonExamples || "",
        personalConnection: word.personalConnection || "",
        customFields: word.customFields || {},
        imageUrls: word.imageUrls || [],
        audioUrl: word.audioUrl || null,
        pronunciationKey: word.pronunciationKey || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Create review session
      await db.insert(reviewSessions).values({
        userId: studentId,
        cardId: newCard.id,
        masteryLevel: 0,
        lastReviewed: new Date(),
        nextReviewDate: new Date(),
        reviewCount: 0,
        correctCount: 0,
        cardType: "recognition",
        isActive: true,
      });
    }
  }

  async resetSystemForNewSemester(teacherId: string): Promise<void> {
    // Clear all student data - for now just clear all data
    // In a real system, this would be more targeted to the teacher's classroom
    await db.delete(vocabularyCards);
    await db.delete(reviewSessions);
  }

  private generateClassCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Vocabulary Cards (with userId)
  async getVocabularyCard(id: number, userId: string): Promise<VocabularyCard | undefined> {
    const [card] = await db.select().from(vocabularyCards)
      .where(and(eq(vocabularyCards.id, id), eq(vocabularyCards.userId, userId)));
    return card || undefined;
  }

  async getAllVocabularyCards(userId: string): Promise<VocabularyCard[]> {
    return await db.select().from(vocabularyCards).where(eq(vocabularyCards.userId, userId));
  }

  async createVocabularyCard(card: InsertVocabularyCard, userId: string): Promise<VocabularyCard> {
    const [newCard] = await db.insert(vocabularyCards).values({
      ...card,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newCard;
  }

  async updateVocabularyCard(id: number, card: Partial<InsertVocabularyCard>, userId: string): Promise<VocabularyCard> {
    const [updatedCard] = await db.update(vocabularyCards)
      .set({ ...card, updatedAt: new Date() })
      .where(and(eq(vocabularyCards.id, id), eq(vocabularyCards.userId, userId)))
      .returning();
    return updatedCard;
  }

  async deleteVocabularyCard(id: number, userId: string): Promise<void> {
    await db.delete(vocabularyCards).where(and(eq(vocabularyCards.id, id), eq(vocabularyCards.userId, userId)));
  }

  // Review Sessions (with userId)
  async getReviewSession(id: number, userId: string): Promise<ReviewSession | undefined> {
    const [session] = await db.select().from(reviewSessions)
      .where(and(eq(reviewSessions.id, id), eq(reviewSessions.userId, userId)));
    return session || undefined;
  }

  async getReviewSessionByCard(cardId: number, cardType: string, userId: string): Promise<ReviewSession | undefined> {
    const [session] = await db.select().from(reviewSessions)
      .where(and(
        eq(reviewSessions.cardId, cardId),
        eq(reviewSessions.cardType, cardType),
        eq(reviewSessions.userId, userId)
      ));
    return session || undefined;
  }

  async getActiveReviewSessions(userId: string): Promise<ReviewSession[]> {
    return await db.select().from(reviewSessions)
      .where(and(eq(reviewSessions.userId, userId), eq(reviewSessions.isActive, true)));
  }

  async getDueReviewSessions(userId: string): Promise<ReviewSession[]> {
    const now = new Date();
    return await db.select().from(reviewSessions)
      .where(and(
        eq(reviewSessions.userId, userId),
        eq(reviewSessions.isActive, true),
        lte(reviewSessions.nextReviewDate, now)
      ));
  }

  async createReviewSession(session: InsertReviewSession, userId: string): Promise<ReviewSession> {
    const [newSession] = await db.insert(reviewSessions).values({
      ...session,
      userId,
    }).returning();
    return newSession;
  }

  async updateReviewSession(id: number, session: Partial<InsertReviewSession>, userId: string): Promise<ReviewSession> {
    const [updatedSession] = await db.update(reviewSessions)
      .set(session)
      .where(and(eq(reviewSessions.id, id), eq(reviewSessions.userId, userId)))
      .returning();
    return updatedSession;
  }

  // Study Settings (with userId)
  async getStudySettings(userId: string): Promise<StudySettings> {
    const [settings] = await db.select().from(studySettings).where(eq(studySettings.userId, userId));
    if (!settings) {
      const defaultSettings = {
        userId,
        dailyGoal: 20,
        newCardsPerDay: 5,
        reviewsPerDay: 15,
        enableAudio: true,
        enableNotifications: true,
        difficultyLevel: "medium",
        cardTypes: ["recognition", "production"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const [newSettings] = await db.insert(studySettings).values(defaultSettings).returning();
      return newSettings;
    }
    return settings;
  }

  async updateStudySettings(settings: Partial<InsertStudySettings>, userId: string): Promise<StudySettings> {
    const [updatedSettings] = await db.update(studySettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(studySettings.userId, userId))
      .returning();
    return updatedSettings;
  }

  // Daily Stats (with userId)
  async getDailyStats(date: Date, userId: string): Promise<DailyStats | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    const [stats] = await db.select().from(dailyStats)
      .where(and(eq(dailyStats.userId, userId), eq(dailyStats.date, dateStr)));
    return stats || undefined;
  }

  async createOrUpdateDailyStats(stats: InsertDailyStats, userId: string): Promise<DailyStats> {
    const existing = await this.getDailyStats(new Date(stats.date), userId);
    if (existing) {
      const [updatedStats] = await db.update(dailyStats)
        .set({ ...stats, updatedAt: new Date() })
        .where(and(eq(dailyStats.userId, userId), eq(dailyStats.date, stats.date)))
        .returning();
      return updatedStats;
    } else {
      const [newStats] = await db.insert(dailyStats).values({
        ...stats,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return newStats;
    }
  }

  async getStatsDateRange(startDate: Date, endDate: Date, userId: string): Promise<DailyStats[]> {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    return await db.select().from(dailyStats)
      .where(and(
        eq(dailyStats.userId, userId),
        gte(dailyStats.date, startStr),
        lte(dailyStats.date, endStr)
      ));
  }

  // Analytics (with userId)
  async getMasteryLevelCounts(userId: string): Promise<{level0: number, level1: number, level2: number, level3: number, level4: number}> {
    const sessions = await db.select().from(reviewSessions).where(eq(reviewSessions.userId, userId));
    const counts = { level0: 0, level1: 0, level2: 0, level3: 0, level4: 0 };
    sessions.forEach(session => {
      const level = `level${session.masteryLevel}` as keyof typeof counts;
      counts[level]++;
    });
    return counts;
  }

  async getRecentActivity(userId: string): Promise<Array<{type: string, word: string, timestamp: Date, details: string}>> {
    // Return empty array for now - would need activity tracking table
    return [];
  }

  // Placeholder implementations for remaining methods
  async getTeacherAssignments(userId: string): Promise<any[]> { return []; }
  async getAssignmentByCode(assignmentCode: string): Promise<any> { return null; }
  async importTeacherAssignment(assignmentId: number, userId: string): Promise<any> { return null; }
  async getTeacherCollections(userId: string): Promise<any[]> { return []; }
  async createTeacherAssignment(assignment: any, teacherId: string): Promise<any> { return null; }
  async getSharedDeck(id: number): Promise<any> { return null; }
  async getAllPublicSharedDecks(): Promise<any[]> { return []; }
  async getUserSharedDecks(userId: string): Promise<any[]> { return []; }
  async getSharedDeckByCode(shareCode: string): Promise<any> { return null; }
  async createSharedDeck(deck: any, userId: string): Promise<any> { return null; }
  async updateSharedDeck(id: number, deck: any, userId: string): Promise<any> { return null; }
  async deleteSharedDeck(id: number, userId: string): Promise<void> { }
  async getSharedDeckCards(deckId: number): Promise<any[]> { return []; }
  async addCardToSharedDeck(deckId: number, cardId: number, userId: string): Promise<any> { return null; }
  async removeCardFromSharedDeck(deckId: number, cardId: number, userId: string): Promise<void> { }
  async importSharedDeck(deckId: number, userId: string): Promise<any> { return null; }
  async getSharedDeckAccess(deckId: number, userId: string): Promise<any> { return null; }
  async grantSharedDeckAccess(deckId: number, userId: string, accessLevel: string, granterId: string): Promise<any> { return null; }
}

export const storage = new DatabaseStorage(); // Using PostgreSQL database for production
