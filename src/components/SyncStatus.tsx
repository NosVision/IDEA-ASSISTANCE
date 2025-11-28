import React, { useEffect, useState } from 'react';
import { Cloud, RefreshCw, Check } from 'lucide-react';
import { SyncManager } from '../services/sync/SyncManager';
import { motion, AnimatePresence } from 'framer-motion';

export const SyncStatus: React.FC = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncStatus, setLastSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        const syncManager = SyncManager.getInstance();
        const unsubscribe = syncManager.subscribe((syncing) => {
            setIsSyncing(syncing);
            if (!syncing) {
                // Determine success/error? 
                // SyncManager doesn't expose error state yet.
                // For now assume success if it stops syncing.
                setLastSyncStatus('success');
                setTimeout(() => setLastSyncStatus('idle'), 3000);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSyncClick = () => {
        SyncManager.getInstance().sync();
    };

    return (
        <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '20px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                cursor: isSyncing ? 'default' : 'pointer',
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
                transition: 'all 0.2s'
            }}
            title="Sync with Google Drive"
        >
            <AnimatePresence mode="wait">
                {isSyncing ? (
                    <motion.div
                        key="syncing"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <RefreshCw size={16} className="spin" />
                    </motion.div>
                ) : lastSyncStatus === 'success' ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <Check size={16} color="var(--color-success)" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <Cloud size={16} />
                    </motion.div>
                )}
            </AnimatePresence>
            <span>
                {isSyncing ? 'Syncing...' : lastSyncStatus === 'success' ? 'Synced' : 'Sync'}
            </span>
            <style>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </button>
    );
};
