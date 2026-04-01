import { useEffect, ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../services/authService";

interface RoleGuardProps {
  requiredRole: Role;
  onDeny: () => void;
  children: ReactNode;
}

/**
 * RoleGuard — frontend route protection.
 *
 * Renders children only when the authenticated user's role matches
 * `requiredRole`. Any mismatch immediately fires `onDeny`, which should
 * redirect the user away from the protected screen.
 *
 * This mirrors backend middleware that rejects requests from the wrong role.
 */
export default function RoleGuard({ requiredRole, onDeny, children }: RoleGuardProps) {
  const { auth } = useAuth();
  const authorized = auth.isAuthenticated && auth.role === requiredRole;

  useEffect(() => {
    if (!authorized) onDeny?.();
  }, [authorized]);

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-background px-6 text-center gap-4">
        <span
          className="material-symbols-outlined text-error icon-fill text-[56px]"
        >
          gpp_bad
        </span>
        <h2 className="font-headline font-extrabold text-primary text-2xl">Access Denied</h2>
        <p className="text-on-surface-variant text-sm max-w-xs">
          You don't have permission to view this page. Redirecting…
        </p>
      </div>
    );
  }

  return children;
}
