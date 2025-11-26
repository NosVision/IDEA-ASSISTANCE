import { LLMService } from './llm';
import { db } from '../../db';

const TITLE_GENERATION_PROMPT = `คุณเป็น AI ที่ช่วยสร้างชื่อบทสนทนาที่กระชับและมีความหมาย

จากข้อความในบทสนทนา ให้สร้างชื่อที่:
- สั้นกระชับ 3-5 คำ
- สื่อความหมายของหัวข้อหลัก
- เป็นภาษาไทย
- ไม่ต้องมีเครื่องหมายคำพูดหรืออักขระพิเศษ

ตอบเฉพาะชื่อบทสนทนาเท่านั้น ไม่ต้องมีคำอธิบายเพิ่มเติม

ตัวอย่าง:
- "แผนการตลาดเดือนหน้า"
- "ไอเดียโปรเจกต์ใหม่"
- "รายการซื้อของสัปดาห์นี้"
- "ปัญหาการทำงาน"`;

export class TitleGeneratorService {
    /**
     * Generate a conversation title from the first few messages
     */
    static async generateTitle(messages: Array<{ role: 'user' | 'assistant', content: string }>): Promise<string> {
        try {
            // Take first 2-3 messages for context
            const contextMessages = messages.slice(0, 3);

            if (contextMessages.length === 0) {
                return 'บทสนทนาใหม่';
            }

            // Build conversation snippet
            const conversationSnippet = contextMessages
                .map(m => `${m.role === 'user' ? 'ผู้ใช้' : 'AI'}: ${m.content}`)
                .join('\n');

            // Generate title using LLM
            const response = await LLMService.generateResponse([
                { role: 'system', content: TITLE_GENERATION_PROMPT },
                { role: 'user', content: `บทสนทนา:\n${conversationSnippet}\n\nชื่อบทสนทนา:` }
            ]);

            // Clean up the response
            let title = response.content.trim();

            // Remove quotes if present
            title = title.replace(/^["']|["']$/g, '');

            // Limit length
            if (title.length > 50) {
                title = title.substring(0, 47) + '...';
            }

            // Fallback if empty
            if (!title || title.length < 3) {
                return 'บทสนทนาใหม่';
            }

            return title;
        } catch (error) {
            console.error('Title generation error:', error);
            // Fallback to default title
            return 'บทสนทนาใหม่';
        }
    }

    /**
     * Generate and update session title
     */
    static async generateAndUpdateSessionTitle(sessionId: string): Promise<string> {
        try {
            // Get messages from session
            const messages = await db.chat_messages
                .where('sessionId')
                .equals(sessionId)
                .sortBy('timestamp');

            if (messages.length === 0) {
                return 'บทสนทนาใหม่';
            }

            // Generate title
            const title = await this.generateTitle(messages);

            // Update session
            await db.chat_sessions.update(sessionId, { title });

            return title;
        } catch (error) {
            console.error('Error updating session title:', error);
            return 'บทสนทนาใหม่';
        }
    }
}
