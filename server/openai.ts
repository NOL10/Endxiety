import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeEmotion(text: string): Promise<{
  emotion: string;
  intensity: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system" as const,
          content: "You are an emotional intelligence expert. Analyze the text and identify the primary emotion, its intensity (1-10), and overall sentiment (positive, negative, or neutral). Respond with JSON in this format: { 'emotion': string, 'intensity': number, 'sentiment': 'positive' | 'negative' | 'neutral' }"
        },
        {
          role: "user" as const,
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{"emotion":"unknown","intensity":5,"sentiment":"neutral"}';
    return JSON.parse(content);
  } catch (error) {
    console.error("Error analyzing emotion:", error);
    return {
      emotion: "unknown",
      intensity: 5,
      sentiment: "neutral"
    };
  }
}

export async function generateSupportiveResponse(content: string, mood?: string | null): Promise<string> {
  try {
    // First, analyze the emotion in the content
    let emotionAnalysis: { emotion: string; intensity: number; sentiment: 'positive' | 'negative' | 'neutral' } | null = null;
    try {
      if (content.trim()) {
        emotionAnalysis = await analyzeEmotion(content);
      }
    } catch (analyzeError) {
      console.warn("Error analyzing emotion (continuing anyway):", analyzeError);
    }
    
    // Create a dynamic system prompt based on the analysis
    let systemPrompt = `You are an anxiety specialist AI therapist on the Endxiety platform. Your purpose is to provide supportive, evidence-based responses to users who share their anxiety experiences.`;
    
    // Add dynamic elements based on emotion analysis and provided mood
    if (emotionAnalysis) {
      systemPrompt += `\n\nContent analysis: The user is expressing ${emotionAnalysis.emotion} with intensity ${emotionAnalysis.intensity}/10. Overall sentiment: ${emotionAnalysis.sentiment}.`;
      
      // Add specific guidance based on analysis
      if (emotionAnalysis.sentiment === 'negative' && emotionAnalysis.intensity > 7) {
        systemPrompt += `\nThis is a high-intensity negative emotion. Focus on immediate anxiety reduction techniques, validation, and stabilization.`;
      } else if (emotionAnalysis.sentiment === 'negative') {
        systemPrompt += `\nFocus on validation, reframing, and practical coping strategies for ${emotionAnalysis.emotion}-related anxiety.`;
      } else if (emotionAnalysis.sentiment === 'positive') {
        systemPrompt += `\nReinforce positive emotional states while still addressing any anxiety-related concerns.`;
      }
    }
    
    // Incorporate provided mood if available
    if (mood) {
      systemPrompt += `\n\nThe user has explicitly selected their mood as: ${mood}.`;
    }
    
    // Add therapeutic framework guidelines
    systemPrompt += `\n\nResponse guidelines:
    - Use evidence-based therapeutic techniques (CBT, ACT, mindfulness)
    - Provide specific, practical anxiety management strategies
    - Be compassionate but professionally therapeutic in tone
    - Include a mix of validation, insight, and actionable suggestions
    - Include one specific technique or exercise when appropriate
    - Keep responses concise (3-4 sentences) but substantive
    - Focus specifically on anxiety management
    - End with a gentle, open question when appropriate
    
    Your response should function as a brief therapeutic intervention for anxiety, not just general emotional support.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system" as const,
          content: systemPrompt
        },
        {
          role: "user" as const,
          content
        }
      ],
      max_tokens: 300,
      temperature: 0.7 // Slightly more creative within therapeutic guidelines
    });

    return response.choices[0].message.content || "I'm here to help you manage your anxiety.";
  } catch (error) {
    console.error("Error generating supportive response:", error);
    
    // Create more specific fallback responses for anxiety support
    const fallbackResponses = [
      "I notice you might be experiencing anxiety. Remember that these feelings are temporary, and there are effective techniques to manage them. Try a quick 4-7-8 breathing exercise: inhale for 4 counts, hold for 7, exhale for 8.",
      
      "Anxiety can feel overwhelming, but you're taking an important step by expressing your feelings. Consider trying the 5-4-3-2-1 grounding technique: identify 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.",
      
      "It sounds like you're going through a challenging time with anxiety. Remember that your thoughts aren't facts - they're just thoughts. Try gently questioning automatic negative thoughts by asking 'What evidence supports this?' and 'What would I tell a friend feeling this way?'",
      
      "Managing anxiety is difficult, but you're not alone in this journey. Small steps like deep breathing, gentle movement, or talking with someone you trust can help reduce immediate anxiety. What's one small action you could take right now to support yourself?"
    ];
    
    // Return a random fallback response
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

export async function generateWellbeingTips(moodHistory: Array<{ mood: string, createdAt: Date }>): Promise<{
  insights: string[];
  tips: {
    category: string;
    title: string;
    content: string;
    icon: string;
  }[];
}> {
  try {
    const moodData = moodHistory.map(m => ({
      mood: m.mood,
      timestamp: m.createdAt.toISOString()
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system" as const,
          content: `You are an emotional wellbeing AI expert. Based on the user's mood history, generate personalized insights and wellbeing tips. 
          Include 2-3 insights about patterns or trends, and 3 actionable well-being tips with categories (Mindfulness, Physical, Social, Creative, etc).
          Respond with JSON in this format: { 
            "insights": string[],
            "tips": [{ 
              "category": string, 
              "title": string, 
              "content": string, 
              "icon": string (fontawesome icon class name like 'fas fa-brain')
            }]
          }`
        },
        {
          role: "user" as const,
          content: JSON.stringify(moodData)
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{"insights":[],"tips":[]}';
    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating wellbeing tips:", error);
    // Fallback response
    return {
      insights: [
        "You may benefit from establishing a regular self-care routine.",
        "Consider tracking specific triggers that affect your mood."
      ],
      tips: [
        {
          category: "Mindfulness",
          title: "5-Minute Breathing",
          content: "Take 5 minutes to focus on your breath, inhaling for 4 counts and exhaling for 6.",
          icon: "fas fa-brain"
        },
        {
          category: "Physical",
          title: "Movement Break",
          content: "Take short walking breaks throughout your day to refresh your mind and body.",
          icon: "fas fa-walking"
        },
        {
          category: "Creative",
          title: "Journal Prompt",
          content: "Write about three positive moments from your day, no matter how small.",
          icon: "fas fa-book"
        }
      ]
    };
  }
}

export async function getChatbotResponse(
  messages: Array<{ content: string; isUserMessage: boolean }>,
  username: string
): Promise<string> {
  try {
    // Extract the latest user message to analyze
    const latestUserMessage = [...messages].reverse().find(msg => msg.isUserMessage)?.content || "";
    
    // Analyze the emotion in the latest message (if possible)
    let emotionAnalysis: { emotion: string; intensity: number; sentiment: 'positive' | 'negative' | 'neutral' } | null = null;
    try {
      if (latestUserMessage.trim()) {
        emotionAnalysis = await analyzeEmotion(latestUserMessage);
      }
    } catch (analyzeError) {
      console.warn("Error analyzing emotion (continuing anyway):", analyzeError);
    }
    
    // Format the message history for the chat
    const formattedMessages = messages.map(msg => ({
      role: msg.isUserMessage ? "user" as const : "assistant" as const,
      content: msg.content
    }));

    // Enhanced system prompt based on emotional analysis
    let systemPrompt = `You are Endxiety's AI Therapist, an advanced empathetic AI companion focused on anxiety support and treatment. Your purpose is to provide personalized therapeutic responses to ${username}.`;
    
    // Add emotion-aware customization if we have analysis
    if (emotionAnalysis) {
      systemPrompt += `\n\nI've detected that ${username} is currently feeling ${emotionAnalysis.emotion} with an intensity of ${emotionAnalysis.intensity}/10, and the overall sentiment is ${emotionAnalysis.sentiment}.`;
      
      // Add specific guidance based on emotion
      if (emotionAnalysis.sentiment === 'negative' && emotionAnalysis.intensity > 7) {
        systemPrompt += `\nThis seems to be a high-intensity negative emotion. Prioritize validation, calming techniques, and grounding exercises.`;
      } else if (emotionAnalysis.sentiment === 'negative') {
        systemPrompt += `\nOffer supportive strategies specific to ${emotionAnalysis.emotion} and gentle reframing of negative thought patterns.`;
      } else if (emotionAnalysis.sentiment === 'positive') {
        systemPrompt += `\nReinforce these positive feelings while still addressing any underlying anxiety concerns.`;
      }
    }
    
    // Add core guidelines
    systemPrompt += `\n\nCore Guidelines:
    - Respond as a professional therapist specializing in anxiety treatment
    - Use evidence-based therapeutic techniques (CBT, mindfulness, ACT)
    - Provide personalized coping strategies for anxiety management
    - Offer specific, actionable advice rather than general platitudes
    - Validate emotions while suggesting constructive perspectives
    - Be conversational, compassionate, and authentic
    - Ask thoughtful questions to promote self-awareness
    - Include occasional breathing or grounding exercises when appropriate
    - Respect boundaries and emphasize privacy
    - Keep responses concise (3-4 sentences) and focused on anxiety management
    
    Remember: You're providing therapeutic support for anxiety specifically, not general mental health care. Focus your responses on anxiety management techniques and strategies.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system" as const, content: systemPrompt },
        ...formattedMessages
      ],
      max_tokens: 200,
      temperature: 0.7 // Slightly more creative responses
    });

    return response.choices[0].message.content || "I'm here to help you manage your anxiety.";
  } catch (error) {
    console.error("Error getting chatbot response:", error);
    
    // More specific fallback responses for anxiety support
    const fallbackResponses = [
      "I'm here to support you with your anxiety. When you're ready to continue, I can suggest some practical coping strategies.",
      "Managing anxiety is challenging, but you're taking important steps by reaching out. What specific situation is triggering your anxiety right now?",
      "I notice you might be experiencing some anxiety. Remember that deep breathing can help - try inhaling for 4 counts, holding for a moment, and exhaling for 6 counts.",
      "It sounds like you're going through a difficult time. Would you like to practice a quick grounding technique together to help manage these feelings?"
    ];
    
    // Return a random fallback response
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}
