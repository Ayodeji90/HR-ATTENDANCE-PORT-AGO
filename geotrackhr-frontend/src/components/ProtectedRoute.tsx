import React from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface Props {
  children: React.ReactNode;
  /** If provided, only these roles may view the route; others see an Access Denied state */
  roles?: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, roles }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-ink-200 bg-white px-6 py-16 text-center">
        <ShieldAlert size={36} className="text-primary-500" />
        <div>
          <p className="font-medium text-ink-800">Access denied</p>
          <p className="mt-1 text-sm text-ink-500">Your role doesn't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
