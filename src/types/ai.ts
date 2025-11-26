// TypeScript types and interfaces for AI auto-categorization system

export interface Intent {
    type: 'note' | 'task' | 'question' | 'chat' | 'update_note' | 'update_task' | 'delete_note' | 'delete_task';
    confidence: number;
    data: NoteData | TaskData | QuestionData | UpdateData | DeleteData | null;
}

export interface NoteData {
    title: string;
    content: string;
    category: string;
}

export interface TaskData {
    title: string;
    description?: string;
    category: string;
    date?: Date;
    time?: string;
    priority: 'low' | 'medium' | 'high';
}

export interface QuestionData {
    query: string;
    filters?: {
        category?: string;
        type?: 'note' | 'task';
        dateRange?: { start: Date; end: Date };
    };
}

export interface UpdateData {
    id?: string; // If known
    searchQuery: string; // To find the item to update
    updates: Partial<NoteData> | Partial<TaskData>;
}

export interface DeleteData {
    id?: string; // If known
    searchQuery: string; // To find the item to delete
    type: 'note' | 'task';
}

export interface Category {
    id?: string;
    name: string;
    type: 'note' | 'task' | 'both';
    createdBy: 'user' | 'ai';
    keywords: string[];
    color?: string;
    icon?: string;
    count: number;
    createdAt: Date;
}

export interface SearchResult {
    notes: Array<{
        id: string;
        title: string;
        content: string;
        category: string;
        date: Date;
    }>;
    tasks: Array<{
        id: string;
        title: string;
        description?: string;
        completed: boolean;
        date?: Date;
        time?: string;
        priority: 'low' | 'medium' | 'high';
    }>;
    summary: string;
}

export interface IntentDetectionResponse {
    type: 'note' | 'task' | 'question' | 'chat';
    confidence: number;
    data: {
        title?: string;
        content?: string;
        description?: string;
        category?: string;
        date?: string;
        time?: string;
        priority?: 'low' | 'medium' | 'high';
    };
}
