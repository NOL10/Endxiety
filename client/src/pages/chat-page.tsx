import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Mic, VolumeX, Volume2, PauseCircle } from "lucide-react";
import { speakText, stopSpeaking, VOICE_OPTIONS, getMuted, setMuted } from "@/lib/text-to-speech";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Navbar component for reuse
import NavBar from "./components/NavBar";

// Types
interface ChatMessage {
  id: number;
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [voiceType, setVoiceType] = useState<string>("female");
  const [speakingRate, setSpeakingRate] = useState(1.0);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(getMuted());
  
  // For speech recognition
  const recognitionRef = useRef<any>(null);
  
  // Fetch chat messages
  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat"],
  });

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        
        setMessage(transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        
        toast({
          title: "Microphone Error",
          description: "Could not access your microphone. Please check permissions.",
          variant: "destructive",
        });
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

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
    setTimeout(() => setIsTyping(false), 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleSpeakMessage = (text: string) => {
    if (isMuted) return;
    speakText(text, voiceType, speakingRate);
  };

  const testVoice = () => {
    if (isMuted) return;
    speakText("Hello, I'm your AI therapy companion. How are you feeling today?", voiceType, speakingRate);
  };
  
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setMuted(newMuted);
    
    if (newMuted) {
      stopSpeaking();
    }
  };
  
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser doesn't support voice input.",
        variant: "destructive",
      });
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // Clear previous message when starting new recording
      setMessage("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  return (
    <>
      <NavBar active="chat" />
      
      <main className="pt-16 min-h-screen bg-neutral-50">
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col space-y-4">
              <h1 className="text-3xl font-bold text-gray-800">AI Therapy</h1>
              <p className="text-gray-600">Your personal AI therapist helps manage anxiety with personalized strategies.</p>
              
              <div className="flex flex-col lg:flex-row gap-6 mt-4">
                {/* Left Side - AI Assistant Info */}
                <div className="w-full lg:w-1/3 space-y-4">
                  <Card className="shadow-md bg-white overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                      <h3 className="font-bold text-xl flex items-center">
                        <i className="fas fa-robot mr-2"></i>
                        AI Therapy Companion
                      </h3>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-1">
                          <h4 className="font-medium text-gray-800 flex items-center mb-2">
                            <i className="fas fa-volume-up mr-2 text-indigo-600"></i>
                            Voice Settings
                          </h4>
                          
                          <div className="flex items-center justify-between mb-3">
                            <Label htmlFor="voice-mute">Voice Output</Label>
                            <Switch 
                              id="voice-mute" 
                              checked={!isMuted} 
                              onCheckedChange={() => toggleMute()}
                            />
                          </div>
                          
                          <div className="mb-3">
                            <Label htmlFor="voice-type">Voice Style</Label>
                            <Select 
                              value={voiceType} 
                              onValueChange={setVoiceType}
                              disabled={isMuted}
                            >
                              <SelectTrigger id="voice-type" className="mt-1">
                                <SelectValue placeholder="Select a voice" />
                              </SelectTrigger>
                              <SelectContent>
                                {VOICE_OPTIONS.map((option) => (
                                  <SelectItem key={option.id} value={option.id}>
                                    {option.icon} {option.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between mb-1">
                              <Label htmlFor="speaking-rate">Speaking Rate</Label>
                              <span className="text-sm text-gray-500">
                                {speakingRate.toFixed(1)}x
                              </span>
                            </div>
                            <Slider
                              id="speaking-rate"
                              value={[speakingRate]}
                              min={0.5}
                              max={1.5}
                              step={0.1}
                              disabled={isMuted}
                              onValueChange={(value) => setSpeakingRate(value[0])}
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="flex space-x-2 pt-2">
                            <Button
                              onClick={testVoice}
                              variant="outline"
                              disabled={isMuted}
                              className="flex-1"
                            >
                              <Volume2 className="h-4 w-4 mr-2" />
                              Test
                            </Button>
                            <Button
                              onClick={stopSpeaking}
                              variant="outline"
                              disabled={isMuted}
                              className="flex-1"
                            >
                              <VolumeX className="h-4 w-4 mr-2" />
                              Stop
                            </Button>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="font-medium text-gray-800 flex items-center mb-2">
                            <i className="fas fa-info-circle mr-2 text-indigo-600"></i>
                            How I Can Help
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start">
                              <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                              <span>Identify anxiety patterns and triggers</span>
                            </li>
                            <li className="flex items-start">
                              <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                              <span>Provide personalized coping strategies</span>
                            </li>
                            <li className="flex items-start">
                              <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                              <span>Guide breathing and relaxation exercises</span>
                            </li>
                            <li className="flex items-start">
                              <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                              <span>Track your progress over time</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-4">
                          <Badge variant="outline" className="text-xs text-gray-500 bg-gray-50">
                            <i className="fas fa-lock mr-1"></i>
                            Private & Secure
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Right Side - Chat Interface */}
                <div className="w-full lg:w-2/3">
                  <Card className="shadow-md bg-white overflow-hidden flex flex-col h-[600px]">
                    {/* Chat Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white mr-3">
                          <i className="fas fa-brain text-xl"></i>
                        </div>
                        <div>
                          <h3 className="font-semibold">AI Therapist</h3>
                          <div className="flex items-center text-xs opacity-80">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1"></span>
                            <span>Active Now</span>
                          </div>
                        </div>
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={toggleMute} className="h-8 text-white hover:bg-white/10">
                              {isMuted ? (
                                <VolumeX className="h-4 w-4" />
                              ) : (
                                <Volume2 className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isMuted ? "Unmute Voice" : "Mute Voice"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {/* Chat Messages Area */}
                    <div 
                      className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50"
                      style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E')",
                      backgroundAttachment: "fixed"
                    }}
                    >
                      {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                      ) : messages && messages.length > 0 ? (
                        <>
                          {messages.map((msg) => (
                            <div 
                              key={msg.id} 
                              className={msg.isUserMessage ? "flex justify-end" : "flex"}
                            >
                              <div className="flex items-end max-w-[80%]">
                                {!msg.isUserMessage && (
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-2 mb-1 flex-shrink-0 border border-indigo-200">
                                    <i className="fas fa-robot text-sm"></i>
                                  </div>
                                )}
                                
                                <div 
                                  className={
                                    msg.isUserMessage 
                                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tl-xl rounded-tr-xl rounded-bl-xl p-3 shadow-sm"
                                      : "bg-white rounded-tr-xl rounded-tl-xl rounded-br-xl p-3 shadow-sm border border-gray-100"
                                  }
                                >
                                  <p className="text-sm">{msg.content}</p>
                                  
                                  {!msg.isUserMessage && !isMuted && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => handleSpeakMessage(msg.content)}
                                      className={`h-6 w-6 p-0 mt-1 ml-auto block ${isMuted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      disabled={isMuted}
                                    >
                                      <Volume2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* AI is typing indicator */}
                          {isTyping && (
                            <div className="flex items-end">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-2 mb-1 flex-shrink-0 border border-indigo-200">
                                <i className="fas fa-robot text-sm"></i>
                              </div>
                              <div className="bg-white rounded-tr-xl rounded-tl-xl rounded-br-xl p-3 shadow-sm border border-gray-100">
                                <div className="flex space-x-1">
                                  <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                  <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                  <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                            <i className="fas fa-comments text-2xl"></i>
                          </div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Start Your Therapy Session</h3>
                          <p className="text-sm text-gray-600 max-w-xs">
                            Share your thoughts and feelings to receive personalized support and anxiety management strategies.
                          </p>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Error Message for TTS */}
                    <div id="tts-error" className="hidden px-4 py-2 bg-red-50 text-red-600 text-sm"></div>
                    
                    {/* Chat Input Area */}
                    <div className="p-4 border-t border-gray-200 bg-white">
                      <div className="flex items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant={isRecording ? "default" : "outline"}
                                onClick={toggleRecording}
                                className={`mr-2 ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-indigo-600 border-indigo-200'}`}
                              >
                                {isRecording ? (
                                  <PauseCircle className="h-5 w-5" />
                                ) : (
                                  <Mic className="h-5 w-5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isRecording ? "Stop Recording" : "Start Voice Input"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <Input
                          placeholder={isRecording ? "Listening..." : "Type your message..."}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1 border-indigo-200 focus-visible:ring-indigo-500"
                          disabled={isRecording}
                        />
                        
                        <Button 
                          type="button"
                          size="icon" 
                          className="ml-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90"
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
                      
                      {isRecording && (
                        <div className="mt-2 py-1 px-2 bg-red-50 text-red-600 text-xs rounded flex items-center">
                          <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                          <span>Recording in progress... Speak clearly</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}