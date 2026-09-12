import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./hooks/ToastProvider";
import { NotificationProvider } from "./hooks/useNotifications";

// Layouts
import { AppLayout } from "./components/layout/AppLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ProtectedRoute, RoleRoute } from "./components/layout/ProtectedRoute";

// Pages
const HomePage = lazy(() => import("./pages/public/HomePage"));
const CatalogPage = lazy(() => import("./pages/public/CatalogPage"));
const AuditoriumDetailPage = lazy(() => import("./pages/public/AuditoriumDetailPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/auth/VerifyEmailPage"));
const StudentBookingsPage = lazy(() => import("./pages/student/StudentBookingsPage"));
const NewBookingPage = lazy(() => import("./pages/student/NewBookingPage"));
const AccountPage = lazy(() => import("./pages/student/AccountPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAuditoriumsPage = lazy(() => import("./pages/admin/AdminAuditoriumsPage"));
const AuditoriumFormPage = lazy(() => import("./pages/admin/AuditoriumFormPage"));
const AdminBookingsPage = lazy(() => import("./pages/admin/AdminBookingsPage"));

// Styles
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteFallback() {
  return (
    <div className="full-state route-fallback" role="status" aria-live="polite">
      <div className="route-loader" />
      <p>Loading page...</p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <motion.div
      className="full-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        404 - Page Not Found
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        The page you requested does not exist on this console.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link className="button primary" to="/" style={{ marginTop: "16px" }}>
          Go to catalog
        </Link>
      </motion.div>
    </motion.div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Public & Student Routes */}
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<Navigate to="/#about" replace />} />
                    <Route path="/auditoriums" element={<CatalogPage />} />
                    <Route path="/auditoriums/:id" element={<AuditoriumDetailPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    
                    {/* Protected Student Routes */}
                    <Route
                      path="/bookings"
                      element={
                        <RoleRoute role="student">
                          <StudentBookingsPage />
                        </RoleRoute>
                      }
                    />
                    <Route
                      path="/bookings/new/:auditoriumId"
                      element={
                        <RoleRoute role="student">
                          <NewBookingPage />
                        </RoleRoute>
                      }
                    />
                    
                    {/* Generic Protected Route */}
                    <Route
                      path="/account"
                      element={
                        <ProtectedRoute>
                          <AccountPage />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* Protected Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <RoleRoute role="admin">
                        <AdminLayout />
                      </RoleRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="auditoriums" element={<AdminAuditoriumsPage />} />
                    <Route path="auditoriums/new" element={<AuditoriumFormPage mode="create" />} />
                    <Route path="auditoriums/:id/edit" element={<AuditoriumFormPage mode="edit" />} />
                    <Route path="bookings" element={<AdminBookingsPage />} />
                  </Route>

                  {/* 404 Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
