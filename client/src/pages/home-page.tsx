import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/mood");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Navigation */}
      <nav className="bg-white shadow-soft fixed w-full z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-primary font-display font-bold text-2xl">Endxiety</span>
              </div>
            </div>
            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                <Button onClick={() => navigate("/")} variant="ghost">Home</Button>
                <Button onClick={() => navigate("/mood")} variant="ghost">Mood Tracker</Button>
                <Button onClick={() => navigate("/community")} variant="ghost">Community</Button>
                <Button onClick={() => navigate("/chat")} variant="ghost">Personal Chat</Button>
                <Button onClick={() => navigate("/analytics")} variant="ghost">Analytics</Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Button onClick={() => navigate("/auth")} variant="ghost">Login / Register</Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16">
        <div className="container mx-auto px-4 py-12 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display font-bold text-4xl md:text-6xl text-neutral-800 mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">End Anxiety.</span> Begin Peace.
            </h1>
            <p className="text-neutral-600 text-lg md:text-xl mb-8">Your personal AI-powered sanctuary for managing anxiety, building resilience, and finding community support - completely anonymous and judgment-free.</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-primary hover:bg-primary-dark text-white shadow-soft"
              >
                Get Started
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-primary text-primary hover:bg-neutral-100 shadow-soft"
              >
                Learn More
              </Button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-t-4 border-purple-500">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <i className="fas fa-comment-alt text-white text-2xl"></i>
                </div>
                <h3 className="font-display font-semibold text-xl mb-3 text-center">Safe Space</h3>
                <p className="text-neutral-600 text-center">Share your anxiety triggers and experiences with complete anonymity in a supportive environment.</p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-t-4 border-indigo-500">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <i className="fas fa-robot text-white text-2xl"></i>
                </div>
                <h3 className="font-display font-semibold text-xl mb-3 text-center">AI Therapy Companion</h3>
                <p className="text-neutral-600 text-center">Talk to our empathetic AI with voice support that helps identify anxiety patterns and provides real-time coping strategies.</p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-t-4 border-blue-500">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <i className="fas fa-chart-bar text-white text-2xl"></i>
                </div>
                <h3 className="font-display font-semibold text-xl mb-3 text-center">Anxiety Insights</h3>
                <p className="text-neutral-600 text-center">Visualize your anxiety patterns and receive personalized strategies to build resilience and mental strength.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
