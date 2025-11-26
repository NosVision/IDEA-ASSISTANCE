import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, CheckSquare, Mic, Archive, User } from 'lucide-react';
import { motion } from 'framer-motion';
import './Navigation.css';

const Navigation: React.FC = () => {
    return (
        <nav className="navigation">
            <div className="nav-container">
                <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <MessageSquare size={24} />
                    <span className="nav-label">History</span>
                </NavLink>

                <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <CheckSquare size={24} />
                    <span className="nav-label">Tasks</span>
                </NavLink>

                <div className="nav-item-center">
                    <NavLink to="/voice">
                        <motion.button
                            className="mic-button"
                            whileTap={{ scale: 0.9 }}
                        >
                            <Mic size={32} color="white" />
                        </motion.button>
                    </NavLink>
                </div>

                <NavLink to="/notes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Archive size={24} />
                    <span className="nav-label">Notes</span>
                </NavLink>

                <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <User size={24} />
                    <span className="nav-label">Profile</span>
                </NavLink>
            </div>
        </nav>
    );
};

export default Navigation;
