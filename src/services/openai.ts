// OpenAI service for Ranch Hand
// Uses gpt-4o-mini — fast and low-cost for farm management AI features
import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

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

async function callOpenAI(messages: Array<{ role: string; content: string }>, jsonMode = false): Promise<string> {
  const body: any = {
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content as string;
}

class OpenAIService {
  /**
   * Generate an AI care plan for an animal or crop.
   * Returns structured tasks that are saved and scheduled automatically.
   */
  async generateCarePlan(request: CarePlanRequest): Promise<CarePlanResponse> {
    const { type, name, details } = request;

    const systemPrompt = `You are an expert farm management assistant for small family farms and homesteads.
Respond ONLY with valid JSON — no markdown, no extra text.`;

    const userPrompt = `A farmer is adding a new ${type} to their homestead and needs a comprehensive care plan.

${type === 'animal' ? 'Animal' : 'Crop'} Information:
- Name: ${name}
${Object.entries(details).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence overview of caring for this ${type}",
  "tasks": [
    {
      "title": "Task name",
      "description": "What to do and how",
      "frequency": "daily|weekly|biweekly|monthly|seasonal|once",
      "timing": "e.g. morning, every 3 days",
      "category": "feeding|watering|cleaning|health|maintenance|harvesting|other"
    }
  ],
  "tips": ["Practical tip 1", "Practical tip 2"],
  "warnings": ["Important caution if any"]
}

Include all essential care tasks. Focus on practical, actionable guidance for a beginner homesteader.`;

    try {
      const text = await callOpenAI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        true
      );
      return this.parseCarePlanResponse(text);
    } catch (error) {
      console.error('Error generating care plan:', error);
      throw error;
    }
  }

  /**
   * Answer a farming question — used by the AI chat assistant.
   */
  async askQuestion(question: string, context?: string): Promise<string> {
    const systemPrompt = `You are a knowledgeable and friendly farming assistant for small family farms and homesteads.
Give clear, practical answers suited to beginning farmers. Keep responses concise but complete.`;

    const userContent = context
      ? `Context about this farm: ${context}\n\nQuestion: ${question}`
      : question;

    try {
      return await callOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ]);
    } catch (error) {
      console.error('Error asking question:', error);
      throw error;
    }
  }

  /**
   * Generate a weekly schedule based on current farm inventory.
   * The schedule is displayed to the user and optionally converted to tasks.
   */
  async generateWeeklySchedule(farmData: {
    animals: Array<{ type: string; breed?: string; quantity: number }>;
    crops: Array<{ name: string; variety?: string; location: string; status: string }>;
  }): Promise<string> {
    const animalList =
      farmData.animals.map(a => `${a.quantity} ${a.breed || ''} ${a.type}`.trim()).join(', ') || 'None';
    const cropList =
      farmData.crops
        .map(c => `${c.variety || ''} ${c.name} (${c.location}, ${c.status})`.trim())
        .join(', ') || 'None';

    const systemPrompt = `You are a farm management assistant for small homesteads.
Create practical, realistic weekly schedules. Be specific about timing and quantities where relevant.`;

    const userPrompt = `Create a detailed day-by-day weekly schedule for this homestead.

Animals: ${animalList}
Crops: ${cropList}

For each day include:
- Feeding and watering schedules
- Cleaning and maintenance tasks
- Harvest or planting activities
- Health checks
- Any other relevant tasks

Format clearly with each day as a header (Monday, Tuesday, etc.) followed by a bullet list of tasks.`;

    try {
      return await callOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  }

  /**
   * Suggest notifications/reminders for a given task based on its category and due date.
   * Returns a suggested reminder time offset in minutes before the due time.
   */
  async suggestReminderTime(task: {
    title: string;
    category: string;
    dueDate: Date;
  }): Promise<{ offsetMinutes: number; reason: string }> {
    const systemPrompt = `You are a farm scheduling assistant. Respond ONLY with valid JSON.`;

    const userPrompt = `A farmer has a task: "${task.title}" (category: ${task.category}) due at ${task.dueDate.toLocaleTimeString()}.

How many minutes before the due time should they receive a reminder? Consider the urgency and preparation needed.

Return JSON: { "offsetMinutes": <number 15-120>, "reason": "<brief explanation>" }`;

    try {
      const text = await callOpenAI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        true
      );
      return JSON.parse(text);
    } catch {
      return { offsetMinutes: 30, reason: 'Default 30-minute reminder' };
    }
  }

  private parseCarePlanResponse(text: string): CarePlanResponse {
    try {
      // Strip any accidental markdown fences (defensive)
      const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      return JSON.parse(clean) as CarePlanResponse;
    } catch (error) {
      console.error('Error parsing care plan response:', error);
      return {
        summary: 'Care plan generation encountered an issue. Please add tasks manually or try again.',
        tasks: [],
        tips: ['Consult local farming resources or extension services for guidance.'],
        warnings: ['Automated care plan unavailable — please add care tasks manually.'],
      };
    }
  }

  /**
   * Run an agentic chat turn with function calling support.
   * Returns either a final text response or a list of tool calls to execute.
   */
  async agentChat(
    messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string; name?: string }>,
    tools: AgentTool[]
  ): Promise<AgentChatResponse> {
    const body: any = {
      model: MODEL,
      messages,
      temperature: 0.5,
      max_tokens: 1024,
    };

    if (tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    if (choice.finish_reason === 'tool_calls') {
      return {
        type: 'tool_calls',
        tool_calls: choice.message.tool_calls,
        raw_message: choice.message,
      };
    }

    return {
      type: 'message',
      content: choice.message.content as string,
    };
  }
}

// Tool type definitions for function calling
export interface AgentTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export type AgentChatResponse =
  | { type: 'message'; content: string }
  | { type: 'tool_calls'; tool_calls: ToolCall[]; raw_message: any };

export const openaiService = new OpenAIService();

// Alias so existing code referencing geminiService still compiles during migration
export const geminiService = openaiService;

export default openaiService;
