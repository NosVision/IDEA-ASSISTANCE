import { supabase } from '../../config/supabase';

export interface UserProfile {
    id: string;
    firebase_uid: string;
    email: string | null;
    display_name: string | null;
    subscription_tier: 'free' | 'pro' | 'enterprise';
    subscription_status: 'active' | 'cancelled' | 'expired';
    subscription_expires_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface SyncMetadata {
    id: string;
    user_id: string;
    last_sync_at: string | null;
    sync_status: 'idle' | 'syncing' | 'error';
    sync_error: string | null;
    notes_count: number;
    tasks_count: number;
    created_at: string;
    updated_at: string;
}

export interface UsageLog {
    id: string;
    user_id: string;
    action_type: 'ai_chat' | 'ai_transcribe' | 'ai_summary';
    tokens_used: number;
    created_at: string;
}

export class SupabaseService {
    /**
     * Get or create user profile
     */
    static async getOrCreateUserProfile(firebaseUid: string, email: string | null, displayName: string | null): Promise<UserProfile | null> {
        // Check if profile exists
        const { data: existing } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('firebase_uid', firebaseUid)
            .single();

        if (existing) {
            return existing as UserProfile;
        }

        // Create new profile
        const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
                firebase_uid: firebaseUid,
                email,
                display_name: displayName
            })
            .select()
            .single();

        if (createError) {
            console.error('Failed to create user profile:', createError);
            return null;
        }

        // Create sync metadata entry
        await supabase
            .from('sync_metadata')
            .insert({
                user_id: newProfile.id
            });

        return newProfile as UserProfile;
    }

    /**
     * Update sync metadata
     */
    static async updateSyncMetadata(userId: string, notesCount: number, tasksCount: number): Promise<void> {
        await supabase
            .from('sync_metadata')
            .upsert({
                user_id: userId,
                last_sync_at: new Date().toISOString(),
                sync_status: 'idle',
                notes_count: notesCount,
                tasks_count: tasksCount
            }, {
                onConflict: 'user_id'
            });
    }

    /**
     * Log AI usage
     */
    static async logUsage(userId: string, actionType: 'ai_chat' | 'ai_transcribe' | 'ai_summary', tokensUsed: number = 0): Promise<void> {
        await supabase
            .from('usage_logs')
            .insert({
                user_id: userId,
                action_type: actionType,
                tokens_used: tokensUsed
            });
    }

    /**
     * Get usage count for today
     */
    static async getTodayUsageCount(userId: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', today.toISOString());

        if (error) {
            console.error('Failed to get usage count:', error);
            return 0;
        }

        return data?.length || 0;
    }

    /**
     * Check if user has exceeded daily quota
     */
    static async checkQuota(userId: string, tier: 'free' | 'pro' | 'enterprise'): Promise<boolean> {
        const quotas = {
            free: 50,
            pro: 500,
            enterprise: Infinity
        };

        const todayCount = await this.getTodayUsageCount(userId);
        return todayCount < quotas[tier];
    }

    /**
     * Get user's subscription info
     */
    static async getUserProfile(firebaseUid: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('firebase_uid', firebaseUid)
            .single();

        if (error) {
            console.error('Failed to get user profile:', error);
            return null;
        }

        return data as UserProfile;
    }
}
