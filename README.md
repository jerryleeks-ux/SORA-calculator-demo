# Singapore SORA Interest & Loan Calculator

A responsive, high-precision financial calculator built for the Singapore financial ecosystem, referencing Monetary Authority of Singapore (MAS) published overnight benchmark rates (SORA).

## Features

- **MAS Benchmark Rates Integration**: Connects to the official MAS Open Data API endpoint (`Domestic Interest Rates / SORA`) with real-time status and verified Actual/365 benchmark rates.
- **Singapore Mortgage & Loan Calculator**:
  - Configurable loan amounts, property values, and loan-to-value (LTV) ratios.
  - Multi-year tiered bank margins (Year 1, Year 2, Year 3, Thereafter).
  - Pre-loaded packages for major Singapore banks: DBS/POSB, OCBC, UOB, Standard Chartered, HSBC.
  - Full amortization schedule with principal, interest, remaining balance, and one-click CSV export.
  - **Early Prepayment Optimizer**: Computes exact interest saved and tenure shortened from lump sum or monthly prepayments.
  - **MAS TDSR & Stress Test**: Assesses affordability against the MAS 4.00% floor interest rate stress test and the 55% Total Debt Servicing Ratio (TDSR) regulatory cap.
- **MAS Daily Compounding Accrual Engine**:
  - Implements the official MAS / ABS Actual/365 compounding formula:
    $$\text{SORA}_{comp} = \left[ \prod_{i=1}^{d_b} \left( 1 + \frac{r_i \times n_i}{365} \right) - 1 \right] \times \frac{365}{d} \times 100\%$$
  - Accounts for weekend weighting ($n_i = 3$ for Friday fixings) and non-business days.
  - Audit trail ledger with daily accrued interest and CSV download.
- **Rate Trajectory & SVG Charts**: Visual comparison between daily overnight SORA and the 3-month compounded benchmark.
- **Rate Shock Simulator**: Stress-testing monthly budget impact across -100 bps to +100 bps rate shifts.
- **Fixed vs Floating SORA Break-Even Analysis**: Identifies the exact SORA rate threshold where fixed packages outcompete floating rates.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Lucide React

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## License

Apache-2.0
