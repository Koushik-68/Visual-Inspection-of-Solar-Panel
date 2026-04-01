import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PanelProvider } from "./context/PanelContext";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import PanelGrid from "./pages/PanelGrid";
import PanelDetail from "./pages/PanelDetail";
// import GridBuilder from "./pages/GridBuilder";
import InspectionHistory from "./pages/InspectionHistory";
import AIPage from "./pages/AIPage";
import AIChatbotPage from "./pages/AIChatbotPage";
// import AISearchHelperPage from "./pages/AISearchHelperPage";
import AIFaultDiagnosisPage from "./pages/AIFaultDiagnosisPage";
import { initializeIfEmpty } from "./utils/storage";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Admin route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  // Initialize the app with sample data if empty
  useEffect(() => {
    try {
      initializeIfEmpty();
      console.log("Application initialized with sample data if needed");
    } catch (error) {
      console.error("Error initializing application:", error);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/panels"
            element={
              <ProtectedRoute>
                <PanelGrid />
              </ProtectedRoute>
            }
          />

          <Route
            path="/panel/:id"
            element={
              <ProtectedRoute>
                <PanelDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inspections"
            element={
              <ProtectedRoute>
                <InspectionHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-assistance"
            element={
              <ProtectedRoute>
                <AIPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-chatbot"
            element={
              <ProtectedRoute>
                <AIChatbotPage />
              </ProtectedRoute>
            }
          />

          {/* <Route
            path="/ai-search-helper"
            element={
              <ProtectedRoute>
                <AISearchHelperPage />
              </ProtectedRoute>
            }
          /> */}

          <Route
            path="/ai-fault-diagnosis"
            element={
              <ProtectedRoute>
                <AIFaultDiagnosisPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          {/* <Route
            path="/grid-builder"
            element={
              <AdminRoute>
                <GridBuilder />
              </AdminRoute>
            }
          /> */}

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <PanelProvider>
        <AppRoutes />
      </PanelProvider>
    </AuthProvider>
  );
}

export default App;
