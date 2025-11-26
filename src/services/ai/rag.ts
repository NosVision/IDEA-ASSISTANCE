import { db } from '../../db';
import type { SearchResult } from '../../types/ai';

export class RAGService {
    /**
     * Search across notes and tasks with structured results
     */
    static async searchWithCards(query: string, category?: string): Promise<SearchResult> {
        const notes = await this.searchNotes(query, category);
        const tasks = await this.searchTasks(query, category);

        const summary = this.generateSummary(notes.length, tasks.length, query);

        return {
            notes: notes.map(n => ({
                id: n.id!.toString(),
                title: n.title,
                content: n.content,
                category: n.category,
                date: new Date(n.date)
            })),
            tasks: tasks.map(t => ({
                id: t.id!.toString(),
                title: t.title,
                description: t.description,
                completed: t.completed,
                date: t.date ? new Date(t.date) : undefined,
                time: t.time,
                priority: t.priority
            })),
            summary
        };
    }

    /**
     * Search notes only
     */
    static async searchNotes(query: string, category?: string) {
        let notes = await db.notes.toArray();

        // Filter by category if provided
        if (category) {
            notes = notes.filter(n => n.category.toLowerCase() === category.toLowerCase());
        }

        // Search by query - split into words for better matching
        const lowerQuery = query.toLowerCase();
        const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);

        notes = notes.filter(n => {
            const searchText = `${n.title} ${n.content}`.toLowerCase();
            // Match if ANY query word is found
            return queryWords.length === 0
                ? searchText.includes(lowerQuery)
                : queryWords.some(word => searchText.includes(word));
        });

        return notes;
    }

    /**
     * Search tasks only
     */
    static async searchTasks(query: string, category?: string) {
        let tasks = await db.tasks.toArray();

        // Filter by category if provided
        if (category) {
            tasks = tasks.filter(t => {
                const taskCategory = (t as any).category;
                return taskCategory && taskCategory.toLowerCase() === category.toLowerCase();
            });
        }

        // Search by query - split into words for better matching
        const lowerQuery = query.toLowerCase();
        const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);

        tasks = tasks.filter(t => {
            const searchText = `${t.title} ${(t as any).description || ''}`.toLowerCase();
            // Match if ANY query word is found
            return queryWords.length === 0
                ? searchText.includes(lowerQuery)
                : queryWords.some(word => searchText.includes(word));
        });

        return tasks;
    }

    /**
     * Generate summary of search results
     */
    static generateSummary(noteCount: number, taskCount: number, query: string): string {
        if (noteCount === 0 && taskCount === 0) {
            return `ไม่พบข้อมูลที่เกี่ยวข้องกับ "${query}" ลองค้นหาด้วยคำอื่นดูครับ`;
        }

        const parts = [];
        if (noteCount > 0) {
            parts.push(`${noteCount} โน้ต`);
        }
        if (taskCount > 0) {
            parts.push(`${taskCount} งาน`);
        }

        return `พบ ${parts.join(' และ ')} ที่เกี่ยวข้องกับ "${query}"`;
    }

    /**
     * Legacy method for backward compatibility
     */
    static async retrieveContext(query: string): Promise<string> {
        const notes = await this.searchNotes(query);

        if (notes.length === 0) {
            return 'No relevant notes found.';
        }

        let context = 'Here are some relevant notes from the user\'s database:\n';
        notes.slice(0, 3).forEach(note => {
            context += `- [${note.title}]: ${note.content}\n`;
        });

        return context;
    }

    /**
     * Construct prompt with context
     */
    static constructPrompt(query: string, context: string): string {
        return `
Context information is below.
---------------------
${context}
---------------------
Given the context information and not prior knowledge, answer the query.
Query: ${query}
Answer:
    `.trim();
    }
}
