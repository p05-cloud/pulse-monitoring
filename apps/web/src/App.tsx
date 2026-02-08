import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Monitors } from './pages/Monitors';
import { MonitorDetail } from './pages/MonitorDetail';
import { Incidents } from './pages/Incidents';
import { Projects } from './pages/Projects';
import { Team } from './pages/Team';
import { Maintenance } from './pages/Maintenance';
import { Integrations } from './pages/Integrations';
import CustomDashboard from './pages/CustomDashboard';
import { useAuthStore } from './stores/auth.store';

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="monitors" element={<Monitors />} />
          <Route path="monitors/:id" element={<MonitorDetail />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="projects" element={<Projects />} />
          <Route path="team" element={<Team />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="tv-dashboard" element={<CustomDashboard />} />
        </Route>
        {/* Catch-all route - redirect to dashboard (ProtectedRoute handles auth) */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
