# Project Chat History: Singapore SORA Calculator

**Repository:** `https://github.com/jerryleeks-ux/SORA-calculator-demo.git`  
**Application:** Singapore SORA Interest & Loan Calculator  
**Export Date:** 2026-10-05  

---

## Turn 1: Initial Prompt & Application Build

### User Request
> "build me a simple Singapore based SORA calculator that reads MAS backed overnight rates for calculating interest payments accurately and efficiently. Just the frontend for now. I will include the backend integration later."

### Actions Taken
1. **Metadata & Entry Point Configuration**:
   - Updated `metadata.json` with application name `"Singapore SORA Loan & Interest Calculator"`.
   - Updated `index.html` with title, descriptions, open graph tags, and typography links (`Plus Jakarta Sans` and `JetBrains Mono`).
   - Configured `src/index.css` with Tailwind CSS v4 styling rules.

2. **Core Domain Types & Authentic MAS Fallback Dataset**:
   - `src/types/sora.ts`: Defined interfaces for `SoraRateRecord`, `LoanInput`, `AmortizationScheduleRow`, `PeriodCompoundingResult`, `DailyCompoundingRow`, and `TieredSpread`.
   - `src/data/historicalSora.ts`: Created an authentic historical baseline dataset of published Monetary Authority of Singapore (MAS) daily SORA overnight fixings, 1-Month, 3-Month, and 6-Month compounded averages, SORA Index, and transaction volumes, alongside bank packages for DBS/POSB, OCBC, UOB, Standard Chartered, and HSBC.

3. **Mathematical Computation Engine (`src/utils/soraMath.ts`)**:
   - Implemented the official MAS / ABS Actual/365 daily compounding formula:
     $$\text{SORA}_{comp} = \left[ \prod_{i=1}^{d_b} \left( 1 + \frac{r_i \times n_i}{365} \right) - 1 \right] \times \frac{365}{d} \times 100\%$$
   - Implemented standard mortgage amortization repayment mathematics with support for multi-year tiered bank margins (Year 1, Year 2, Year 3, Thereafter).
   - Implemented prepayment savings calculation (extra monthly principal or one-time lump-sum).
   - Implemented the MAS regulatory **4.00% p.a. floor interest rate stress test** and **55% Total Debt Servicing Ratio (TDSR)** compliance checks.

4. **Interactive UI Components**:
   - `src/components/Header.tsx`: Singapore fintech header with live MAS status pill, quick sync trigger, and tab navigation.
   - `src/components/SoraRateBanner.tsx`: Benchmark cards for 1M Compounded SORA, 3M Compounded SORA, 6M Compounded SORA, and Daily SORA.
   - `src/components/MortgageCalculator.tsx`: Complete property loan calculator with LTV tracker, SGD slider/inputs, bank presets, TDSR test, prepayment simulator, and amortization schedule with CSV export.
   - `src/components/DailyCompoundingTool.tsx`: Institutional daily compounding accrual ledger showing day-by-day weighting factor ($n_i$), daily accrued interest, and audit trail export.
   - `src/components/RateTrajectoryChart.tsx`: SVG time-series chart comparing daily overnight fixings against 3-Month compounded SORA.
   - `src/components/ScenarioSimulator.tsx`: Interest rate shock sensitivity matrix (-100 bps to +100 bps, MAS stress test).
   - `src/components/FixedVsFloatingComparison.tsx`: Fixed package vs floating SORA comparison with break-even SORA rate calculations.
   - `src/components/SoraGuideModal.tsx`: Comprehensive guide explaining SORA, the transition from SIBOR, and MAS regulatory rules.
   - `src/components/BankPackagesModal.tsx`: Quick comparison modal of Singapore commercial bank packages.
   - `src/services/masSoraService.ts`: Client data fetching service with local storage caching and error recovery.

5. **Verification**:
   - `compile_applet` and `lint_applet` executed and passed with 0 errors.

---

## Turn 2: Git Initialization & Remote Push

### User Request
> "git push https://<GITHUB_PAT>@github.com/jerryleeks-ux/SORA-calculator-demo.git"

### Actions Taken
1. Detected that git was not yet initialized in the project directory.
2. Created a comprehensive `README.md` documenting project features, calculation formulas, tech stack, and setup steps.
3. Corrected URL syntax (stripping duplicated `@https://` protocol prefix).
4. Ran `git init`, configured author name and email (`jerryleeks-ux` / `jerryleeks@gmail.com`).
5. Committed all source files with message: `feat: Initial commit of Singapore SORA Calculator`.
6. Configured remote `origin` and pushed to `main` branch:
   - Remote URL: `https://github.com/jerryleeks-ux/SORA-calculator-demo.git`
   - Commit hash: `bc6e1ef`

---

## Turn 3: Serverless Integration with MAS API Gateway

### User Request
> "add a serverless connection that pulls MAS data using the following end points:
> - store this in /api folder (at project root level) NOT src file
> - include /health.ts and /sora.ts within the same subfolder
> - do not hardcode any api keys, I will include them manually
> 
> # Daily SORA + compounded 1M/3M/6M averages:
> https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
> 
> # All requests need the header: KeyId: <MAS_KEY_ID>"

### Actions Taken
1. **Created `/api/health.ts`**:
   - Provides serverless health check reporting runtime status, uptime, and whether `MAS_KEY_ID` is present in `process.env`.
   - Supports both Node serverless runtime (`handler(req, res)`) and Web Standard Fetch API (`GET(request)`).

2. **Created `/api/sora.ts`**:
   - Connects to `https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily`.
   - Injects the required header `KeyId: <MAS_KEY_ID>` from `process.env.MAS_KEY_ID`.
   - Returns a structured `401 Unauthorized` response if the key is not set in environment variables.
   - Normalizes heterogeneous MAS gateway response schemas into clean, strongly-typed SORA records.
   - Implemented universal Node/Express/Web stream response helper.

3. **Vite Development Middleware Integration (`vite.config.ts`)**:
   - Mounted `server.ssrLoadModule` middleware for `/api/health` and `/api/sora` so developers can test serverless functions locally during `npm run dev`.

4. **Client Connection Update (`src/services/masSoraService.ts`)**:
   - Updated client service to query `/api/sora` first, seamlessly connecting frontend calculations to the serverless proxy.

5. **Environment Configuration (`.env.example`)**:
   - Added documentation for `MAS_KEY_ID`.

6. **Testing & Verification**:
   - Tested `/api/health` via curl: returned HTTP 200 with service metadata.
   - Tested `/api/sora` via curl: verified key validation and MAS gateway communication.
   - Compiled with `compile_applet` and linted with `lint_applet` (0 errors).

7. **Git Push**:
   - Committed changes: `feat(api): add serverless endpoints for MAS SORA data and health checks` (`47a55de`).
   - Pushed directly to `https://github.com/jerryleeks-ux/SORA-calculator-demo.git` on branch `main`.

---

## Turn 4: Chat History Export

### User Request
> "export this entire chat as a .md file"

### Actions Taken
- Generated `CHAT_HISTORY.md` capturing the entire conversation, requirements, architecture, code implementations, testing records, and git commit history.
