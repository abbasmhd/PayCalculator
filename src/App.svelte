<script lang="ts">
  import {
    calculatePayroll,
    getTaxBrackets,
    PERIODS_PER_YEAR,
    type AdminFeeMode,
    type CustomTaxMode,
    type ExpenseItem,
    type PayCycle,
    type PaygMode,
    type ResidencyStatus,
    type SuperMode,
    type TaxYear,
    type UnitType
  } from './lib/taxEngine';
  import Header from './components/Header.svelte';
  import ControlBar from './components/ControlBar.svelte';
  import LedgerSummary from './components/LedgerSummary.svelte';
  import EarningsPanel from './components/EarningsPanel.svelte';
  import TaxParamsPanel from './components/TaxParamsPanel.svelte';
  import ExpensesPanel from './components/ExpensesPanel.svelte';
  import MultiPeriodTable from './components/MultiPeriodTable.svelte';
  import ComparisonTable from './components/ComparisonTable.svelte';
  import Visualizations from './components/Visualizations.svelte';

  let payCycle = $state<PayCycle>('weekly');
  let unitType = $state<UnitType>('hourly');
  let unitsWorked = $state<number>(40.0);
  let unitRate = $state<number>(124.61);
  let superMode = $state<SuperMode>('inclusive');
  let superRate = $state<number>(12.0);
  let leaveReserve = $state<number>(1500.0);
  let adminFeeMode = $state<AdminFeeMode>('percent');
  let adminFeeInput = $state<number>(1.75);
  let paygMode = $state<PaygMode>('ato_post_deductions');
  let customTaxMode = $state<CustomTaxMode>('dollar');
  let customPaygVal = $state<number>(284.0);
  let taxYear = $state<TaxYear>('2026-27');
  let residency = $state<ResidencyStatus>('resident_tft');
  let hasHecs = $state<boolean>(false);
  let applyLito = $state<boolean>(true);
  let applyMedicare = $state<boolean>(true);
  let hasPrivateHealth = $state<boolean>(false);

  let nextExpenseId = 3;
  let expenseItems = $state<ExpenseItem[]>([
    { id: 1, name: 'Portable Hardware', amount: 1372.0 },
    { id: 2, name: 'Business Expenses', amount: 176.55 }
  ]);

  let result = $derived(
    calculatePayroll({
      payCycle,
      unitType,
      unitsWorked,
      unitRate,
      superMode,
      superRate,
      leaveReserve,
      adminFeeMode,
      adminFeeInput,
      paygMode,
      customTaxMode,
      customPaygVal,
      taxYear,
      residency,
      hasHecs,
      applyLito,
      applyMedicare,
      hasPrivateHealth,
      expenseItems
    })
  );

  let cycleLabel = $derived(payCycle.replace('ly', ''));
  let currentPeriods = $derived(PERIODS_PER_YEAR[payCycle] || 52);

  let multiPeriodRows = $derived.by(() => {
    const baseGross = result.baseGross;
    const superVal = result.superAmount;
    const leave = leaveReserve;
    const admin = result.adminFee;
    const exGst = result.totalExGstClaimed;
    const incGst = result.totalIncGstPaid;
    const taxable = result.clmTaxable;
    const periodTax = result.clmPAYGTax;
    const netPay = result.clmNetPay;

    const scale = (fn: (p: number) => number) => ({
      w: fn(52 / currentPeriods),
      f: fn(26 / currentPeriods),
      m: fn(12 / currentPeriods),
      a: fn(1 / currentPeriods)
    });

    const superRow =
      superMode === 'exclusive'
        ? { name: 'Super Guarantee (+)', ...scale((p) => superVal * p), color: 'text-zinc-600', rowClass: '' }
        : { name: 'Super Guarantee', ...scale((p) => -superVal * p), color: 'text-rose-600', rowClass: '' };

    return [
      { name: 'Base Gross Earnings', ...scale((p) => baseGross * p), color: '', rowClass: '' },
      superRow,
      { name: 'Reserved Leave', ...scale((p) => -leave * p), color: 'text-rose-600', rowClass: '' },
      { name: 'Admin Fee', ...scale((p) => -admin * p), color: 'text-rose-600', rowClass: '' },
      { name: 'Pre-Tax Expenses (Ex-GST)', ...scale((p) => -exGst * p), color: 'text-amber-700 font-semibold', rowClass: '' },
      { name: 'Taxable Income', ...scale((p) => taxable * p), color: '', rowClass: 'font-bold bg-zinc-50 text-zinc-900' },
      { name: 'PAYG Tax Withheld', ...scale((p) => -periodTax * p), color: 'text-rose-600', rowClass: '' },
      { name: 'Expense Reimbursements', ...scale((p) => incGst * p), color: 'text-[#0F4C3A] font-semibold', rowClass: '' },
      {
        name: 'Net Take-Home Pay',
        ...scale((p) => netPay * p),
        color: '',
        rowClass: 'font-extrabold bg-zinc-900 text-white border-t-2 border-zinc-900'
      }
    ];
  });

  let brackets = $derived(getTaxBrackets(residency));

  let activeBracketRate = $derived.by(() => {
    const annual = result.annualTaxable;
    for (let i = 0; i < brackets.length; i++) {
      const prevMax = i === 0 ? 0 : brackets[i - 1].max;
      if (annual > prevMax && (annual <= brackets[i].max || i === brackets.length - 1)) {
        return brackets[i].rate;
      }
    }
    return 0;
  });

  function addExpenseRow() {
    expenseItems.push({ id: nextExpenseId++, name: 'New Expense Claim', amount: 100.0 });
  }

  function removeExpenseItem(id: number) {
    expenseItems = expenseItems.filter((x) => x.id !== id);
  }

  function resetDefaults() {
    payCycle = 'weekly';
    unitType = 'hourly';
    unitsWorked = 40.0;
    unitRate = 124.61;
    superMode = 'inclusive';
    superRate = 12.0;
    leaveReserve = 1500.0;
    adminFeeMode = 'percent';
    adminFeeInput = 1.75;
    paygMode = 'ato_post_deductions';
    customTaxMode = 'dollar';
    customPaygVal = 284.0;
    taxYear = '2026-27';
    residency = 'resident_tft';
    hasHecs = false;
    applyLito = true;
    applyMedicare = true;
    hasPrivateHealth = false;
    expenseItems = [
      { id: 1, name: 'Portable Hardware', amount: 1372.0 },
      { id: 2, name: 'Business Expenses', amount: 176.55 }
    ];
    nextExpenseId = 3;
  }
</script>

<Header bind:taxYear onReset={resetDefaults} />

<main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
  <ControlBar bind:payCycle bind:unitType />

  <LedgerSummary {result} {cycleLabel} {activeBracketRate} />

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div class="lg:col-span-5 space-y-5">
      <EarningsPanel
        {unitType}
        bind:unitsWorked
        bind:unitRate
        bind:superMode
        bind:superRate
        bind:leaveReserve
        bind:adminFeeMode
        bind:adminFeeInput
        baseGross={result.baseGross}
        superAmount={result.superAmount}
        adminFee={result.adminFee}
      />

      <TaxParamsPanel
        bind:paygMode
        bind:customTaxMode
        bind:customPaygVal
        bind:residency
        bind:hasHecs
        bind:applyLito
        bind:applyMedicare
        bind:hasPrivateHealth
      />

      <ExpensesPanel
        bind:expenseItems
        totalIncGstPaid={result.totalIncGstPaid}
        totalExGstClaimed={result.totalExGstClaimed}
        totalGstRefunded={result.totalGstRefunded}
        onAdd={addExpenseRow}
        onRemove={removeExpenseItem}
      />
    </div>

    <div class="lg:col-span-7 space-y-5">
      <MultiPeriodTable rows={multiPeriodRows} />

      <ComparisonTable {result} {cycleLabel} {unitsWorked} {unitType} {unitRate} {leaveReserve} {superMode} />

      <Visualizations
        clmNetPay={result.clmNetPay}
        clmPAYGTax={result.clmPAYGTax}
        superAmount={result.superAmount}
        feesAndLeave={leaveReserve + result.adminFee}
        totalIncGstPaid={result.totalIncGstPaid}
        totalExGstClaimed={result.totalExGstClaimed}
        annualTaxable={result.annualTaxable}
        {activeBracketRate}
        {brackets}
      />
    </div>
  </div>
</main>
