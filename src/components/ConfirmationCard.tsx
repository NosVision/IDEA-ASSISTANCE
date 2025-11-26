import React from 'react';
import { motion } from 'framer-motion';
import { Save, Edit2, X } from 'lucide-react';

interface ConfirmationCardProps {
    type: 'note' | 'task';
    data: {
        title: string;
        content?: string;
        description?: string;
        category: string;
        date?: Date;
        time?: string;
        priority?: 'low' | 'medium' | 'high';
    };
    onConfirm: () => void;
    onEdit: () => void;
    onCancel: () => void;
}

const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
    type,
    data,
    onConfirm,
    onEdit,
    onCancel
}) => {
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '2px solid var(--color-primary)',
                marginBottom: '16px'
            }}
        >
            {/* Header */}
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--color-primary)',
                    marginBottom: '8px'
                }}>
                    {type === 'note' ? '📝 Save as Note?' : '✅ Create Task?'}
                </h3>
            </div>

            {/* Content */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                        Title
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '500' }}>
                        {data.title}
                    </div>
                </div>

                {(data.description || data.content) && (
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                            {type === 'note' ? 'Content' : 'Description'}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                            {data.description || data.content}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                            Category
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>
                            {getCategoryEmoji(data.category)} {data.category}
                        </div>
                    </div>

                    {data.date && (
                        <div>
                            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                                Date
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                {data.date.toLocaleDateString()}
                            </div>
                        </div>
                    )}

                    {data.time && (
                        <div>
                            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                                Time
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                {data.time}
                            </div>
                        </div>
                    )}

                    {data.priority && (
                        <div>
                            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                                Priority
                            </div>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: data.priority === 'high' ? 'var(--color-danger)' :
                                    data.priority === 'medium' ? 'var(--color-warning)' :
                                        'var(--color-success)'
                            }}>
                                {data.priority.charAt(0).toUpperCase() + data.priority.slice(1)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={onConfirm}
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <Save size={16} />
                    Save
                </button>
                <button
                    onClick={onEdit}
                    style={{
                        padding: '10px',
                        borderRadius: '10px',
                        backgroundColor: 'white',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '10px',
                        borderRadius: '10px',
                        backgroundColor: 'white',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <X size={16} />
                </button>
            </div>
        </motion.div>
    );
};

export default ConfirmationCard;
