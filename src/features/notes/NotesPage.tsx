import React, { useState, useEffect } from 'react';
import { Search, Filter, Mic, Loader, Plus, X, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import NoteCard, { type Note } from './NoteCard';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { OfflineWhisperService } from '../../services/ai/whisper';
import { db } from '../../db';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoryManagerService } from '../../services/ai/category-manager';
import type { Category } from '../../types/ai';

const NotesPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [notes, setNotes] = useState<Note[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newNote, setNewNote] = useState<Partial<Note>>({
        title: '',
        content: '',
        category: 'Personal'
    });

    const { startRecording, stopRecording, isRecording, audioBlob } = useAudioRecorder();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await Promise.all([loadNotes(), loadCategories()]);
    };

    const loadNotes = async () => {
        const dbNotes = await db.notes.toArray();
        setNotes(dbNotes.map(n => ({
            ...n,
            id: n.id!.toString(),
            date: new Date(n.date)
        })));
    };

    const loadCategories = async () => {
        const cats = await CategoryManagerService.getCategoriesByType('note');
        setCategories(cats);
    };

    // Auto-open note detail modal from URL params
    useEffect(() => {
        const noteId = searchParams.get('id');
        if (noteId && notes.length > 0) {
            const note = notes.find(n => n.id === noteId);
            if (note) {
                setSelectedNote(note);
                setShowDetailModal(true);
                // Clear URL params after opening
                setSearchParams({});
            }
        }
    }, [searchParams, notes]);

    // Effect to handle recording stop and transcription
    useEffect(() => {
        const transcribe = async () => {
            if (audioBlob && isSearching) {
                try {
                    const text = await OfflineWhisperService.transcribe(audioBlob);
                    setSearchTerm(text);
                } catch (error) {
                    console.error('Transcription failed:', error);
                } finally {
                    setIsSearching(false);
                }
            }
        };
        transcribe();
    }, [audioBlob, isSearching]);

    const handleVoiceSearch = () => {
        if (isRecording) {
            stopRecording();
            setIsSearching(true);
        } else {
            startRecording();
            setSearchTerm('');
        }
    };

    const handleNoteClick = (id: string) => {
        const note = notes.find(n => n.id === id);
        if (note) {
            setSelectedNote(note);
            setShowDetailModal(true);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.title?.trim()) return;

        // Ensure category exists or use Personal
        let categoryName = newNote.category || 'Personal';

        // If it's a new custom category typed in (if we allow that later), create it
        // For now, we assume selection from list, but let's be safe
        const category = await CategoryManagerService.getOrCreateCategory(categoryName, 'note', 'user');
        categoryName = category.name;

        const noteToAdd = {
            title: newNote.title,
            content: newNote.content || '',
            category: categoryName,
            date: new Date()
        };

        const id = await db.notes.add(noteToAdd as any);
        setNotes(prev => [...prev, { ...noteToAdd, id: id.toString() }]);

        // Update category count
        if (category.id) {
            await CategoryManagerService.updateCount(category.id, 1);
            loadCategories(); // Reload to update counts/list
        }

        setNewNote({ title: '', content: '', category: 'Personal' });
        setShowAddModal(false);
    };

    const handleUpdateNote = async () => {
        if (!selectedNote) return;

        await db.notes.update(selectedNote.id, {
            title: selectedNote.title,
            content: selectedNote.content,
            category: selectedNote.category
        });

        setNotes(prev => prev.map(n =>
            n.id === selectedNote.id ? selectedNote : n
        ));
        setShowDetailModal(false);
    };

    const handleDeleteNote = async () => {
        if (!selectedNote) return;

        await db.notes.delete(selectedNote.id);
        setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
        setShowDetailModal(false);
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Notes</h1>
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

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{
                        flex: 1,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', color: 'var(--color-text-secondary)' }} />
                        <input
                            type="text"
                            placeholder={isRecording ? "Listening..." : "Search notes..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                borderRadius: '12px',
                                border: isRecording ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                                backgroundColor: '#f5f5f5',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'border 0.2s'
                            }}
                        />
                        <button
                            onClick={handleVoiceSearch}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                padding: '8px',
                                borderRadius: '50%',
                                backgroundColor: isRecording ? 'var(--color-danger)' : 'transparent',
                                color: isRecording ? 'white' : 'var(--color-text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {isSearching ? <Loader size={20} className="spin" /> : <Mic size={20} />}
                        </button>
                    </div>
                    <button style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--color-bg)',
                        cursor: 'pointer'
                    }}>
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '16px',
                paddingBottom: '20px'
            }}>
                {filteredNotes.map(note => (
                    <NoteCard key={note.id} note={note} onClick={handleNoteClick} />
                ))}
                {filteredNotes.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: 'var(--color-text-secondary)'
                    }}>
                        No notes found. Click + to add one!
                    </div>
                )}
            </div>

            {/* Add Note Modal */}
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
                                <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>New Note</h2>
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
                                        placeholder="Note title"
                                        value={newNote.title}
                                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
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
                                        Content
                                    </label>
                                    <textarea
                                        placeholder="Write your note..."
                                        value={newNote.content}
                                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                        rows={5}
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

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                        Category
                                    </label>
                                    <select
                                        value={newNote.category}
                                        onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
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

                                <button
                                    onClick={handleAddNote}
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
                                    Add Note
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Note Detail Modal */}
            <AnimatePresence>
                {showDetailModal && selectedNote && (
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
                                <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>Note Details</h2>
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
                                        value={selectedNote.title}
                                        onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
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
                                        Content
                                    </label>
                                    <textarea
                                        value={selectedNote.content}
                                        onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                                        rows={8}
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

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                                        Category
                                    </label>
                                    <select
                                        value={selectedNote.category}
                                        onChange={(e) => setSelectedNote({ ...selectedNote, category: e.target.value })}
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

                                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                    Created: {selectedNote.date.toLocaleDateString()} {selectedNote.date.toLocaleTimeString()}
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                    <button
                                        onClick={handleUpdateNote}
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
                                        onClick={handleDeleteNote}
                                        style={{
                                            padding: '14px',
                                            borderRadius: '12px',
                                            backgroundColor: 'var(--color-danger)',
                                            color: 'white',
                                            border: 'none',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotesPage;
