import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-your-api-key"
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
          role: "system",
          content: "You are an emotional intelligence expert. Analyze the text and identify the primary emotion, its intensity (1-10), and overall sentiment (positive, negative, or neutral). Respond with JSON in this format: { 'emotion': string, 'intensity': number, 'sentiment': 'positive' | 'negative' | 'neutral' }"
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing emotion:", error);
    return {
      emotion: "unknown",
      intensity: 5,
      sentiment: "neutral"
    };
  }
}

export async function generateSupportiveResponse(content: string, mood?: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an empathetic AI companion on an emotional support platform. Your goal is to provide supportive, understanding responses to users who share their feelings. Be compassionate, encouraging, and helpful without being overly positive or dismissive of negative emotions. Provide practical advice when appropriate. 
          ${mood ? `The user's selected mood is: ${mood}.` : ""}`
        },
        {
          role: "user",
          content
        }
      ],
      max_tokens: 250
    });

    return response.choices[0].message.content || "I'm here to support you through this.";
  } catch (error) {
    console.error("Error generating supportive response:", error);
    return "I understand that you're going through a difficult time. Remember that emotions are temporary, and it's okay to feel what you're feeling. If you'd like to talk more, I'm here for you.";
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
          role: "system",
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
          role: "user",
          content: JSON.stringify(moodData)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
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
    const formattedMessages = messages.map(msg => ({
      role: msg.isUserMessage ? "user" : "assistant",
      content: msg.content
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are EmoCare, an empathetic AI companion focused on emotional support. Your purpose is to provide a safe space for ${username} to express their feelings and receive compassionate responses. 
          
          Guidelines:
          - Be warm, understanding, and supportive without being overly cheerful
          - Validate emotions without judgment
          - Listen attentively and respond to the content of messages
          - Offer gentle guidance and coping strategies when appropriate
          - Ask thoughtful questions to encourage self-reflection
          - Keep responses concise (2-3 sentences), conversational and authentic
          - Never minimize feelings or use toxic positivity
          - Respect boundaries and privacy
          
          Remember that you're a supportive companion, not a replacement for professional mental health care.`
        },
        ...formattedMessages
      ],
      max_tokens: 150
    });

    return response.choices[0].message.content || "I'm here to support you.";
  } catch (error) {
    console.error("Error getting chatbot response:", error);
    return "I'm here for you and would like to continue our conversation. If you'd like to share more about what you're experiencing, I'm ready to listen.";
  }
}
