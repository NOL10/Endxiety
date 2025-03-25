import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { moodTypes, reactionTypes } from "@shared/schema";

// Navbar component for reuse
import NavBar from "./components/NavBar";

// Types
interface Post {
  id: number;
  content: string;
  mood: string | null;
  createdAt: string;
  username: string;
  aiResponse: string | null;
  reactions: Record<string, number>;
  commentCount: number;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostMood, setNewPostMood] = useState<string | null>(null);
  const [isNewPostDialogOpen, setIsNewPostDialogOpen] = useState(false);

  // Fetch posts
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  // Create new post
  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string, mood: string | null }) => {
      const res = await apiRequest("POST", "/api/posts", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPostContent("");
      setNewPostMood(null);
      setIsNewPostDialogOpen(false);
      toast({
        title: "Post created",
        description: "Your post has been shared with the community."
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Add reaction to post
  const addReactionMutation = useMutation({
    mutationFn: async ({ postId, type }: { postId: number, type: string }) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/reactions`, { type });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error) => {
      toast({
        title: "Error adding reaction",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handlePostSubmit = () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Post cannot be empty",
        description: "Please write something to share with the community.",
        variant: "destructive"
      });
      return;
    }

    createPostMutation.mutate({
      content: newPostContent,
      mood: newPostMood
    });
  };

  const handleReaction = (postId: number, type: string) => {
    addReactionMutation.mutate({ postId, type });
  };

  const getMoodEmoji = (moodLabel: string | null) => {
    if (!moodLabel) return null;
    const mood = moodTypes.find(m => m.label === moodLabel);
    return mood ? mood.emoji : null;
  };

  return (
    <>
      <NavBar active="community" />
      
      <main className="pt-16 min-h-screen bg-neutral-100">
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display font-bold text-2xl">Community Feed</h2>
              <Dialog open={isNewPostDialogOpen} onOpenChange={setIsNewPostDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center text-white bg-primary hover:bg-primary-dark">
                    <i className="fas fa-plus-circle mr-2"></i>
                    <span>New Post</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share with the community</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="What's on your mind?"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                    <div>
                      <p className="text-sm font-medium mb-2">How are you feeling?</p>
                      <div className="flex flex-wrap gap-2">
                        {moodTypes.map((mood) => (
                          <Button
                            key={mood.label}
                            variant={newPostMood === mood.label ? "default" : "outline"}
                            onClick={() => setNewPostMood(mood.label)}
                            className="flex items-center"
                          >
                            <span className="mr-1">{mood.emoji}</span>
                            {mood.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button 
                      onClick={handlePostSubmit}
                      className="w-full bg-primary hover:bg-primary-dark"
                      disabled={createPostMutation.isPending}
                    >
                      {createPostMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Share Post
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* AI Recommended Posts */}
            <div className="mb-10">
              <h3 className="font-display font-semibold text-lg text-neutral-700 mb-4">
                <i className="fas fa-lightbulb text-accent mr-2"></i>
                Recommended for you
              </h3>
              
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.slice(0, 2).map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onReaction={handleReaction} 
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-neutral-500">No posts available yet. Be the first to share!</p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Community Posts */}
            <div>
              <h3 className="font-display font-semibold text-lg text-neutral-700 mb-4">
                <i className="fas fa-users text-secondary mr-2"></i>
                Community Posts
              </h3>
              
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.slice(2).map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onReaction={handleReaction} 
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-neutral-500">No posts available yet. Be the first to share!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// Post Card Component
function PostCard({ post, onReaction }: { post: Post, onReaction: (postId: number, type: string) => void }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPp");
  };

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <Card className="shadow-card">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary">
              <span className="font-semibold">{getInitial(post.username)}</span>
            </div>
            <div className="ml-3">
              <div className="font-medium">{post.username}</div>
              <div className="text-sm text-neutral-500">{formatDate(post.createdAt)}</div>
            </div>
          </div>
          {post.mood && (
            <div className="text-xl">{moodTypes.find(m => m.label === post.mood)?.emoji}</div>
          )}
        </div>
        
        <p className="text-neutral-700 mb-4">{post.content}</p>
        
        {post.aiResponse && (
          <div className="p-4 rounded-lg bg-neutral-100 mb-4">
            <div className="flex items-start">
              <div className="text-primary-dark mr-2">
                <i className="fas fa-robot"></i>
              </div>
              <div>
                <div className="font-medium text-primary-dark mb-1">EmoCare AI</div>
                <p className="text-neutral-700">{post.aiResponse}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <div className="flex flex-wrap gap-2">
          {reactionTypes.map((reaction) => (
            <Button
              key={reaction.type}
              variant="outline"
              size="sm"
              className="inline-flex items-center rounded-full"
              onClick={() => onReaction(post.id, reaction.type)}
            >
              <i className={`${reaction.icon} text-primary mr-1`}></i>
              <span>{reaction.label} ({post.reactions[reaction.type] || 0})</span>
            </Button>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
