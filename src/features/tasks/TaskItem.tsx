import React from 'react';
import { CheckCircle, Circle, Calendar, Flag } from 'lucide-react';
import { motion } from 'framer-motion';

export interface Task {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    date?: Date;
    time?: string;
    priority: 'low' | 'medium' | 'high';
    category?: string;
    completedAt?: Date;
}

interface TaskItemProps {
    task: Task;
    onToggle: (id: string) => void;
    onClick?: (task: Task) => void;
}

const priorityColors = {
    low: 'var(--color-success)',
    medium: 'var(--color-warning)',
    high: 'var(--color-danger)'
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onClick }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="task-item"
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                backgroundColor: 'var(--color-bg)',
                borderBottom: '1px solid var(--color-border)',
                gap: '12px'
            }}
        >
            <button onClick={() => onToggle(task.id)}>
                {task.completed ? (
                    <CheckCircle size={24} color="var(--color-accent)" fill="var(--color-accent)" stroke="white" />
                ) : (
                    <Circle size={24} color="var(--color-border)" />
                )}
            </button>

            <div
                style={{ flex: 1, cursor: onClick ? 'pointer' : 'default' }}
                onClick={() => onClick?.(task)}
            >
                <h3 style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? 'var(--color-text-secondary)' : 'var(--color-text)',
                    marginBottom: '4px'
                }}>
                    {task.title}
                </h3>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {task.category && (
                        <div className="flex-center" style={{
                            gap: '4px',
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            padding: '2px 8px',
                            borderRadius: '12px'
                        }}>
                            <span style={{ fontWeight: 500 }}>{task.category}</span>
                        </div>
                    )}
                    {task.date && (
                        <div className="flex-center" style={{ gap: '4px' }}>
                            <Calendar size={12} />
                            <span>{task.date.toLocaleDateString()}</span>
                        </div>
                    )}
                    <div className="flex-center" style={{ gap: '4px' }}>
                        <Flag size={12} color={priorityColors[task.priority]} fill={priorityColors[task.priority]} />
                        <span style={{ textTransform: 'capitalize' }}>{task.priority}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TaskItem;
