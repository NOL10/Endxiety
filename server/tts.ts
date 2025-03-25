import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import fs from 'fs';
import util from 'util';
import path from 'path';
import crypto from 'crypto';

// Initialize the Text-to-Speech client
const client = new TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Create an in-memory cache for audio
const audioCache = new Map<string, Buffer>();

export async function textToSpeech(
  text: string,
  voiceType: string = 'en-US-Wavenet-F',
  speakingRate: number = 1.0
): Promise<Buffer> {
  if (!text) {
    throw new Error('Text is required for text-to-speech conversion');
  }

  // Create a unique hash for this text + voice configuration
  const key = crypto.createHash('md5').update(`${text}${voiceType}${speakingRate}`).digest('hex');

  // Check if we have this in cache
  if (audioCache.has(key)) {
    return audioCache.get(key)!;
  }

  // Configure voice options
  const request = {
    input: { text },
    voice: {
      languageCode: 'en-US',
      name: voiceType,
      ssmlGender: voiceType.includes('F') ? 'FEMALE' : 'MALE',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate,
      pitch: 0,
    },
  };

  try {
    // Perform the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent as Buffer;

    // Store in cache
    audioCache.set(key, audioContent);

    // Return the audio content
    return audioContent;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw new Error('Failed to generate speech');
  }
}

// Clean up the audio cache periodically (every hour)
setInterval(() => {
  // Clear items older than 1 hour
  const MAX_AGE = 60 * 60 * 1000; // 1 hour in milliseconds
  const now = Date.now();
  
  // This would require enhancing the cache with timestamps
  // For now, just clear the entire cache
  audioCache.clear();
}, 60 * 60 * 1000); // Run every hour
