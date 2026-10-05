import {
  LoanInput,
  LoanCalculationSummary,
  AmortizationScheduleRow,
  SoraRateRecord,
  PeriodCompoundingResult,
  DailyCompoundingRow
} from '../types/sora';

/**
 * Standard Singapore MAS Stress Test Interest Rate for Residential Mortgages.
 * MAS requires all financial institutions to compute TDSR using at least 4.00% p.a.
 */
export const MAS_STRESS_TEST_RATE = 4.00; // 4.00% p.a.
export const MAS_MAX_TDSR_PERCENT = 55; // 55% of monthly gross income
export const MAS_MAX_MSR_PERCENT = 30; // 30% for HDB / EC

/**
 * Format currency in Singapore Dollars (SGD)
 */
export function formatSGD(amount: number, showCents: boolean = false): string {
  if (isNaN(amount) || !isFinite(amount)) return 'S$ 0';
  return 'S$ ' + amount.toLocaleString('en-SG', {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0
  });
}

/**
 * Format percentage with specified precision (default 4 decimals for SORA, 2 for loans)
 */
export function formatPercent(rate: number, decimals: number = 4): string {
  if (isNaN(rate) || !isFinite(rate)) return '0.00%';
  return rate.toFixed(decimals) + '%';
}

/**
 * Computes monthly amortizing installment:
 * M = P * [ r*(1+r)^N ] / [ (1+r)^N - 1 ]
 * where r = annualRate / 12 / 100
 */
export function calculateMonthlyInstallment(
  principal: number,
  annualRatePct: number,
  tenureMonths: number
): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePct <= 0) return principal / tenureMonths;

  const monthlyRate = (annualRatePct / 100) / 12;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const payment = (principal * monthlyRate * factor) / (factor - 1);
  return isFinite(payment) ? payment : 0;
}

/**
 * Computes complete loan amortization schedule with support for:
 * - Multi-year tiered bank margins (Year 1, Year 2, Year 3, Thereafter)
 * - Monthly optional prepayments
 * - Lump-sum prepayment at specific month
 * - MAS Stress Test calculations
 */
export function calculateLoanSchedule(
  input: LoanInput,
  activeBenchmarkRate: number
): LoanCalculationSummary {
  const totalMonths = Math.max(1, Math.min(35 * 12, input.tenureYears * 12));
  let remainingBalance = input.loanAmount;

  // Determine applicable rates
  const getSpreadForMonth = (month: number): number => {
    if (!input.isTieredSpread) {
      return input.flatSpread;
    }
    const year = Math.ceil(month / 12);
    if (year === 1) return input.tieredSpread.year1;
    if (year === 2) return input.tieredSpread.year2;
    if (year === 3) return input.tieredSpread.year3;
    return input.tieredSpread.thereafter;
  };

  const schedule: AmortizationScheduleRow[] = [];
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let payoffMonth = totalMonths;

  // Baseline monthly payment without prepayments for Year 1 and Thereafter
  const y1AllIn = activeBenchmarkRate + (input.isTieredSpread ? input.tieredSpread.year1 : input.flatSpread);
  const thereafterAllIn = activeBenchmarkRate + (input.isTieredSpread ? input.tieredSpread.thereafter : input.flatSpread);

  const monthlyPaymentFirstYear = calculateMonthlyInstallment(input.loanAmount, y1AllIn, totalMonths);
  const monthlyPaymentThereafter = calculateMonthlyInstallment(input.loanAmount, thereafterAllIn, totalMonths);

  // Recalculating baseline total interest to compute savings from prepayment
  let baselineTotalInterest = 0;
  let tempBal = input.loanAmount;
  for (let m = 1; m <= totalMonths; m++) {
    const curSpread = getSpreadForMonth(m);
    const curAllIn = activeBenchmarkRate + curSpread;
    const monthlyRate = (curAllIn / 100) / 12;
    const interest = tempBal * monthlyRate;
    const payment = calculateMonthlyInstallment(tempBal, curAllIn, totalMonths - m + 1);
    const principalPaid = Math.min(tempBal, payment - interest);
    tempBal -= principalPaid;
    baselineTotalInterest += interest;
    if (tempBal <= 0.01) break;
  }

  // Generate actual schedule with prepayments
  for (let m = 1; m <= totalMonths; m++) {
    if (remainingBalance <= 0.01) {
      payoffMonth = m - 1;
      break;
    }

    const curSpread = getSpreadForMonth(m);
    const curAllIn = activeBenchmarkRate + curSpread;
    const monthlyRate = (curAllIn / 100) / 12;

    const interestForMonth = remainingBalance * monthlyRate;
    const monthsRemaining = totalMonths - m + 1;
    const basePayment = calculateMonthlyInstallment(remainingBalance, curAllIn, monthsRemaining);

    let principalPortion = basePayment - interestForMonth;
    let actualPayment = basePayment;

    // Apply monthly extra payment if any
    if (input.prepaymentMonthly && input.prepaymentMonthly > 0) {
      principalPortion += input.prepaymentMonthly;
      actualPayment += input.prepaymentMonthly;
    }

    // Apply lump sum prepayment if this month matches
    if (
      input.prepaymentLumpSum &&
      input.prepaymentLumpSum > 0 &&
      input.prepaymentLumpSumMonth === m
    ) {
      principalPortion += input.prepaymentLumpSum;
      actualPayment += input.prepaymentLumpSum;
    }

    // Cap principal payment to remaining balance
    if (principalPortion > remainingBalance) {
      principalPortion = remainingBalance;
      actualPayment = interestForMonth + principalPortion;
      remainingBalance = 0;
    } else {
      remainingBalance -= principalPortion;
    }

    totalInterestPaid += interestForMonth;
    totalPrincipalPaid += principalPortion;

    schedule.push({
      month: m,
      year: Math.ceil(m / 12),
      payment: actualPayment,
      principal: principalPortion,
      interest: interestForMonth,
      balance: Math.max(0, remainingBalance),
      applicableRate: curAllIn,
      soraBaseRate: activeBenchmarkRate,
      bankSpread: curSpread
    });

    if (remainingBalance <= 0.01) {
      payoffMonth = m;
      break;
    }
  }

  const interestSaved = Math.max(0, baselineTotalInterest - totalInterestPaid);
  const timeSavedMonths = Math.max(0, totalMonths - payoffMonth);

  // TDSR Calculations (MAS 4.00% benchmark)
  const stressMonthlyPayment = calculateMonthlyInstallment(input.loanAmount, MAS_STRESS_TEST_RATE, totalMonths);
  const monthlyIncome = input.monthlyIncome || 0;
  const otherDebt = input.otherMonthlyDebt || 0;

  let actualTdsrRatio: number | null = null;
  let stressTdsrRatio: number | null = null;
  let minIncomeRequiredActual = 0;
  let minIncomeRequiredStress = 0;
  let passedTdsr = true;

  if (monthlyIncome > 0) {
    actualTdsrRatio = ((monthlyPaymentFirstYear + otherDebt) / monthlyIncome) * 100;
    stressTdsrRatio = ((stressMonthlyPayment + otherDebt) / monthlyIncome) * 100;
    passedTdsr = stressTdsrRatio <= MAS_MAX_TDSR_PERCENT;
  }

  // Minimum income to keep TDSR <= 55%
  minIncomeRequiredActual = (monthlyPaymentFirstYear + otherDebt) / (MAS_MAX_TDSR_PERCENT / 100);
  minIncomeRequiredStress = (stressMonthlyPayment + otherDebt) / (MAS_MAX_TDSR_PERCENT / 100);

  return {
    monthlyPaymentFirstYear,
    monthlyPaymentThereafter,
    allInRateFirstYear: y1AllIn,
    allInRateThereafter: thereafterAllIn,
    totalInterestPaid,
    totalPrincipalPaid: input.loanAmount,
    totalCostOfLoan: input.loanAmount + totalInterestPaid,
    payoffMonths: payoffMonth,
    interestSavedWithPrepayment: interestSaved,
    timeSavedMonths,
    schedule,
    tdsr: {
      masStressTestRate: MAS_STRESS_TEST_RATE,
      stressMonthlyPayment,
      actualTdsrRatio,
      stressTdsrRatio,
      minIncomeRequiredActual,
      minIncomeRequiredStress,
      passedTdsr
    }
  };
}

/**
 * Calculates MAS-prescribed Compounded SORA for an explicit historical date window
 * Formula: [ Product_{i=1}^{d_b} (1 + (r_i * n_i) / 36500) - 1 ] * (365 / d) * 100
 */
export function calculateCompoundedSoraForPeriod(
  records: SoraRateRecord[],
  principal: number = 1000000,
  spreadPct: number = 0.70
): PeriodCompoundingResult {
  if (!records || records.length === 0) {
    return {
      startDate: '',
      endDate: '',
      totalCalendarDays: 0,
      totalBusinessDays: 0,
      annualizedCompoundedSora: 0,
      totalInterestAccrued: 0,
      principal,
      spreadRate: spreadPct,
      effectiveAllInRate: 0,
      rows: []
    };
  }

  // Sort chronological ascending
  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const rows: DailyCompoundingRow[] = [];

  let cumulativeProduct = 1.0;
  let cumulativeInterest = 0;
  let totalCalendarDays = 0;

  for (let i = 0; i < sorted.length; i++) {
    const rec = sorted[i];
    const currentDate = new Date(rec.date);
    const dayOfWeek = currentDate.getUTCDay(); // 0 = Sun, 5 = Fri

    // Determine weight n_i:
    // If Friday (5), covers Fri, Sat, Sun => 3 days (unless next record explicitly fills weekend)
    // Or if last record, estimate based on weekend
    let weightDays = 1;
    if (i < sorted.length - 1) {
      const nextDate = new Date(sorted[i + 1].date);
      const diffMs = nextDate.getTime() - currentDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      weightDays = Math.max(1, diffDays);
    } else {
      // Last record: if Friday, 3 days
      weightDays = (dayOfWeek === 5) ? 3 : 1;
    }

    totalCalendarDays += weightDays;

    // Daily factor: (1 + (r_i / 100) * n_i / 365)
    const rateDecimal = rec.sora / 100;
    const effectiveFactor = 1 + (rateDecimal * weightDays) / 365;
    cumulativeProduct *= effectiveFactor;

    // Daily interest on principal with spread
    const allInDecimal = (rec.sora + spreadPct) / 100;
    const dailyInterest = principal * (allInDecimal * (weightDays / 365));
    cumulativeInterest += dailyInterest;

    rows.push({
      date: rec.date,
      rate: rec.sora,
      weightDays,
      effectiveFactor,
      cumulativeProduct,
      dailyInterestOnPrincipal: dailyInterest,
      cumulativeInterest,
      isWeekendOrHoliday: weightDays > 1
    });
  }

  // Annualized Compounded SORA rate:
  // [ (Product - 1) * (365 / totalCalendarDays) ] * 100
  const annualizedCompoundedSora = totalCalendarDays > 0
    ? (cumulativeProduct - 1) * (365 / totalCalendarDays) * 100
    : 0;

  const effectiveAllInRate = annualizedCompoundedSora + spreadPct;

  return {
    startDate: sorted[0].date,
    endDate: sorted[sorted.length - 1].date,
    totalCalendarDays,
    totalBusinessDays: sorted.length,
    annualizedCompoundedSora,
    totalInterestAccrued: cumulativeInterest,
    principal,
    spreadRate: spreadPct,
    effectiveAllInRate,
    rows
  };
}
