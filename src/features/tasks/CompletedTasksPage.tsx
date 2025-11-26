import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Trash2, RefreshCcw } from 'lucide-react';
import TaskItem, { type Task } from './TaskItem';
import { db, type DeletedTask } from '../../db';

const CompletedTasksPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'completed' | 'deleted'>('completed');
    const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
    const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('all');
    const [dates, setDates] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        if (activeTab === 'completed') {
            await loadCompletedTasks();
        } else {
            await loadDeletedTasks();
        }
    };

    const loadCompletedTasks = async () => {
        const dbTasks = await db.tasks.toArray();
        const tasks = dbTasks
            .filter(t => t.completed === true)
            .map(t => ({
                ...t,
                id: t.id!.toString(),
                date: t.date ? new Date(t.date) : undefined,
                completedAt: t.completedAt ? new Date(t.completedAt) : undefined
            }))
            .sort((a, b) => {
                if (!a.completedAt || !b.completedAt) return 0;
                return b.completedAt.getTime() - a.completedAt.getTime();
            });

        setCompletedTasks(tasks);

        // Extract unique dates
        const uniqueDates = Array.from(new Set(
            tasks
                .filter(t => t.completedAt)
                .map(t => t.completedAt!.toISOString().split('T')[0])
        )).sort().reverse();
        setDates(uniqueDates);
    };

    const loadDeletedTasks = async () => {
        const dbDeleted = await db.deleted_tasks.toArray();
        const tasks = dbDeleted
            .map(t => ({
                ...t,
                id: t.id!.toString(),
                date: t.date ? new Date(t.date) : undefined,
                deletedAt: new Date(t.deletedAt)
            }))
            .sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());

        setDeletedTasks(tasks);
    };

    const filteredCompletedTasks = selectedDate === 'all'
        ? completedTasks
        : completedTasks.filter(t =>
            t.completedAt?.toISOString().split('T')[0] === selectedDate
        );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateStr === today.toISOString().split('T')[0]) return 'วันนี้';
        if (dateStr === yesterday.toISOString().split('T')[0]) return 'เมื่อวาน';

        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    };

    const handleTaskClick = async (task: Task) => {
        navigate(`/tasks?id=${task.id}`);
    };

    const handleToggle = async (id: string) => {
        const task = completedTasks.find(t => t.id === id);
        if (task) {
            // Fix: Convert id to number for Dexie
            await db.tasks.update(Number(id), { completed: false, completedAt: undefined });
            await loadCompletedTasks();
        }
    };

    const handleRestore = async (task: DeletedTask) => {
        // Restore to tasks table
        await db.tasks.add({
            title: task.title,
            description: task.description,
            completed: task.completed,
            date: task.date,
            time: task.time,
            priority: task.priority,
            category: task.category,
            completedAt: task.completedAt
        } as any);

        // Remove from deleted_tasks
        await db.deleted_tasks.delete(Number(task.id));
        await loadDeletedTasks();
    };

    const handleDeleteForever = async (id: string) => {
        if (confirm('ต้องการลบถาวรหรือไม่?')) {
            await db.deleted_tasks.delete(Number(id));
            await loadDeletedTasks();
        }
    };

    return (
        <div className="page-container">
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => navigate('/tasks')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        cursor: 'pointer',
                        marginBottom: '16px'
                    }}
                >
                    <ArrowLeft size={20} />
                    <span>กลับ</span>
                </button>

                <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {activeTab === 'completed' ? 'Completed Tasks' : 'Trash'}
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    {activeTab === 'completed'
                        ? `${completedTasks.length} งานที่เสร็จแล้ว`
                        : `${deletedTasks.length} งานที่ถูกลบ (เก็บไว้ 30 วัน)`
                    }
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
                <button
                    onClick={() => setActiveTab('completed')}
                    style={{
                        padding: '12px 24px',
                        borderBottom: activeTab === 'completed' ? '2px solid var(--color-primary)' : 'none',
                        color: activeTab === 'completed' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        fontWeight: activeTab === 'completed' ? '600' : 'normal',
                        background: 'none',
                        border: 'none',
                        borderBottomWidth: activeTab === 'completed' ? '2px' : '0',
                        borderBottomStyle: 'solid',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Completed
                </button>
                <button
                    onClick={() => setActiveTab('deleted')}
                    style={{
                        padding: '12px 24px',
                        borderBottom: activeTab === 'deleted' ? '2px solid var(--color-danger)' : 'none',
                        color: activeTab === 'deleted' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                        fontWeight: activeTab === 'deleted' ? '600' : 'normal',
                        background: 'none',
                        border: 'none',
                        borderBottomWidth: activeTab === 'deleted' ? '2px' : '0',
                        borderBottomStyle: 'solid',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Trash
                </button>
            </div>

            {activeTab === 'completed' ? (
                <>
                    {/* Date Filter */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        marginBottom: '20px',
                        paddingBottom: '8px'
                    }}>
                        <button
                            onClick={() => setSelectedDate('all')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: selectedDate === 'all' ? 'var(--color-primary)' : 'var(--color-surface)',
                                color: selectedDate === 'all' ? 'white' : 'var(--color-text)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontSize: '14px'
                            }}
                        >
                            ทั้งหมด ({completedTasks.length})
                        </button>
                        {dates.map(date => {
                            const count = completedTasks.filter(t =>
                                t.completedAt?.toISOString().split('T')[0] === date
                            ).length;
                            return (
                                <button
                                    key={date}
                                    onClick={() => setSelectedDate(date)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: selectedDate === date ? 'var(--color-primary)' : 'var(--color-surface)',
                                        color: selectedDate === date ? 'white' : 'var(--color-text)',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Calendar size={14} />
                                    {formatDate(date)} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* Tasks List */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {filteredCompletedTasks.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: 'var(--color-text-secondary)'
                            }}>
                                {selectedDate === 'all'
                                    ? 'ยังไม่มีงานที่เสร็จ'
                                    : `ไม่มีงานที่เสร็จในวัน${formatDate(selectedDate)}`
                                }
                            </div>
                        ) : (
                            filteredCompletedTasks.map(task => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    onToggle={handleToggle}
                                    onClick={() => handleTaskClick(task)}
                                />
                            ))
                        )}
                    </div>
                </>
            ) : (
                /* Deleted Tasks List */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {deletedTasks.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            color: 'var(--color-text-secondary)'
                        }}>
                            ถังขยะว่างเปล่า
                        </div>
                    ) : (
                        deletedTasks.map(task => (
                            <div
                                key={task.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '16px',
                                    backgroundColor: 'var(--color-bg)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '12px',
                                    gap: '12px'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        color: 'var(--color-text-secondary)',
                                        textDecoration: 'line-through',
                                        marginBottom: '4px'
                                    }}>
                                        {task.title}
                                    </h3>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                        ลบเมื่อ: {task.deletedAt.toLocaleDateString()} {task.deletedAt.toLocaleTimeString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleRestore(task)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            backgroundColor: 'white',
                                            color: 'var(--color-success)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                        title="กู้คืน"
                                    >
                                        <RefreshCcw size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteForever(task.id!)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            backgroundColor: 'white',
                                            color: 'var(--color-danger)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                        title="ลบถาวร"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default CompletedTasksPage;
