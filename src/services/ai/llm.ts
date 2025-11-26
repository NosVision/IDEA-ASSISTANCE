import { db } from '../../db';

export interface LLMResponse {
    content: string;
    role: 'assistant';
}

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{
        type: 'text' | 'image_url';
        text?: string;
        image_url?: { url: string };
    }>;
}

const SECRETARY_SYSTEM_PROMPT = `You are an intelligent AI secretary assistant for a creative professional.

Your role:
- Listen attentively to the user's thoughts, ideas, and tasks
- Remember conversation context from previous messages
- Extract actionable items (notes, tasks, appointments) from natural conversation
- Ask clarifying questions naturally when needed
- Categorize intelligently based on content
- Confirm actions efficiently
- Analyze images if provided

The user thinks fast and has many ideas. Capture everything accurately and quickly.

When the user mentions:
- Ideas/thoughts/observations → Note (suggest category based on context)
- Things to do/deadlines/must-do → Task (extract date/time/priority)
- Meetings/appointments → Task with specific date and time
- Important information → Note with appropriate category

When images are provided:
- Analyze the visual content
- Extract text or ideas from the image
- Suggest relevant notes or tasks based on the image

Be conversational, smart, and helpful like a real secretary. Speak Thai naturally.`;

export class LLMService {
    static async generateResponse(
        prompt: string | LLMMessage[],
        provider: 'openai' | 'anthropic' = 'openai'
    ): Promise<LLMResponse> {
        const keys = await db.settings.get('apiKeys');
        if (!keys || !keys.value[provider]) {
            throw new Error(`No API key found for ${provider}`);
        }

        const apiKey = keys.value[provider];

        if (provider === 'openai') {
            return this.callOpenAI(prompt, apiKey);
        } else {
            // Placeholder for Anthropic
            return this.callOpenAI(prompt, apiKey);
        }
    }

    private static async callOpenAI(prompt: string | LLMMessage[], apiKey: string): Promise<LLMResponse> {
        try {
            // Build messages array
            const messages: LLMMessage[] = [];

            // Add system message
            messages.push({
                role: 'system',
                content: SECRETARY_SYSTEM_PROMPT
            });

            // Add user prompt(s)
            if (typeof prompt === 'string') {
                messages.push({ role: 'user', content: prompt });
            } else {
                // Already an array of messages (conversation history)
                messages.push(...prompt);
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o', // Upgraded from gpt-4o-mini
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'OpenAI API failed');
            }

            const data = await response.json();
            return {
                content: data.choices[0].message.content,
                role: 'assistant'
            };
        } catch (error) {
            console.error('LLM Error:', error);
            throw error;
        }
    }
}
