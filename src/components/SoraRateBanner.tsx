import React from 'react';
import { SoraRateRecord, SoraBenchmarkType } from '../types/sora';
import { formatPercent } from '../utils/soraMath';
import { TrendingUp, Clock, Info, Check, Coins } from 'lucide-react';

interface SoraRateBannerProps {
  latestRecord: SoraRateRecord;
  selectedBenchmark: SoraBenchmarkType;
  onSelectBenchmark: (benchmark: SoraBenchmarkType) => void;
}

export const SoraRateBanner: React.FC<SoraRateBannerProps> = ({
  latestRecord,
  selectedBenchmark,
  onSelectBenchmark
}) => {
  const cards = [
    {
      type: '1M_COMPOUNDED' as SoraBenchmarkType,
      title: '1-Month Compounded SORA',
      subtitle: 'Most frequent reset (Monthly)',
      rate: latestRecord.sora_compound_1m ?? 3.0945,
      tag: 'Common for floating mortgages',
      recommended: false
    },
    {
      type: '3M_COMPOUNDED' as SoraBenchmarkType,
      title: '3-Month Compounded SORA',
      subtitle: 'Quarterly reset (Standard benchmark)',
      rate: latestRecord.sora_compound_3m ?? 3.1420,
      tag: 'Singapore Market Standard (DBS, OCBC, UOB)',
      recommended: true
    },
    {
      type: '6M_COMPOUNDED' as SoraBenchmarkType,
      title: '6-Month Compounded SORA',
      subtitle: 'Semi-annual reset',
      rate: latestRecord.sora_compound_6m ?? 3.2110,
      tag: 'Smoothest quarterly volatility',
      recommended: false
    },
    {
      type: 'DAILY_COMPOUNDED' as SoraBenchmarkType,
      title: 'Latest Overnight SORA',
      subtitle: `Fixing Date: ${latestRecord.date}`,
      rate: latestRecord.sora,
      tag: latestRecord.aggregate_volume ? `Vol: S$ ${(latestRecord.aggregate_volume / 1000).toFixed(2)}B` : 'Daily publication',
      recommended: false
    }
  ];

  return (
    <div className="bg-slate-900/60 border-b border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center justify-center p-1 bg-rose-500/10 rounded text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-semibold text-slate-200">
              MAS Published SORA Benchmarks
            </h2>
            <span className="text-xs text-slate-400">
              (Effective as of {latestRecord.date})
            </span>
          </div>
          <div className="text-xs text-slate-400 flex items-center space-x-3">
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Published 9:00 AM SGT
            </span>
            {latestRecord.sora_index && (
              <span className="hidden md:inline-flex items-center text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                SORA Index: {latestRecord.sora_index.toFixed(5)}
              </span>
            )}
          </div>
        </div>

        {/* Benchmark Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((card) => {
            const isSelected = selectedBenchmark === card.type;
            return (
              <button
                key={card.type}
                onClick={() => onSelectBenchmark(card.type)}
                className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-rose-950/30 border-rose-500/80 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/50'
                    : 'bg-slate-800/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                {/* Active checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-rose-500 text-white p-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1 pr-5">
                    <span className="text-xs font-medium text-slate-300">
                      {card.title}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold font-mono text-white tracking-tight">
                      {formatPercent(card.rate, 4)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">p.a.</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 truncate mr-1">{card.subtitle}</span>
                  {card.recommended && (
                    <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap">
                      Popular
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
