import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { OfflineWhisperService } from '../services/ai/whisper';

interface ModelState {
    isInitialized: boolean;
    isInitializing: boolean;
    progress: number;
    error: string | null;
}

interface ModelContextType {
    whisperState: ModelState;
    initializeWhisper: () => Promise<void>;
    retryInitialization: () => Promise<void>;
    skipInitialization: () => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const useModel = () => {
    const context = useContext(ModelContext);
    if (!context) {
        throw new Error('useModel must be used within ModelProvider');
    }
    return context;
};

interface ModelProviderProps {
    children: ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
    const [whisperState, setWhisperState] = useState<ModelState>({
        isInitialized: false,
        isInitializing: false,
        progress: 0,
        error: null
    });

    const initializeWhisper = async () => {
        setWhisperState(prev => ({
            ...prev,
            isInitializing: true,
            error: null,
            progress: 0
        }));

        try {
            console.log('Starting Whisper initialization...');

            // Initialize with progress tracking
            await OfflineWhisperService.initialize((progress) => {
                setWhisperState(prev => ({
                    ...prev,
                    progress
                }));
            });

            console.log('Whisper initialized successfully');
            setWhisperState({
                isInitialized: true,
                isInitializing: false,
                progress: 100,
                error: null
            });
        } catch (error) {
            console.error('Failed to initialize Whisper:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : 'Failed to initialize speech recognition model';

            setWhisperState({
                isInitialized: false,
                isInitializing: false,
                progress: 0,
                error: errorMessage
            });
        }
    };

    const retryInitialization = async () => {
        await initializeWhisper();
    };

    const skipInitialization = () => {
        setWhisperState(prev => ({
            ...prev,
            isInitialized: true, // Fake initialization to unblock UI
            error: null
        }));
    };

    // Auto-initialize on mount
    useEffect(() => {
        initializeWhisper();
    }, []);

    const value: ModelContextType = {
        whisperState,
        initializeWhisper,
        retryInitialization,
        skipInitialization
    };

    return (
        <ModelContext.Provider value={value}>
            {children}
        </ModelContext.Provider>
    );
};
