import { useState } from 'react';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoleColors } from '@/hooks/useRoleColors';

interface MasterQuickActionsProps {
  onQuickAction: (query: string) => void;
}

export default function MasterQuickActions({ onQuickAction }: MasterQuickActionsProps) {
  const [forecastDrug, setForecastDrug] = useState('');
  const [trendDrug, setTrendDrug] = useState('');

  const colors = useRoleColors('Master');

  const handleForecast = () => {
    if (forecastDrug.trim()) {
      onQuickAction(`Run demand forecast for ${forecastDrug}`);
      setForecastDrug('');
    }
  };

  const handleTrend = () => {
    if (trendDrug.trim()) {
      onQuickAction(`Analyze seasonal trends for ${trendDrug}`);
      setTrendDrug('');
    }
  };

  return (
    <>
      {/* Forecast Drug */}
      <div className="px-3 py-3 space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
          <Package className="h-3.5 w-3.5" />
          Forecast Drug
        </label>
        <input
          type="text"
          value={forecastDrug}
          onChange={(e) => setForecastDrug(e.target.value)}
          placeholder="Drug name..."
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleForecast();
            }
          }}
        />
        <button
          onClick={handleForecast}
          disabled={!forecastDrug.trim()}
          className={cn(
            "w-full px-2.5 py-1.5 text-xs font-medium text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors",
            colors.bg,
            colors.bgHover
          )}
        >
          Forecast
        </button>
      </div>

      {/* Seasonal Trends */}
      <div className="px-3 py-3 space-y-2 border-t border-gray-200">
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
          <TrendingUp className="h-3.5 w-3.5" />
          Seasonal Trends
        </label>
        <input
          type="text"
          value={trendDrug}
          onChange={(e) => setTrendDrug(e.target.value)}
          placeholder="Drug name..."
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleTrend();
            }
          }}
        />
        <button
          onClick={handleTrend}
          disabled={!trendDrug.trim()}
          className={cn(
            "w-full px-2.5 py-1.5 text-xs font-medium text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors",
            colors.bg,
            colors.bgHover
          )}
        >
          Analyze
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="px-3 py-3 space-y-1.5 border-t border-gray-200">
        <button
          onClick={() => onQuickAction('Show me all active users')}
          className="w-full px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors text-left"
        >
          User Management
        </button>
        <button
          onClick={() => onQuickAction('Show me top moving drugs')}
          className="w-full px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors text-left"
        >
          Top Movers
        </button>
        <button
          onClick={() => onQuickAction('Show me slow moving drugs')}
          className="w-full px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors text-left"
        >
          Slow Movers
        </button>
        <button
          onClick={() => onQuickAction('Show me stockout risk analysis')}
          className="w-full px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors text-left flex items-center gap-2"
        >
          <AlertTriangle className="h-3.5 w-3.5" /> Stockout Risk
        </button>
        <button
          onClick={() => onQuickAction('Generate purchase order for low stock items')}
          className="w-full px-2.5 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors text-left"
        >
          Generate PO
        </button>
      </div>
    </>
  );
}
