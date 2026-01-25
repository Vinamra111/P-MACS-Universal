import { useState } from 'react';
import { Search, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoleColors } from '@/hooks/useRoleColors';

interface NurseQuickActionsProps {
  onQuickAction: (query: string) => void;
}

const locations = ['ICU', 'Emergency-Room', 'Ward-1', 'Ward-2', 'Ward-3', 'Pharmacy-Main'];

export default function NurseQuickActions({ onQuickAction }: NurseQuickActionsProps) {
  const [emergencyDrug, setEmergencyDrug] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ICU');
  const [fefoDrug, setFefoDrug] = useState('');

  const colors = useRoleColors('Nurse');

  const handleEmergencyDrug = () => {
    if (emergencyDrug.trim()) {
      onQuickAction(`Show me all ${emergencyDrug} stock`);
      setEmergencyDrug('');
    }
  };

  const handleFefoDrug = () => {
    if (fefoDrug.trim()) {
      onQuickAction(`Give me FEFO order for ${fefoDrug}`);
      setFefoDrug('');
    }
  };

  return (
    <>
      {/* Emergency Drug Locator */}
      <div className="px-3 py-3 space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
          <Search className="h-3.5 w-3.5" />
          Emergency Drug Locator
        </label>
        <input
          type="text"
          value={emergencyDrug}
          onChange={(e) => setEmergencyDrug(e.target.value)}
          placeholder="Drug name..."
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleEmergencyDrug();
            }
          }}
        />
        <button
          onClick={handleEmergencyDrug}
          disabled={!emergencyDrug.trim()}
          className={cn(
            "w-full px-2.5 py-1.5 text-xs font-medium text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors",
            colors.bg,
            colors.bgHover
          )}
        >
          Locate
        </button>
      </div>

      {/* Location Inventory */}
      <div className="px-3 py-3 space-y-2 border-t border-gray-200">
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
          <MapPin className="h-3.5 w-3.5" />
          Location Inventory
        </label>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          {locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <button
          onClick={() => onQuickAction(`Show ${selectedLocation} inventory status`)}
          className="w-full px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          View Stock
        </button>
      </div>

      {/* FEFO Check */}
      <div className="px-3 py-3 space-y-2 border-t border-gray-200">
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
          <Clock className="h-3.5 w-3.5" />
          FEFO Check
        </label>
        <input
          type="text"
          value={fefoDrug}
          onChange={(e) => setFefoDrug(e.target.value)}
          placeholder="Drug name..."
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleFefoDrug();
            }
          }}
        />
        <button
          onClick={handleFefoDrug}
          disabled={!fefoDrug.trim()}
          className={cn(
            "w-full px-2.5 py-1.5 text-xs font-medium text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors",
            colors.bg,
            colors.bgHover
          )}
        >
          Get Order
        </button>
      </div>
    </>
  );
}
