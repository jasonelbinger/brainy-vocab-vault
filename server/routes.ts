import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertVocabularyCardSchema, 
  insertReviewSessionSchema, 
  updateReviewSessionSchema,
  insertStudySettingsSchema,
  insertDailyStatsSchema,
  insertCardTemplateSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint (no auth required)
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      host: req.hostname,
      database: !!process.env.DATABASE_URL,
      session: !!process.env.SESSION_SECRET
    });
  });

  // Simple auth bypass for Railway deployment
  if (process.env.NODE_ENV === 'production') {
    console.log('Running in production mode - bypassing auth setup temporarily');
    
    // Temporary route to test if app works without auth
    app.get('/api/test', (req, res) => {
      res.json({ message: 'Railway deployment working without auth!' });
    });
    
    // Create a simple mock auth for testing
    app.get('/api/auth/user', (req, res) => {
      res.json({ id: 'test-user', role: 'student' });
    });
  } else {
    // Auth middleware for development
    try {
      await setupAuth(app);
    } catch (error) {
      console.error('Auth setup failed:', error);
      // Continue without auth to prevent crashes
    }
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Card Templates - Students get first 3, teachers get all 7
  app.get("/api/card-templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRole = await storage.getUserRole(userId);
      const templates = userRole === "teacher" ? 
        await storage.getAllCardTemplates() : 
        await storage.getStudentCardTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch card templates" });
    }
  });

  app.get("/api/card-templates/default", async (req, res) => {
    try {
      const defaultTemplate = await storage.getDefaultCardTemplate();
      res.json(defaultTemplate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch default template" });
    }
  });

  app.get("/api/card-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getCardTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch card template" });
    }
  });

  app.post("/api/card-templates", async (req, res) => {
    try {
      const templateData = insertCardTemplateSchema.parse(req.body);
      const template = await storage.createCardTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create card template" });
    }
  });

  app.put("/api/card-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const templateData = insertCardTemplateSchema.partial().parse(req.body);
      const template = await storage.updateCardTemplate(id, templateData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update card template" });
    }
  });

  app.delete("/api/card-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCardTemplate(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete card template" });
    }
  });

  // Vocabulary Cards
  app.get("/api/vocabulary-cards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cards = await storage.getAllVocabularyCards(userId);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary cards" });
    }
  });

  app.get("/api/vocabulary-cards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const card = await storage.getVocabularyCard(id, userId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary card" });
    }
  });

  app.post("/api/vocabulary-cards", isAuthenticated, async (req: any, res) => {
    try {
      console.log("Card creation request body:", JSON.stringify(req.body, null, 2));
      const cardData = insertVocabularyCardSchema.parse(req.body);
      const userId = req.user.claims.sub;
      const card = await storage.createVocabularyCard(cardData, userId);
      res.status(201).json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid card data", errors: error.errors });
      }
      console.error("Card creation error:", error);
      res.status(500).json({ message: "Failed to create vocabulary card" });
    }
  });

  app.put("/api/vocabulary-cards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const cardData = insertVocabularyCardSchema.partial().parse(req.body);
      const userId = req.user.claims.sub;
      const card = await storage.updateVocabularyCard(id, cardData, userId);
      res.json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update vocabulary card" });
    }
  });

  app.delete("/api/vocabulary-cards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      await storage.deleteVocabularyCard(id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vocabulary card" });
    }
  });

  // Review Sessions
  app.get("/api/review-sessions/due", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getDueReviewSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch due review sessions" });
    }
  });

  app.post("/api/review-sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = insertReviewSessionSchema.parse(req.body);
      const session = await storage.createReviewSession(sessionData, userId);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review session" });
    }
  });

  app.get("/api/review-sessions/active", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getActiveReviewSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active review sessions" });
    }
  });

  app.get("/api/review-sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const session = await storage.getReviewSession(id, userId);
      if (!session) {
        return res.status(404).json({ message: "Review session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch review session" });
    }
  });

  app.put("/api/review-sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const sessionData = updateReviewSessionSchema.parse(req.body);
      const session = await storage.updateReviewSession(id, sessionData, userId);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update review session" });
    }
  });

  // Study Settings
  app.get("/api/study-settings", async (req, res) => {
    try {
      const settings = await storage.getStudySettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch study settings" });
    }
  });

  app.put("/api/study-settings", async (req, res) => {
    try {
      const settingsData = insertStudySettingsSchema.partial().parse(req.body);
      const settings = await storage.updateStudySettings(settingsData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update study settings" });
    }
  });

  // Analytics
  app.get("/api/analytics/mastery-levels", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const counts = await storage.getMasteryLevelCounts(userId);
      res.json(counts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mastery level counts" });
    }
  });

  app.get("/api/analytics/recent-activity", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activity = await storage.getRecentActivity(userId);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  app.get("/api/analytics/daily-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const stats = await storage.getStatsDateRange(start, end, userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily stats" });
    }
  });

  // Dictionary API proxy - Elementary Dictionary for kids with audio
  app.get("/api/dictionary/:word", async (req, res) => {
    try {
      const word = req.params.word;
      const apiKey = process.env.MERRIAM_WEBSTER_API_KEY;
      
      if (!apiKey || apiKey === "your-api-key") {
        return res.status(503).json({ 
          message: "Dictionary API key not configured",
          error: "API_KEY_MISSING"
        });
      }
      
      // Try School Dictionary (sd3) first - this matches your API subscription
      let response = await fetch(`https://www.dictionaryapi.com/api/v3/references/sd3/json/${word}?key=${apiKey}`);
      
      // If School Dictionary fails, try Elementary Dictionary as fallback
      if (!response.ok || response.status === 401) {
        response = await fetch(`https://www.dictionaryapi.com/api/v3/references/sd2/json/${word}?key=${apiKey}`);
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          return res.status(401).json({ 
            message: "Invalid API key or not subscribed to dictionary service",
            error: "INVALID_API_KEY"
          });
        }
        return res.status(response.status).json({ 
          message: "Dictionary API request failed",
          error: "API_REQUEST_FAILED"
        });
      }
      
      const data = await response.json();
      
      // Check if API returned error message instead of data
      if (typeof data === 'string' && data.includes('Invalid API key')) {
        return res.status(401).json({ 
          message: "Invalid API key or not subscribed to dictionary service",
          error: "INVALID_API_KEY"
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Dictionary API error:', error);
      res.status(500).json({ 
        message: "Failed to fetch dictionary data",
        error: "INTERNAL_ERROR"
      });
    }
  });

  // Export/Import functionality
  app.get("/api/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cards = await storage.getAllVocabularyCards(userId);
      const sessions = await storage.getActiveReviewSessions(userId);
      const settings = await storage.getStudySettings(userId);
      
      const exportData = {
        cards,
        sessions,
        settings,
        exportDate: new Date().toISOString(),
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="vocabulary-export.json"');
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  app.post("/api/import", async (req, res) => {
    try {
      const { cards, settings } = req.body;
      
      if (cards && Array.isArray(cards)) {
        for (const card of cards) {
          const cardData = insertVocabularyCardSchema.parse(card);
          await storage.createVocabularyCard(cardData);
        }
      }
      
      if (settings) {
        const settingsData = insertStudySettingsSchema.partial().parse(settings);
        await storage.updateStudySettings(settingsData);
      }
      
      res.json({ message: "Data imported successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid import data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to import data" });
    }
  });

  app.post("/api/reset", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Clear all data by creating new storage instance
      const cards = await storage.getAllVocabularyCards(userId);
      for (const card of cards) {
        await storage.deleteVocabularyCard(card.id, userId);
      }
      
      res.json({ message: "All data has been reset" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset data" });
    }
  });

  // Shared Deck Routes
  // Teacher assignments routes (for students)
  app.get("/api/teacher-assignments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assignments = await storage.getTeacherAssignments(userId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching teacher assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post("/api/teacher-assignments", isAuthenticated, async (req: any, res) => {
    try {
      const teacherId = req.user.claims.sub;
      const assignment = await storage.createTeacherAssignment(req.body, teacherId);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.get("/api/teacher-assignments/code/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const assignment = await storage.getAssignmentByCode(code);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching assignment by code:", error);
      res.status(500).json({ message: "Failed to fetch assignment" });
    }
  });

  app.post("/api/teacher-assignments/:id/import", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const result = await storage.importTeacherAssignment(parseInt(id), userId);
      res.json(result);
    } catch (error) {
      console.error("Error importing teacher assignment:", error);
      res.status(500).json({ message: "Failed to import assignment" });
    }
  });

  app.get("/api/teacher-collections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collections = await storage.getTeacherCollections(userId);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching teacher collections:", error);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  // Reset SRS system for testing
  app.post("/api/reset-srs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.resetSRSSystem(userId);
      res.json({ message: "SRS system reset successfully" });
    } catch (error) {
      console.error("Error resetting SRS system:", error);
      res.status(500).json({ message: "Failed to reset SRS system" });
    }
  });

  // Role management
  app.get("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const role = await storage.getUserRole(userId);
      res.json({ role });
    } catch (error) {
      console.error("Error getting user role:", error);
      res.status(500).json({ message: "Failed to get user role" });
    }
  });

  app.post("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      await storage.setUserRole(userId, role);
      res.json({ message: "Role updated successfully" });
    } catch (error) {
      console.error("Error setting user role:", error);
      res.status(500).json({ message: "Failed to set user role" });
    }
  });

  // Teacher classroom management
  app.post("/api/teacher/classroom", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRole = await storage.getUserRole(userId);
      if (userRole !== "teacher") {
        return res.status(403).json({ message: "Only teachers can create classrooms" });
      }
      const { name } = req.body;
      const user = await storage.getUser(userId);
      const classroom = await storage.createClassroom(name, user?.email || "");
      res.json(classroom);
    } catch (error) {
      console.error("Error creating classroom:", error);
      res.status(500).json({ message: "Failed to create classroom" });
    }
  });

  app.post("/api/teacher/reset-semester", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRole = await storage.getUserRole(userId);
      if (userRole !== "teacher") {
        return res.status(403).json({ message: "Only teachers can reset the semester" });
      }
      await storage.resetSystemForNewSemester(userId);
      res.json({ message: "System reset for new semester successfully" });
    } catch (error) {
      console.error("Error resetting semester:", error);
      res.status(500).json({ message: "Failed to reset semester" });
    }
  });

  // Student classroom joining
  app.post("/api/student/join-classroom", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { classCode } = req.body;
      await storage.joinClassroom(userId, classCode);
      res.json({ message: "Joined classroom successfully" });
    } catch (error) {
      console.error("Error joining classroom:", error);
      res.status(500).json({ message: "Failed to join classroom" });
    }
  });

  // Get public shared decks
  app.get("/api/shared-decks/public", async (req, res) => {
    try {
      const decks = await storage.getAllPublicSharedDecks();
      res.json(decks);
    } catch (error) {
      console.error("Error fetching public shared decks:", error);
      res.status(500).json({ message: "Failed to fetch public shared decks" });
    }
  });

  // Get user's shared decks
  app.get("/api/shared-decks/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const decks = await storage.getUserSharedDecks(userId);
      res.json(decks);
    } catch (error) {
      console.error("Error fetching user's shared decks:", error);
      res.status(500).json({ message: "Failed to fetch user's shared decks" });
    }
  });

  // Get shared deck by ID
  app.get("/api/shared-decks/:id", async (req, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const deck = await storage.getSharedDeck(deckId);
      
      if (!deck) {
        return res.status(404).json({ message: "Shared deck not found" });
      }
      
      res.json(deck);
    } catch (error) {
      console.error("Error fetching shared deck:", error);
      res.status(500).json({ message: "Failed to fetch shared deck" });
    }
  });

  // Get shared deck by share code
  app.get("/api/shared-decks/code/:shareCode", async (req, res) => {
    try {
      const { shareCode } = req.params;
      const deck = await storage.getSharedDeckByCode(shareCode);
      
      if (!deck) {
        return res.status(404).json({ message: "Shared deck not found" });
      }
      
      res.json(deck);
    } catch (error) {
      console.error("Error fetching shared deck by code:", error);
      res.status(500).json({ message: "Failed to fetch shared deck" });
    }
  });

  // Create shared deck
  app.post("/api/shared-decks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deck = await storage.createSharedDeck(req.body, userId);
      res.status(201).json(deck);
    } catch (error) {
      console.error("Error creating shared deck:", error);
      res.status(500).json({ message: "Failed to create shared deck" });
    }
  });

  // Update shared deck
  app.patch("/api/shared-decks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deckId = parseInt(req.params.id);
      const deck = await storage.updateSharedDeck(deckId, req.body, userId);
      res.json(deck);
    } catch (error) {
      console.error("Error updating shared deck:", error);
      res.status(500).json({ message: "Failed to update shared deck" });
    }
  });

  // Delete shared deck
  app.delete("/api/shared-decks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deckId = parseInt(req.params.id);
      await storage.deleteSharedDeck(deckId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting shared deck:", error);
      res.status(500).json({ message: "Failed to delete shared deck" });
    }
  });

  // Get shared deck cards
  app.get("/api/shared-decks/:id/cards", async (req, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const cards = await storage.getSharedDeckCards(deckId);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching shared deck cards:", error);
      res.status(500).json({ message: "Failed to fetch shared deck cards" });
    }
  });

  // Add card to shared deck
  app.post("/api/shared-decks/:id/cards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deckId = parseInt(req.params.id);
      const { cardId } = req.body;
      
      const deckCard = await storage.addCardToSharedDeck(deckId, cardId, userId);
      res.status(201).json(deckCard);
    } catch (error) {
      console.error("Error adding card to shared deck:", error);
      res.status(500).json({ message: "Failed to add card to shared deck" });
    }
  });

  // Remove card from shared deck
  app.delete("/api/shared-decks/:deckId/cards/:cardId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deckId = parseInt(req.params.deckId);
      const cardId = parseInt(req.params.cardId);
      
      await storage.removeCardFromSharedDeck(deckId, cardId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing card from shared deck:", error);
      res.status(500).json({ message: "Failed to remove card from shared deck" });
    }
  });

  // Import shared deck
  app.post("/api/shared-decks/:id/import", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deckId = parseInt(req.params.id);
      
      const importRecord = await storage.importSharedDeck(deckId, userId);
      res.status(201).json(importRecord);
    } catch (error) {
      console.error("Error importing shared deck:", error);
      res.status(500).json({ message: "Failed to import shared deck" });
    }
  });

  // Teacher Dashboard Routes
  app.post("/api/teacher/classroom", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRole = await storage.getUserRole(userId);
      if (userRole !== "teacher") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Classroom name is required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const classroom = await storage.createClassroom(name.trim(), user.email);
      res.json(classroom);
    } catch (error) {
      console.error("Error creating classroom:", error);
      res.status(500).json({ message: "Failed to create classroom" });
    }
  });

  app.post("/api/teacher/reset-semester", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRole = await storage.getUserRole(userId);
      if (userRole !== "teacher") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.resetSystemForNewSemester(userId);
      res.json({ message: "System reset for new semester successfully" });
    } catch (error) {
      console.error("Error resetting semester:", error);
      res.status(500).json({ message: "Failed to reset semester" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
