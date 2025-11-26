import { LLMService } from './llm';
import { MULTI_ITEM_INTENT_PROMPT } from './prompts';
import type { Intent, NoteData, TaskData, UpdateData, DeleteData } from '../../types/ai';

export interface MultiItemIntent {
    type: 'note' | 'task' | 'question' | 'chat' | 'update_note' | 'update_task' | 'delete_note' | 'delete_task';
    items: Array<NoteData | TaskData | UpdateData | DeleteData>;
    confidence: number;
    summary: string;
}

export class IntentDetectorService {
    /**
     * Detect user's intent WITH conversation context and extract multiple items
     */
    static async detectIntentWithContext(
        message: string,
        conversationHistory: Array<{ role: 'user' | 'assistant', content: string }> = [],
        images: string[] = []
    ): Promise<MultiItemIntent> {
        try {
            // Construct user message content (text + images)
            const userContent: any[] = [
                {
                    type: 'text',
                    text: `Current date: ${new Date().toISOString().split('T')[0]}\n\nAnalyze this message and extract all actionable items:\n"${message}"`
                }
            ];

            // Add images if present
            if (images.length > 0) {
                images.forEach(img => {
                    userContent.push({
                        type: 'image_url',
                        image_url: { url: img }
                    });
                });
            }

            // Build context for GPT-4o
            const messages = [
                {
                    role: 'system' as const,
                    content: MULTI_ITEM_INTENT_PROMPT
                },
                ...conversationHistory,
                {
                    role: 'user' as const,
                    content: userContent
                }
            ];

            const response = await LLMService.generateResponse(messages);

            // Parse JSON response
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return this.fallbackIntent();
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Convert to MultiItemIntent format
            return {
                type: parsed.type || 'chat',
                items: this.convertItems(parsed.type, parsed.items || []),
                confidence: parsed.confidence || 0.5,
                summary: parsed.summary || ''
            };
        } catch (error) {
            console.error('Intent detection with context failed:', error);
            return this.fallbackIntent();
        }
    }

    /**
     * Legacy single-item detection (backward compatible)
     */
    static async detectIntent(message: string): Promise<Intent> {
        const multiIntent = await this.detectIntentWithContext(message, []);

        // Convert multi-item to single-item for backward compatibility
        if (multiIntent.items.length > 0) {
            return {
                type: multiIntent.type,
                confidence: multiIntent.confidence,
                data: multiIntent.items[0]
            };
        }

        return {
            type: multiIntent.type,
            confidence: multiIntent.confidence,
            data: null
        };
    }

    /**
     * Convert raw items to typed data
     */
    private static convertItems(
        type: 'note' | 'task' | 'question' | 'chat' | 'update_note' | 'update_task' | 'delete_note' | 'delete_task',
        items: any[]
    ): Array<NoteData | TaskData | UpdateData | DeleteData> {
        if (type === 'chat' || type === 'question') return [];

        return items.map(item => {
            if (type === 'update_note' || type === 'update_task') {
                return {
                    searchQuery: item.searchQuery || '',
                    updates: item.updates || {}
                } as UpdateData;
            }

            if (type === 'delete_note' || type === 'delete_task') {
                return {
                    searchQuery: item.searchQuery || '',
                    type: type === 'delete_note' ? 'note' : 'task'
                } as DeleteData;
            }

            if (type === 'note') {
                return {
                    title: item.title || '',
                    content: item.content || item.description || '',
                    category: item.category || 'Personal'
                } as NoteData;
            }

            if (type === 'task') {
                const taskData: TaskData = {
                    title: item.title || '',
                    description: item.description || item.content || '',
                    category: item.category || 'Personal',
                    priority: item.priority || 'medium'
                };

                // Parse date
                if (item.date) {
                    try {
                        taskData.date = new Date(item.date);
                    } catch (e) {
                        console.error('Invalid date:', item.date);
                    }
                }

                // Add time
                if (item.time) {
                    taskData.time = item.time;
                }

                return taskData;
            }

            return item;
        });
    }

    /**
     * Fallback intent when detection fails
     */
    private static fallbackIntent(): MultiItemIntent {
        return {
            type: 'chat',
            items: [],
            confidence: 0.3,
            summary: 'Unable to detect intent'
        };
    }

    /**
     * Quick check if message is a save intent (note or task)
     */
    static isSaveIntent(message: string): boolean {
        const saveKeywords = [
            'จด', 'บันทึก', 'เก็บไว้', 'save', 'remember',
            'ทำ', 'to-do', 'todo', 'task', 'reminder', 'ช่วย', 'ลง'
        ];

        const lowerMessage = message.toLowerCase();
        return saveKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    /**
     * Quick check if message is a question
     */
    static isQuestionIntent(message: string): boolean {
        const questionKeywords = [
            'มีอะไรบ้าง', 'ค้นหา', 'หา', 'show', 'find', 'search',
            'มี', 'ไหม', 'อะไร', 'what', 'when', 'where'
        ];

        const lowerMessage = message.toLowerCase();
        return questionKeywords.some(keyword => lowerMessage.includes(keyword)) ||
            lowerMessage.includes('?') || lowerMessage.includes('？');
    }
}
