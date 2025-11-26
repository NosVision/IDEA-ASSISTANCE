import React from 'react';
import { useModel } from '../contexts/ModelContext';
import { Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const ModelLoadingScreen: React.FC = () => {
    const { whisperState, retryInitialization, skipInitialization } = useModel();

    if (whisperState.isInitialized) {
        return null; // Don't show anything when initialized
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--color-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                maxWidth: '400px',
                padding: '40px',
                textAlign: 'center'
            }}>
                {whisperState.error ? (
                    // Error State
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <AlertCircle
                            size={64}
                            style={{
                                color: 'var(--color-danger)',
                                marginBottom: '20px'
                            }}
                        />
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            marginBottom: '12px',
                            color: 'var(--color-text-primary)'
                        }}>
                            Initialization Failed
                        </h2>
                        <p style={{
                            fontSize: '14px',
                            color: 'var(--color-text-secondary)',
                            marginBottom: '24px',
                            lineHeight: '1.6'
                        }}>
                            {whisperState.error}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={retryInitialization}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <RefreshCw size={18} />
                                Retry
                            </button>
                            <button
                                onClick={skipInitialization}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-text-primary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Skip
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-text-secondary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Reload
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    // Loading State
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'linear'
                            }}
                            style={{
                                display: 'inline-block',
                                marginBottom: '20px'
                            }}
                        >
                            <Loader
                                size={64}
                                style={{ color: 'var(--color-primary)' }}
                            />
                        </motion.div>

                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            marginBottom: '12px',
                            color: 'var(--color-text-primary)'
                        }}>
                            Loading AI Model
                        </h2>

                        <p style={{
                            fontSize: '14px',
                            color: 'var(--color-text-secondary)',
                            marginBottom: '24px'
                        }}>
                            Downloading speech recognition model...
                            <br />
                            This may take 10-30 seconds on first load.
                        </p>

                        {/* Progress Bar */}
                        <div style={{
                            width: '100%',
                            height: '4px',
                            backgroundColor: 'var(--color-border)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}>
                            <motion.div
                                initial={{ width: '0%' }}
                                animate={{
                                    width: whisperState.progress > 0
                                        ? `${whisperState.progress}%`
                                        : '30%'
                                }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    height: '100%',
                                    backgroundColor: 'var(--color-primary)',
                                    borderRadius: '2px'
                                }}
                            />
                        </div>

                        <p style={{
                            fontSize: '12px',
                            color: 'var(--color-text-secondary)',
                            marginTop: '12px'
                        }}>
                            {whisperState.progress > 0
                                ? `${whisperState.progress}% complete`
                                : 'Initializing...'}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ModelLoadingScreen;
