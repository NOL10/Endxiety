import { getTextToSpeech } from './openai';

let audioContext: AudioContext | null = null;
let audioQueue: { buffer: AudioBuffer, onComplete: () => void }[] = [];
let isPlaying = false;

export async function speakText(
  text: string,
  voiceType: string = 'en-US-Wavenet-F',
  speakingRate: number = 1.0,
  onComplete: () => void = () => {}
): Promise<void> {
  try {
    // Create audio context if it doesn't exist
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Get the audio from the server
    const audioArrayBuffer = await getTextToSpeech(text, voiceType, speakingRate);
    
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);
    
    // Add to queue
    audioQueue.push({ buffer: audioBuffer, onComplete });
    
    // If not already playing, start playing
    if (!isPlaying) {
      playNextInQueue();
    }
  } catch (error) {
    console.error('Error speaking text:', error);
    onComplete();
  }
}

function playNextInQueue(): void {
  if (!audioContext || audioQueue.length === 0) {
    isPlaying = false;
    return;
  }
  
  isPlaying = true;
  const { buffer, onComplete } = audioQueue.shift()!;
  
  // Create a source node
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  
  // When it's done, play the next one
  source.onended = () => {
    onComplete();
    playNextInQueue();
  };
  
  // Start playing
  source.start(0);
}

export function stopSpeaking(): void {
  if (audioContext) {
    // Create a new audio context to immediately stop all audio
    audioContext.close();
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Clear the queue
    audioQueue = [];
    isPlaying = false;
  }
}
