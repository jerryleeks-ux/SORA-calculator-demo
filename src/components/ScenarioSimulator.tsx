import React, { useState } from 'react';
import { SoraBenchmarkType, SoraRateRecord } from '../types/sora';
import { calculateMonthlyInstallment, formatSGD, formatPercent } from '../utils/soraMath';
import { Activity, AlertTriangle, TrendingDown, TrendingUp, SlidersHorizontal } from 'lucide-react';

interface ScenarioSimulatorProps {
  latestRecord: SoraRateRecord;
  selectedBenchmark: SoraBenchmarkType;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  latestRecord,
  selectedBenchmark
}) => {
  const [loanAmount, setLoanAmount] = useState<number>(1000000);
  const [tenureYears, setTenureYears] = useState<number>(25);
  const [spreadPct, setSpreadPct] = useState<number>(0.70);

  // Active base SORA
  const currentBaseRate = selectedBenchmark === '1M_COMPOUNDED'
    ? (latestRecord.sora_compound_1m ?? 3.0945)
    : selectedBenchmark === '3M_COMPOUNDED'
    ? (latestRecord.sora_compound_3m ?? 3.1420)
    : (latestRecord.sora_compound_6m ?? 3.2110);

  const currentAllIn = currentBaseRate + spreadPct;
  const currentMonthly = calculateMonthlyInstallment(loanAmount, currentAllIn, tenureYears * 12);
  const currentTotalInterest = (currentMonthly * tenureYears * 12) - loanAmount;

  // Scenarios matrix
  const scenarios = [
    { label: 'Severe Easing (-1.00%)', shiftBps: -1.0, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-800/40' },
    { label: 'Moderate Easing (-0.50%)', shiftBps: -0.5, color: 'text-emerald-300', bg: 'bg-emerald-950/10 border-emerald-800/30' },
    { label: 'Current Base SORA', shiftBps: 0.0, color: 'text-white', bg: 'bg-slate-800/80 border-slate-700' },
    { label: 'Moderate Hike (+0.50%)', shiftBps: +0.5, color: 'text-amber-300', bg: 'bg-amber-950/20 border-amber-800/40' },
    { label: 'Aggressive Hike (+1.00%)', shiftBps: +1.0, color: 'text-rose-400', bg: 'bg-rose-950/20 border-rose-800/40' },
    { label: 'MAS Regulatory Stress (4.00% Base)', explicitBase: 4.00, color: 'text-rose-300', bg: 'bg-rose-950/40 border-rose-600/50' },
  ];

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
            <Activity className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold text-white">
            SORA Sensitivity & Rate Shock Simulator
          </h3>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Floating rate loans fluctuate as global central banks and MAS adjust monetary policy.
          Use this sensitivity matrix to forecast your monthly installment and total interest buffer under potential interest rate hikes or rate cuts.
        </p>
      </div>

      {/* Loan parameter tweak controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Simulated Loan Balance (SGD)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-semibold">
              S$
            </span>
            <input
              type="number"
              step="50000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Math.max(10000, Number(e.target.value)))}
              className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Tenure (Years)
          </label>
          <div className="relative">
            <input
              type="number"
              min="5"
              max="35"
              value={tenureYears}
              onChange={(e) => setTenureYears(Math.max(1, Number(e.target.value)))}
              className="w-full pr-12 pl-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-rose-500"
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 text-xs">
              Years
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Bank Spread (% p.a.)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.05"
              min="0"
              value={spreadPct}
              onChange={(e) => setSpreadPct(Number(e.target.value))}
              className="w-full pr-8 pl-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-rose-500"
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 text-xs">
              %
            </span>
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((sc, idx) => {
          const baseRate = sc.explicitBase !== undefined ? sc.explicitBase : currentBaseRate + sc.shiftBps;
          const allInRate = baseRate + spreadPct;
          const monthlyPayment = calculateMonthlyInstallment(loanAmount, allInRate, tenureYears * 12);
          const monthlyDiff = monthlyPayment - currentMonthly;
          const totalInterest = (monthlyPayment * tenureYears * 12) - loanAmount;
          const interestDiff = totalInterest - currentTotalInterest;

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${sc.bg} relative overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  {sc.label}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950/70 border border-slate-700/50 text-slate-200">
                  {formatPercent(allInRate, 2)} All-In
                </span>
              </div>

              <div className="mt-2">
                <span className="text-[11px] text-slate-400">Monthly Installment:</span>
                <div className={`text-2xl font-black font-mono tracking-tight ${sc.color}`}>
                  {formatSGD(monthlyPayment)}
                  <span className="text-xs font-normal text-slate-400"> /mo</span>
                </div>
              </div>

              {/* Difference from current */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Monthly Delta:</span>
                  <span className={`font-bold flex items-center ${
                    monthlyDiff > 0 ? 'text-rose-400' : monthlyDiff < 0 ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {monthlyDiff > 0 ? '+' : ''}{formatSGD(monthlyDiff)}
                    {monthlyDiff > 0 && <TrendingUp className="w-3 h-3 ml-1" />}
                    {monthlyDiff < 0 && <TrendingDown className="w-3 h-3 ml-1" />}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Annual Variance:</span>
                  <span className={monthlyDiff > 0 ? 'text-rose-400' : monthlyDiff < 0 ? 'text-emerald-400' : 'text-slate-400'}>
                    {monthlyDiff > 0 ? '+' : ''}{formatSGD(monthlyDiff * 12)}/yr
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800/40">
                  <span className="text-slate-400">Lifetime Interest Delta:</span>
                  <span className="font-semibold text-slate-200">
                    {interestDiff > 0 ? '+' : ''}{formatSGD(interestDiff)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
