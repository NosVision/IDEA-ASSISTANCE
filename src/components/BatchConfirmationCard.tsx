import React from 'react';
import type { NoteData, TaskData } from '../types/ai';

interface BatchConfirmationCardProps {
    type: 'note' | 'task';
    items: Array<NoteData | TaskData>;
    summary: string;
    onConfirmAll: () => void;
    onCancel: () => void;
}

const BatchConfirmationCard: React.FC<BatchConfirmationCardProps> = ({
    type,
    items,
    summary,
    onConfirmAll,
    onCancel
}) => {
    const getCategoryEmoji = (category: string) => {
        const map: Record<string, string> = {
            'Fitness': '💪',
            'Work': '💼',
            'Ideas': '💡',
            'Projects': '🚀',
            'Meeting': '📅',
            'Personal': '👤',
            'Shopping': '🛒',
            'Study': '📚'
        };
        return map[category] || '📝';
    };

    const renderTaskItem = (task: TaskData, index: number) => (
        <div
            key={index}
            style={{
                backgroundColor: 'var(--color-surface)',
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                border: '1px solid var(--color-border)'
            }}
        >
            <div style={{ fontSize: '20px' }}>✅</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {index + 1}. {task.title}
                </div>
                <div style={{
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <span>{getCategoryEmoji(task.category)} {task.category}</span>
                    {task.time && <span>🕐 {task.time}</span>}
                    {task.date && <span>📅 {task.date.toLocaleDateString('th-TH')}</span>}
                    {task.priority === 'high' && <span style={{ color: 'var(--color-danger)' }}>⚠️ สำคัญ</span>}
                </div>
            </div>
        </div>
    );

    const renderNoteItem = (note: NoteData, index: number) => (
        <div
            key={index}
            style={{
                backgroundColor: 'var(--color-surface)',
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                border: '1px solid var(--color-border)'
            }}
        >
            <div style={{ fontSize: '20px' }}>📝</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {index + 1}. {note.title}
                </div>
                {note.content && (
                    <div style={{
                        fontSize: '13px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '4px'
                    }}>
                        {note.content}
                    </div>
                )}
                <div style={{
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)'
                }}>
                    {getCategoryEmoji(note.category)} {note.category}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '100%'
        }}>
            {/* Header */}
            <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span>{type === 'task' ? '📋' : '📝'}</span>
                <span>{summary}</span>
            </div>

            {/* Item Count */}
            <div style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                marginBottom: '16px'
            }}>
                พบ {type === 'task' ? 'Task' : 'โน้ต'} {items.length} รายการ
            </div>

            {/* Items List */}
            <div style={{ marginBottom: '16px' }}>
                {type === 'task'
                    ? items.map((item, index) => renderTaskItem(item as TaskData, index))
                    : items.map((item, index) => renderNoteItem(item as NoteData, index))
                }
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={onConfirmAll}
                    style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        fontWeight: '600',
                        fontSize: '15px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <span>✓</span>
                    <span>Save All {items.length} {type === 'task' ? 'Tasks' : 'Notes'}</span>
                </button>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '14px 20px',
                        borderRadius: '12px',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                        fontWeight: '600',
                        fontSize: '15px',
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default BatchConfirmationCard;
