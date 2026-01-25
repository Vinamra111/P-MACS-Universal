'use client';

import { BarChart3 } from 'lucide-react';

export default function InventoryChart() {
  const categories = [
    { name: 'Analgesics', count: 45, percentage: 68 },
    { name: 'Antibiotics', count: 38, percentage: 92 },
    { name: 'Cardiovascular', count: 32, percentage: 85 },
    { name: 'Controlled', count: 28, percentage: 75 },
    { name: 'IV Solutions', count: 25, percentage: 88 },
    { name: 'Others', count: 31, percentage: 80 },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Inventory by Category</h3>
          <p className="text-sm text-gray-500 mt-1">Stock levels across drug categories</p>
        </div>
        <BarChart3 className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          // Contextual color based on stock level
          const getStockColor = (percentage: number) => {
            if (percentage >= 80) return 'bg-green-500'; // Good stock - Green
            if (percentage >= 60) return 'bg-amber-500'; // Warning - Amber
            return 'bg-red-500'; // Critical low - Red
          };

          const getTextColor = (percentage: number) => {
            if (percentage >= 80) return 'text-green-700';
            if (percentage >= 60) return 'text-amber-700';
            return 'text-red-700';
          };

          return (
            <div key={category.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{category.count} items</span>
                  <span className={`text-sm font-semibold ${getTextColor(category.percentage)}`}>
                    {category.percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`${getStockColor(category.percentage)} h-2.5 rounded-full transition-all duration-500`}
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          {/* Total Items - Blue (informational) */}
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-900">199</p>
            <p className="text-xs text-blue-700 font-medium mt-1">Total Items</p>
          </div>

          {/* In Stock - Green (positive) */}
          <div className="text-center border-l border-r border-gray-200">
            <p className="text-2xl font-bold text-green-900">94%</p>
            <p className="text-xs text-green-700 font-medium mt-1">In Stock</p>
          </div>

          {/* Low/Out - Red (critical) */}
          <div className="text-center">
            <p className="text-2xl font-bold text-red-900">6%</p>
            <p className="text-xs text-red-700 font-medium mt-1">Low/Out</p>
          </div>
        </div>
      </div>
    </div>
  );
}
