import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  analyzeEmotion, 
  generateSupportiveResponse, 
  generateWellbeingTips,
  getChatbotResponse 
} from "./openai";
import { textToSpeech } from "./tts";
import { 
  insertMoodSchema, 
  insertPostSchema,
  insertCommentSchema,
  insertReactionSchema,
  insertChatMessageSchema,
  moodTypes,
  reactionTypes
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication endpoints
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Get mood types
  app.get("/api/moods/types", (req, res) => {
    res.json(moodTypes);
  });

  // Create new mood entry
  app.post("/api/moods", requireAuth, async (req, res, next) => {
    try {
      const validatedData = insertMoodSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const mood = await storage.createMood(validatedData);
      res.status(201).json(mood);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mood data", errors: error.errors });
      }
      next(error);
    }
  });

  // Get user's mood history
  app.get("/api/moods", requireAuth, async (req, res, next) => {
    try {
      const moods = await storage.getMoodsByUserId(req.user.id);
      res.json(moods);
    } catch (error) {
      next(error);
    }
  });

  // Create new post
  app.post("/api/posts", requireAuth, async (req, res, next) => {
    try {
      const validatedData = insertPostSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const post = await storage.createPost(validatedData);
      
      // Generate AI response
      const aiResponse = await generateSupportiveResponse(post.content, post.mood);
      
      await storage.createAiResponse({
        postId: post.id,
        content: aiResponse
      });
      
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      next(error);
    }
  });

  // Get all posts with AI responses
  app.get("/api/posts", requireAuth, async (req, res, next) => {
    try {
      const posts = await storage.getAllPosts();
      
      // Enhance posts with AI responses and reaction counts
      const enhancedPosts = await Promise.all(posts.map(async (post) => {
        const aiResponse = await storage.getAiResponseByPostId(post.id);
        const reactions = await storage.getReactionsByPostId(post.id);
        const comments = await storage.getCommentsByPostId(post.id);
        
        // Count reactions by type
        const reactionCounts = reactionTypes.reduce((acc, { type }) => {
          acc[type] = reactions.filter(r => r.type === type).length;
          return acc;
        }, {} as Record<string, number>);
        
        // Get user object (without password)
        const user = await storage.getUser(post.userId);
        const username = user ? user.username : "Anonymous";
        
        return {
          ...post,
          username,
          aiResponse: aiResponse?.content || null,
          reactions: reactionCounts,
          commentCount: comments.length
        };
      }));
      
      res.json(enhancedPosts);
    } catch (error) {
      next(error);
    }
  });

  // Create reaction to a post
  app.post("/api/posts/:postId/reactions", requireAuth, async (req, res, next) => {
    try {
      const { postId } = req.params;
      
      const post = await storage.getPostById(Number(postId));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const validatedData = insertReactionSchema.parse({
        ...req.body,
        postId: Number(postId),
        userId: req.user.id
      });
      
      const reaction = await storage.createReaction(validatedData);
      res.status(201).json(reaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reaction data", errors: error.errors });
      }
      next(error);
    }
  });

  // Create comment on a post
  app.post("/api/posts/:postId/comments", requireAuth, async (req, res, next) => {
    try {
      const { postId } = req.params;
      
      const post = await storage.getPostById(Number(postId));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        postId: Number(postId),
        userId: req.user.id
      });
      
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      next(error);
    }
  });

  // Get comments for a post
  app.get("/api/posts/:postId/comments", requireAuth, async (req, res, next) => {
    try {
      const { postId } = req.params;
      
      const comments = await storage.getCommentsByPostId(Number(postId));
      
      // Enhance comments with username
      const enhancedComments = await Promise.all(comments.map(async (comment) => {
        const user = await storage.getUser(comment.userId);
        return {
          ...comment,
          username: user ? user.username : "Anonymous",
        };
      }));
      
      res.json(enhancedComments);
    } catch (error) {
      next(error);
    }
  });

  // Chat endpoints
  app.post("/api/chat", requireAuth, async (req, res, next) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Save user message
      const userMessage = await storage.createChatMessage({
        userId: req.user.id,
        content: message,
        isUserMessage: true
      });
      
      // Get chat history
      const chatHistory = await storage.getChatMessagesByUserId(req.user.id);
      
      // Generate AI response
      const aiResponseText = await getChatbotResponse(
        chatHistory,
        req.user.username
      );
      
      // Save AI response
      const aiMessage = await storage.createChatMessage({
        userId: req.user.id,
        content: aiResponseText,
        isUserMessage: false
      });
      
      res.json({ 
        userMessage, 
        aiMessage 
      });
    } catch (error) {
      next(error);
    }
  });

  // Get chat history
  app.get("/api/chat", requireAuth, async (req, res, next) => {
    try {
      const messages = await storage.getChatMessagesByUserId(req.user.id);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  // Text-to-speech endpoint
  app.post("/api/tts", requireAuth, async (req, res, next) => {
    try {
      const { text, voiceType, speakingRate } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const audio = await textToSpeech(
        text,
        voiceType || undefined,
        speakingRate || undefined
      );
      
      res.set('Content-Type', 'audio/mpeg');
      res.send(audio);
    } catch (error) {
      next(error);
    }
  });

  // Analytics endpoints
  app.get("/api/analytics", requireAuth, async (req, res, next) => {
    try {
      const moods = await storage.getMoodsByUserId(req.user.id);
      const posts = await storage.getPostsByUserId(req.user.id);
      
      // Generate wellbeing tips based on mood history
      const wellbeingData = await generateWellbeingTips(moods);
      
      // Calculate mood distribution
      const moodDistribution = moodTypes.reduce((acc, { label }) => {
        const count = moods.filter(m => m.mood === label).length;
        const percentage = moods.length > 0 ? Math.round((count / moods.length) * 100) : 0;
        acc[label] = { count, percentage };
        return acc;
      }, {} as Record<string, { count: number; percentage: number }>);
      
      // Calculate overall mood score (simple algorithm)
      const moodScores: Record<string, number> = {
        "Happy": 90,
        "Calm": 70,
        "Sad": 40,
        "Angry": 30,
        "Irritated": 35,
        "Exhausted": 50
      };
      
      let overallScore = 0;
      if (moods.length > 0) {
        const totalScore = moods.reduce((sum, mood) => {
          return sum + (moodScores[mood.mood] || 50);
        }, 0);
        overallScore = Math.round(totalScore / moods.length);
      }
      
      // Group moods by day for chart data
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });
      
      const moodsByDay = last7Days.map(day => {
        const dayMoods = moods.filter(mood => 
          mood.createdAt.toISOString().split('T')[0] === day
        );
        
        return {
          date: day,
          count: dayMoods.length,
          moods: dayMoods.map(m => m.mood)
        };
      });
      
      res.json({
        moodDistribution,
        overallScore,
        moodsByDay,
        insights: wellbeingData.insights,
        wellbeingTips: wellbeingData.tips,
        totalPosts: posts.length,
        totalMoodEntries: moods.length
      });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
