import OpenAI from 'openai';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Initialize the OpenAI client for TTS
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create an in-memory cache for audio
const audioCache = new Map<string, Buffer>();

// Voice options mapping
const VOICE_OPTIONS: { [key: string]: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" } = {
  'female': 'nova',    // Clear female voice
  'male': 'onyx',      // Deep male voice
  'neutral': 'alloy',  // Neutral voice
};

export async function textToSpeech(
  text: string,
  voiceOption: string = 'female',
  speakingRate: number = 1.0
): Promise<Buffer> {
  // Input validation
  if (!text) {
    throw new Error('Text is required for text-to-speech conversion');
  }
  
  // Map voice option to OpenAI voice
  const voice = voiceOption in VOICE_OPTIONS ? 
    VOICE_OPTIONS[voiceOption] : 
    VOICE_OPTIONS['neutral'] || 'alloy';
  
  // Create a unique hash for this text + voice configuration
  const key = crypto.createHash('md5').update(`${text}${voice}${speakingRate}`).digest('hex');

  // Check if we have this in cache
  if (audioCache.has(key)) {
    return audioCache.get(key)!;
  }

  try {
    // Use OpenAI's text-to-speech API
    console.log(`Converting to speech: "${text.substring(0, 50)}..." with voice ${voice}`);
    
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
      speed: speakingRate,
    });
    
    // Convert to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Store in cache
    audioCache.set(key, buffer);
    
    console.log(`Speech generated successfully (${buffer.length} bytes)`);
    return buffer;
  } catch (error: any) {
    if (error.status === 429) {
      console.error('OpenAI API rate limit reached for text-to-speech');
      throw new Error('Service temporarily unavailable. Please try again later.');
    }
    
    console.error('Error generating speech:', error);
    throw new Error('Failed to generate speech');
  }
}

// Clean up the audio cache periodically (every hour)
setInterval(() => {
  const cacheSize = audioCache.size;
  console.log(`Clearing TTS cache (${cacheSize} items)`);
  audioCache.clear();
}, 60 * 60 * 1000); // Run every hour
