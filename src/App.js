import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Common Components
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Auth Components
import Login from './components/auth/Login';
import ChangePassword from './components/auth/ChangePassword';

// Admin Components
import AdminDashboard from './components/admin/Dashboard';
import DeveloperManagement from './components/admin/DeveloperManagement';
import ClientManagement from './components/admin/ClientManagement';
import CRManagement from './components/admin/CRManagement';
import PaymentManagement from './components/admin/PaymentManagement';
import Reports from './components/admin/Reports';
import TDSConfig from './components/admin/TDSConfig';
import InvoiceManagement from './components/admin/InvoiceManagement';

// Developer Components
import DeveloperDashboard from './components/developer/Dashboard';
import MyCRs from './components/developer/MyCRs';
import Earnings from './components/developer/Earnings';

// Client Components
import ClientDashboard from './components/client/Dashboard';
import CRList from './components/client/CRList';
import Approvals from './components/client/Approvals';

// Layout wrapper for authenticated pages
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="pt-16 lg:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

// Unauthorized page
const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Unauthorized Access</h2>
      <p className="text-gray-600">You don't have permission to access this page.</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/developers"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout>
                  <DeveloperManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clients"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout>
                  <ClientManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/crs"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout>
                  <CRManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/admin/invoices"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout>
                  <InvoiceManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />  
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout>
                  <PaymentManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout>
                  <Reports />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tds-config"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout>
                  <TDSConfig />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Developer Routes */}
          <Route
            path="/developer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Developer']}>
                <AppLayout>
                  <DeveloperDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/developer/my-crs"
            element={
              <ProtectedRoute allowedRoles={['Developer']}>
                <AppLayout>
                  <MyCRs />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/developer/earnings"
            element={
              <ProtectedRoute allowedRoles={['Developer']}>
                <AppLayout>
                  <Earnings />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Client Routes */}
          <Route
            path="/client/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Client']}>
                <AppLayout>
                  <ClientDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/crs"
            element={
              <ProtectedRoute allowedRoles={['Client']}>
                <AppLayout>
                  <CRList />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/approvals"
            element={
              <ProtectedRoute allowedRoles={['Client']}>
                <AppLayout>
                  <Approvals />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Change Password (All authenticated users) */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Developer', 'Client']}>
                <AppLayout>
                  <ChangePassword />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AuthProvider>
  );
}

export default App;