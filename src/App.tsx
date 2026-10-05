import React, { useState, useEffect, useCallback } from 'react';
import { SoraRateRecord, SoraBenchmarkType } from './types/sora';
import { MasSoraService, MasFetchResult } from './services/masSoraService';
import { FALLBACK_SORA_DATA, SINGAPORE_BANK_PRESETS } from './data/historicalSora';
import { Header } from './components/Header';
import { SoraRateBanner } from './components/SoraRateBanner';
import { MortgageCalculator } from './components/MortgageCalculator';
import { DailyCompoundingTool } from './components/DailyCompoundingTool';
import { RateTrajectoryChart } from './components/RateTrajectoryChart';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { FixedVsFloatingComparison } from './components/FixedVsFloatingComparison';
import { SoraGuideModal } from './components/SoraGuideModal';
import { BankPackagesModal } from './components/BankPackagesModal';
import { ShieldCheck, Info, ExternalLink, Cpu } from 'lucide-react';

export default function App() {
  const [ratesData, setRatesData] = useState<SoraRateRecord[]>(FALLBACK_SORA_DATA);
  const [masStatus, setMasStatus] = useState<MasFetchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBenchmark, setSelectedBenchmark] = useState<SoraBenchmarkType>('3M_COMPOUNDED');
  const [activeTab, setActiveTab] = useState<'mortgage' | 'compounding' | 'trends' | 'comparison' | 'scenario'>('mortgage');

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isBankPackagesOpen, setIsBankPackagesOpen] = useState<boolean>(false);

  // Fetch rates on mount
  const loadRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await MasSoraService.fetchSoraRates();
      setMasStatus(result);
      if (result.data && result.data.length > 0) {
        setRatesData(result.data);
      }
    } catch {
      // Fallback
      setRatesData(FALLBACK_SORA_DATA);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const latestRecord = ratesData[0] || FALLBACK_SORA_DATA[0];

  const handleApplyBankPackage = (preset: typeof SINGAPORE_BANK_PRESETS[0]) => {
    setSelectedBenchmark(preset.benchmark);
    setActiveTab('mortgage');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <Header
        masStatus={masStatus}
        isLoading={isLoading}
        onRefreshRates={loadRates}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenBankPackages={() => setIsBankPackagesOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* SORA Live Rate Benchmark Banner */}
      <SoraRateBanner
        latestRecord={latestRecord}
        selectedBenchmark={selectedBenchmark}
        onSelectBenchmark={setSelectedBenchmark}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'mortgage' && (
          <MortgageCalculator
            latestRecord={latestRecord}
            selectedBenchmark={selectedBenchmark}
            onSelectBenchmark={setSelectedBenchmark}
          />
        )}

        {activeTab === 'compounding' && (
          <DailyCompoundingTool ratesData={ratesData} />
        )}

        {activeTab === 'trends' && (
          <RateTrajectoryChart data={ratesData} />
        )}

        {activeTab === 'scenario' && (
          <ScenarioSimulator
            latestRecord={latestRecord}
            selectedBenchmark={selectedBenchmark}
          />
        )}

        {activeTab === 'comparison' && (
          <FixedVsFloatingComparison
            latestRecord={latestRecord}
            selectedBenchmark={selectedBenchmark}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/50 mt-12 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-800/60">
            <div>
              <div className="flex items-center space-x-2 text-white font-bold text-sm mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Monetary Authority of Singapore (MAS) Data</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                SORA rates are published by the Monetary Authority of Singapore at approximately 9:00 AM Singapore Time (SGT) every business day. Day-count convention follows Singapore Actual/365.
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-2 text-white font-bold text-sm mb-2">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Backend Integration Ready</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Built modularly with <code className="text-slate-300 font-mono">MasSoraService</code>. Connect your backend proxy endpoint (<code className="text-slate-300 font-mono">/api/sora</code>) or database sync at any time without frontend refactoring.
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-2 text-white font-bold text-sm mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Regulatory Disclaimer</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Calculations are for educational and financial scenario planning purposes. Official mortgage approval and exact interest debits depend on your individual lender’s confirmation letter and credit terms.
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
            <span>
              Singapore Overnight Rate Average (SORA) Interest Engine • Actual/365
            </span>
            <div className="flex space-x-4 mt-2 sm:mt-0">
              <button onClick={() => setIsGuideOpen(true)} className="hover:text-slate-300 transition">
                SORA Reference Guide
              </button>
              <button onClick={() => setIsBankPackagesOpen(true)} className="hover:text-slate-300 transition">
                Bank Packages
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SoraGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <BankPackagesModal
        isOpen={isBankPackagesOpen}
        onClose={() => setIsBankPackagesOpen(false)}
        onSelectPackage={handleApplyBankPackage}
      />
    </div>
  );
}
