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
                <span className="text-primary font-display font-bold text-xl">EmoCare</span>
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
            <h1 className="font-display font-bold text-4xl md:text-5xl text-neutral-800 mb-6">Your Emotional Support Companion</h1>
            <p className="text-neutral-600 text-lg mb-8">A safe space to share, understand, and improve your emotional wellbeing - completely anonymous and supportive.</p>
            
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
              <div className="bg-white p-6 rounded-xl shadow-card">
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-comment-dots text-primary text-2xl"></i>
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">Anonymous Sharing</h3>
                <p className="text-neutral-600">Express yourself freely with complete anonymity and no judgment.</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-card">
                <div className="w-16 h-16 bg-secondary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-brain text-secondary text-2xl"></i>
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">AI Companion</h3>
                <p className="text-neutral-600">Talk to our empathetic AI that understands your emotions and provides support.</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-card">
                <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-line text-accent text-2xl"></i>
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">Mood Insights</h3>
                <p className="text-neutral-600">Track your emotional patterns and discover helpful insights to improve wellbeing.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
