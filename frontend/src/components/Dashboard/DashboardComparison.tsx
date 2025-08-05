import React, { useState } from 'react';
import { Dashboard } from './Dashboard';
import { MinimalDashboard } from './MinimalDashboard';
import { Monitor, Layers } from 'lucide-react';
import './minimal-dashboard.css';

export const DashboardComparison: React.FC = () => {
  const [view, setView] = useState<'original' | 'minimal' | 'split'>('minimal');

  return (
    <div className="tw-min-h-screen tw-bg-gray-50">
      {/* View Toggle */}
      <div className="tw-sticky tw-top-0 tw-z-50 tw-bg-white tw-border-b tw-border-gray-200 tw-px-6 tw-py-3">
        <div className="tw-flex tw-items-center tw-justify-between tw-max-w-7xl tw-mx-auto">
          <div className="tw-flex tw-items-center tw-gap-2">
            <Monitor className="tw-w-5 tw-h-5 tw-text-gray-600" />
            <span className="tw-text-sm tw-font-medium tw-text-gray-700">Dashboard View</span>
          </div>
          <div className="tw-flex tw-bg-gray-100 tw-rounded-lg tw-p-1">
            <button
              onClick={() => setView('original')}
              className={`tw-px-4 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-md tw-transition-all ${
                view === 'original'
                  ? 'tw-bg-white tw-text-gray-900 tw-shadow-sm'
                  : 'tw-text-gray-600 hover:tw-text-gray-900'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setView('minimal')}
              className={`tw-px-4 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-md tw-transition-all ${
                view === 'minimal'
                  ? 'tw-bg-white tw-text-gray-900 tw-shadow-sm'
                  : 'tw-text-gray-600 hover:tw-text-gray-900'
              }`}
            >
              Minimal 2025
            </button>
            <button
              onClick={() => setView('split')}
              className={`tw-px-4 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-md tw-transition-all tw-flex tw-items-center tw-gap-1 ${
                view === 'split'
                  ? 'tw-bg-white tw-text-gray-900 tw-shadow-sm'
                  : 'tw-text-gray-600 hover:tw-text-gray-900'
              }`}
            >
              <Layers className="tw-w-3 tw-h-3" />
              Split View
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="tw-flex-1">
        {view === 'original' && (
          <div className="tw-p-6 tw-max-w-7xl tw-mx-auto">
            <Dashboard />
          </div>
        )}
        
        {view === 'minimal' && <MinimalDashboard />}
        
        {view === 'split' && (
          <div className="tw-flex tw-h-[calc(100vh-57px)]">
            <div className="tw-flex-1 tw-border-r tw-border-gray-200 tw-overflow-auto">
              <div className="tw-p-6">
                <div className="tw-mb-4 tw-px-3 tw-py-2 tw-bg-gray-100 tw-rounded-lg tw-inline-block">
                  <span className="tw-text-xs tw-font-medium tw-text-gray-600">ORIGINAL (2015 STYLE)</span>
                </div>
                <Dashboard />
              </div>
            </div>
            <div className="tw-flex-1 tw-overflow-auto">
              <div className="tw-relative">
                <div className="tw-absolute tw-top-6 tw-left-6 tw-z-10 tw-px-3 tw-py-2 tw-bg-blue-100 tw-rounded-lg tw-inline-block">
                  <span className="tw-text-xs tw-font-medium tw-text-blue-600">MINIMAL 2025</span>
                </div>
                <MinimalDashboard />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};