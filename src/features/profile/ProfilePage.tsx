import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Sparkles, Search, Network } from 'lucide-react';
import { db } from '../../db';
import { motion, AnimatePresence } from 'framer-motion';

interface APIKeys {
    openai: string;
    anthropic: string;
    google: string;
    perplexity: string;
    openrouter: string;
}

interface Provider {
    key: keyof APIKeys;
    name: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

const ProfilePage: React.FC = () => {
    const [apiKeys, setApiKeys] = useState<APIKeys>({
        openai: '',
        anthropic: '',
        google: '',
        perplexity: '',
        openrouter: ''
    });
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [tempKey, setTempKey] = useState('');

    useEffect(() => {
        loadAPIKeys();
    }, []);

    const loadAPIKeys = async () => {
        const savedKeys = await db.settings.get('apiKeys');
        if (savedKeys) {
            setApiKeys(savedKeys.value);
        }
    };

    const handleSave = async () => {
        if (!selectedProvider) return;

        const newKeys = { ...apiKeys, [selectedProvider.key]: tempKey };
        await db.settings.put({ key: 'apiKeys', value: newKeys });
        setApiKeys(newKeys);
        setSelectedProvider(null);
        setTempKey('');
    };

    const openProviderModal = (provider: Provider) => {
        setSelectedProvider(provider);
        setTempKey(apiKeys[provider.key] || '');
    };

    const providers: Provider[] = [
        {
            key: 'openai',
            name: 'ChatGPT (OpenAI)',
            icon: <MessageSquare size={24} />,
            color: '#10a37f',
            bgColor: '#e6f7f3'
        },
        {
            key: 'anthropic',
            name: 'Claude (Anthropic)',
            icon: <Sparkles size={24} />,
            color: '#d97757',
            bgColor: '#fef3ed'
        },
        {
            key: 'google',
            name: 'Gemini (Google)',
            icon: (
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4285f4' }}>G</div>
            ),
            color: '#4285f4',
            bgColor: '#e8f0fe'
        },
        {
            key: 'perplexity',
            name: 'Perplexity',
            icon: <Search size={24} />,
            color: '#20808d',
            bgColor: '#e0f2f4'
        },
        {
            key: 'openrouter',
            name: 'OpenRouter',
            icon: <Network size={24} />,
            color: '#8b5cf6',
            bgColor: '#f3e8ff'
        }
    ];

    return (
        <div className="page-container" style={{ maxWidth: '600px' }}>
            {/* Header */}
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '32px' }}>Settings</h1>

            {/* AI Providers Section */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '16px',
                    letterSpacing: '0.5px'
                }}>
                    AI PROVIDERS
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {providers.map((provider) => {
                        const isConfigured = !!apiKeys[provider.key];
                        return (
                            <motion.div
                                key={provider.key}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => openProviderModal(provider)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '16px',
                                    backgroundColor: 'var(--color-surface)',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    gap: '16px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '14px',
                                    backgroundColor: provider.bgColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: provider.color,
                                    flexShrink: 0
                                }}>
                                    {provider.icon}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '17px', fontWeight: '500', marginBottom: '2px' }}>
                                        {provider.name}
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        color: isConfigured ? provider.color : 'var(--color-text-secondary)'
                                    }}>
                                        {isConfigured ? 'Configured' : 'Not configured'}
                                    </div>
                                </div>

                                {/* Status Indicator */}
                                {isConfigured && (
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        backgroundColor: provider.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: 'white'
                                        }} />
                                    </div>
                                )}

                                {/* Arrow */}
                                <div style={{ color: 'var(--color-text-secondary)' }}>
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Info Box */}
            <div style={{
                padding: '16px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
            }}>
                <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    flexShrink: 0
                }}>
                    i
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#1e40af' }}>
                    <strong>Important:</strong> You must add your own OpenAI API key to use voice transcription and AI features. Get your key at platform.openai.com/api-keys. The selected provider (marked with a dot) will be used for all AI features.
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedProvider && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                        onClick={() => setSelectedProvider(null)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '24px 24px 0 0',
                                padding: '24px',
                                width: '100%',
                                maxWidth: '600px',
                                maxHeight: '90vh',
                                overflow: 'auto'
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>
                                    {selectedProvider.name}
                                </h2>
                                <button
                                    onClick={() => setSelectedProvider(null)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* API Key Input */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '15px',
                                    fontWeight: '500',
                                    marginBottom: '8px'
                                }}>
                                    API Key
                                </label>
                                <input
                                    type="password"
                                    value={tempKey}
                                    onChange={(e) => setTempKey(e.target.value)}
                                    placeholder="Enter your API key"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        backgroundColor: '#f9fafb',
                                        fontSize: '15px',
                                        fontFamily: 'monospace',
                                        outline: 'none'
                                    }}
                                />
                                <div style={{
                                    fontSize: '13px',
                                    color: '#6b7280',
                                    marginTop: '8px'
                                }}>
                                    Your API key is stored securely on your device and never shared.
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '14px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    fontSize: '17px',
                                    fontWeight: '600',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Save Configuration
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfilePage;
