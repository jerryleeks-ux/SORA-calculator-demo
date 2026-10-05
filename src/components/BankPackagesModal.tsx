import React from 'react';
import { X, Building2, Check, ArrowRight, Shield } from 'lucide-react';
import { SINGAPORE_BANK_PRESETS } from '../data/historicalSora';
import { SoraBenchmarkType } from '../types/sora';

interface BankPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPackage: (preset: typeof SINGAPORE_BANK_PRESETS[0]) => void;
}

export const BankPackagesModal: React.FC<BankPackagesModalProps> = ({
  isOpen,
  onClose,
  onSelectPackage
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Singapore Commercial Bank SORA Packages
              </h3>
              <p className="text-xs text-slate-400">
                Representative home loan packages across major Singapore lenders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Packages list */}
        <div className="py-4 space-y-3">
          {SINGAPORE_BANK_PRESETS.map((pkg) => (
            <div
              key={pkg.bank}
              className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-white">{pkg.bank}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {pkg.benchmark.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                    Lock-in: {pkg.lockIn}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  Year 1: +{pkg.spreadYear1.toFixed(2)}% | Year 2: +{pkg.spreadYear2.toFixed(2)}% | Year 3: +{pkg.spreadYear3.toFixed(2)}% | Thereafter: +{pkg.spreadThereafter.toFixed(2)}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Features: {pkg.features}
                </div>
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    onSelectPackage(pkg);
                    onClose();
                  }}
                  className="w-full md:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition active:scale-95"
                >
                  <span>Apply Package</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500">
          Note: Bank spreads and promotional terms are indicative Singapore market rates subject to credit approval and bank repricing schedules.
        </div>
      </div>
    </div>
  );
};
