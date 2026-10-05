import React, { useState, useMemo } from 'react';
import {
  LoanInput,
  SoraBenchmarkType,
  SoraRateRecord
} from '../types/sora';
import {
  calculateLoanSchedule,
  formatSGD,
  formatPercent,
  MAS_STRESS_TEST_RATE,
  MAS_MAX_TDSR_PERCENT
} from '../utils/soraMath';
import { SINGAPORE_BANK_PRESETS } from '../data/historicalSora';
import {
  Calculator,
  Download,
  Building,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Percent,
  Sliders,
  PiggyBank,
  FileSpreadsheet
} from 'lucide-react';

interface MortgageCalculatorProps {
  latestRecord: SoraRateRecord;
  selectedBenchmark: SoraBenchmarkType;
  onSelectBenchmark: (benchmark: SoraBenchmarkType) => void;
}

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({
  latestRecord,
  selectedBenchmark,
  onSelectBenchmark
}) => {
  // Primary Loan State
  const [propertyValue, setPropertyValue] = useState<number>(1350000);
  const [loanAmount, setLoanAmount] = useState<number>(1000000);
  const [tenureYears, setTenureYears] = useState<number>(25);
  const [manualBenchmarkRate, setManualBenchmarkRate] = useState<number>(3.15);
  const [propertyType, setPropertyType] = useState<'HDB' | 'PRIVATE' | 'COMMERCIAL'>('PRIVATE');

  // Spread state
  const [isTieredSpread, setIsTieredSpread] = useState<boolean>(true);
  const [flatSpread, setFlatSpread] = useState<number>(0.75);
  const [tieredSpread, setTieredSpread] = useState({
    year1: 0.65,
    year2: 0.65,
    year3: 0.75,
    thereafter: 0.80
  });

  // Prepayment Simulator state
  const [showPrepayment, setShowPrepayment] = useState<boolean>(false);
  const [prepaymentMonthly, setPrepaymentMonthly] = useState<number>(0);
  const [prepaymentLumpSum, setPrepaymentLumpSum] = useState<number>(0);
  const [prepaymentLumpSumMonth, setPrepaymentLumpSumMonth] = useState<number>(12);

  // TDSR state
  const [showTdsr, setShowTdsr] = useState<boolean>(false);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(12000);
  const [otherMonthlyDebt, setOtherMonthlyDebt] = useState<number>(800);

  // Table view state
  const [tableMode, setTableMode] = useState<'yearly' | 'monthly'>('yearly');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Compute active benchmark rate
  const activeBenchmarkRate = useMemo(() => {
    switch (selectedBenchmark) {
      case '1M_COMPOUNDED':
        return latestRecord.sora_compound_1m ?? 3.0945;
      case '3M_COMPOUNDED':
        return latestRecord.sora_compound_3m ?? 3.1420;
      case '6M_COMPOUNDED':
        return latestRecord.sora_compound_6m ?? 3.2110;
      case 'DAILY_COMPOUNDED':
        return latestRecord.sora;
      case 'MANUAL':
      default:
        return manualBenchmarkRate;
    }
  }, [selectedBenchmark, latestRecord, manualBenchmarkRate]);

  // Compute Loan Schedule
  const loanInput: LoanInput = useMemo(() => ({
    propertyValue,
    loanAmount,
    tenureYears,
    benchmarkType: selectedBenchmark,
    manualBenchmarkRate,
    isTieredSpread,
    flatSpread,
    tieredSpread,
    monthlyIncome: showTdsr ? monthlyIncome : 0,
    otherMonthlyDebt: showTdsr ? otherMonthlyDebt : 0,
    propertyType,
    prepaymentMonthly: showPrepayment ? prepaymentMonthly : 0,
    prepaymentLumpSum: showPrepayment ? prepaymentLumpSum : 0,
    prepaymentLumpSumMonth: showPrepayment ? prepaymentLumpSumMonth : 12
  }), [
    propertyValue,
    loanAmount,
    tenureYears,
    selectedBenchmark,
    manualBenchmarkRate,
    isTieredSpread,
    flatSpread,
    tieredSpread,
    showTdsr,
    monthlyIncome,
    otherMonthlyDebt,
    propertyType,
    showPrepayment,
    prepaymentMonthly,
    prepaymentLumpSum,
    prepaymentLumpSumMonth
  ]);

  const results = useMemo(() => {
    return calculateLoanSchedule(loanInput, activeBenchmarkRate);
  }, [loanInput, activeBenchmarkRate]);

  // LTV (Loan to Value)
  const ltv = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0;

  // Aggregate yearly rows for clean view
  const yearlySchedule = useMemo(() => {
    const yearsMap = new Map<number, {
      year: number;
      totalPayment: number;
      principalPaid: number;
      interestPaid: number;
      endingBalance: number;
      applicableRate: number;
    }>();

    results.schedule.forEach(row => {
      const existing = yearsMap.get(row.year);
      if (!existing) {
        yearsMap.set(row.year, {
          year: row.year,
          totalPayment: row.payment,
          principalPaid: row.principal,
          interestPaid: row.interest,
          endingBalance: row.balance,
          applicableRate: row.applicableRate
        });
      } else {
        existing.totalPayment += row.payment;
        existing.principalPaid += row.principal;
        existing.interestPaid += row.interest;
        existing.endingBalance = row.balance;
        existing.applicableRate = row.applicableRate;
      }
    });

    return Array.from(yearsMap.values());
  }, [results.schedule]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Month',
      'Year',
      'Payment (SGD)',
      'Principal (SGD)',
      'Interest (SGD)',
      'Balance (SGD)',
      'All-In Rate (%)',
      'SORA Benchmark (%)',
      'Bank Margin (%)'
    ];

    const rows = results.schedule.map(r => [
      r.month,
      r.year,
      r.payment.toFixed(2),
      r.principal.toFixed(2),
      r.interest.toFixed(2),
      r.balance.toFixed(2),
      r.applicableRate.toFixed(4),
      r.soraBaseRate.toFixed(4),
      r.bankSpread.toFixed(4)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SORA_Loan_Amortization_S$${loanAmount}_${tenureYears}Y.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applyBankPreset = (preset: typeof SINGAPORE_BANK_PRESETS[0]) => {
    onSelectBenchmark(preset.benchmark);
    setIsTieredSpread(true);
    setTieredSpread({
      year1: preset.spreadYear1,
      year2: preset.spreadYear2,
      year3: preset.spreadYear3,
      thereafter: preset.spreadThereafter
    });
  };

  // Quick Amount presets
  const quickAmounts = [500000, 750000, 1000000, 1500000, 2000000];

  return (
    <div className="space-y-6">
      {/* Top Banner / Bank Quick Presets */}
      <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Building className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Singapore Bank SORA Packages
            </h3>
            <p className="text-xs text-slate-400">
              Apply realistic market packages from major local banks in 1 click
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {SINGAPORE_BANK_PRESETS.map((preset) => (
            <button
              key={preset.bank}
              onClick={() => applyBankPreset(preset)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition flex items-center space-x-1"
            >
              <span className="font-semibold text-white">{preset.bank}</span>
              <span className="text-slate-400">+{preset.spreadYear1}%</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-rose-400" />
                <h3 className="text-base font-bold text-white">Loan Parameters</h3>
              </div>
              <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                LTV: {ltv.toFixed(1)}%
              </span>
            </div>

            {/* Property Type */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Property Category
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['PRIVATE', 'HDB', 'COMMERCIAL'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setPropertyType(type);
                      if (type === 'HDB' && loanAmount > 1000000) {
                        setLoanAmount(600000);
                        setPropertyValue(800000);
                      }
                    }}
                    className={`py-2 rounded-lg font-medium border text-center transition ${
                      propertyType === type
                        ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type === 'PRIVATE' ? 'Private Residential' : type === 'HDB' ? 'HDB / EC' : 'Commercial'}
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Loan Amount (SGD)
                </label>
                <span className="text-xs font-mono font-bold text-rose-400">
                  {formatSGD(loanAmount)}
                </span>
              </div>
              <div className="relative mb-2">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm font-semibold">
                  S$
                </span>
                <input
                  type="number"
                  min="50000"
                  max="20000000"
                  step="10000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Math.max(10000, Number(e.target.value)))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Quick Loan Amount Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setLoanAmount(amt)}
                    className={`text-[11px] px-2 py-1 rounded-md font-mono transition ${
                      loanAmount === amt
                        ? 'bg-rose-600 text-white font-semibold'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Valuation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Estimated Property Value (SGD)
                </label>
                <span className="text-xs font-mono text-slate-400">
                  {formatSGD(propertyValue)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm font-semibold">
                  S$
                </span>
                <input
                  type="number"
                  min="50000"
                  step="10000"
                  value={propertyValue}
                  onChange={(e) => setPropertyValue(Math.max(10000, Number(e.target.value)))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Loan Tenure */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Loan Tenure
                </label>
                <span className="text-xs font-mono font-bold text-white">
                  {tenureYears} Years ({tenureYears * 12} Months)
                </span>
              </div>
              <input
                type="range"
                min="5"
                max={propertyType === 'HDB' ? 30 : 35}
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full accent-rose-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>5 yrs</span>
                <span>15 yrs</span>
                <span>25 yrs</span>
                <span>{propertyType === 'HDB' ? '30 yrs (Max HDB)' : '35 yrs (Max Pvt)'}</span>
              </div>
            </div>

            {/* SORA Benchmark Selection */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                SORA Benchmark Type
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectBenchmark('3M_COMPOUNDED')}
                  className={`p-2 rounded-lg border text-left transition ${
                    selectedBenchmark === '3M_COMPOUNDED'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold">3M Compounded SORA</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {formatPercent(latestRecord.sora_compound_3m ?? 3.1420)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectBenchmark('1M_COMPOUNDED')}
                  className={`p-2 rounded-lg border text-left transition ${
                    selectedBenchmark === '1M_COMPOUNDED'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold">1M Compounded SORA</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {formatPercent(latestRecord.sora_compound_1m ?? 3.0945)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectBenchmark('6M_COMPOUNDED')}
                  className={`p-2 rounded-lg border text-left transition ${
                    selectedBenchmark === '6M_COMPOUNDED'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold">6M Compounded SORA</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {formatPercent(latestRecord.sora_compound_6m ?? 3.2110)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectBenchmark('MANUAL')}
                  className={`p-2 rounded-lg border text-left transition ${
                    selectedBenchmark === 'MANUAL'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold">Custom / Manual SORA</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Enter any %
                  </div>
                </button>
              </div>

              {selectedBenchmark === 'MANUAL' && (
                <div className="mt-2">
                  <label className="text-xs text-slate-400 block mb-1">
                    Custom Base SORA Rate (% p.a.)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="15"
                      value={manualBenchmarkRate}
                      onChange={(e) => setManualBenchmarkRate(Number(e.target.value))}
                      className="w-full pr-8 pl-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bank Spread / Margin Configuration */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Bank Margin / Spread
                </label>
                <div className="flex items-center space-x-2 text-xs">
                  <span className={!isTieredSpread ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                    Flat
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsTieredSpread(!isTieredSpread)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      isTieredSpread ? 'bg-rose-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                        isTieredSpread ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={isTieredSpread ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                    Multi-Year Tiered
                  </span>
                </div>
              </div>

              {!isTieredSpread ? (
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Flat Spread (% p.a.)</span>
                    <span className="font-mono text-white">+{flatSpread.toFixed(2)}%</span>
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="5"
                    value={flatSpread}
                    onChange={(e) => setFlatSpread(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Year 1</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.05"
                        value={tieredSpread.year1}
                        onChange={(e) => setTieredSpread({ ...tieredSpread, year1: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Year 2</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.05"
                        value={tieredSpread.year2}
                        onChange={(e) => setTieredSpread({ ...tieredSpread, year2: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Year 3</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.05"
                        value={tieredSpread.year3}
                        onChange={(e) => setTieredSpread({ ...tieredSpread, year3: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Thereafter</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.05"
                        value={tieredSpread.thereafter}
                        onChange={(e) => setTieredSpread({ ...tieredSpread, thereafter: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible: Prepayment Simulator */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPrepayment(!showPrepayment)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white"
              >
                <div className="flex items-center space-x-1.5">
                  <PiggyBank className="w-4 h-4 text-emerald-400" />
                  <span>Early Prepayment & Payoff Optimizer</span>
                </div>
                {showPrepayment ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showPrepayment && (
                <div className="mt-3 space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Extra Monthly Principal Repayment (SGD)
                    </label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={prepaymentMonthly}
                      onChange={(e) => setPrepaymentMonthly(Math.max(0, Number(e.target.value)))}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        One-Time Lump Sum (SGD)
                      </label>
                      <input
                        type="number"
                        step="5000"
                        min="0"
                        value={prepaymentLumpSum}
                        onChange={(e) => setPrepaymentLumpSum(Math.max(0, Number(e.target.value)))}
                        placeholder="e.g. 50000"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Pay At Month
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="360"
                        value={prepaymentLumpSumMonth}
                        onChange={(e) => setPrepaymentLumpSumMonth(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  {(results.interestSavedWithPrepayment > 0 || results.timeSavedMonths > 0) && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs space-y-1">
                      <div className="font-semibold flex items-center">
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        Prepayment Savings Benefit:
                      </div>
                      <div className="flex justify-between">
                        <span>Interest Saved:</span>
                        <span className="font-mono font-bold">{formatSGD(results.interestSavedWithPrepayment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tenure Shortened by:</span>
                        <span className="font-mono font-bold">
                          {Math.floor(results.timeSavedMonths / 12)} yrs {results.timeSavedMonths % 12} mos
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible: MAS TDSR & Stress Test Assessment */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTdsr(!showTdsr)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white"
              >
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  <span>MAS TDSR & Stress Test (4.00% benchmark)</span>
                </div>
                {showTdsr ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showTdsr && (
                <div className="mt-3 space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Gross Monthly Income (SGD)
                      </label>
                      <input
                        type="number"
                        step="500"
                        min="1000"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Other Monthly Debts (SGD)
                      </label>
                      <input
                        type="number"
                        step="100"
                        min="0"
                        value={otherMonthlyDebt}
                        onChange={(e) => setOtherMonthlyDebt(Math.max(0, Number(e.target.value)))}
                        placeholder="Car loan, cards"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  {results.tdsr.stressTdsrRatio !== null && (
                    <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      results.tdsr.passedTdsr
                        ? 'bg-blue-950/40 border-blue-800/60 text-blue-200'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                    }`}>
                      <div className="flex items-center justify-between font-semibold">
                        <span>MAS TDSR Assessment:</span>
                        <span className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                          results.tdsr.passedTdsr ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {results.tdsr.passedTdsr ? 'ELIGIBLE (PASSED)' : 'EXCEEDS 55% CAP'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Stress Test Installment (@ {MAS_STRESS_TEST_RATE}%):</span>
                        <span className="font-mono font-bold">{formatSGD(results.tdsr.stressMonthlyPayment)}/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Calculated Stress TDSR Ratio:</span>
                        <span className="font-mono font-bold">{results.tdsr.stressTdsrRatio.toFixed(1)}% (Cap 55%)</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800/50">
                        <span className="text-slate-400">Min. Income Required:</span>
                        <span className="font-mono font-bold text-white">{formatSGD(results.tdsr.minIncomeRequiredStress)}/mo</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Output: KPI Cards, Charts, & Amortization Table (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top 3 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Monthly Payment */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
              <div className="text-xs font-semibold text-slate-400 mb-1">
                Estimated Monthly Payment
              </div>
              <div className="text-2xl font-black font-mono text-white tracking-tight">
                {formatSGD(results.monthlyPaymentFirstYear)}
                <span className="text-xs font-normal text-slate-400"> /mo</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Year 1 All-In Rate:</span>
                <span className="font-mono font-semibold text-rose-400">
                  {formatPercent(results.allInRateFirstYear, 3)}
                </span>
              </div>
              {isTieredSpread && (
                <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                  <span>Thereafter (@ {formatPercent(results.allInRateThereafter, 2)}):</span>
                  <span className="font-mono text-slate-200">
                    {formatSGD(results.monthlyPaymentThereafter)}/mo
                  </span>
                </div>
              )}
            </div>

            {/* Card 2: Total Interest */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
              <div className="text-xs font-semibold text-slate-400 mb-1">
                Total Interest Payable
              </div>
              <div className="text-2xl font-black font-mono text-amber-300 tracking-tight">
                {formatSGD(results.totalInterestPaid)}
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Interest vs Loan Ratio:</span>
                <span className="font-mono font-semibold text-amber-400">
                  {((results.totalInterestPaid / loanAmount) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                <span>Total Principal:</span>
                <span className="font-mono text-slate-200">{formatSGD(loanAmount)}</span>
              </div>
            </div>

            {/* Card 3: Total Cost of Loan */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
              <div className="text-xs font-semibold text-slate-400 mb-1">
                Total Loan Cost (P + I)
              </div>
              <div className="text-2xl font-black font-mono text-emerald-300 tracking-tight">
                {formatSGD(results.totalCostOfLoan)}
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Tenure Duration:</span>
                <span className="font-mono font-semibold text-white">
                  {results.payoffMonths} Months
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                <span>MAS SORA Base:</span>
                <span className="font-mono text-slate-200">{formatPercent(activeBenchmarkRate, 4)}</span>
              </div>
            </div>
          </div>

          {/* Visual Loan Balance Composition Bar */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm mr-1.5"></span>
                Principal Loan ({((loanAmount / results.totalCostOfLoan) * 100).toFixed(0)}%)
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm mr-1.5"></span>
                Interest Payment ({((results.totalInterestPaid / results.totalCostOfLoan) * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${(loanAmount / results.totalCostOfLoan) * 100}%` }}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${(results.totalInterestPaid / results.totalCostOfLoan) * 100}%` }}
              />
            </div>
          </div>

          {/* Amortization Schedule Table */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-rose-400" />
                <h4 className="text-sm font-bold text-white">
                  Amortization Repayment Schedule
                </h4>
              </div>

              <div className="flex items-center space-x-2">
                {/* Mode Selector */}
                <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => { setTableMode('yearly'); setCurrentPage(1); }}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      tableMode === 'yearly' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Annual Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTableMode('monthly'); setCurrentPage(1); }}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      tableMode === 'monthly' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Monthly Detail
                  </button>
                </div>

                {/* CSV Download */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  title="Export Amortization Schedule to CSV"
                >
                  <Download className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">
                      {tableMode === 'yearly' ? 'Year' : 'Month'}
                    </th>
                    <th className="py-2.5 px-3">
                      {tableMode === 'yearly' ? 'Annual Payment' : 'Payment'}
                    </th>
                    <th className="py-2.5 px-3">Principal</th>
                    <th className="py-2.5 px-3">Interest</th>
                    <th className="py-2.5 px-3">Ending Balance</th>
                    <th className="py-2.5 px-3 text-right">Applicable Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {tableMode === 'yearly' ? (
                    yearlySchedule.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 font-bold text-white">Year {row.year}</td>
                        <td className="py-2 px-3 text-slate-200">{formatSGD(row.totalPayment)}</td>
                        <td className="py-2 px-3 text-blue-300">{formatSGD(row.principalPaid)}</td>
                        <td className="py-2 px-3 text-amber-300">{formatSGD(row.interestPaid)}</td>
                        <td className="py-2 px-3 text-slate-300 font-semibold">{formatSGD(row.endingBalance)}</td>
                        <td className="py-2 px-3 text-right text-rose-400">{formatPercent(row.applicableRate, 2)}</td>
                      </tr>
                    ))
                  ) : (
                    results.schedule
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((row) => (
                        <tr key={row.month} className="hover:bg-slate-800/40 transition">
                          <td className="py-2 px-3 font-semibold text-white">
                            M{row.month} <span className="text-[10px] text-slate-500 font-normal">(Y{row.year})</span>
                          </td>
                          <td className="py-2 px-3 text-slate-200">{formatSGD(row.payment)}</td>
                          <td className="py-2 px-3 text-blue-300">{formatSGD(row.principal)}</td>
                          <td className="py-2 px-3 text-amber-300">{formatSGD(row.interest)}</td>
                          <td className="py-2 px-3 text-slate-300 font-semibold">{formatSGD(row.balance)}</td>
                          <td className="py-2 px-3 text-right text-rose-400">{formatPercent(row.applicableRate, 2)}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Monthly mode */}
            {tableMode === 'monthly' && (
              <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing months {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, results.schedule.length)} of {results.schedule.length}
                </span>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
                  >
                    Prev
                  </button>
                  <span className="px-2 py-1 text-slate-400 font-mono">
                    {currentPage} / {Math.ceil(results.schedule.length / itemsPerPage)}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= Math.ceil(results.schedule.length / itemsPerPage)}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
