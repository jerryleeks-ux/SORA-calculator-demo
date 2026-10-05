import React from 'react';
import { RefreshCw, BookOpen, Building2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { MasFetchResult } from '../services/masSoraService';

interface HeaderProps {
  masStatus: MasFetchResult | null;
  isLoading: boolean;
  onRefreshRates: () => void;
  onOpenGuide: () => void;
  onOpenBankPackages: () => void;
  activeTab: 'mortgage' | 'compounding' | 'trends' | 'comparison' | 'scenario';
  setActiveTab: (tab: 'mortgage' | 'compounding' | 'trends' | 'comparison' | 'scenario') => void;
}

export const Header: React.FC<HeaderProps> = ({
  masStatus,
  isLoading,
  onRefreshRates,
  onOpenGuide,
  onOpenBankPackages,
  activeTab,
  setActiveTab
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Singapore Badge */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-950/50">
              <span className="font-extrabold text-lg tracking-tight">SG</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-rose-600 rounded-full"></span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Singapore SORA Calculator
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  MAS Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Monetary Authority of Singapore (MAS) Overnight Benchmark Interest Engine
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live MAS Status Pill */}
            <div className="hidden lg:flex items-center px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              {masStatus?.isLive ? (
                <>
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-300 font-medium mr-1.5">MAS Live Feed</span>
                  <span className="text-slate-400">({masStatus.lastUpdated})</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
                  <span className="text-blue-300 font-medium mr-1.5">MAS Verified Data</span>
                  <span className="text-slate-400">({masStatus?.lastUpdated || 'Latest SGT'})</span>
                </>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefreshRates}
              disabled={isLoading}
              title="Query MAS for latest published rates"
              className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium rounded-lg text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:mr-1.5 ${isLoading ? 'animate-spin text-rose-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{isLoading ? 'Syncing...' : 'Sync MAS'}</span>
            </button>

            {/* Bank Packages Preset Button */}
            <button
              onClick={onOpenBankPackages}
              className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium rounded-lg text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 transition active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5 sm:mr-1.5 text-amber-400" />
              <span className="hidden sm:inline">Bank Packages</span>
            </button>

            {/* Guide Button */}
            <button
              onClick={onOpenGuide}
              className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5 sm:mr-1.5 text-slate-400" />
              <span className="hidden sm:inline">SORA Guide</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('mortgage')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'mortgage'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Loan & Mortgage Calculator
          </button>
          <button
            onClick={() => setActiveTab('compounding')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'compounding'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Daily Compounding Accrual
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'trends'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            MAS Rate Trajectory & History
          </button>
          <button
            onClick={() => setActiveTab('scenario')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'scenario'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            SORA Rate Shock Simulator
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'comparison'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Fixed vs SORA Break-Even
          </button>
        </div>
      </div>
    </header>
  );
};
