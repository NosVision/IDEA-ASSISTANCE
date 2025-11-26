import React from 'react';
import { motion } from 'framer-motion';

export interface Note {
    id: string;
    title: string;
    content: string;
    category: string;
    date: Date;
    color?: string;
}

interface NoteCardProps {
    note: Note;
    onClick: (id: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
    return (
        <motion.div
            layout
            whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onClick(note.id)}
            style={{
                backgroundColor: note.color || 'var(--color-bg)',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                height: '100%',
                boxShadow: 'var(--shadow-sm)'
            }}
        >
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{note.title}</h3>
            <p style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
            }}>
                {note.content}
            </p>
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    fontWeight: 500
                }}>
                    {note.category}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                    {note.date.toLocaleDateString()}
                </span>
            </div>
        </motion.div>
    );
};

export default NoteCard;
