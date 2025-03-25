import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { moodTypes } from "@shared/schema";
import { Loader2 } from "lucide-react";

// Navbar component for reuse
import NavBar from "./components/NavBar";

export default function MoodTrackerPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, logoutMutation } = useAuth();
  
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState<string>("");

  const moodMutation = useMutation({
    mutationFn: async (data: { mood: string, note: string }) => {
      const res = await apiRequest("POST", "/api/moods", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moods"] });
      toast({
        title: "Mood tracked",
        description: "Your mood has been recorded successfully.",
      });
      navigate("/community");
    },
    onError: (error) => {
      toast({
        title: "Error saving mood",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMoodSelection = (mood: string) => {
    setSelectedMood(mood);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
  };

  const handleSubmit = () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "Choose an emoji that represents how you feel today.",
        variant: "destructive",
      });
      return;
    }

    moodMutation.mutate({
      mood: selectedMood,
      note: note,
    });
  };

  // Add CSS classes for mood selector
  const getMoodClasses = (mood: string) => {
    let classes = "emoji-selector bg-white rounded-xl shadow-soft p-4 text-center cursor-pointer hover:transform hover:-translate-y-1 transition-transform";
    if (selectedMood === mood) {
      classes += " ring-2 ring-primary";
    }
    return classes;
  };

  return (
    <>
      <NavBar active="mood" />
      
      <main className="pt-16 min-h-screen bg-neutral-100">
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-3xl mb-3">How are you feeling today?</h2>
              <p className="text-neutral-600">Select the emoji that best represents your current emotional state</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              {moodTypes.map((mood) => (
                <div 
                  key={mood.label}
                  className={getMoodClasses(mood.label)}
                  onClick={() => handleMoodSelection(mood.label)}
                >
                  <div className="text-5xl mb-2">{mood.emoji}</div>
                  <div className="font-medium text-neutral-700">{mood.label}</div>
                </div>
              ))}
            </div>
            
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h3 className="font-display font-semibold text-lg mb-3">Care to share more?</h3>
                <Textarea
                  className="resize-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="What's on your mind today? (optional)"
                  rows={4}
                  value={note}
                  onChange={handleNoteChange}
                />
              </CardContent>
            </Card>
            
            <div className="text-center">
              <Button
                onClick={handleSubmit}
                size="lg"
                className="bg-primary hover:bg-primary-dark shadow-soft"
                disabled={moodMutation.isPending}
              >
                {moodMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Submit
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
