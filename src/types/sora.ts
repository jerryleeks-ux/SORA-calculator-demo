export interface SoraRateRecord {
  date: string; // YYYY-MM-DD
  sora: number; // Overnight rate % (e.g. 3.2500)
  sora_compound_1m?: number; // 1-month compounded SORA %
  sora_compound_3m?: number; // 3-month compounded SORA %
  sora_compound_6m?: number; // 6-month compounded SORA %
  sora_index?: number; // SORA Index
  aggregate_volume?: number; // In S$ Billions or Millions
  highest_transaction?: number;
  lowest_transaction?: number;
  percentile_10?: number;
  percentile_25?: number;
  percentile_75?: number;
  percentile_90?: number;
  calculation_method?: string;
}

export type SoraBenchmarkType = '1M_COMPOUNDED' | '3M_COMPOUNDED' | '6M_COMPOUNDED' | 'DAILY_COMPOUNDED' | 'MANUAL';

export interface TieredSpread {
  year1: number;
  year2: number;
  year3: number;
  thereafter: number;
}

export interface LoanInput {
  propertyValue: number;
  loanAmount: number;
  tenureYears: number;
  benchmarkType: SoraBenchmarkType;
  manualBenchmarkRate: number;
  isTieredSpread: boolean;
  flatSpread: number; // e.g. 0.70%
  tieredSpread: TieredSpread;
  monthlyIncome?: number; // for TDSR assessment
  otherMonthlyDebt?: number; // for TDSR assessment
  propertyType: 'HDB' | 'PRIVATE' | 'COMMERCIAL';
  prepaymentMonthly?: number; // optional extra monthly principal
  prepaymentLumpSum?: number; // optional lump sum
  prepaymentLumpSumMonth?: number; // month at which lump sum occurs
}

export interface AmortizationScheduleRow {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  applicableRate: number;
  soraBaseRate: number;
  bankSpread: number;
}

export interface LoanCalculationSummary {
  monthlyPaymentFirstYear: number;
  monthlyPaymentThereafter: number;
  allInRateFirstYear: number;
  allInRateThereafter: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  totalCostOfLoan: number;
  payoffMonths: number;
  interestSavedWithPrepayment: number;
  timeSavedMonths: number;
  schedule: AmortizationScheduleRow[];
  tdsr: {
    masStressTestRate: number; // 4.00%
    stressMonthlyPayment: number;
    actualTdsrRatio: number | null;
    stressTdsrRatio: number | null;
    minIncomeRequiredActual: number;
    minIncomeRequiredStress: number;
    passedTdsr: boolean;
  };
}

export interface DailyCompoundingRow {
  date: string;
  rate: number;
  weightDays: number; // n_i (1 for weekdays, 3 for Friday, etc.)
  effectiveFactor: number; // (1 + r * n / 365)
  cumulativeProduct: number;
  dailyInterestOnPrincipal: number;
  cumulativeInterest: number;
  isWeekendOrHoliday: boolean;
}

export interface PeriodCompoundingResult {
  startDate: string;
  endDate: string;
  totalCalendarDays: number;
  totalBusinessDays: number;
  annualizedCompoundedSora: number; // in %
  totalInterestAccrued: number;
  principal: number;
  spreadRate: number;
  effectiveAllInRate: number;
  rows: DailyCompoundingRow[];
}
