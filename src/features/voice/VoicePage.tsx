import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Mic, Loader, Send, Plus, X, SquarePen } from 'lucide-react';
import BatchConfirmationCard from '../../components/BatchConfirmationCard';
import ChatNoteCard from '../../components/ChatNoteCard';
import ChatTaskCard from '../../components/ChatTaskCard';
import { IntentDetectorService } from '../../services/ai/intent-detector';
import { CategoryManagerService } from '../../services/ai/category-manager';
import { RAGService } from '../../services/ai/rag';
import { LLMService, type LLMMessage } from '../../services/ai/llm';
import { ConversationService } from '../../services/ai/conversation';
import { TitleGeneratorService } from '../../services/ai/title-generator';
import { db } from '../../db';
import type { NoteData, TaskData, UpdateData, DeleteData } from '../../types/ai';
import './VoicePage.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string | React.ReactNode;
    timestamp: Date;
}

const VoicePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        isRecording,
        transcript,
        interimTranscript,
        startRecording,
        stopRecording,
        resetTranscript,
        isSupported
    } = useSpeechRecognition();

    // State declarations
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [hasGeneratedTitle, setHasGeneratedTitle] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [textBeforeCursor, setTextBeforeCursor] = useState('');
    const [textAfterCursor, setTextAfterCursor] = useState('');
    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Initialize default categories
        CategoryManagerService.initializeDefaultCategories();

        // Load messages from database
        const loadMessages = async () => {
            try {
                const sessionId = await ConversationService.getCurrentSession();
                setCurrentSessionId(sessionId);
                const dbMessages = await ConversationService.getSessionMessages(sessionId);

                if (dbMessages.length > 0) {
                    // Convert database messages to UI format
                    const loadedMessages: Message[] = dbMessages.map(msg => ({
                        id: msg.id?.toString() || Date.now().toString(),
                        role: msg.role,
                        content: msg.content,
                        timestamp: msg.timestamp
                    }));
                    setMessages(loadedMessages);
                } else {
                    // Show welcome message only if no messages exist
                    setMessages([
                        {
                            id: 'init',
                            role: 'assistant',
                            content: 'สวัสดีครับ! คุณสามารถพูดหรือพิมพ์ได้เลย:\n• "จดไว้นะ..." - บันทึกโน้ต\n• "To-do: ..." - สร้าง Task\n• "มีอะไรบ้าง?" - ค้นหาข้อมูล\n\nลองพูดหรือพิมพ์ได้เลยครับ! 🎤',
                            timestamp: new Date()
                        }
                    ]);
                }
            } catch (error) {
                console.error('Failed to load messages:', error);
                // Show welcome message on error
                setMessages([
                    {
                        id: 'init',
                        role: 'assistant',
                        content: 'สวัสดีครับ! คุณสามารถพูดหรือพิมพ์ได้เลย:\n• "จดไว้นะ..." - บันทึกโน้ต\n• "To-do: ..." - สร้าง Task\n• "มีอะไรบ้าง?" - ค้นหาข้อมูล\n\nลองพูดหรือพิมพ์ได้เลยครับ! 🎤',
                        timestamp: new Date()
                    }
                ]);
            }
        };

        loadMessages();
    }, []);

    // Reload messages when navigating back to VoicePage (e.g., from History)
    useEffect(() => {
        const checkAndReloadMessages = async () => {
            const sessionId = await ConversationService.getCurrentSession();
            // If session has changed, reload messages
            if (currentSessionId && sessionId !== currentSessionId) {
                setCurrentSessionId(sessionId);
                const dbMessages = await ConversationService.getSessionMessages(sessionId);

                if (dbMessages.length > 0) {
                    const loadedMessages: Message[] = dbMessages.map(msg => ({
                        id: msg.id?.toString() || Date.now().toString(),
                        role: msg.role,
                        content: msg.content,
                        timestamp: msg.timestamp
                    }));
                    setMessages(loadedMessages);
                    setHasGeneratedTitle(true); // Assume title is already generated for existing sessions
                }
            }
        };

        checkAndReloadMessages();
    }, [location]); // Trigger when location changes

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-scroll input horizontally when recording (but don't move cursor)
    useEffect(() => {
        if (isRecording && inputRef.current) {
            const input = inputRef.current;
            input.focus();
            // Only scroll to show current cursor, don't force cursor to end
            input.scrollLeft = input.scrollWidth;
        }
    }, [inputText, isRecording]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isProcessing]);

    // Sync transcript to input at cursor position when recording
    useEffect(() => {
        if (isRecording && (transcript || interimTranscript)) {
            const newText = transcript + (interimTranscript ? ' ' + interimTranscript : '');
            // Insert at cursor position using saved before/after text
            setInputText(textBeforeCursor + newText + textAfterCursor);

            // Update cursor to end of inserted text
            if (inputRef.current) {
                const newCursorPos = textBeforeCursor.length + newText.length;
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
                    }
                }, 0);
            }
        }
    }, [transcript, interimTranscript, isRecording, textBeforeCursor, textAfterCursor]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // Limit to 10 images total
            const remainingSlots = 10 - selectedImages.length;
            const newImages = files.slice(0, remainingSlots);
            setSelectedImages(prev => [...prev, ...newImages]);
        }
    };

    const handleRemoveImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSendText = async () => {
        if ((!inputText.trim() && selectedImages.length === 0) || isProcessing) return;

        const text = inputText;
        const currentImages = [...selectedImages];

        setInputText('');
        setSelectedImages([]);
        resetTranscript();

        if (isRecording) {
            stopRecording();
        }

        // Convert images to base64
        let base64Images: string[] = [];
        try {
            base64Images = await Promise.all(currentImages.map(convertFileToBase64));
        } catch (error) {
            console.error('Error converting images:', error);
            // Continue without images if conversion fails
        }

        // Add User Message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: (
                <div>
                    {currentImages.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            {currentImages.map((file, index) => (
                                <img
                                    key={index}
                                    src={URL.createObjectURL(file)}
                                    alt="uploaded"
                                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                            ))}
                        </div>
                    )}
                    <div>{text}</div>
                </div>
            ),
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);

        // Save to conversation history
        const historyText = text + (currentImages.length > 0 ? `\n[Attached ${currentImages.length} images]` : '');
        await ConversationService.addMessage('user', historyText);

        // Auto-generate title after first user message
        if (!hasGeneratedTitle && messages.filter(m => m.role === 'user').length === 0) {
            setHasGeneratedTitle(true);
            // Generate title in background
            setTimeout(async () => {
                try {
                    const sessionId = await ConversationService.getCurrentSession();
                    await TitleGeneratorService.generateAndUpdateSessionTitle(sessionId);
                } catch (error) {
                    console.error('Failed to generate title:', error);
                }
            }, 2000); // Wait 2 seconds to ensure AI response is saved
        }

        setIsProcessing(true);

        try {
            // Get conversation history
            const history = await ConversationService.getFormattedContext(10);

            // Detect Intent WITH context AND images
            const multiIntent = await IntentDetectorService.detectIntentWithContext(text, history, base64Images);

            // Handle question/search intent first (items array is empty for questions)
            if (multiIntent.type === 'question') {
                await handleQuestionIntent(text);
            } else if (multiIntent.items.length > 0) {
                // Check if it's notes or tasks
                const isNote = multiIntent.type === 'note';
                const isTask = multiIntent.type === 'task';

                if (isNote) {
                    handleMultiNoteIntent(multiIntent.items as NoteData[], multiIntent.summary);
                } else if (isTask) {
                    handleMultiTaskIntent(multiIntent.items as TaskData[], multiIntent.summary);
                } else if (multiIntent.type === 'update_note' || multiIntent.type === 'update_task') {
                    handleUpdateIntent(multiIntent.items as UpdateData[], multiIntent.type);
                } else if (multiIntent.type === 'delete_note' || multiIntent.type === 'delete_task') {
                    handleDeleteIntent(multiIntent.items as DeleteData[], multiIntent.type);
                }
            } else {
                // Chat intent
                await handleChatIntent(text, base64Images); // Pass images to chat handler too
            }
        } catch (error) {
            console.error('Error processing intent:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMultiNoteIntent = async (notes: NoteData[], summary: string) => {
        const confirmationMsg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: (
                <BatchConfirmationCard
                    type="note"
                    items={notes}
                    summary={summary}
                    onConfirmAll={() => confirmSaveAllNotes(notes)}
                    onCancel={() => handleCancelIntent()}
                />
            ),
            timestamp: new Date()
        };
        setMessages(prev => [...prev, confirmationMsg]);
    };

    const handleMultiTaskIntent = async (tasks: TaskData[], summary: string) => {
        const confirmationMsg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: (
                <BatchConfirmationCard
                    type="task"
                    items={tasks}
                    summary={summary}
                    onConfirmAll={() => confirmSaveAllTasks(tasks)}
                    onCancel={() => handleCancelIntent()}
                />
            ),
            timestamp: new Date()
        };
        setMessages(prev => [...prev, confirmationMsg]);
    };


    const handleQuestionIntent = async (query: string) => {
        const result = await RAGService.searchWithCards(query);

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: (
                <div>
                    <p style={{ marginBottom: '12px' }}>{result.summary}</p>
                    {result.notes.map(note => (
                        <ChatNoteCard
                            key={note.id}
                            note={note}
                            onViewClick={(id) => navigate(`/notes?id=${id}`)}
                        />
                    ))}
                    {result.tasks.map(task => (
                        <ChatTaskCard
                            key={task.id}
                            task={task}
                            onViewClick={(id) => navigate(`/tasks?id=${id}`)}
                        />
                    ))}
                </div>
            ),
            timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
    };

    const handleChatIntent = async (query: string, images: string[] = []) => {
        try {
            // Get conversation context (last 20 messages)
            const history = await ConversationService.getFormattedContext(20);
            const conversationContext: LLMMessage[] = history.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            }));

            // Add current query to context
            if (images.length > 0) {
                const userContent: any[] = [{ type: 'text', text: query }];
                images.forEach(img => {
                    userContent.push({ type: 'image_url', image_url: { url: img } });
                });
                conversationContext.push({ role: 'user', content: userContent });
            } else {
                conversationContext.push({ role: 'user', content: query });
            }

            // Use context for smarter responses
            const response = await LLMService.generateResponse(conversationContext);

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.content,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);

            // Save AI response to history
            await ConversationService.addMessage('assistant', response.content);
        } catch (error) {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'ขออภัยครับ ตอนนี้ผมไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบ API Key หรือการเชื่อมต่ออินเทอร์เน็ต',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        }
    };





    // Batch save functions for multi-item creation
    const confirmSaveAllNotes = async (notes: NoteData[]) => {
        try {
            for (const noteData of notes) {
                const category = await CategoryManagerService.getOrCreateCategory(
                    noteData.category,
                    'note',
                    'ai'
                );

                await db.notes.add({
                    title: noteData.title,
                    content: noteData.content,
                    category: category.name,
                    date: new Date()
                });

                await CategoryManagerService.updateCount(category.id!, 1);
            }

            const successMsg: Message = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: `✅ บันทึก ${notes.length} โน้ตเรียบร้อยแล้ว!`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev.filter(m => m.id !== Date.now().toString()), successMsg]);

            // Save success message to history
            await ConversationService.addMessage('assistant', `บันทึก ${notes.length} โน้ตเรียบร้อยแล้ว`);
        } catch (error) {
            console.error('Batch save notes error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: 'เกิดข้อผิดพลาดในการบันทึกครับ',
                timestamp: new Date()
            };
            setMessages(prev => [...prev.filter(m => m.id !== Date.now().toString()), errorMsg]);
        }
    };

    const confirmSaveAllTasks = async (tasks: TaskData[]) => {
        try {
            for (const taskData of tasks) {
                const category = await CategoryManagerService.getOrCreateCategory(
                    taskData.category,
                    'task',
                    'ai'
                );

                await db.tasks.add({
                    title: taskData.title,
                    description: taskData.description || '',
                    completed: false,
                    category: category.name,
                    date: taskData.date || undefined,
                    time: taskData.time || undefined,
                    priority: taskData.priority || 'medium'
                });

                await CategoryManagerService.updateCount(category.id!, 1);
            }

            const successMsg: Message = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: `✅ สร้าง ${tasks.length} Tasks เรียบร้อยแล้ว!`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev.filter(m => m.id !== Date.now().toString()), successMsg]);

            // Save success message to history
            await ConversationService.addMessage('assistant', `สร้าง ${tasks.length} tasks เรียบร้อยแล้ว`);
        } catch (error) {
            console.error('Batch save tasks error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: 'เกิดข้อผิดพลาดในการสร้าง tasks ครับ',
                timestamp: new Date()
            };
            setMessages(prev => [...prev.filter(m => m.id !== Date.now().toString()), errorMsg]);
        }
    };




    const handleCancelIntent = () => {
        const cancelMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: 'ยกเลิกแล้วครับ มีอะไรให้ช่วยอีกไหมครับ?',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, cancelMsg]);
    };

    const handleUpdateIntent = async (updates: UpdateData[], type: 'update_note' | 'update_task') => {
        const isTask = type === 'update_task';
        const table = isTask ? db.tasks : db.notes;

        for (const update of updates) {
            // 1. Search for item
            const items = await table
                .filter(item => item.title.toLowerCase().includes(update.searchQuery.toLowerCase()))
                .toArray();

            if (items.length === 0) {
                const notFoundMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `❌ ไม่พบ ${isTask ? 'Task' : 'โน้ต'} ที่ชื่อ "${update.searchQuery}" ครับ`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, notFoundMsg]);
                continue;
            }

            // 2. Update item (take the first match for now)
            const itemToUpdate = items[0];
            await table.update(itemToUpdate.id!, update.updates);

            // 3. Confirm update
            const successMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `✅ แก้ไข ${isTask ? 'Task' : 'โน้ต'} "${itemToUpdate.title}" เรียบร้อยแล้วครับ`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, successMsg]);
        }
    };

    const handleDeleteIntent = async (deletes: DeleteData[], type: 'delete_note' | 'delete_task') => {
        const isTask = type === 'delete_task';
        const table = isTask ? db.tasks : db.notes;

        for (const del of deletes) {
            // 1. Search for item
            const items = await table
                .filter(item => item.title.toLowerCase().includes(del.searchQuery.toLowerCase()))
                .toArray();

            if (items.length === 0) {
                const notFoundMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `❌ ไม่พบ ${isTask ? 'Task' : 'โน้ต'} ที่ชื่อ "${del.searchQuery}" ครับ`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, notFoundMsg]);
                continue;
            }

            // 2. Delete item (take the first match)
            const itemToDelete = items[0];
            await table.delete(itemToDelete.id!);

            // 3. Confirm delete
            const successMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `🗑️ ลบ ${isTask ? 'Task' : 'โน้ต'} "${itemToDelete.title}" เรียบร้อยแล้วครับ`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, successMsg]);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            // Save cursor position and surrounding text
            if (inputRef.current) {
                const cursorPos = inputRef.current.selectionStart || 0;

                setTextBeforeCursor(inputText.substring(0, cursorPos));
                setTextAfterCursor(inputText.substring(cursorPos)); // เก็บ text หลัง cursor ด้วย!
            }
            resetTranscript();
            startRecording();
        }
    };

    const renderMessageContent = (msg: Message) => {
        // User message: Always bubble
        if (msg.role === 'user') {
            return (
                <div style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                }}>
                    {msg.content}
                </div>
            );
        }

        // Assistant message
        if (typeof msg.content === 'string') {
            return (
                <div style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                }}>
                    {msg.content}
                </div>
            );
        }

        // Assistant custom component (Cards, etc.)
        return <div style={{ width: '100%', maxWidth: '400px' }}>{msg.content}</div>;
    };

    const handleStartNewConversation = async () => {
        if (messages.length > 1) {
            const confirmed = window.confirm('ต้องการเริ่มบทสนทนาใหม่หรือไม่? บทสนทนาปัจจุบันจะถูกบันทึกในประวัติ');
            if (!confirmed) return;
        }

        // Start new session
        const newSessionId = await ConversationService.startNewSession();
        setCurrentSessionId(newSessionId);
        setMessages([{
            id: 'init',
            role: 'assistant',
            content: 'สวัสดีครับ! คุณสามารถพูดหรือพิมพ์ได้เลย:\n• "จดไว้นะ..." - บันทึกโน้ต\n• "To-do: ..." - สร้าง Task\n• "มีอะไรบ้าง?" - ค้นหาข้อมูล\n\nลองพูดหรือพิมพ์ได้เลยครับ! 🎤',
            timestamp: new Date()
        }]);
        setHasGeneratedTitle(false);
        setInputText('');
        setSelectedImages([]);
    };

    return (
        <div className="voice-page-container">
            <div style={{ marginBottom: '16px', textAlign: 'center', position: 'relative' }}>
                <button
                    onClick={handleStartNewConversation}
                    className="mobile-only"
                    style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text)'
                    }}
                    title="เริ่มบทสนทนาใหม่"
                >
                    <SquarePen size={24} />
                </button>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Voice Chat</h1>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    {isSupported ? 'Speak naturally, text appears instantly' : 'Voice input not supported in this browser'}
                </p>
            </div>

            {/* Chat Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                paddingBottom: '100px',  // More space to prevent input box from blocking messages
                display: 'flex',
                flexDirection: 'column'
            }}>
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        style={{
                            display: 'flex',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: '12px',
                            padding: '0 12px'
                        }}
                    >
                        {renderMessageContent(msg)}
                    </div>
                ))}
                {isProcessing && (
                    <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                        <Loader size={16} className="spin" />
                        <span>AI กำลังคิด...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input - Responsive */}
            <div className="voice-input-area">
                <div>
                    {/* Image Preview */}
                    {selectedImages.length > 0 && (
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            overflowX: 'auto',
                            paddingBottom: '12px',
                            marginBottom: '8px'
                        }}>
                            {selectedImages.map((file, index) => (
                                <div key={index} style={{ position: 'relative', flexShrink: 0 }}>
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt="preview"
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '8px',
                                            objectFit: 'cover',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                    <button
                                        onClick={() => handleRemoveImage(index)}
                                        style={{
                                            position: 'absolute',
                                            top: '-6px',
                                            right: '-6px',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--color-text)',
                                            color: 'white',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/*"
                            multiple
                            style={{ display: 'none' }}
                        />

                        {/* Attachment Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing || selectedImages.length >= 10}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text)',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                flexShrink: 0
                            }}
                        >
                            <Plus size={24} />
                        </button>

                        {/* Input with Mic Button Inside + Scrolling Text */}
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                                placeholder={isRecording ? "🎤 กำลังฟัง..." : "Type a message..."}
                                disabled={isProcessing}
                                style={{
                                    width: '100%',
                                    padding: '14px 50px 14px 16px',
                                    borderRadius: '24px',
                                    border: isRecording ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                                    backgroundColor: '#f5f5f5',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'border 0.2s',
                                    boxShadow: isRecording ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none',
                                    color: 'var(--color-text)'
                                }}
                            />

                            {/* Mic Button Inside Input */}
                            <button
                                onClick={toggleRecording}
                                disabled={!isSupported || isProcessing}
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: isRecording ? 'var(--color-danger)' : 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    cursor: isSupported && !isProcessing ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: isRecording ? '0 0 15px rgba(239, 68, 68, 0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
                                    transition: 'all 0.3s',
                                    opacity: !isSupported || isProcessing ? 0.5 : 1,
                                    animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                                    zIndex: 2
                                }}
                            >
                                <Mic size={20} />
                            </button>
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleSendText}
                            disabled={(!inputText.trim() && selectedImages.length === 0) || isProcessing}
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: (inputText.trim() || selectedImages.length > 0) && !isProcessing ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                color: 'white',
                                border: 'none',
                                cursor: (inputText.trim() || selectedImages.length > 0) && !isProcessing ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isProcessing ? <Loader size={20} className="spin" /> : <Send size={20} />}
                        </button>
                    </div>
                </div>

                {/* Add animations */}
                <style>{`
                @keyframes pulse {
                    0%, 100% {
                        transform: translateY(-50%) scale(1);
                    }
                    50% {
                        transform: translateY(-50%) scale(1.05);
                    }
                }
            `}</style>
            </div>
        </div>
    );
};

export default VoicePage;
