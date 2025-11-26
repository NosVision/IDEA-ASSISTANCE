import { db } from '../../db';
import { LLMService } from './llm';
import { CATEGORY_SUGGESTION_PROMPT } from './prompts';
import type { Category } from '../../types/ai';

export class CategoryManagerService {
    /**
     * Get all categories from database
     */
    static async getAllCategories(): Promise<Category[]> {
        const categories = await db.categories.toArray();
        return categories.map(c => ({
            ...c,
            id: c.id?.toString(),
            createdAt: new Date(c.createdAt)
        }));
    }

    /**
     * Get categories by type
     */
    static async getCategoriesByType(type: 'note' | 'task' | 'both'): Promise<Category[]> {
        const allCategories = await this.getAllCategories();
        return allCategories.filter(c => c.type === type || c.type === 'both');
    }

    /**
     * Suggest category using AI
     */
    static async suggestCategory(content: string, type: 'note' | 'task'): Promise<string> {
        try {
            const existingCategories = await this.getCategoriesByType(type);
            const categoryNames = existingCategories.map(c => c.name).join(', ');

            const prompt = `${CATEGORY_SUGGESTION_PROMPT}\n\nExisting categories: ${categoryNames}\n\nContent: "${content}"\n\nSuggested category:`;

            const response = await LLMService.generateResponse(prompt);
            const category = response.content.trim().replace(/['"]/g, '');

            return category || 'Personal';
        } catch (error) {
            console.error('Category suggestion failed:', error);
            return 'Personal';
        }
    }

    /**
     * Create new category
     */
    static async createCategory(
        name: string,
        type: 'note' | 'task' | 'both',
        createdBy: 'user' | 'ai' = 'ai'
    ): Promise<Category> {
        // Check if category already exists
        const existing = await this.findByName(name);
        if (existing) {
            return existing;
        }

        const category: Category = {
            name,
            type,
            createdBy,
            keywords: this.generateKeywords(name),
            count: 0,
            createdAt: new Date()
        };

        const id = await db.categories.add(category as any);
        return { ...category, id: id.toString() };
    }

    /**
     * Find category by name (case-insensitive)
     */
    static async findByName(name: string): Promise<Category | null> {
        const allCategories = await this.getAllCategories();
        const found = allCategories.find(
            c => c.name.toLowerCase() === name.toLowerCase()
        );
        return found || null;
    }

    /**
     * Find similar categories using fuzzy matching
     */
    static async findSimilarCategories(name: string): Promise<Category[]> {
        const allCategories = await this.getAllCategories();
        const lowerName = name.toLowerCase();

        return allCategories.filter(c => {
            const lowerCategoryName = c.name.toLowerCase();
            // Check name similarity
            if (lowerCategoryName.includes(lowerName) || lowerName.includes(lowerCategoryName)) {
                return true;
            }
            // Check keywords
            return c.keywords.some(k => k.toLowerCase().includes(lowerName));
        });
    }

    /**
     * Get or create category
     */
    static async getOrCreateCategory(
        name: string,
        type: 'note' | 'task',
        createdBy: 'user' | 'ai' = 'ai'
    ): Promise<Category> {
        // Try to find exact match first
        let category = await this.findByName(name);
        if (category) {
            return category;
        }

        // Check for similar categories
        const similar = await this.findSimilarCategories(name);
        if (similar.length > 0) {
            // Use the first similar category
            return similar[0];
        }

        // Create new category
        return await this.createCategory(name, type, createdBy);
    }

    /**
     * Update category count
     */
    static async updateCount(categoryId: string, delta: number): Promise<void> {
        const category = await db.categories.get(categoryId);
        if (category) {
            await db.categories.update(categoryId, {
                count: (category.count || 0) + delta
            });
        }
    }

    /**
     * Generate keywords from category name
     */
    private static generateKeywords(name: string): string[] {
        const keywords = [name.toLowerCase()];

        // Add common variations
        const variations: Record<string, string[]> = {
            'work': ['งาน', 'ทำงาน', 'office'],
            'personal': ['ส่วนตัว', 'private'],
            'ideas': ['ไอเดีย', 'idea', 'thinking'],
            'fitness': ['ออกกำลังกาย', 'exercise', 'workout'],
            'shopping': ['ช็อปปิ้ง', 'ซื้อของ', 'buy'],
            'meeting': ['ประชุม', 'conference', 'call'],
            'health': ['สุขภาพ', 'healthy'],
            'finance': ['การเงิน', 'money', 'budget']
        };

        const lowerName = name.toLowerCase();
        for (const [key, values] of Object.entries(variations)) {
            if (lowerName.includes(key) || values.some(v => lowerName.includes(v))) {
                keywords.push(...values);
            }
        }

        return [...new Set(keywords)]; // Remove duplicates
    }

    /**
     * Initialize default categories
     */
    static async initializeDefaultCategories(): Promise<void> {
        const defaults = [
            { name: 'Personal', type: 'both' as const },
            { name: 'Work', type: 'both' as const },
            { name: 'Ideas', type: 'note' as const },
            { name: 'Projects', type: 'both' as const },
            { name: 'Meeting', type: 'both' as const }
        ];

        for (const def of defaults) {
            const existing = await this.findByName(def.name);
            if (!existing) {
                await this.createCategory(def.name, def.type, 'user');
            }
        }
    }
}
