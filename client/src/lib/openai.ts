import { apiRequest } from "./queryClient";

// Types
export interface AnalyzeEmotionResponse {
  emotion: string;
  intensity: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface WellbeingTip {
  category: string;
  title: string;
  content: string;
  icon: string;
}

export interface WellbeingTipsResponse {
  insights: string[];
  tips: WellbeingTip[];
}

// Client-side functions that call the server API endpoints
export async function analyzeSentiment(text: string): Promise<AnalyzeEmotionResponse> {
  try {
    const response = await apiRequest('POST', '/api/sentiment', { text });
    return await response.json();
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return {
      emotion: 'unknown',
      intensity: 5,
      sentiment: 'neutral'
    };
  }
}

export async function sendChatMessage(message: string): Promise<{
  userMessage: { content: string; isUserMessage: boolean; createdAt: string; };
  aiMessage: { content: string; isUserMessage: boolean; createdAt: string; };
}> {
  const response = await apiRequest('POST', '/api/chat', { message });
  return await response.json();
}

export async function getTextToSpeech(
  text: string,
  voiceType?: string,
  speakingRate?: number
): Promise<ArrayBuffer> {
  try {
    const response = await apiRequest('POST', '/api/tts', {
      text,
      voiceType,
      speakingRate
    });
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error getting text-to-speech:', error);
    throw new Error('Failed to get text-to-speech audio');
  }
}
