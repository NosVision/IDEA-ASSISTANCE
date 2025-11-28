import Dexie, { type Table } from 'dexie';

export interface Note {
    id?: number;
    uuid?: string;
    title: string;
    content: string;
    category: string;
    date: Date;
    audioBlob?: Blob;
    transcriptionStatus?: 'pending' | 'completed' | 'failed';
    updatedAt?: Date;
}

export interface Task {
    id?: number;
    uuid?: string;
    title: string;
    description?: string;
    completed: boolean;
    date?: Date;
    time?: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    completedAt?: Date; // Track when task was completed
    updatedAt?: Date;
}

export interface DeletedTask {
    id?: number;
    uuid?: string;
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
    updatedAt?: Date;
}

export interface Category {
    id?: number;
    uuid?: string;
    name: string;
    type: 'note' | 'task' | 'both';
    createdBy: 'user' | 'ai';
    keywords: string[];
    color?: string;
    icon?: string;
    count: number;
    createdAt: Date;
    updatedAt?: Date;
}

export interface ChatSession {
    id?: number;
    uuid?: string;
    createdAt: Date;
    updatedAt: Date;
    title?: string; // Auto-generated from first message
}

export interface ChatMessage {
    id?: number;
    uuid?: string;
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    updatedAt?: Date;
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

        // Version 5: Add UUID and updatedAt for sync
        this.version(5).stores({
            notes: '++id, uuid, title, category, date, transcriptionStatus, updatedAt',
            tasks: '++id, uuid, title, completed, date, priority, completedAt, updatedAt',
            deleted_tasks: '++id, uuid, originalId, deletedAt, updatedAt',
            categories: '++id, uuid, name, type, createdBy, updatedAt',
            chat_sessions: '++id, uuid, createdAt, updatedAt',
            chat_messages: '++id, uuid, sessionId, role, timestamp, updatedAt',
            settings: 'key',
            syncQueue: '++id, action, timestamp'
        }).upgrade(async (trans) => {
            const tables = ['notes', 'tasks', 'deleted_tasks', 'categories', 'chat_sessions', 'chat_messages'];
            for (const tableName of tables) {
                await trans.table(tableName).toCollection().modify(item => {
                    if (!item.uuid) item.uuid = crypto.randomUUID();
                    if (!item.updatedAt) item.updatedAt = new Date();
                });
            }
        });
    }
}

export const db = new VoiceNoteDB();
