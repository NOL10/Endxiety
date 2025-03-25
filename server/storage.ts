import { 
  User, InsertUser, 
  Mood, InsertMood, 
  Post, InsertPost, 
  Reaction, InsertReaction, 
  Comment, InsertComment, 
  AiResponse, InsertAiResponse, 
  ChatMessage, InsertChatMessage
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Mood methods
  createMood(mood: InsertMood): Promise<Mood>;
  getMoodsByUserId(userId: number): Promise<Mood[]>;
  
  // Post methods
  createPost(post: InsertPost): Promise<Post>;
  getPostById(id: number): Promise<Post | undefined>;
  getAllPosts(): Promise<Post[]>;
  getPostsByUserId(userId: number): Promise<Post[]>;
  
  // Reaction methods
  createReaction(reaction: InsertReaction): Promise<Reaction>;
  getReactionsByPostId(postId: number): Promise<Reaction[]>;
  
  // Comment methods
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  
  // AI Response methods
  createAiResponse(response: InsertAiResponse): Promise<AiResponse>;
  getAiResponseByPostId(postId: number): Promise<AiResponse | undefined>;
  
  // Chat methods
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByUserId(userId: number): Promise<ChatMessage[]>;

  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private moods: Map<number, Mood>;
  private posts: Map<number, Post>;
  private reactions: Map<number, Reaction>;
  private comments: Map<number, Comment>;
  private aiResponses: Map<number, AiResponse>;
  private chatMessages: Map<number, ChatMessage>;
  
  private userIdCounter: number;
  private moodIdCounter: number;
  private postIdCounter: number;
  private reactionIdCounter: number;
  private commentIdCounter: number;
  private aiResponseIdCounter: number;
  private chatMessageIdCounter: number;
  
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.moods = new Map();
    this.posts = new Map();
    this.reactions = new Map();
    this.comments = new Map();
    this.aiResponses = new Map();
    this.chatMessages = new Map();
    
    this.userIdCounter = 1;
    this.moodIdCounter = 1;
    this.postIdCounter = 1;
    this.reactionIdCounter = 1;
    this.commentIdCounter = 1;
    this.aiResponseIdCounter = 1;
    this.chatMessageIdCounter = 1;
    
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Mood methods
  async createMood(insertMood: InsertMood): Promise<Mood> {
    const id = this.moodIdCounter++;
    const now = new Date();
    const mood: Mood = { 
      id,
      userId: insertMood.userId, 
      mood: insertMood.mood,
      note: insertMood.note ?? null, 
      createdAt: now 
    };
    this.moods.set(id, mood);
    return mood;
  }

  async getMoodsByUserId(userId: number): Promise<Mood[]> {
    return Array.from(this.moods.values())
      .filter(mood => mood.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Post methods
  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.postIdCounter++;
    const now = new Date();
    const post: Post = { 
      id,
      userId: insertPost.userId,
      content: insertPost.content,
      mood: insertPost.mood ?? null,
      createdAt: now 
    };
    this.posts.set(id, post);
    return post;
  }

  async getPostById(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPostsByUserId(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Reaction methods
  async createReaction(insertReaction: InsertReaction): Promise<Reaction> {
    const id = this.reactionIdCounter++;
    const now = new Date();
    const reaction: Reaction = { ...insertReaction, id, createdAt: now };
    this.reactions.set(id, reaction);
    return reaction;
  }

  async getReactionsByPostId(postId: number): Promise<Reaction[]> {
    return Array.from(this.reactions.values())
      .filter(reaction => reaction.postId === postId);
  }

  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const comment: Comment = { ...insertComment, id, createdAt: now };
    this.comments.set(id, comment);
    return comment;
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // AI Response methods
  async createAiResponse(insertResponse: InsertAiResponse): Promise<AiResponse> {
    const id = this.aiResponseIdCounter++;
    const now = new Date();
    const response: AiResponse = { ...insertResponse, id, createdAt: now };
    this.aiResponses.set(id, response);
    return response;
  }

  async getAiResponseByPostId(postId: number): Promise<AiResponse | undefined> {
    return Array.from(this.aiResponses.values())
      .find(response => response.postId === postId);
  }

  // Chat methods
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageIdCounter++;
    const now = new Date();
    const message: ChatMessage = { ...insertMessage, id, createdAt: now };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessagesByUserId(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export const storage = new MemStorage();
