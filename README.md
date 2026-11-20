# PayCalculator (AU)

PayCalculator is a single-page Svelte app for Australian contractors and employees who want to see how salary packaging (pre-tax expense claims, novated car leases, and reserved leave) changes their take-home pay. It calculates PAYG withholding using ATO Schedule 1 formulas or a custom withholding amount, and shows the resulting net pay across weekly, fortnightly, monthly, and annual periods.

## Features

- **Earnings input:** hourly or daily rate × units worked, pay frequency (weekly, fortnightly, monthly, annual), and working weeks (1–52).
- **Super:** super guarantee rate with inclusive or exclusive calculation, plus voluntary/salary-sacrificed super.
- **Leave and fees:** reserved leave, leave payout, and an admin fee (percent or dollar).
- **PAYG modes:** ATO Schedule 1 (after pre-tax expense deductions), ATO Schedule 1 (before expense claims), or a custom withholding amount in dollars or percent.
- **Residency:** resident with tax-free threshold, resident without tax-free threshold, foreign resident, and working holiday maker.
- **Tax years:** 2020–21 through 2027–28, using Stage 2 and Stage 3 rates.
- **Offsets and levies:** LITO, Medicare levy (2%), HECS/HELP repayment, and Medicare levy surcharge (in the YTD estimator).
- **Salary packaging expenses:** ex-GST claims marked as recurring or one-off, with preset options.
- **Novated car lease:** EV and ICE lease modes.
- **Results:** multi-period pay breakdown, side-by-side savings comparison, package and marginal tax bracket charts, and a YTD / end-of-year refund or bill estimator.
- **Saved scenarios:** save up to three scenarios and compare them.
- **Sharing and export:** copy a share link (inputs are encoded in the `s` query parameter) and export the breakdown as CSV.
- **State:** inputs are saved to `localStorage`; "Reset defaults" can be undone.

## Tech Stack

- [Svelte](https://svelte.dev/) 5 with [Vite](https://vite.dev/) 6
- TypeScript
- [Tailwind CSS](https://tailwindcss.com/) 4 (via `@tailwindcss/vite`)
- [Vitest](https://vitest.dev/) 3 for unit tests

## Getting Started

Requires Node.js 20 (the version used in CI).

```bash
npm install        # install dependencies
npm run dev        # start the Vite dev server
npm run build      # production build to dist/
npm run preview    # serve the production build locally
npm test           # run unit tests once (vitest run)
npm run test:watch # run tests in watch mode
npm run check      # TypeScript type check (tsc --noEmit)
```

## Project Structure

```
src/
├── App.svelte          # Main app: state, derived results, export/share logic
├── main.ts             # App entry point
├── app.css             # Global styles
├── components/         # UI panels (earnings, tax parameters, expenses, car lease, tables, charts, etc.)
└── lib/
    ├── taxEngine.ts       # Pay, PAYG, super, LITO, Medicare, HECS and refund calculations
    └── taxEngine.test.ts  # Unit tests for the tax engine
.github/workflows/deploy.yml  # GitHub Pages deployment workflow
vite.config.ts                # Vite config (base path: /PayCalculator/)
```

## Deployment

The workflow in `.github/workflows/deploy.yml` deploys to GitHub Pages:

1. Runs on a push to `master` or manually via `workflow_dispatch`.
2. **Build job** (`ubuntu-latest`, Node 20): checks out the repo, runs `npm ci`, runs `npm test && npm run build`, and uploads `dist/` as a Pages artifact.
3. **Deploy job:** publishes the artifact to the `github-pages` environment with `actions/deploy-pages`.

The Vite `base` is set to `/PayCalculator/`, so the built app expects to be served from that path.

## Disclaimer

The calculations in this app are estimates for information only. They are not financial, tax, or legal advice. Tax rates, thresholds, and formulas are hardcoded in `src/lib/taxEngine.ts` and may be out of date. Verify all figures against official sources such as the [Australian Taxation Office (ATO)](https://www.ato.gov.au/) before making decisions.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
