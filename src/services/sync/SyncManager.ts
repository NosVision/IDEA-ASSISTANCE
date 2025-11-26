import { db } from '../../db';

export interface SyncAction {
    id?: number;
    action: 'CREATE_NOTE' | 'UPDATE_NOTE' | 'DELETE_NOTE' | 'CREATE_TASK' | 'UPDATE_TASK';
    payload: any;
    timestamp: number;
}

export class SyncManager {
    static async addToQueue(action: Omit<SyncAction, 'id' | 'timestamp'>) {
        await db.table('syncQueue').add({
            ...action,
            timestamp: Date.now()
        });

        if (navigator.onLine) {
            this.processQueue();
        }
    }

    static async processQueue() {
        if (!navigator.onLine) return;

        const queue = await db.table('syncQueue').toArray();

        for (const item of queue) {
            try {
                // TODO: Send to backend API
                console.log('Syncing item:', item);

                // If successful, remove from queue
                await db.table('syncQueue').delete(item.id);
            } catch (error) {
                console.error('Sync failed for item:', item, error);
            }
        }
    }
}

// Listen for online status
window.addEventListener('online', () => {
    SyncManager.processQueue();
});
