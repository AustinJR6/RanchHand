// Gemini AI service for Ranch Hand
// This service handles AI-powered features like generating care plans
import Constants from 'expo-constants';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey || "YOUR_GEMINI_API_KEY";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface CarePlanRequest {
  type: 'animal' | 'crop';
  name: string;
  details: Record<string, any>;
}

export interface CarePlanResponse {
  summary: string;
  tasks: Array<{
    title: string;
    description: string;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'seasonal' | 'once';
    timing?: string;
    category: 'feeding' | 'watering' | 'cleaning' | 'health' | 'maintenance' | 'harvesting' | 'other';
  }>;
  tips: string[];
  warnings?: string[];
}

class GeminiService {
  private apiKey: string;

  constructor(apiKey: string = GEMINI_API_KEY) {
    this.apiKey = apiKey;
  }

  /**
   * Generate a care plan for an animal or crop
   */
  async generateCarePlan(request: CarePlanRequest): Promise<CarePlanResponse> {
    const prompt = this.buildCarePlanPrompt(request);

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;

      // Parse the JSON response from Gemini
      return this.parseCarePlanResponse(text);
    } catch (error) {
      console.error('Error generating care plan:', error);
      throw error;
    }
  }

  /**
   * Ask Gemini a farming question (for educational features)
   */
  async askQuestion(question: string, context?: string): Promise<string> {
    const prompt = `You are a helpful farming assistant for small family farms. ${context ? `Context: ${context}\n\n` : ''}Question: ${question}\n\nProvide a clear, practical answer suitable for a beginning farmer.`;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error asking question:', error);
      throw error;
    }
  }

  /**
   * Generate a weekly schedule based on farm inventory
   */
  async generateWeeklySchedule(farmData: {
    animals: Array<{ type: string; breed?: string; quantity: number }>;
    crops: Array<{ name: string; variety?: string; location: string; status: string }>;
  }): Promise<string> {
    const prompt = `You are a farm management assistant. Based on the following farm inventory, create a detailed weekly schedule for the farmer.

Farm Inventory:
Animals: ${farmData.animals.map(a => `${a.quantity} ${a.breed || ''} ${a.type}`.trim()).join(', ') || 'None'}
Crops: ${farmData.crops.map(c => `${c.variety || ''} ${c.name} (${c.location}, ${c.status})`.trim()).join(', ') || 'None'}

Create a day-by-day schedule for the week with specific tasks for each day. Include:
- Feeding and watering schedules
- Cleaning tasks
- Harvest activities
- Maintenance tasks
- Health checks

Format as a clear, structured weekly schedule.`;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for care plan generation
   */
  private buildCarePlanPrompt(request: CarePlanRequest): string {
    const { type, name, details } = request;

    let prompt = `You are an expert farm management assistant. A farmer is adding a new ${type} to their small family farm and needs a comprehensive care plan.

${type === 'animal' ? 'Animal' : 'Crop'} Information:
- Name: ${name}
${Object.entries(details).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Please generate a detailed care plan in JSON format with the following structure:
{
  "summary": "A brief 2-3 sentence overview of caring for this ${type}",
  "tasks": [
    {
      "title": "Task name",
      "description": "Detailed description of what to do",
      "frequency": "daily|weekly|biweekly|monthly|seasonal|once",
      "timing": "When to do it (e.g., 'morning', 'every 3 days')",
      "category": "feeding|watering|cleaning|health|maintenance|harvesting|other"
    }
  ],
  "tips": [
    "Helpful tip 1",
    "Helpful tip 2"
  ],
  "warnings": [
    "Important warning or caution (optional)"
  ]
}

Focus on practical, actionable tasks suitable for a beginning farmer. Include all essential care requirements.`;

    return prompt;
  }

  /**
   * Parse the JSON response from Gemini
   */
  private parseCarePlanResponse(text: string): CarePlanResponse {
    try {
      // Gemini sometimes wraps JSON in markdown code blocks
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;

      const parsed = JSON.parse(jsonText);
      return parsed as CarePlanResponse;
    } catch (error) {
      console.error('Error parsing care plan response:', error);
      // Return a basic fallback response
      return {
        summary: 'Care plan generation is temporarily unavailable. Please add details manually.',
        tasks: [],
        tips: ['Consult with local farming experts or extension services for guidance.'],
        warnings: ['Unable to generate automated care plan. Please research best practices for this specific type.']
      };
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService;
