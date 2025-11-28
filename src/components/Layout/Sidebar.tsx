import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, CheckSquare, Archive, User, Plus, MessageCircle } from 'lucide-react';
import { ConversationService } from '../../services/ai/conversation';
import type { ChatSession } from '../../db';
import './Sidebar.css';

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);

    useEffect(() => {
        loadRecentSessions();
        // Refresh sessions periodically or listen to changes (simplified for now)
        const interval = setInterval(loadRecentSessions, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadRecentSessions = async () => {
        try {
            const sessions = await ConversationService.getAllSessions();
            // Take top 10 recent sessions
            setRecentSessions(sessions.slice(0, 10));
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    };

    const handleNewChat = async () => {
        // Navigate to voice page and trigger new chat
        // We can use a custom event or just navigate. 
        // For now, let's navigate to /voice and let the user start there, 
        // or we can force a new session if we are already there.

        if (window.location.pathname === '/voice') {
            // If already on voice page, we might want to trigger a reset.
            // This is a bit tricky without a global context for chat state.
            // A simple page reload or navigation with state could work.
            window.location.reload(); // Simple but effective for now to reset state
        } else {
            navigate('/voice');
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <button className="new-chat-btn" onClick={handleNewChat}>
                    <Plus size={16} />
                    New chat
                </button>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/voice" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
                    <MessageSquare size={18} />
                    <span>Chat</span>
                </NavLink>
                <NavLink to="/tasks" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
                    <CheckSquare size={18} />
                    <span>Tasks</span>
                </NavLink>
                <NavLink to="/notes" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
                    <Archive size={18} />
                    <span>Notes</span>
                </NavLink>
            </nav>

            <div className="sidebar-history">
                <div className="history-label">Recent History</div>
                {recentSessions.map(session => (
                    <div
                        key={session.id}
                        className="history-item"
                        onClick={async () => {
                            if (session.id) {
                                await ConversationService.switchSession(String(session.id));
                                navigate('/voice');
                            }
                        }}
                    >
                        <MessageCircle size={16} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {session.title || 'New Conversation'}
                        </span>
                    </div>
                ))}
                <NavLink to="/history" className="sidebar-nav-item" style={{ marginTop: 'auto' }}>
                    <span>View all history</span>
                </NavLink>
            </div>

            <div className="sidebar-footer">
                <NavLink to="/profile" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
                    <User size={18} />
                    <span>Profile</span>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
