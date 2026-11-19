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
  import CarLeasePanel from './components/CarLeasePanel.svelte';
  import MultiPeriodTable from './components/MultiPeriodTable.svelte';
  import ComparisonTable from './components/ComparisonTable.svelte';
  import Visualizations from './components/Visualizations.svelte';

  const STORAGE_KEY = 'paycalculator-au-state-v1';

  const DEFAULT_EXPENSE_ITEMS: ExpenseItem[] = [
    { id: 1, name: 'Portable Hardware', amount: 1372.0 },
    { id: 2, name: 'Business Expenses', amount: 176.55 }
  ];

  function loadSavedState(): Record<string, unknown> {
    try {
      if (typeof localStorage === 'undefined') return {};
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  const saved = loadSavedState();

  let payCycle = $state<PayCycle>((saved.payCycle as PayCycle) ?? 'weekly');
  let unitType = $state<UnitType>((saved.unitType as UnitType) ?? 'hourly');
  let unitsWorked = $state<number>((saved.unitsWorked as number) ?? 0);
  let unitRate = $state<number>((saved.unitRate as number) ?? 0);
  let superMode = $state<SuperMode>((saved.superMode as SuperMode) ?? 'inclusive');
  let superRate = $state<number>((saved.superRate as number) ?? 0);
  let leaveReserve = $state<number>((saved.leaveReserve as number) ?? 0);
  let leavePayout = $state<number>((saved.leavePayout as number) ?? 0);
  let adminFeeMode = $state<AdminFeeMode>((saved.adminFeeMode as AdminFeeMode) ?? 'percent');
  let adminFeeInput = $state<number>((saved.adminFeeInput as number) ?? 0);
  let paygMode = $state<PaygMode>((saved.paygMode as PaygMode) ?? 'ato_post_deductions');
  let customTaxMode = $state<CustomTaxMode>((saved.customTaxMode as CustomTaxMode) ?? 'dollar');
  let customPaygVal = $state<number>((saved.customPaygVal as number) ?? 284.0);
  let taxYear = $state<TaxYear>((saved.taxYear as TaxYear) ?? '2026-27');
  let residency = $state<ResidencyStatus>((saved.residency as ResidencyStatus) ?? 'resident_tft');
  let hasHecs = $state<boolean>((saved.hasHecs as boolean) ?? false);
  let applyLito = $state<boolean>((saved.applyLito as boolean) ?? true);
  let applyMedicare = $state<boolean>((saved.applyMedicare as boolean) ?? true);
  let hasPrivateHealth = $state<boolean>((saved.hasPrivateHealth as boolean) ?? false);

  let expenseItems = $state<ExpenseItem[]>(
    Array.isArray(saved.expenseItems) ? (saved.expenseItems as ExpenseItem[]) : []
  );
  let nextExpenseId = Math.max(0, ...expenseItems.map((i) => i.id)) + 1;
  let carLeaseEnabled = $state<boolean>((saved.carLeaseEnabled as boolean) ?? false);
  let carLeaseType = $state<'ev' | 'ice'>((saved.carLeaseType as 'ev' | 'ice') ?? 'ev');
  let carLeasePerPeriod = $state<number>((saved.carLeasePerPeriod as number) ?? 0);
  let carBaseValue = $state<number>((saved.carBaseValue as number) ?? 0);

  $effect(() => {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          payCycle,
          unitType,
          unitsWorked,
          unitRate,
          superMode,
          superRate,
          leaveReserve,
          leavePayout,
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
          expenseItems,
          carLeaseEnabled,
          carLeaseType,
          carLeasePerPeriod,
          carBaseValue
        })
      );
    } catch {
      // Ignore storage quota or serialization errors
    }
  });

  let result = $derived(
    calculatePayroll({
      payCycle,
      unitType,
      unitsWorked,
      unitRate,
      superMode,
      superRate,
      leaveReserve,
      leavePayout,
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
      expenseItems,
      carLeaseEnabled,
      carLeaseType,
      carLeasePerPeriod,
      carBaseValue
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
      w: fn(currentPeriods / 52),
      f: fn(currentPeriods / 26),
      m: fn(currentPeriods / 12),
      a: fn(currentPeriods)
    });

    const superRow =
      superMode === 'exclusive'
        ? { name: 'Super Guarantee (+)', ...scale((p) => superVal * p), color: 'text-zinc-600', rowClass: '' }
        : { name: 'Super Guarantee', ...scale((p) => -superVal * p), color: 'text-rose-600', rowClass: '' };

    const section = (name: string) => ({
      name,
      w: 0,
      f: 0,
      m: 0,
      a: 0,
      color: '',
      rowClass: '',
      isSection: true
    });

    return [
      section('Gross & Package'),
      { name: 'Base Gross Earnings', ...scale((p) => baseGross * p), color: '', rowClass: '' },
      superRow,
      ...(leavePayout > 0
        ? [{ name: 'Leave Payout (+)', ...scale((p) => leavePayout * p), color: 'text-[#0F4C3A]', rowClass: '' }]
        : []),
      section('Pre-Tax Deductions'),
      { name: 'Reserved Leave', ...scale((p) => -leave * p), color: 'text-rose-600', rowClass: '' },
      { name: 'Admin Fee', ...scale((p) => -admin * p), color: 'text-rose-600', rowClass: '' },
      { name: 'Pre-Tax Expenses (Ex-GST)', ...scale((p) => -exGst * p), color: 'text-amber-700 font-semibold', rowClass: '' },
      ...(carLeaseEnabled || result.carLeasePreTax > 0
        ? [
            {
              name: 'Novated Lease (Pre-Tax)',
              ...scale((p) => -result.carLeasePreTax * p),
              color: 'text-amber-700 font-semibold',
              rowClass: ''
            }
          ]
        : []),
      section('Tax & Net'),
      { name: 'Taxable Income', ...scale((p) => taxable * p), color: '', rowClass: 'font-bold bg-zinc-50 text-zinc-900' },
      { name: 'PAYG Tax Withheld', ...scale((p) => -periodTax * p), color: 'text-rose-600', rowClass: '' },
      section('Tax-Free Reimbursements'),
      { name: 'Expense Reimbursements', ...scale((p) => incGst * p), color: 'text-[#0F4C3A] font-semibold', rowClass: '' },
      ...(carLeaseEnabled || result.carLeasePostTax > 0
        ? [
            {
              name: 'Novated Lease (Post-Tax ECM)',
              ...scale((p) => -result.carLeasePostTax * p),
              color: 'text-rose-600',
              rowClass: ''
            }
          ]
        : []),
      {
        name: 'Net Take-Home Pay',
        ...scale((p) => netPay * p),
        color: '',
        rowClass: 'font-extrabold bg-zinc-900 text-white border-t-2 border-zinc-900'
      }
    ];
  });

  let brackets = $derived(getTaxBrackets(residency, taxYear));

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

  interface SavedState {
    payCycle: PayCycle;
    unitType: UnitType;
    unitsWorked: number;
    unitRate: number;
    superMode: SuperMode;
    superRate: number;
    leaveReserve: number;
    leavePayout: number;
    adminFeeMode: AdminFeeMode;
    adminFeeInput: number;
    paygMode: PaygMode;
    customTaxMode: CustomTaxMode;
    customPaygVal: number;
    taxYear: TaxYear;
    residency: ResidencyStatus;
    hasHecs: boolean;
    applyLito: boolean;
    applyMedicare: boolean;
    hasPrivateHealth: boolean;
    expenseItems: ExpenseItem[];
    nextExpenseId: number;
    carLeaseEnabled: boolean;
    carLeaseType: 'ev' | 'ice';
    carLeasePerPeriod: number;
    carBaseValue: number;
  }

  let previousState = $state<SavedState | null>(null);
  let showUndoToast = $state(false);
  let undoTimer: ReturnType<typeof setTimeout> | undefined;

  function resetDefaults() {
    previousState = {
      payCycle,
      unitType,
      unitsWorked,
      unitRate,
      superMode,
      superRate,
      leaveReserve,
      leavePayout,
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
      expenseItems: expenseItems.map((item) => ({ ...item })),
      nextExpenseId,
      carLeaseEnabled,
      carLeaseType,
      carLeasePerPeriod,
      carBaseValue
    };

    payCycle = 'weekly';
    unitType = 'hourly';
    unitsWorked = 0;
    unitRate = 0;
    superMode = 'inclusive';
    superRate = 12.0;
    leaveReserve = 0;
    leavePayout = 0;
    adminFeeMode = 'percent';
    adminFeeInput = 0;
    paygMode = 'ato_post_deductions';
    customTaxMode = 'dollar';
    customPaygVal = 284.0;
    taxYear = '2026-27';
    residency = 'resident_tft';
    hasHecs = false;
    applyLito = true;
    applyMedicare = true;
    hasPrivateHealth = false;
    expenseItems = [];
    nextExpenseId = 1;
    carLeaseEnabled = false;
    carLeaseType = 'ev';
    carLeasePerPeriod = 0;
    carBaseValue = 0;

    showUndoToast = true;
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      showUndoToast = false;
    }, 8000);
  }

  function undoReset() {
    if (!previousState) return;
    payCycle = previousState.payCycle;
    unitType = previousState.unitType;
    unitsWorked = previousState.unitsWorked;
    unitRate = previousState.unitRate;
    superMode = previousState.superMode;
    superRate = previousState.superRate;
    leaveReserve = previousState.leaveReserve;
    leavePayout = previousState.leavePayout;
    adminFeeMode = previousState.adminFeeMode;
    adminFeeInput = previousState.adminFeeInput;
    paygMode = previousState.paygMode;
    customTaxMode = previousState.customTaxMode;
    customPaygVal = previousState.customPaygVal;
    taxYear = previousState.taxYear;
    residency = previousState.residency;
    hasHecs = previousState.hasHecs;
    applyLito = previousState.applyLito;
    applyMedicare = previousState.applyMedicare;
    hasPrivateHealth = previousState.hasPrivateHealth;
    expenseItems = previousState.expenseItems;
    nextExpenseId = previousState.nextExpenseId;
    carLeaseEnabled = previousState.carLeaseEnabled;
    carLeaseType = previousState.carLeaseType;
    carLeasePerPeriod = previousState.carLeasePerPeriod;
    carBaseValue = previousState.carBaseValue;
    previousState = null;
    showUndoToast = false;
    if (undoTimer) clearTimeout(undoTimer);
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
        bind:leavePayout
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

      <CarLeasePanel
        bind:carLeaseEnabled
        bind:carLeaseType
        bind:carLeasePerPeriod
        bind:carBaseValue
        carLeasePreTax={result.carLeasePreTax}
        carLeasePostTax={result.carLeasePostTax}
        carLeaseGstSaved={result.carLeaseGstSaved}
      />
    </div>

    <div class="lg:col-span-7 space-y-5">
      <MultiPeriodTable rows={multiPeriodRows} />

      <ComparisonTable
        {result}
        {cycleLabel}
        {unitsWorked}
        {unitType}
        {unitRate}
        {leaveReserve}
        {leavePayout}
        {superMode}
        {carLeaseEnabled}
      />

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

{#if showUndoToast}
  <div
    role="status"
    aria-live="polite"
    class="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-zinc-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg border border-zinc-700"
  >
    <span>Defaults restored</span>
    <span class="text-zinc-500">—</span>
    <button
      onclick={undoReset}
      class="font-bold text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
    >
      Undo
    </button>
    <button
      onclick={() => (showUndoToast = false)}
      aria-label="Dismiss notification"
      class="text-zinc-400 hover:text-white ml-1 cursor-pointer"
    >
      ×
    </button>
  </div>
{/if}
