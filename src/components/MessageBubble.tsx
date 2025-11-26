import React from 'react';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
    role: 'user' | 'assistant';
    content: React.ReactNode;
    timestamp: Date;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content, timestamp }) => {
    const isUser = role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`message-bubble ${isUser ? 'user' : 'assistant'}`}
            style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '16px',
                borderBottomRightRadius: isUser ? '4px' : '16px',
                borderBottomLeftRadius: isUser ? '16px' : '4px',
                backgroundColor: isUser ? 'var(--color-primary)' : 'var(--color-border)',
                color: isUser ? 'var(--color-bg)' : 'var(--color-text)',
                marginBottom: '12px',
                boxShadow: 'var(--shadow-sm)',
                wordWrap: 'break-word'
            }}
        >
            <div style={{ margin: 0, lineHeight: 1.5 }}>{content}</div>
            <span style={{
                fontSize: '10px',
                opacity: 0.7,
                display: 'block',
                marginTop: '4px',
                textAlign: isUser ? 'right' : 'left'
            }}>
                {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </motion.div>
    );
};

export default MessageBubble;
