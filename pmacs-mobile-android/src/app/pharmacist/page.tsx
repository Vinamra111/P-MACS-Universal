'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/components/pharmacist/PharmacistDashboard';
import ChatInterface from '@/components/ChatInterface';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

function PharmacistContent() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'chat'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [triggeredQuery, setTriggeredQuery] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  if (!user) return null;

  const handleQuickAction = (query: string) => {
    setTriggeredQuery(query);
    setActiveView('chat');
  };

  const clearTriggeredQuery = () => {
    setTriggeredQuery(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onQuickAction={handleQuickAction}
        userRole="Pharmacist"
        userName={user.name}
        userId={user.empId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {activeView === 'dashboard' ? (
            <Dashboard />
          ) : (
            <ChatInterface
              triggeredQuery={triggeredQuery}
              onQueryProcessed={clearTriggeredQuery}
              apiEndpoint={`${apiUrl}/api/pharmacist/chat`}
              userRole="Pharmacist"
              userName={user.name}
              userEmpId={user.empId}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function PharmacistPage() {
  return (
    <ProtectedRoute allowedRoles={['Pharmacist']}>
      <PharmacistContent />
    </ProtectedRoute>
  );
}
