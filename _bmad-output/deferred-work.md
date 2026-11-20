# Deferred work

## Deferred from: code review (2026-11-20)

Unverified (maybe-false) claims from the review of src/, package.json, tsconfig.json, vite.config.ts, svelte.config.js, index.html, .gitignore and .github/workflows/deploy.yml. Each would be medium or high if true; each needs the noted check before it is promoted.

- Scale 2 PAYG coefficients may be discontinuous at $500/week for 2026-27 and 2027-28 (src/lib/taxEngine.ts). Settle: evaluate calculatePeriodPAYG at 499.99 and 500.00 for both years.
- PAYG may annualise over 52 weeks regardless of workingWeeks, overstating withholding for part-year workers (src/lib/taxEngine.ts). Settle: read the periods value passed into calculatePeriodPAYG for part-year input.
- MultiPeriodTable and ComparisonTable may not reconcile; salary sacrifice has no row and ComparisonTable omits the lease pre-tax deduction (src/components/MultiPeriodTable.svelte, src/components/ComparisonTable.svelte). Settle: reconcile row sums against calculatePayroll for a sacrifice + lease input.
- Pre-tax claims above taxable income may add reimbursement to net pay without a sacrificed salary (src/lib/taxEngine.ts, approx. lines 422-435). Settle: trace fundedExGst for claims above stdTaxable.
- Negative leave reserve may raise take-home (src/lib/taxEngine.ts:360). Settle: check whether the current code already clamps the value.
- Lease GST cost may be counted in the benefit while take-home never pays it (src/lib/taxEngine.ts, approx. lines 410-437). Settle: compare totalBenefitGotBack with clmNetPay for a lease input.
- ICE lease with zero vehicle base value may treat the whole lease as pre-tax (src/lib/taxEngine.ts, approx. line 415). Settle: read the ECM branch.
- Malformed numeric share-link or stored fields may produce NaN totals (src/App.svelte, approx. lines 73-121). Settle: check every load field goes through the num() guard.
