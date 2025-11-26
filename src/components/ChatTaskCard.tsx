import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock, Flag } from 'lucide-react';

interface ChatTaskCardProps {
    task: {
        id: string;
        title: string;
        priority: 'low' | 'medium' | 'high';
        date?: Date;
        time?: string;
        completed: boolean;
        description?: string;
    };
    onViewClick: (id: string) => void;
}

const ChatTaskCard: React.FC<ChatTaskCardProps> = ({ task, onViewClick }) => {
    const priorityColors = {
        low: 'var(--color-success)',
        medium: 'var(--color-warning)',
        high: 'var(--color-danger)'
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
                borderLeft: `4px solid ${priorityColors[task.priority]}`,
                transition: 'all 0.2s'
            }}
            onClick={() => onViewClick(task.id)}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '600'
                }}>
                    <Flag size={12} fill={priorityColors[task.priority]} color={priorityColors[task.priority]} />
                    <span style={{
                        color: priorityColors[task.priority],
                        textTransform: 'capitalize'
                    }}>
                        {task.priority}
                    </span>
                </div>
                {task.completed && (
                    <div style={{
                        fontSize: '11px',
                        backgroundColor: 'var(--color-success)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: '600'
                    }}>
                        ✓ Done
                    </div>
                )}
            </div>

            {/* Title */}
            <div style={{
                fontSize: '15px',
                fontWeight: '500',
                marginBottom: '8px',
                color: task.completed ? 'var(--color-text-secondary)' : 'var(--color-text)',
                textDecoration: task.completed ? 'line-through' : 'none'
            }}>
                {task.title}
            </div>

            {/* Description Preview */}
            {task.description && (
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
                    {task.description}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {task.date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            <span>{task.date.toLocaleDateString()}</span>
                        </div>
                    )}
                    {task.time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            <span>{task.time}</span>
                        </div>
                    )}
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--color-primary)',
                    fontWeight: '500'
                }}>
                    <span>View Task</span>
                    <ArrowRight size={14} />
                </div>
            </div>
        </motion.div>
    );
};

export default ChatTaskCard;
