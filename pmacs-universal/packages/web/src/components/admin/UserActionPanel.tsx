import { useState } from 'react';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface User {
  empId: string;
  name: string;
  role: string;
  status: string;
  lastLogin: string;
}

interface UserActionPanelProps {
  users: User[];
  onWhitelist: (empId: string) => Promise<void>;
  onBlacklist: (empId: string) => Promise<void>;
  onDelete: (empId: string) => Promise<void>;
  loading: boolean;
}

export default function UserActionPanel({
  users,
  onWhitelist,
  onBlacklist,
  onDelete,
  loading,
}: UserActionPanelProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const selectedUserData = users.find((u) => u.empId === selectedUser);

  const handleDelete = async () => {
    if (!selectedUser || !confirm(`Permanently delete ${selectedUser}?`)) return;
    await onDelete(selectedUser);
    setSelectedUser('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div>
        <label className="block text-sm font-medium mb-2">Select User</label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">-- Select a user --</option>
          {users.map((user) => (
            <option key={user.empId} value={user.empId}>
              {user.empId} - {user.name} ({user.status})
            </option>
          ))}
        </select>

        {selectedUserData && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border space-y-1 text-sm">
            <div>
              <span className="font-medium">Name:</span> {selectedUserData.name}
            </div>
            <div>
              <span className="font-medium">Role:</span> {selectedUserData.role}
            </div>
            <div>
              <span className="font-medium">Status:</span> {selectedUserData.status}
            </div>
            <div>
              <span className="font-medium">Last Login:</span> {selectedUserData.lastLogin || 'Never'}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Actions</label>
        <div className="space-y-3">
          <button
            onClick={() => onWhitelist(selectedUser)}
            disabled={!selectedUser || loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            Whitelist
          </button>
          <button
            onClick={() => onBlacklist(selectedUser)}
            disabled={!selectedUser || loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            <XCircle className="h-5 w-5" />
            Blacklist
          </button>
          <button
            onClick={handleDelete}
            disabled={!selectedUser || loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            <Trash2 className="h-5 w-5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
