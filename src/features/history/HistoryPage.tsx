import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Trash2, Clock } from 'lucide-react';
import { ConversationService } from '../../services/ai/conversation';
import type { ChatSession } from '../../db';

interface SessionWithDetails extends ChatSession {
    messageCount?: number;
    preview?: string | null;
}

const HistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const allSessions = await ConversationService.getAllSessions();
            // Sort by most recent first
            allSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

            // Load message counts and previews
            const sessionsWithDetails = await Promise.all(
                allSessions.map(async (session) => {
                    const messageCount = await ConversationService.getMessageCount(String(session.id!));
                    const preview = await ConversationService.getFirstMessage(String(session.id!));
                    return {
                        ...session,
                        messageCount,
                        preview: preview ? (preview.length > 60 ? preview.substring(0, 60) + '...' : preview) : null
                    };
                })
            );

            setSessions(sessionsWithDetails);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSessionClick = async (sessionId: number) => {
        try {
            await ConversationService.switchSession(String(sessionId));
            navigate('/voice');
        } catch (error) {
            console.error('Failed to switch session:', error);
        }
    };

    const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!confirm('ต้องการลบบทสนทนานี้หรือไม่?')) return;

        try {
            await ConversationService.deleteSession(String(sessionId));
            await loadSessions();
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'วันนี้';
        if (days === 1) return 'เมื่อวาน';
        if (days < 7) return `${days} วันที่แล้ว`;

        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '20px', textAlign: 'center' }}>
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: '1200px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
                ประวัติการสนทนา
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                {sessions.length} บทสนทนา
            </p>

            {sessions.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--color-text-secondary)'
                }}>
                    <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <p>ยังไม่มีประวัติการสนทนา</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>
                        เริ่มแชทใหม่ที่หน้า Voice Chat
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '16px'
                }}>
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            onClick={() => handleSessionClick(session.id!)}
                            style={{
                                padding: '16px',
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '4px'
                                    }}>
                                        <MessageSquare size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                                            {session.title || 'บทสนทนาใหม่'}
                                        </h3>
                                    </div>
                                    {session.preview && (
                                        <p style={{
                                            fontSize: '13px',
                                            color: 'var(--color-text-secondary)',
                                            margin: '4px 0',
                                            lineHeight: '1.4'
                                        }}>
                                            {session.preview}
                                        </p>
                                    )}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        fontSize: '13px',
                                        color: 'var(--color-text-secondary)',
                                        marginTop: '8px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={13} />
                                            <span>{formatDate(session.updatedAt)}</span>
                                        </div>
                                        {session.messageCount !== undefined && (
                                            <div style={{
                                                padding: '2px 8px',
                                                backgroundColor: 'var(--color-primary)',
                                                color: 'white',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                {session.messageCount} ข้อความ
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteSession(session.id!, e)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        color: 'var(--color-danger)',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                        flexShrink: 0
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
