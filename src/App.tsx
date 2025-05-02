import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MainManagerDashboard from './pages/MainManagerDashboard';
import BranchManagerDashboard from './pages/BranchManagerDashboard';
import BranchInventoryPage from './pages/BranchInventoryPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuthState } from './contexts/AuthContext';
import { AuthProvider } from './contexts/AuthContext';
import { InventoryProvider } from './contexts/InventoryContext';

function AppContent() {
  const { user, loading } = useAuthState();

  // Handle automatic logout when page closes/refreshes
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Firebase will handle the session cleanup automatically
      // We just need to make sure the app re-authenticates on reload
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/main-dashboard/*" 
        element={
          <ProtectedRoute 
            isAllowed={!!user && user.role === 'main-manager'} 
            redirectPath="/login"
          >
            <MainManagerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/branch-dashboard/:branchId" 
        element={
          <ProtectedRoute 
            isAllowed={!!user && user.role === 'branch-manager'} 
            redirectPath="/login"
          >
            <BranchManagerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/branch-inventory/:branchId" 
        element={
          <ProtectedRoute 
            isAllowed={!!user && user.role === 'main-manager'} 
            redirectPath="/login"
          >
            <BranchInventoryPage />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <InventoryProvider>
          <AppContent />
          <Toaster position="top-right" />
        </InventoryProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;