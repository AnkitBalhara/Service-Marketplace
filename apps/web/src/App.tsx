import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { CataloguePage } from './pages/catalogue/CataloguePage';
import { ServiceDetailPage } from './pages/catalogue/ServiceDetailPage';
import { MyBookingsPage } from './pages/customer/MyBookingsPage';
import { VendorDashboardPage } from './pages/vendor/VendorDashboardPage';
import { VendorServicesPage } from './pages/vendor/VendorServicesPage';
import { VendorAvailabilityPage } from './pages/vendor/VendorAvailabilityPage';
import { VendorBookingsPage } from './pages/vendor/VendorBookingsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminVendorsPage } from './pages/admin/AdminVendorsPage';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage';
import { AdminRolesPage } from './pages/admin/AdminRolesPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { LoadingScreen } from './components/common/LoadingScreen';

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
}> = ({ children, allowedRoles, requiredPermission }) => {
  const { user, isAuthenticated, isLoading, isRole, hasPermission } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Verifying authentication & permissions..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<CataloguePage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Customer Routes */}
          <Route
            path="/customer/bookings"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'SUPER_ADMIN']}>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />

          {/* Vendor Routes */}
          <Route
            path="/vendor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['VENDOR', 'SUPER_ADMIN']}>
                <VendorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/services"
            element={
              <ProtectedRoute allowedRoles={['VENDOR', 'SUPER_ADMIN']}>
                <VendorServicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/availability"
            element={
              <ProtectedRoute allowedRoles={['VENDOR', 'SUPER_ADMIN']}>
                <VendorAvailabilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/bookings"
            element={
              <ProtectedRoute allowedRoles={['VENDOR', 'SUPER_ADMIN']}>
                <VendorBookingsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'CATALOGUE_MODERATOR']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vendors"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                <AdminVendorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'CATALOGUE_MODERATOR']}>
                <AdminBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                <AdminRolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'CATALOGUE_MODERATOR']}>
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
