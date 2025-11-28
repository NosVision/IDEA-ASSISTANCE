
import { db } from '../../db';
import { GoogleDriveSync } from './GoogleDriveSync';
import { SupabaseService } from '../supabase/SupabaseService';
import { GoogleAuthService } from '../auth/GoogleAuth';

export class SyncManager {
    private static instance: SyncManager;
    private driveSync: GoogleDriveSync | null = null;
    private isSyncing = false;

    private constructor() { }

    private listeners: ((isSyncing: boolean) => void)[] = [];

    static getInstance(): SyncManager {
        if (!SyncManager.instance) {
            SyncManager.instance = new SyncManager();
        }
        return SyncManager.instance;
    }

    subscribe(listener: (isSyncing: boolean) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(l => l(this.isSyncing));
    }

    async sync(): Promise<void> {
        if (this.isSyncing) return;
        this.isSyncing = true;
        this.notifyListeners();

        try {
            // 1. Get Access Token (We need to fix this part to get the actual Google Access Token)
            // For now, let's assume we have it or need to get it.
            // The Firebase User object doesn't contain the Google Access Token after page reload.
            // We might need to re-authenticate or store it.
            // Actually, for long-term access, we need to handle token refresh or use the Firebase SDK to call Google APIs?
            // No, Firebase SDK doesn't proxy Drive API calls.
            // We need the Google Access Token.

            // Temporary: We will ask the user to sign in again if token is missing?
            // Or we store it in localStorage (insecure but works for MVP)?
            // Let's check how we handled it in GoogleAuth.ts

            const accessToken = localStorage.getItem('google_access_token');
            if (!accessToken) {
                console.warn('No Google Access Token found. Cannot sync.');
                return;
            }

            this.driveSync = new GoogleDriveSync(accessToken);

            // 2. Download from Drive
            const cloudData = await this.driveSync.syncFromGoogleDrive();

            // 3. Merge Cloud -> Local
            if (cloudData) {
                await this.mergeData(cloudData.data);
            }

            // 4. Get Local Data
            const localData = await this.getAllLocalData();

            // 5. Upload Local -> Drive
            await this.driveSync.syncToGoogleDrive(localData);

            // 6. Update Supabase metadata
            const user = GoogleAuthService.getCurrentUser();
            if (user) {
                const profile = await SupabaseService.getUserProfile(user.uid);
                if (profile) {
                    await SupabaseService.updateSyncMetadata(
                        profile.id,
                        localData.notes.length,
                        localData.tasks.length
                    );
                }
            }

            console.log('Sync completed successfully');
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            this.isSyncing = false;
            this.notifyListeners();
        }
    }

    private async getAllLocalData() {
        const [notes, tasks, categories, chatSessions, chatMessages, deletedTasks] = await Promise.all([
            db.notes.toArray(),
            db.tasks.toArray(),
            db.categories.toArray(),
            db.chat_sessions.toArray(),
            db.chat_messages.toArray(),
            db.deleted_tasks.toArray()
        ]);

        return {
            notes,
            tasks,
            categories,
            chatSessions,
            chatMessages,
            deletedTasks
        };
    }

    private async mergeData(cloudData: any) {
        await db.transaction('rw', [db.notes, db.tasks, db.categories, db.chat_sessions, db.chat_messages, db.deleted_tasks], async () => {
            // Merge Notes
            if (cloudData.notes) {
                for (const note of cloudData.notes) {
                    await this.mergeItem(db.notes, note);
                }
            }
            // Merge Tasks
            if (cloudData.tasks) {
                for (const task of cloudData.tasks) {
                    await this.mergeItem(db.tasks, task);
                }
            }
            // Merge Categories
            if (cloudData.categories) {
                for (const category of cloudData.categories) {
                    await this.mergeItem(db.categories, category);
                }
            }
            // Merge Chat Sessions
            if (cloudData.chatSessions) {
                for (const session of cloudData.chatSessions) {
                    await this.mergeItem(db.chat_sessions, session);
                }
            }
            // Merge Chat Messages
            if (cloudData.chatMessages) {
                for (const message of cloudData.chatMessages) {
                    await this.mergeItem(db.chat_messages, message);
                }
            }
            // Merge Deleted Tasks
            if (cloudData.deletedTasks) {
                for (const task of cloudData.deletedTasks) {
                    await this.mergeItem(db.deleted_tasks, task);
                }
            }
        });
    }

    private async mergeItem(table: any, cloudItem: any) {
        if (!cloudItem.uuid) return; // Skip items without UUID

        const localItem = await table.where('uuid').equals(cloudItem.uuid).first();

        if (!localItem) {
            // New item from cloud
            // Remove id to let Dexie auto-increment
            const { id, ...itemData } = cloudItem;
            await table.add(itemData);
        } else {
            // Item exists, check timestamp
            const cloudTime = new Date(cloudItem.updatedAt || 0).getTime();
            const localTime = new Date(localItem.updatedAt || 0).getTime();

            if (cloudTime > localTime) {
                // Cloud is newer, update local
                const { id, ...itemData } = cloudItem;
                await table.update(localItem.id, itemData);
            }
        }
    }
}
