import React from 'react';
import { X, BookOpen, CheckCircle, ShieldCheck, Scale, AlertCircle, HelpCircle } from 'lucide-react';

interface SoraGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoraGuideModal: React.FC<SoraGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Singapore SORA & MAS Interest Guide
              </h3>
              <p className="text-xs text-slate-400">
                Understanding benchmark rates, compounding formulas, and mortgage regulations
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

        {/* Content sections */}
        <div className="space-y-6 py-4 text-xs sm:text-sm text-slate-300">
          {/* Section 1: What is SORA */}
          <div>
            <h4 className="font-bold text-white text-sm mb-1.5 flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
              1. What is SORA (Singapore Overnight Rate Average)?
            </h4>
            <p className="text-slate-400 leading-relaxed">
              SORA is the official benchmark interest rate for Singapore, administered and published by the <strong>Monetary Authority of Singapore (MAS)</strong>. It is computed as the volume-weighted average rate of unsecured overnight SGD interbank transactions brokered in Singapore between 8:00 AM and 6:15 PM SGT. MAS publishes the rate at 9:00 AM SGT on the following business day.
            </p>
          </div>

          {/* Section 2: Why SORA replaced SIBOR */}
          <div>
            <h4 className="font-bold text-white text-sm mb-1.5 flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
              2. Why did Singapore transition from SIBOR & SOR to SORA?
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Legacy benchmarks like SIBOR (Singapore Interbank Offered Rate) relied on bank quotes and estimates rather than actual transaction volumes, making them prone to manipulation. SORA is backed by hundreds of millions to billions in actual daily SGD transactions, making it robust, transparent, and aligned with global risk-free rate standards (like SOFR in the US and SONIA in the UK).
            </p>
          </div>

          {/* Section 3: 1M vs 3M vs 6M Compounded SORA */}
          <div>
            <h4 className="font-bold text-white text-sm mb-1.5 flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
              3. 1-Month vs 3-Month Compounded SORA
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="font-semibold text-rose-400 mb-1">1-Month Compounded SORA</div>
                <p className="text-slate-400 text-xs">
                  Resets every month. Reflects rate drops more quickly in an easing environment, but can also rise faster during monetary tightening.
                </p>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="font-semibold text-blue-400 mb-1">3-Month Compounded SORA</div>
                <p className="text-slate-400 text-xs">
                  Resets once per quarter. Most widely used package among DBS, OCBC, and UOB. Smooths out temporary market spikes.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Compounding formula & Actual/365 */}
          <div>
            <h4 className="font-bold text-white text-sm mb-1.5 flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
              4. MAS Daily Compounding Convention (Actual/365)
            </h4>
            <p className="text-slate-400 leading-relaxed mb-2">
              Interest on SGD financing is calculated based on an <strong>Actual/365</strong> money market convention. Under MAS guidelines, Friday’s published overnight SORA rate applies for 3 calendar days (Friday, Saturday, and Sunday) to ensure accurate daily accrual across non-business days.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-rose-300">
              SORA_comp = [ ∏ ( 1 + (r_i × n_i) / 36500 ) - 1 ] × (365 / d) × 100%
            </div>
          </div>

          {/* Section 5: TDSR & MAS 4.00% Stress Test */}
          <div>
            <h4 className="font-bold text-white text-sm mb-1.5 flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
              5. MAS Total Debt Servicing Ratio (TDSR) & 4.00% Stress Test
            </h4>
            <p className="text-slate-400 leading-relaxed">
              To ensure financial resilience, the Monetary Authority of Singapore mandates that all Singapore banks stress-test property mortgage applications using an interest rate floor of at least <strong>4.00% p.a.</strong>. Total debt repayments (including car loans, study loans, and cards) must not exceed <strong>55%</strong> of borrower gross monthly income.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition"
          >
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  );
};
