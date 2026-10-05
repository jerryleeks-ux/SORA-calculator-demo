import React, { useState, useMemo } from 'react';
import { SoraRateRecord } from '../types/sora';
import { calculateCompoundedSoraForPeriod, formatSGD, formatPercent } from '../utils/soraMath';
import { Calculator, Download, HelpCircle, Calendar, Hash, ArrowRight, ShieldCheck } from 'lucide-react';

interface DailyCompoundingToolProps {
  ratesData: SoraRateRecord[];
}

export const DailyCompoundingTool: React.FC<DailyCompoundingToolProps> = ({ ratesData }) => {
  const [principal, setPrincipal] = useState<number>(1000000);
  const [spreadPct, setSpreadPct] = useState<number>(0.70);
  const [selectedRangePreset, setSelectedRangePreset] = useState<'30D' | '60D' | 'ALL'>('30D');

  // Filter records based on preset
  const filteredRecords = useMemo(() => {
    if (!ratesData || ratesData.length === 0) return [];
    const count = selectedRangePreset === '30D' ? 22 : selectedRangePreset === '60D' ? 44 : ratesData.length;
    return ratesData.slice(0, count);
  }, [ratesData, selectedRangePreset]);

  // Run calculation
  const compoundingResult = useMemo(() => {
    return calculateCompoundedSoraForPeriod(filteredRecords, principal, spreadPct);
  }, [filteredRecords, principal, spreadPct]);

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Overnight SORA (%)',
      'Weight Days (n_i)',
      'Compounding Factor',
      'Cumulative Product',
      'Daily Interest Accrued (SGD)',
      'Cumulative Interest (SGD)'
    ];

    const rows = compoundingResult.rows.map(r => [
      r.date,
      r.rate.toFixed(4),
      r.weightDays,
      r.effectiveFactor.toFixed(8),
      r.cumulativeProduct.toFixed(8),
      r.dailyInterestOnPrincipal.toFixed(2),
      r.cumulativeInterest.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MAS_SORA_Daily_Compounding_${compoundingResult.startDate}_to_${compoundingResult.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Intro Explanation */}
      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Calculator className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white">
              MAS Prescribed Daily Compounding Engine
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Calculates exact interest payments based on the official MAS/ABS Actual/365 daily compounding formula.
            Accounts for weekend and public holiday weighting (<span className="font-mono text-slate-300">n_i</span>) where Friday's published rate extends across Saturday and Sunday.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Export Audit Trail (CSV)
          </button>
        </div>
      </div>

      {/* Inputs Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Principal Balance (SGD)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-semibold">
              S$
            </span>
            <input
              type="number"
              min="1000"
              step="10000"
              value={principal}
              onChange={(e) => setPrincipal(Math.max(1, Number(e.target.value)))}
              className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Bank Spread / Margin (% p.a.)
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

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Calculation Period
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setSelectedRangePreset('30D')}
              className={`py-1 text-xs rounded-lg font-medium transition ${
                selectedRangePreset === '30D' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ~30 Days
            </button>
            <button
              type="button"
              onClick={() => setSelectedRangePreset('60D')}
              className={`py-1 text-xs rounded-lg font-medium transition ${
                selectedRangePreset === '60D' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ~60 Days
            </button>
            <button
              type="button"
              onClick={() => setSelectedRangePreset('ALL')}
              className={`py-1 text-xs rounded-lg font-medium transition ${
                selectedRangePreset === 'ALL' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Series
            </button>
          </div>
        </div>
      </div>

      {/* Result Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 mb-1">
            Total Interest Payable (Period)
          </div>
          <div className="text-2xl font-black font-mono text-emerald-300">
            {formatSGD(compoundingResult.totalInterestAccrued, true)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Accrued across {compoundingResult.totalCalendarDays} calendar days
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 mb-1">
            Annualized Compounded SORA
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {formatPercent(compoundingResult.annualizedCompoundedSora, 4)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Derived via MAS Actual/365 product
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 mb-1">
            Effective All-In Rate
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {formatPercent(compoundingResult.effectiveAllInRate, 4)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Compounded SORA + {spreadPct.toFixed(2)}% margin
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 mb-1">
            Date Window
          </div>
          <div className="text-sm font-bold font-mono text-slate-200 mt-1">
            {compoundingResult.startDate} to {compoundingResult.endDate}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {compoundingResult.totalBusinessDays} MAS fixings ({compoundingResult.totalCalendarDays} days)
          </div>
        </div>
      </div>

      {/* Formula Box */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 font-mono flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div>
          <span className="text-rose-400 font-bold">MAS Compounding Formula: </span>
          <span>SORA_comp = [ ∏ ( 1 + (r_i × n_i) / 365 ) - 1 ] × (365 / d) × 100%</span>
        </div>
        <span className="text-[11px] text-slate-400 font-sans">
          Convention: Actual/365 (Singapore Money Market Standard)
        </span>
      </div>

      {/* Daily Audit Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center">
            <Hash className="w-4 h-4 mr-1.5 text-rose-400" />
            Daily Compounding Ledger & Fixing Audit Trail
          </h4>
          <span className="text-xs font-mono text-slate-400">
            {compoundingResult.rows.length} Business Days
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/90 text-slate-400 uppercase font-mono sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">MAS Overnight Rate (r_i)</th>
                <th className="py-2.5 px-3 text-center">Days Weight (n_i)</th>
                <th className="py-2.5 px-3">Daily Factor [1 + (r×n)/365]</th>
                <th className="py-2.5 px-3">Cumulative Factor</th>
                <th className="py-2.5 px-3 text-right">Daily Accrued (SGD)</th>
                <th className="py-2.5 px-3 text-right">Cumulative Interest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {compoundingResult.rows.map((row) => (
                <tr
                  key={row.date}
                  className={`hover:bg-slate-800/40 transition ${
                    row.isWeekendOrHoliday ? 'bg-slate-900/40' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-semibold text-white flex items-center">
                    {row.date}
                    {row.isWeekendOrHoliday && (
                      <span className="ml-2 text-[10px] font-sans px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50">
                        +Weekend ({row.weightDays}d)
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-rose-400 font-bold">
                    {formatPercent(row.rate, 4)}
                  </td>
                  <td className="py-2 px-3 text-center text-slate-300 font-bold">
                    {row.weightDays}
                  </td>
                  <td className="py-2 px-3 text-slate-400">
                    {row.effectiveFactor.toFixed(8)}
                  </td>
                  <td className="py-2 px-3 text-slate-300">
                    {row.cumulativeProduct.toFixed(8)}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-400 font-semibold">
                    {formatSGD(row.dailyInterestOnPrincipal, true)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-200 font-bold">
                    {formatSGD(row.cumulativeInterest, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
