import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Mic, VolumeX, Volume2 } from "lucide-react";
import { speakText, stopSpeaking } from "@/lib/text-to-speech";
import { Slider } from "@/components/ui/slider";

// Navbar component for reuse
import NavBar from "./components/NavBar";

// Types
interface ChatMessage {
  id: number;
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}

// Voice options
const voiceOptions = [
  { value: "en-US-Neural2-F", label: "Calming Female" },
  { value: "en-US-Neural2-C", label: "Warm Female" },
  { value: "en-US-Neural2-D", label: "Gentle Male" },
  { value: "en-US-Neural2-A", label: "Supportive Male" },
];

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [voiceType, setVoiceType] = useState(voiceOptions[0].value);
  const [speakingRate, setSpeakingRate] = useState(1.0);
  const [isTyping, setIsTyping] = useState(false);

  // Fetch chat messages
  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat"],
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/chat", { message: content });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setIsTyping(true);
    sendMessageMutation.mutate(message);
    
    // Simulate AI typing
    setTimeout(() => setIsTyping(false), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleSpeakMessage = (text: string) => {
    speakText(text, voiceType, speakingRate);
  };

  const testVoice = () => {
    speakText("Hello, I'm your EmoCare assistant. How can I help you today?", voiceType, speakingRate);
  };

  return (
    <>
      <NavBar active="chat" />
      
      <main className="pt-16 min-h-screen bg-neutral-100">
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* AI Assistant Info */}
              <div className="w-full sm:w-1/3">
                <Card className="shadow-card h-full">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center mb-5">
                      <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center text-primary mb-3">
                        <i className="fas fa-robot text-4xl"></i>
                      </div>
                      <h3 className="font-display font-semibold text-xl text-center">EmoCare Assistant</h3>
                      <p className="text-sm text-neutral-600 text-center mt-1">Your personal emotional support companion</p>
                    </div>
                    
                    <div className="border-t border-neutral-200 pt-4">
                      <h4 className="font-medium text-neutral-700 mb-2">Voice Settings</h4>
                      <div className="mb-3">
                        <Label htmlFor="voice-type">Voice Type</Label>
                        <Select value={voiceType} onValueChange={setVoiceType}>
                          <SelectTrigger id="voice-type">
                            <SelectValue placeholder="Select a voice" />
                          </SelectTrigger>
                          <SelectContent>
                            {voiceOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="mb-3">
                        <Label className="mb-2">
                          Speaking Rate: {speakingRate.toFixed(1)}
                        </Label>
                        <Slider
                          value={[speakingRate]}
                          min={0.5}
                          max={1.5}
                          step={0.1}
                          onValueChange={(value) => setSpeakingRate(value[0])}
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={testVoice}
                          variant="outline"
                          className="flex-1"
                        >
                          <Volume2 className="h-4 w-4 mr-2" />
                          Test Voice
                        </Button>
                        <Button
                          onClick={stopSpeaking}
                          variant="outline"
                          className="flex-1"
                        >
                          <VolumeX className="h-4 w-4 mr-2" />
                          Stop
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-t border-neutral-200 pt-4 mt-4">
                      <h4 className="font-medium text-neutral-700 mb-3">How I can help:</h4>
                      <ul className="text-sm text-neutral-600 space-y-2">
                        <li className="flex items-start">
                          <i className="fas fa-check-circle text-secondary mt-1 mr-2"></i>
                          <span>Listen and respond to your feelings</span>
                        </li>
                        <li className="flex items-start">
                          <i className="fas fa-check-circle text-secondary mt-1 mr-2"></i>
                          <span>Provide emotional support and guidance</span>
                        </li>
                        <li className="flex items-start">
                          <i className="fas fa-check-circle text-secondary mt-1 mr-2"></i>
                          <span>Suggest coping strategies and self-care tips</span>
                        </li>
                        <li className="flex items-start">
                          <i className="fas fa-check-circle text-secondary mt-1 mr-2"></i>
                          <span>Help you reflect on your emotional patterns</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Chat Interface */}
              <div className="w-full sm:w-2/3">
                <Card className="shadow-card flex flex-col h-[600px]">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-neutral-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary mr-3">
                        <i className="fas fa-robot"></i>
                      </div>
                      <div>
                        <h3 className="font-display font-semibold">EmoCare Assistant</h3>
                        <div className="flex items-center text-xs text-neutral-500">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                          <span>Online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : messages && messages.length > 0 ? (
                      <>
                        {messages.map((msg) => (
                          <div 
                            key={msg.id} 
                            className={msg.isUserMessage ? "flex items-end justify-end" : "flex items-end"}
                          >
                            {!msg.isUserMessage && (
                              <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary mr-2 flex-shrink-0">
                                <i className="fas fa-robot text-sm"></i>
                              </div>
                            )}
                            <div 
                              className={
                                msg.isUserMessage 
                                  ? "max-w-[80%] bg-primary text-white rounded-t-xl rounded-l-xl p-3"
                                  : "max-w-[80%] bg-neutral-100 rounded-t-xl rounded-r-xl p-3"
                              }
                            >
                              <p>{msg.content}</p>
                              {!msg.isUserMessage && (
                                <div className="mt-1 text-right">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleSpeakMessage(msg.content)}
                                  >
                                    <Volume2 className="h-4 w-4 text-primary" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* AI is typing indicator */}
                        {isTyping && (
                          <div className="flex items-end">
                            <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary mr-2 flex-shrink-0">
                              <i className="fas fa-robot text-sm"></i>
                            </div>
                            <div className="max-w-[80%] bg-neutral-100 rounded-t-xl rounded-r-xl p-3">
                              <div className="flex space-x-1">
                                <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500">
                        <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-primary mb-4">
                          <i className="fas fa-robot text-2xl"></i>
                        </div>
                        <p className="font-medium mb-2">Welcome to your personal chat</p>
                        <p className="text-sm">Type a message to start talking with your EmoCare assistant</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Chat Input */}
                  <div className="p-4 border-t border-neutral-200">
                    <div className="flex items-center">
                      <Button size="icon" variant="ghost" className="mr-2">
                        <Mic className="h-5 w-5 text-primary" />
                      </Button>
                      <Input
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button 
                        size="icon" 
                        className="ml-2 bg-primary hover:bg-primary-dark"
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500 flex items-center">
                      <i className="fas fa-lock mr-1"></i>
                      <span>Private conversation - Not shared with community</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
