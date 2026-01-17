import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BranchComparison from './pages/BranchComparison';
import RiskAnalysis from './pages/RiskAnalysis';
import MapView from './pages/MapView';
import Reports from './pages/Reports';
import Decisions from './pages/Decisions';
import Scenarios from './pages/Scenarios';
import Forecast from './pages/Forecast';
import Users from './pages/Users';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="comparison" element={<BranchComparison />} />
        <Route path="risk" element={<RiskAnalysis />} />
        <Route path="map" element={<MapView />} />
        <Route path="reports" element={<Reports />} />
        <Route path="decisions" element={<Decisions />} />
        <Route path="scenarios" element={<Scenarios />} />
        <Route path="forecast" element={<Forecast />} />
        <Route path="users" element={<Users />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
