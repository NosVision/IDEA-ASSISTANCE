import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HistoryPage from './features/history/HistoryPage';
import TasksPage from './features/tasks/TasksPage';
import CompletedTasksPage from './features/tasks/CompletedTasksPage';
import NotesPage from './features/notes/NotesPage';
import ProfilePage from './features/profile/ProfilePage';
import VoicePage from './features/voice/VoicePage';
import { ModelProvider } from './contexts/ModelContext';


import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './features/auth/LoginPage';

function App() {
  return (
    <AuthProvider>
      <ModelProvider>

        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/voice" replace />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="completed-tasks" element={<CompletedTasksPage />} />
              <Route path="voice" element={<VoicePage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </Router>
      </ModelProvider>
    </AuthProvider>
  );
}

export default App;
