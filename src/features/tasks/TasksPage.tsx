import React, { useState, useEffect } from 'react';
import { Plus, X, CheckCircle2, Archive } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TaskItem, { type Task } from './TaskItem';
import { db } from '../../db';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoryManagerService } from '../../services/ai/category-manager';
import type { Category } from '../../types/ai';

const TasksPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCompletedModal, setShowCompletedModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '',
        description: '',
        priority: 'medium',
        completed: false,
        time: '',
        category: 'Personal'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await Promise.all([loadTasks(), loadCategories()]);
    };

    const loadTasks = async () => {
        const dbTasks = await db.tasks.toArray();
        setTasks(dbTasks.map(t => ({
            ...t,
            id: t.id!.toString(),
            date: t.date ? new Date(t.date) : undefined
        })));
    };

    const loadCategories = async () => {
        const cats = await CategoryManagerService.getCategoriesByType('task');
        setCategories(cats);
    };

    // Auto-open task detail modal from URL params
    useEffect(() => {
        const taskId = searchParams.get('id');
        if (taskId && tasks.length > 0) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                setSelectedTask(task);
                setShowDetailModal(true);
                // Clear URL params after opening
                setSearchParams({});
            }
        }
    }, [searchParams, tasks]);

    const toggleTask = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const newCompleted = !task.completed;
            await db.tasks.update(Number(id), {
                completed: newCompleted,
                completedAt: newCompleted ? new Date() : undefined
            });
            setTasks(prev => prev.map(t =>
                t.id === id ? { ...t, completed: newCompleted, completedAt: newCompleted ? new Date() : undefined } : t
            ));
        }
    };

    const handleAddTask = async () => {
        if (!newTask.title?.trim()) return;

        // Ensure category exists or use Personal
        let categoryName = newTask.category || 'Personal';
        const category = await CategoryManagerService.getOrCreateCategory(categoryName, 'task', 'user');
        categoryName = category.name;

        const taskToAdd = {
            title: newTask.title,
            description: newTask.description || '',
            completed: false,
            priority: newTask.priority || 'medium',
            date: newTask.date ? new Date(newTask.date) : undefined,
            time: newTask.time || '',
            category: categoryName
        };

        const id = await db.tasks.add(taskToAdd as any);
        setTasks(prev => [...prev, { ...taskToAdd, id: id.toString() }]);

        // Update category count
        if (category.id) {
            await CategoryManagerService.updateCount(category.id, 1);
            loadCategories();
        }

        setNewTask({ title: '', description: '', priority: 'medium', completed: false, time: '', category: 'Personal' });
        setShowAddModal(false);
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setShowDetailModal(true);
    };

    const handleUpdateTask = async () => {
        if (!selectedTask) return;

        await db.tasks.update(Number(selectedTask.id), {
            title: selectedTask.title,
            description: selectedTask.description,
            priority: selectedTask.priority,
            date: selectedTask.date,
            time: selectedTask.time,
            category: selectedTask.category
        });

        setTasks(prev => prev.map(t =>
            t.id === selectedTask.id ? selectedTask : t
        ));
        setShowDetailModal(false);
    };

    const handleDeleteTask = async () => {
        if (!selectedTask) return;

        // Move to trash instead of permanent delete
        await db.deleted_tasks.add({
            originalId: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description,
            completed: selectedTask.completed,
            date: selectedTask.date,
            time: selectedTask.time,
            priority: selectedTask.priority,
            category: selectedTask.category || 'Personal',
            deletedAt: new Date(),
            completedAt: selectedTask.completedAt
        });

        // Remove from tasks
        await db.tasks.delete(Number(selectedTask.id));
        setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
        setShowDetailModal(false);
    };

    const activeTasks = tasks.filter(t => !t.completed).sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const completedTasks = tasks.filter(t => t.completed).sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return b.date.getTime() - a.date.getTime();
    });

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Tasks</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/completed-tasks')}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                    >
                        <Archive size={20} />
                        {completedTasks.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-success)',
                                color: 'white',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {completedTasks.length}
                            </div>
                        )}
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activeTasks.map(task => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onClick={() => handleTaskClick(task)}
                    />
                ))}
                {activeTasks.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: 'var(--color-text-secondary)'
                    }}>
                        No active tasks. Click + to add one!
                    </div>
                )}
            </div>

            {/* Add Task Modal */}
            <AnimatePresence>
                {showAddModal && (
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
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '20px',
                                padding: '24px',
                                width: '90%',
                                maxWidth: '500px',
                                maxHeight: '90vh',
                                overflow: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>New Task</h2>
                                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Task title"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--color-border)',
                                            fontSize: '16px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                        Description
                                    </label>
                                    <textarea
                                        placeholder="Add details..."
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--color-border)',
                                            fontSize: '15px',
                                            outline: 'none',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={newTask.date ? new Date(newTask.date).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setNewTask({ ...newTask, date: e.target.value ? new Date(e.target.value) : undefined })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '1px solid var(--color-border)',
                                                fontSize: '15px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                            Time
                                        </label>
                                        <input
                                            type="time"
                                            value={newTask.time}
                                            onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '1px solid var(--color-border)',
                                                fontSize: '15px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                            Priority
                                        </label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '1px solid var(--color-border)',
                                                fontSize: '15px',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="low">Low Priority</option>
                                            <option value="medium">Medium Priority</option>
                                            <option value="high">High Priority</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                            Category
                                        </label>
                                        <select
                                            value={newTask.category}
                                            onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '1px solid var(--color-border)',
                                                fontSize: '15px',
                                                outline: 'none'
                                            }}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddTask}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        backgroundColor: 'var(--color-primary)',
                                        color: 'white',
                                        border: 'none',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        marginTop: '8px'
                                    }}
                                >
                                    Add Task
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task Detail Modal */}
            <AnimatePresence>
                {showDetailModal && selectedTask && (
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
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                        onClick={() => setShowDetailModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '20px',
                                padding: '24px',
                                width: '90%',
                                maxWidth: '500px',
                                maxHeight: '90vh',
                                overflow: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>Task Details</h2>
                                <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedTask.title}
                                        onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--color-border)',
                                            fontSize: '16px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                        Description
                                    </label>
                                    <textarea
                                        value={selectedTask.description || ''}
                                        onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--color-border)',
                                            fontSize: '15px',
                                            outline: 'none',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedTask.date ? new Date(selectedTask.date).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setSelectedTask({ ...selectedTask, date: e.target.value ? new Date(e.target.value) : undefined })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '1px solid var(--color-border)',
                                                fontSize: '15px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                            Time
                                        </label>
                                        <input
                                            type="time"
                                            value={selectedTask.time || ''}
                                            onChange={(e) => setSelectedTask({ ...selectedTask, time: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '1px solid var(--color-border)',
                                                fontSize: '15px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                            Priority
                                        </label>
                                        <select
                                            value={selectedTask.priority}
                                            onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value as any })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '1px solid var(--color-border)',
                                                fontSize: '15px',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="low">Low Priority</option>
                                            <option value="medium">Medium Priority</option>
                                            <option value="high">High Priority</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                            Category
                                        </label>
                                        <select
                                            value={selectedTask.category}
                                            onChange={(e) => setSelectedTask({ ...selectedTask, category: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '1px solid var(--color-border)',
                                                fontSize: '15px',
                                                outline: 'none'
                                            }}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                    <button
                                        onClick={handleUpdateTask}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            borderRadius: '12px',
                                            backgroundColor: 'var(--color-primary)',
                                            color: 'white',
                                            border: 'none',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={handleDeleteTask}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            borderRadius: '12px',
                                            backgroundColor: 'var(--color-danger)',
                                            color: 'white',
                                            border: 'none',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Completed Tasks Modal */}
            <AnimatePresence>
                {showCompletedModal && (
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
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                        onClick={() => setShowCompletedModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '20px',
                                padding: '24px',
                                width: '90%',
                                maxWidth: '500px',
                                maxHeight: '80vh',
                                overflow: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <CheckCircle2 size={24} color="var(--color-success)" />
                                    <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>Completed Tasks</h2>
                                </div>
                                <button onClick={() => setShowCompletedModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {completedTasks.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onToggle={toggleTask}
                                        onClick={() => {
                                            setShowCompletedModal(false);
                                            handleTaskClick(task);
                                        }}
                                    />
                                ))}
                                {completedTasks.length === 0 && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '40px 20px',
                                        color: 'var(--color-text-secondary)'
                                    }}>
                                        No completed tasks yet.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TasksPage;
