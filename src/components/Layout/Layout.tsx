import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import './Layout.css';

import Sidebar from './Sidebar';
import ModelLoadingScreen from '../ModelLoadingScreen';

const Layout: React.FC = () => {

    return (
        <div className="app-layout">
            <ModelLoadingScreen />
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
            <Navigation />
        </div>
    );
};

export default Layout;
