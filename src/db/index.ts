import Dexie, { type Table } from 'dexie';

export interface Note {
    id?: string;
    title: string;
    content: string;
    category: string;
    date: Date;
    audioBlob?: Blob;
    transcriptionStatus?: 'pending' | 'completed' | 'failed';
}

export interface Task {
    id?: string;
    title: string;
    description?: string;
    completed: boolean;
    date?: Date;
    time?: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    completedAt?: Date; // Track when task was completed
}

export interface DeletedTask {
    id?: string;
    originalId: string; // Original task ID
    title: string;
    description?: string;
    completed: boolean;
    date?: Date;
    time?: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    deletedAt: Date; // When it was deleted
    completedAt?: Date;
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

export interface ChatSession {
    id?: string;
    createdAt: Date;
    updatedAt: Date;
    title?: string; // Auto-generated from first message
}

export interface ChatMessage {
    id?: string;
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface Setting {
    key: string;
    value: any;
}

export interface SyncQueueItem {
    id?: number;
    action: 'CREATE_NOTE' | 'UPDATE_NOTE' | 'DELETE_NOTE' | 'CREATE_TASK' | 'UPDATE_TASK';
    payload: any;
    timestamp: number;
}

export class VoiceNoteDB extends Dexie {
    notes!: Table<Note>;
    tasks!: Table<Task>;
    deleted_tasks!: Table<DeletedTask>;
    categories!: Table<Category>;
    chat_sessions!: Table<ChatSession>;
    chat_messages!: Table<ChatMessage>;
    settings!: Table<Setting>;
    syncQueue!: Table<SyncQueueItem>;

    constructor() {
        super('VoiceNoteDB');
        this.version(1).stores({
            notes: '++id, title, category, date, transcriptionStatus',
            tasks: '++id, title, completed, date, priority',
            settings: 'key',
            syncQueue: '++id, action, timestamp'
        });
        this.version(2).stores({
            notes: '++id, title, category, date, transcriptionStatus',
            tasks: '++id, title, completed, date, priority',
            categories: '++id, name, type, createdBy',
            settings: 'key',
            syncQueue: '++id, action, timestamp'
        });
        // Version 3: Add chat history
        this.version(3).stores({
            notes: '++id, title, category, date, transcriptionStatus',
            tasks: '++id, title, completed, date, priority',
            categories: '++id, name, type, createdBy',
            chat_sessions: '++id, createdAt, updatedAt',
            chat_messages: '++id, sessionId, role, timestamp',
            settings: 'key',
            syncQueue: '++id, action, timestamp'
        });
        // Version 4: Add deleted_tasks and completedAt
        this.version(4).stores({
            notes: '++id, title, category, date, transcriptionStatus',
            tasks: '++id, title, completed, date, priority, completedAt',
            deleted_tasks: '++id, originalId, deletedAt',
            categories: '++id, name, type, createdBy',
            chat_sessions: '++id, createdAt, updatedAt',
            chat_messages: '++id, sessionId, role, timestamp',
            settings: 'key',
            syncQueue: '++id, action, timestamp'
        }).upgrade(async (trans) => {
            // Migrate existing tasks to add completedAt field
            const tasks = await trans.table('tasks').toArray();
            for (const task of tasks) {
                if (task.completed && !task.completedAt) {
                    await trans.table('tasks').update(task.id, {
                        completedAt: task.date || new Date()
                    });
                }
            }
        });
    }
}

export const db = new VoiceNoteDB();
