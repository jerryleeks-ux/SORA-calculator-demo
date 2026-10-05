import React, { useState } from 'react';
import { SoraBenchmarkType, SoraRateRecord } from '../types/sora';
import { calculateMonthlyInstallment, formatSGD, formatPercent } from '../utils/soraMath';
import { Scale, Check, AlertCircle, ArrowRight, Shield, Zap } from 'lucide-react';

interface FixedVsFloatingComparisonProps {
  latestRecord: SoraRateRecord;
  selectedBenchmark: SoraBenchmarkType;
}

export const FixedVsFloatingComparison: React.FC<FixedVsFloatingComparisonProps> = ({
  latestRecord,
  selectedBenchmark
}) => {
  const [loanAmount, setLoanAmount] = useState<number>(1000000);
  const [tenureYears, setTenureYears] = useState<number>(25);

  // Fixed Package Parameters
  const [fixedRate, setFixedRate] = useState<number>(2.85); // e.g. 2.85% fixed for 2 years
  const [fixedDurationYears, setFixedDurationYears] = useState<number>(2);

  // Floating Package Parameters
  const [floatingSpread, setFloatingSpread] = useState<number>(0.65); // e.g. SORA + 0.65%

  const activeSora = selectedBenchmark === '1M_COMPOUNDED'
    ? (latestRecord.sora_compound_1m ?? 3.0945)
    : selectedBenchmark === '3M_COMPOUNDED'
    ? (latestRecord.sora_compound_3m ?? 3.1420)
    : (latestRecord.sora_compound_6m ?? 3.2110);

  const floatingAllIn = activeSora + floatingSpread;

  // Monthly installments
  const totalMonths = tenureYears * 12;
  const fixedMonthly = calculateMonthlyInstallment(loanAmount, fixedRate, totalMonths);
  const floatingMonthly = calculateMonthlyInstallment(loanAmount, floatingAllIn, totalMonths);

  // Interest over fixed period (e.g. 24 or 36 months)
  const compareMonths = fixedDurationYears * 12;

  // Approximate interest over compareMonths
  let fixedInterestCompare = 0;
  let fixedBal = loanAmount;
  for (let m = 1; m <= compareMonths; m++) {
    const interest = fixedBal * (fixedRate / 100 / 12);
    const principal = fixedMonthly - interest;
    fixedBal -= principal;
    fixedInterestCompare += interest;
  }

  let floatingInterestCompare = 0;
  let floatingBal = loanAmount;
  for (let m = 1; m <= compareMonths; m++) {
    const interest = floatingBal * (floatingAllIn / 100 / 12);
    const principal = floatingMonthly - interest;
    floatingBal -= principal;
    floatingInterestCompare += interest;
  }

  const interestDifference = Math.abs(fixedInterestCompare - floatingInterestCompare);
  const isFixedCheaper = fixedInterestCompare < floatingInterestCompare;

  // Break-even SORA rate: the SORA level at which floatingAllIn = fixedRate
  // SORA + spread = fixedRate => SORA_breakeven = fixedRate - spread
  const breakEvenSora = fixedRate - floatingSpread;
  const soraCushion = activeSora - breakEvenSora;

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
            <Scale className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold text-white">
            Fixed Rate vs SORA Floating Comparison & Break-Even Analysis
          </h3>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Evaluate whether locking into a bank Fixed Rate package beats riding the floating SORA benchmark.
          Calculates the exact "Break-Even SORA" rate required for one package to outcompete the other.
        </p>
      </div>

      {/* Input parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Loan Amount (SGD)
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
            Fixed Package Rate (% p.a.)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.05"
              value={fixedRate}
              onChange={(e) => setFixedRate(Number(e.target.value))}
              className="w-full pr-8 pl-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-rose-500"
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 text-xs">
              %
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Fixed Lock-In Duration
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
            {[1, 2, 3].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setFixedDurationYears(yr)}
                className={`py-1 text-xs rounded-lg font-medium transition ${
                  fixedDurationYears === yr ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {yr} {yr === 1 ? 'Year' : 'Years'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Floating Spread (SORA + %)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.05"
              value={floatingSpread}
              onChange={(e) => setFloatingSpread(Number(e.target.value))}
              className="w-full pr-8 pl-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-rose-500"
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 text-xs">
              %
            </span>
          </div>
        </div>
      </div>

      {/* Head-to-Head Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fixed Package */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isFixedCheaper ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h4 className="text-base font-bold text-white">Fixed Rate Package</h4>
            </div>
            {isFixedCheaper && (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-xs font-semibold">
                Saves More Currently
              </span>
            )}
          </div>

          <div className="space-y-3 font-mono">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400 font-sans">Guaranteed All-In Rate:</span>
              <span className="text-xl font-bold text-white">{formatPercent(fixedRate, 2)} p.a.</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400 font-sans">Monthly Payment:</span>
              <span className="text-xl font-bold text-blue-300">{formatSGD(fixedMonthly)}/mo</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-sans">{fixedDurationYears}-Year Total Interest:</span>
              <span className="text-lg font-bold text-slate-200">{formatSGD(fixedInterestCompare)}</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-950/60 text-xs text-slate-400">
            Peace of mind with zero volatility during the {fixedDurationYears}-year lock-in period, immune to rate hikes.
          </div>
        </div>

        {/* Floating Package */}
        <div className={`p-5 rounded-2xl border transition-all ${
          !isFixedCheaper ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h4 className="text-base font-bold text-white">Floating SORA Package</h4>
            </div>
            {!isFixedCheaper && (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-xs font-semibold">
                Saves More Currently
              </span>
            )}
          </div>

          <div className="space-y-3 font-mono">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400 font-sans">Current All-In Rate:</span>
              <span className="text-xl font-bold text-white">
                {formatPercent(floatingAllIn, 4)} p.a.
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400 font-sans">Monthly Payment:</span>
              <span className="text-xl font-bold text-amber-300">{formatSGD(floatingMonthly)}/mo</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-sans">{fixedDurationYears}-Year Total Interest:</span>
              <span className="text-lg font-bold text-slate-200">{formatSGD(floatingInterestCompare)}</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-950/60 text-xs text-slate-400">
            Subject to monthly or quarterly resets. If MAS SORA trends downwards, your monthly payments decrease automatically.
          </div>
        </div>
      </div>

      {/* Break-Even Insight Box */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Scale className="w-4 h-4" />
          </span>
          <h4 className="text-sm font-bold text-white">
            Break-Even SORA Threshold
          </h4>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono">
          <div>
            <span className="text-xs text-slate-400 block font-sans">
              Break-Even SORA Level:
            </span>
            <span className="text-2xl font-black text-rose-400">
              {formatPercent(breakEvenSora, 2)}
            </span>
            <span className="text-xs text-slate-400 block font-sans mt-0.5">
              (Fixed {fixedRate}% - Margin {floatingSpread}%)
            </span>
          </div>

          <div className="text-xs font-sans text-slate-300 max-w-md space-y-1">
            <p>
              • If MAS SORA is <strong>above {formatPercent(breakEvenSora, 2)}</strong>, the Fixed Package is cheaper by approximately{' '}
              <span className="text-emerald-400 font-mono font-bold">{formatSGD(interestDifference)}</span> over {fixedDurationYears} years.
            </p>
            <p>
              • If MAS SORA drops <strong>below {formatPercent(breakEvenSora, 2)}</strong>, the Floating SORA package becomes more advantageous.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
