import { getTextToSpeech } from './openai';

let audioContext: AudioContext | null = null;
let audioQueue: { buffer: AudioBuffer, onComplete: () => void }[] = [];
let isPlaying = false;
let isMuted = false;

// Voice options available to users
export const VOICE_OPTIONS = [
  { id: 'female', name: 'Female Voice', icon: '👩' },
  { id: 'male', name: 'Male Voice', icon: '👨' },
  { id: 'neutral', name: 'Neutral Voice', icon: '🔄' }
];

// Add getter/setter for muted state
export function getMuted(): boolean {
  return isMuted;
}

export function setMuted(muted: boolean): void {
  isMuted = muted;
  if (muted && isPlaying) {
    stopSpeaking();
  }
}

export async function speakText(
  text: string,
  voiceType: string = 'female',
  speakingRate: number = 1.0,
  onComplete: () => void = () => {}
): Promise<void> {
  // If muted, skip speech synthesis
  if (isMuted) {
    onComplete();
    return;
  }
  
  try {
    // Create audio context if it doesn't exist
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // On iOS, we need user interaction to start the audio context
      if (audioContext.state === 'suspended') {
        const resumeAudio = async () => {
          await audioContext?.resume();
          document.removeEventListener('click', resumeAudio);
          document.removeEventListener('touchstart', resumeAudio);
        };
        
        document.addEventListener('click', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
      }
    }

    console.log(`Requesting speech for "${text.substring(0, 30)}..." with voice ${voiceType}`);
    
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
    
    // Display a user-friendly error message
    const errorMessage = document.getElementById('tts-error');
    if (errorMessage) {
      errorMessage.textContent = 'Voice playback unavailable. Please try again later.';
      errorMessage.style.display = 'block';
      setTimeout(() => {
        errorMessage.style.display = 'none';
      }, 5000);
    }
    
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
