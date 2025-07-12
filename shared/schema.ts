import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Google ID
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("student"), // "student" or "teacher"
  classroomId: integer("classroom_id"), // Reference to classroom
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Classrooms table for organizing students
export const classrooms = pgTable("classrooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  classCode: varchar("class_code").unique().notNull(), // 6-digit code for students to join
  teacherEmail: varchar("teacher_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cardTemplates = pgTable("card_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"), // "Why it works" explanation
  isDefault: boolean("is_default").default(false),
  fields: jsonb("fields").notNull(), // Array of field configurations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vocabularyCards = pgTable("vocabulary_cards", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  templateId: integer("template_id").references(() => cardTemplates.id),
  word: text("word").notNull(),
  partOfSpeech: text("part_of_speech"),
  definition: text("definition").default(""),
  characteristics: text("characteristics").default(""),
  examples: text("examples").default(""),
  nonExamples: text("non_examples").default(""),
  personalConnection: text("personal_connection"),
  customFields: jsonb("custom_fields"), // Dynamic fields based on template
  imageUrls: text("image_urls").array(),
  audioUrl: text("audio_url"),
  pronunciationKey: text("pronunciation_key"),
  clozeSentence: text("cloze_sentence"), // Sentence with target word to be replaced with underscores
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviewSessions = pgTable("review_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  cardId: integer("card_id").references(() => vocabularyCards.id),
  masteryLevel: integer("mastery_level").default(0), // 0-4
  lastReviewed: timestamp("last_reviewed").defaultNow(),
  nextReviewDate: timestamp("next_review_date").notNull(),
  reviewCount: integer("review_count").default(0),
  correctCount: integer("correct_count").default(0),
  cardType: text("card_type").notNull(), // 'recognition' or 'production'
  isActive: boolean("is_active").default(true),
});

export const studySettings = pgTable("study_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  dailyGoal: integer("daily_goal").default(20),
  newCardsPerDay: integer("new_cards_per_day").default(5),
  autoPlayAudio: boolean("auto_play_audio").default(true),
  level0Interval: integer("level0_interval").default(0), // Same session
  level1Interval: integer("level1_interval").default(1), // 1 day
  level2Interval: integer("level2_interval").default(3), // 3 days
  level3Interval: integer("level3_interval").default(7), // 7 days
  level4Interval: integer("level4_interval").default(30), // 30 days
  enableDictionaryApi: boolean("enable_dictionary_api").default(true),
});

export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  cardsReviewed: integer("cards_reviewed").default(0),
  newCardsAdded: integer("new_cards_added").default(0),
  masteryProgression: jsonb("mastery_progression"), // {level0to1: 2, level1to2: 1, etc}
  studyTimeMinutes: integer("study_time_minutes").default(0),
});

// Shared Decks - Collections of vocabulary cards that can be shared
export const sharedDecks = pgTable("shared_decks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(false),
  shareCode: varchar("share_code").unique(), // 8-character code for sharing
  cardCount: integer("card_count").default(0),
  downloadCount: integer("download_count").default(0),
  tags: jsonb("tags").default([]), // Array of tags for categorization
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shared Deck Cards - Cards that belong to shared decks
export const sharedDeckCards = pgTable("shared_deck_cards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").references(() => sharedDecks.id).notNull(),
  cardId: integer("card_id").references(() => vocabularyCards.id).notNull(),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shared Deck Access - Track who has access to which shared decks
export const sharedDeckAccess = pgTable("shared_deck_access", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").references(() => sharedDecks.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accessLevel: varchar("access_level").default("view"), // view, contribute, admin
  grantedAt: timestamp("granted_at").defaultNow(),
  grantedBy: varchar("granted_by").references(() => users.id),
});

// Deck Imports - Track when users import shared decks
export const deckImports = pgTable("deck_imports", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  deckId: integer("deck_id").references(() => sharedDecks.id).notNull(),
  importedAt: timestamp("imported_at").defaultNow(),
  cardsImported: integer("cards_imported").default(0),
});

// Field type definitions
export const fieldTypeSchema = z.enum(['text', 'textarea', 'image', 'audio', 'select', 'multiselect']);

export const fieldConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: fieldTypeSchema,
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(), // For select/multiselect fields
  maxLength: z.number().optional(),
  order: z.number(),
});

export const templateFieldsSchema = z.array(fieldConfigSchema);

export const insertCardTemplateSchema = createInsertSchema(cardTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  fields: templateFieldsSchema,
});

export const insertVocabularyCardSchema = createInsertSchema(vocabularyCards).omit({
  id: true,
  userId: true, // Handle userId in backend, not frontend
  createdAt: true,
  updatedAt: true,
}).extend({
  definition: z.string().optional(),
  characteristics: z.string().optional(),
  examples: z.string().optional(),
  nonExamples: z.string().optional(),
});

export const insertReviewSessionSchema = createInsertSchema(reviewSessions).omit({
  id: true,
});

export const updateReviewSessionSchema = z.object({
  masteryLevel: z.number().optional(),
  lastReviewed: z.string().transform(val => new Date(val)).optional(),
  nextReviewDate: z.string().transform(val => new Date(val)).optional(),
  reviewCount: z.number().optional(),
  correctCount: z.number().optional(),
  cardType: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertStudySettingsSchema = createInsertSchema(studySettings).omit({
  id: true,
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats).omit({
  id: true,
});

// Shared Deck Schemas
export const insertSharedDeckSchema = createInsertSchema(sharedDecks).omit({
  id: true,
  creatorId: true,
  shareCode: true,
  cardCount: true,
  downloadCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSharedDeckCardSchema = createInsertSchema(sharedDeckCards).omit({
  id: true,
  createdAt: true,
});

export const insertSharedDeckAccessSchema = createInsertSchema(sharedDeckAccess).omit({
  id: true,
  grantedAt: true,
});

export const insertDeckImportSchema = createInsertSchema(deckImports).omit({
  id: true,
  importedAt: true,
});

export type FieldType = z.infer<typeof fieldTypeSchema>;
export type FieldConfig = z.infer<typeof fieldConfigSchema>;

// Authentication types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Classroom = typeof classrooms.$inferSelect;
export type InsertClassroom = typeof classrooms.$inferInsert;

// Existing types
export type CardTemplate = typeof cardTemplates.$inferSelect;
export type InsertCardTemplate = z.infer<typeof insertCardTemplateSchema>;
export type VocabularyCard = typeof vocabularyCards.$inferSelect;
export type InsertVocabularyCard = z.infer<typeof insertVocabularyCardSchema>;
export type ReviewSession = typeof reviewSessions.$inferSelect;
export type InsertReviewSession = z.infer<typeof insertReviewSessionSchema>;
export type StudySettings = typeof studySettings.$inferSelect;
export type InsertStudySettings = z.infer<typeof insertStudySettingsSchema>;
export type DailyStats = typeof dailyStats.$inferSelect;
export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;

// Shared Deck Types
export type SharedDeck = typeof sharedDecks.$inferSelect;
export type InsertSharedDeck = z.infer<typeof insertSharedDeckSchema>;
export type SharedDeckCard = typeof sharedDeckCards.$inferSelect;
export type InsertSharedDeckCard = z.infer<typeof insertSharedDeckCardSchema>;
export type SharedDeckAccess = typeof sharedDeckAccess.$inferSelect;
export type InsertSharedDeckAccess = z.infer<typeof insertSharedDeckAccessSchema>;
export type DeckImport = typeof deckImports.$inferSelect;
export type InsertDeckImport = z.infer<typeof insertDeckImportSchema>;
