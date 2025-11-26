import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar } from 'lucide-react';

interface ChatNoteCardProps {
    note: {
        id: string;
        title: string;
        category: string;
        date: Date;
        content?: string;
    };
    onViewClick: (id: string) => void;
}

const ChatNoteCard: React.FC<ChatNoteCardProps> = ({ note, onViewClick }) => {
    const getCategoryEmoji = (category: string) => {
        const emojiMap: Record<string, string> = {
            'Ideas': '💡',
            'Work': '💼',
            'Personal': '👤',
            'Projects': '📁',
            'Meeting': '📅',
            'Fitness': '💪',
            'Shopping': '🛒',
            'Health': '🏥',
            'Finance': '💰'
        };
        return emojiMap[category] || '📝';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '8px',
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                transition: 'all 0.2s'
            }}
            onClick={() => onViewClick(note.id)}
        >
            {/* Category */}
            <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--color-primary)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                <span>{getCategoryEmoji(note.category)}</span>
                <span>{note.category}</span>
            </div>

            {/* Title */}
            <div style={{
                fontSize: '15px',
                fontWeight: '500',
                marginBottom: '8px',
                color: 'var(--color-text)'
            }}>
                {note.title}
            </div>

            {/* Content Preview */}
            {note.content && (
                <div style={{
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                }}>
                    {note.content}
                </div>
            )}

            {/* Footer */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: 'var(--color-text-secondary)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    <span>{note.date.toLocaleDateString()}</span>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--color-primary)',
                    fontWeight: '500'
                }}>
                    <span>View Note</span>
                    <ArrowRight size={14} />
                </div>
            </div>
        </motion.div>
    );
};

export default ChatNoteCard;
