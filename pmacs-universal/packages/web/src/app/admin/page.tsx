'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/components/admin/AdminDashboard';
import Header from '@/components/Header';

function AdminContent() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content - No Sidebar for Admin */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => {}} />

        {/* Dashboard Only - No Chat */}
        <main className="flex-1 overflow-auto">
          <AdminDashboard />
        </main>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['Master']}>
      <AdminContent />
    </ProtectedRoute>
  );
}
