import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/auth';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import LoginRegister from './pages/LoginRegister';
import Dashboard from './pages/Dashboard';
import WorkspaceDetail from './pages/WorkspaceDetail';
import SearchPapers from './pages/SearchPapers';
import AITools from './pages/AITools';
import UploadPDF from './pages/UploadPDF';
import DocSpace from './pages/DocSpace';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#0B0816] text-gray-400 gap-4">
        <span className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase">Verifying encryption keys...</p>
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Page */}
          <Route path="/login" element={<LoginRegister />} />
          
          {/* Protected Main Application Layout */}
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="workspaces/:id" element={<WorkspaceDetail />} />
            <Route path="search" element={<SearchPapers />} />
            <Route path="tools" element={<AITools />} />
            <Route path="upload" element={<UploadPDF />} />
            <Route path="docspace" element={<DocSpace />} />
          </Route>
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
export default App;
