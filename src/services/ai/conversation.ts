import { db, type ChatSession, type ChatMessage } from '../../db';

export interface ConversationContext {
    messages: Array<{ role: 'user' | 'assistant', content: string, timestamp: Date }>;
    sessionId: string;
}

const MAX_CONTEXT_MESSAGES = 30; // Keep last 30 messages

export class ConversationService {
    private static currentSessionId: string | null = null;

    /**
     * Get or create current conversation session
     */
    static async getCurrentSession(): Promise<string> {
        if (this.currentSessionId) {
            return this.currentSessionId;
        }

        // Create new session
        const sessionId = await db.chat_sessions.add({
            createdAt: new Date(),
            updatedAt: new Date()
        });

        this.currentSessionId = String(sessionId);
        return this.currentSessionId;
    }

    /**
     * Add message to conversation history
     */
    static async addMessage(
        role: 'user' | 'assistant',
        content: string
    ): Promise<void> {
        const sessionId = await this.getCurrentSession();

        await db.chat_messages.add({
            sessionId,
            role,
            content,
            timestamp: new Date()
        });

        // Update session timestamp
        await db.chat_sessions.update(sessionId, {
            updatedAt: new Date()
        });
    }

    /**
     * Get conversation context (last N messages)
     */
    static async getContext(limit: number = MAX_CONTEXT_MESSAGES): Promise<ConversationContext> {
        const sessionId = await this.getCurrentSession();

        const messages = await db.chat_messages
            .where('sessionId')
            .equals(sessionId)
            .reverse()
            .limit(limit)
            .toArray();

        // Reverse to get chronological order
        messages.reverse();

        return {
            sessionId,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp
            }))
        };
    }

    /**
     * Get formatted context for LLM (last N messages)
     */
    static async getFormattedContext(limit: number = 20) {
        const context = await this.getContext(limit);

        return context.messages.map(m => ({
            role: m.role,
            content: m.content
        }));
    }

    /**
     * Start new conversation session
     */
    static async startNewSession(): Promise<string> {
        this.currentSessionId = null;
        return await this.getCurrentSession();
    }

    /**
     * Clear all conversation history
     */
    static async clearAllHistory(): Promise<void> {
        await db.chat_messages.clear();
        await db.chat_sessions.clear();
        this.currentSessionId = null;
    }

    /**
     * Get all sessions
     */
    static async getAllSessions(): Promise<ChatSession[]> {
        return await db.chat_sessions.toArray();
    }

    /**
     * Get messages for a specific session
     */
    static async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
        return await db.chat_messages
            .where('sessionId')
            .equals(sessionId)
            .toArray();
    }

    /**
     * Switch to a different session
     */
    static async switchSession(sessionId: string): Promise<void> {
        this.currentSessionId = sessionId;
        // Update session timestamp
        await db.chat_sessions.update(sessionId, {
            updatedAt: new Date()
        });
    }

    /**
     * Delete a session and all its messages
     */
    static async deleteSession(sessionId: string): Promise<void> {
        // Delete all messages in this session
        await db.chat_messages
            .where('sessionId')
            .equals(sessionId)
            .delete();

        // Delete the session
        // chat_sessions primary key is a number, so we must convert the string ID back to number
        await db.chat_sessions.delete(Number(sessionId));

        // If this was the current session, clear it
        if (this.currentSessionId === sessionId) {
            this.currentSessionId = null;
        }
    }

    /**
     * Update session title (auto-generate from first message)
     */
    static async updateSessionTitle(sessionId: string, title: string): Promise<void> {
        await db.chat_sessions.update(sessionId, { title });
    }

    /**
     * Get message count for a session
     */
    static async getMessageCount(sessionId: string): Promise<number> {
        return await db.chat_messages
            .where('sessionId')
            .equals(sessionId)
            .count();
    }

    /**
     * Get first message from a session for preview
     */
    static async getFirstMessage(sessionId: string): Promise<string | null> {
        const messages = await db.chat_messages
            .where('sessionId')
            .equals(sessionId)
            .sortBy('timestamp');

        if (messages.length === 0) return null;

        // Return first user message content
        const firstUserMessage = messages.find(m => m.role === 'user');
        return firstUserMessage ? firstUserMessage.content : messages[0].content;
    }
    /**
     * Get the most recent session
     */
    static async getMostRecentSession(): Promise<string | null> {
        const session = await db.chat_sessions.orderBy('updatedAt').reverse().first();
        if (session && session.id) {
            this.currentSessionId = String(session.id);
            return this.currentSessionId;
        }
        return null;
    }

    /**
     * Cleanup empty sessions (sessions with 0 messages)
     */
    static async cleanupEmptySessions(): Promise<number> {
        const sessions = await db.chat_sessions.toArray();
        let deletedCount = 0;

        for (const session of sessions) {
            if (!session.id) continue;

            const messageCount = await this.getMessageCount(String(session.id));
            if (messageCount === 0) {
                await db.chat_sessions.delete(session.id);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            console.log(`Cleaned up ${deletedCount} empty sessions`);
        }

        return deletedCount;
    }
}
