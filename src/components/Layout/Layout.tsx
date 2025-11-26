import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import './Layout.css';

import Sidebar from './Sidebar';

const Layout: React.FC = () => {

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
            <Navigation />
        </div>
    );
};

export default Layout;
