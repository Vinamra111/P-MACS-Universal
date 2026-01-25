import { useState } from 'react';

type MessageType = { type: 'success' | 'error'; text: string } | null;

export function useUserManagement(onRefresh: () => void, currentUserId?: string) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageType>(null);

  const handleUserAction = async (empId: string, action: 'WHITELIST' | 'BLACKLIST') => {
    if (!empId) return;
    setLoading(true);
    setMessage(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentUserId) {
        headers['x-user-id'] = currentUserId;
      }

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ empId, action }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        onRefresh();
      } else {
        setMessage({ type: 'error', text: data.error || 'Action failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (empId: string) => {
    if (!empId) return;
    setLoading(true);
    setMessage(null);

    try {
      const headers: Record<string, string> = {};
      if (currentUserId) {
        headers['x-user-id'] = currentUserId;
      }

      const response = await fetch(`/api/admin/users?empId=${empId}`, {
        method: 'DELETE',
        headers
      });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        onRefresh();
      } else {
        setMessage({ type: 'error', text: data.error || 'Delete failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (user: {
    empId: string;
    name: string;
    role: 'Nurse' | 'Pharmacist' | 'Master';
    password: string;
  }) => {
    // Client-side validation
    if (!user.empId.trim() || !user.name.trim() || !user.password.trim()) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    // Password validation - must match backend requirements
    if (user.password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    if (user.password.length > 100) {
      setMessage({ type: 'error', text: 'Password must be at most 100 characters' });
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(user.password)) {
      setMessage({
        type: 'error',
        text: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
      return;
    }

    if (!/^[A-Z][0-9]{3,}$/.test(user.empId)) {
      setMessage({ type: 'error', text: 'Employee ID format: N001, P001, M001 (letter + numbers)' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentUserId) {
        headers['x-user-id'] = currentUserId;
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(user),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        onRefresh();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    message,
    setMessage,
    whitelistUser: (empId: string) => handleUserAction(empId, 'WHITELIST'),
    blacklistUser: (empId: string) => handleUserAction(empId, 'BLACKLIST'),
    deleteUser,
    createUser,
  };
}
