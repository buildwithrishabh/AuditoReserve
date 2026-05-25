import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FullPageState } from "../common/LoadingSkeleton";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <FullPageState
        title="Checking Session"
        message="Restoring your account session details..."
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function RoleRoute({
  children,
  role,
}: {
  children: ReactNode;
  role: "student" | "admin";
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <FullPageState
        title="Validating Authorization"
        message="Checking secure role clearances..."
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    // If student tries to visit admin paths, send to home. If admin tries to visit student path, send to admin page.
    return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  }

  return <>{children}</>;
}
