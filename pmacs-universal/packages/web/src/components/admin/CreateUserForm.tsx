import { useState } from 'react';
import { Plus } from 'lucide-react';

interface CreateUserFormProps {
  onCreateUser: (user: {
    empId: string;
    name: string;
    role: 'Nurse' | 'Pharmacist' | 'Master';
    password: string;
  }) => Promise<void>;
  loading: boolean;
}

export default function CreateUserForm({ onCreateUser, loading }: CreateUserFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    empId: '',
    name: '',
    role: 'Nurse' as 'Nurse' | 'Pharmacist' | 'Master',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateUser(formData);
    setFormData({ empId: '', name: '', role: 'Nurse', password: '' });
    setShowForm(false);
  };

  return (
    <>
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-6"
      >
        <Plus className="h-5 w-5" />
        Create New User
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-8 border">
          <h3 className="text-lg font-semibold mb-4">Create New User</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={formData.empId}
              onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
              placeholder="Employee ID (e.g., N012)"
              className="px-3 py-2 border rounded-md"
            />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Full Name"
              className="px-3 py-2 border rounded-md"
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="px-3 py-2 border rounded-md"
            >
              <option value="Nurse">Nurse</option>
              <option value="Pharmacist">Pharmacist</option>
              <option value="Master">Master</option>
            </select>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Password"
              className="px-3 py-2 border rounded-md"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 border rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </>
  );
}
