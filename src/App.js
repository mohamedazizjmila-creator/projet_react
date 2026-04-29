import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { theme } from './theme/theme';
import Login from './pages/Auth/Login';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import Batiments from './pages/Batiments/Batiments';
import Lots from './pages/Lots/Lots';
import Production from './pages/Production/Production';
import Sante from './pages/Sante/Sante';
import Stocks from './pages/Stocks/Stocks';
import Users from './pages/Users/Users';
import Interventions from './pages/Interventions/Interventions';

// Composant pour protéger les routes selon le rôle
function ProtectedRoute({ children, allowedRoles }) {
  const { user, userRole, loading } = useAuth();
  
  if (loading) {
    return <div>Chargement...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" />;
  }
  
  return children;
}

function AppRoutes() {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Sidebar>
      <Routes>
        {/* Dashboard - tout le monde */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Bâtiments - admin, responsable seulement */}
        <Route path="/batiments" element={
          <ProtectedRoute allowedRoles={['admin', 'responsable']}>
            <Batiments />
          </ProtectedRoute>
        } />
        
        {/* Lots - admin, responsable seulement */}
        <Route path="/lots" element={
          <ProtectedRoute allowedRoles={['admin', 'responsable']}>
            <Lots />
          </ProtectedRoute>
        } />
        
        {/* Production - tout le monde */}
        <Route path="/production" element={<Production />} />
        
        {/* Santé - vétérinaire, admin, responsable */}
        <Route path="/sante" element={
          <ProtectedRoute allowedRoles={['admin', 'responsable', 'veterinaire']}>
            <Sante />
          </ProtectedRoute>
        } />
        
        {/* Stocks - admin, responsable seulement */}
        <Route path="/stocks" element={
          <ProtectedRoute allowedRoles={['admin', 'responsable']}>
            <Stocks />
          </ProtectedRoute>
        } />
        {/* Interventions - tout le monde */}
<Route path="/interventions" element={
  <ProtectedRoute allowedRoles={['admin', 'responsable', 'technicien', 'veterinaire']}>
    <Interventions />
  </ProtectedRoute>
} />
        
        {/* Utilisateurs - admin seulement */}
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Users />
          </ProtectedRoute>
        } />
      </Routes>
    </Sidebar>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;