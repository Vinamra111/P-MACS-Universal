import { AlertTriangle } from 'lucide-react';

interface UserStatsCardsProps {
  totalUsers: number;
  activeUsers: number;
  blacklistedUsers: number;
  nurses: number;
  pharmacists: number;
}

export default function UserStatsCards({
  totalUsers,
  activeUsers,
  blacklistedUsers,
  nurses,
  pharmacists,
}: UserStatsCardsProps) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Users - Blue (informational) */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="text-3xl font-bold text-blue-900">{totalUsers}</div>
          <div className="text-sm text-blue-700 font-medium">Total Users</div>
        </div>

        {/* Active Users - Green (positive status) */}
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="text-3xl font-bold text-green-900">{activeUsers}</div>
          <div className="text-sm text-green-700 font-medium">Active</div>
        </div>

        {/* Nurses - Violet (role color) */}
        <div className="bg-violet-50 border border-violet-200 p-4 rounded-lg">
          <div className="text-3xl font-bold text-violet-900">{nurses}</div>
          <div className="text-sm text-violet-700 font-medium">Nurses</div>
        </div>

        {/* Pharmacists - Cyan (role color) */}
        <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-lg">
          <div className="text-3xl font-bold text-cyan-900">{pharmacists}</div>
          <div className="text-sm text-cyan-700 font-medium">Pharmacists</div>
        </div>
      </div>

      {blacklistedUsers > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">{blacklistedUsers} user(s) blacklisted</span>
          </div>
        </div>
      )}
    </>
  );
}
