<script lang="ts">
  import {
    calculatePayroll,
    getConcessionalCap,
    getSuperGuaranteeRate,
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
  import YtdRefundPanel from './components/YtdRefundPanel.svelte';
  import ScenariosPanel, { type SavedScenario } from './components/ScenariosPanel.svelte';

  const STORAGE_KEY = 'paycalculator-au-state-v1';
  const SCENARIOS_STORAGE_KEY = 'paycalculator-au-scenarios-v1';

  function loadSavedState(): Record<string, unknown> {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get('s');
        if (encoded) {
          const json = decodeURIComponent(atob(encoded));
          const parsed: unknown = JSON.parse(json);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
          }
        }
      }
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

  // Saves written before superRateAuto existed carry no flag. Treat the stored SG rate as
  // "follows the tax year" only when it is missing, 0 (the old unset default) or exactly the
  // rate for its saved year, so a custom rate typed by the user is never overwritten.
  function legacySuperRateFollowsYear(rate: unknown, year: unknown): boolean {
    if (typeof rate !== 'number') return true;
    const taxYear = (typeof year === 'string' ? year : '2026-27') as TaxYear;
    return rate === 0 || rate === getSuperGuaranteeRate(taxYear);
  }

  const saved = loadSavedState();

  let payCycle = $state<PayCycle>((saved.payCycle as PayCycle) ?? 'weekly');
  let unitType = $state<UnitType>((saved.unitType as UnitType) ?? 'hourly');
  let unitsWorked = $state<number>((saved.unitsWorked as number) ?? 0);
  let unitRate = $state<number>((saved.unitRate as number) ?? 0);
  let superMode = $state<SuperMode>((saved.superMode as SuperMode) ?? 'inclusive');
  let superRate = $state<number>(
    (saved.superRate as number) ?? getSuperGuaranteeRate((saved.taxYear as TaxYear) ?? '2026-27')
  );
  // true = SG rate follows the selected tax year; becomes false once the user types their own rate
  let superRateAuto = $state<boolean>(
    (saved.superRateAuto as boolean) ?? legacySuperRateFollowsYear(saved.superRate, saved.taxYear)
  );
  let voluntarySuper = $state<number>((saved.voluntarySuper as number) ?? 0);
  let workingWeeks = $state<number>((saved.workingWeeks as number) ?? 52);
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
  function nextExpenseIdFor(items: ExpenseItem[]): number {
    return Math.max(0, ...items.map((i) => i.id)) + 1;
  }

  let nextExpenseId = nextExpenseIdFor(expenseItems);
  let carLeaseEnabled = $state<boolean>((saved.carLeaseEnabled as boolean) ?? false);
  let carLeaseType = $state<'ev' | 'ice'>((saved.carLeaseType as 'ev' | 'ice') ?? 'ev');
  let carLeasePerPeriod = $state<number>((saved.carLeasePerPeriod as number) ?? 0);
  let carBaseValue = $state<number>((saved.carBaseValue as number) ?? 0);

  // Keep the SG rate in step with the selected tax year, unless the user has entered their own rate
  $effect(() => {
    const yearRate = getSuperGuaranteeRate(taxYear);
    if (superRateAuto) superRate = yearRate;
  });

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
          superRateAuto,
          voluntarySuper,
          workingWeeks,
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
      voluntarySuper,
      workingWeeks,
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
      a: fn(result.effectivePeriods)
    });

    // One-off claims count once in the annual figure, matching annualNetPay in taxEngine.ts
    const annualReimbursements =
      result.oneOffIncGstPaid > 0 && result.effectivePeriods >= 1
        ? result.recurringIncGstPaid * (result.effectivePeriods - 1) + incGst
        : incGst * result.effectivePeriods;

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
      {
        name: 'Expense Reimbursements',
        ...scale((p) => incGst * p),
        a: annualReimbursements,
        color: 'text-[#0F4C3A] font-semibold',
        rowClass: ''
      },
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
        a: result.annualNetPay,
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
    expenseItems.push({ id: nextExpenseId++, name: 'New Expense Claim', amount: 100.0, recurring: true });
  }

  function addExpensePreset(name: string, amount: number, recurring: boolean) {
    expenseItems.push({ id: nextExpenseId++, name, amount, recurring });
  }

  const SCENARIO_SUMMARY_KEYS = [
    'clmNetPay',
    'annualNetPay',
    'totalSuperPerPeriod',
    'annualSuper',
    'paygTaxSaved',
    'totalBenefitGotBack'
  ] as const;

  // Lightweight shape check so malformed stored entries are skipped instead of breaking the Scenarios panel
  function isSavedScenario(value: unknown): value is SavedScenario {
    if (!value || typeof value !== 'object') return false;
    const sc = value as Record<string, unknown>;
    if (typeof sc.id !== 'string' || typeof sc.name !== 'string') return false;
    if (!sc.input || typeof sc.input !== 'object') return false;
    const input = sc.input as Record<string, unknown>;
    if (input.expenseItems !== undefined && !Array.isArray(input.expenseItems)) return false;
    if (!sc.summary || typeof sc.summary !== 'object') return false;
    const summary = sc.summary as Record<string, unknown>;
    return SCENARIO_SUMMARY_KEYS.every((key) => typeof summary[key] === 'number' && Number.isFinite(summary[key]));
  }

  function loadScenarios(): SavedScenario[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(SCENARIOS_STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isSavedScenario) : [];
    } catch {
      return [];
    }
  }

  let scenarios = $state<SavedScenario[]>(loadScenarios());
  let shareCopied = $state(false);

  $effect(() => {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
    } catch {
      // Ignore storage errors
    }
  });

  function getCurrentInput(): import('./lib/taxEngine').PayrollInput {
    return {
      payCycle,
      unitType,
      unitsWorked,
      unitRate,
      superMode,
      superRate,
      voluntarySuper,
      workingWeeks,
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
      expenseItems: expenseItems.map((i) => ({ ...i })),
      carLeaseEnabled,
      carLeaseType,
      carLeasePerPeriod,
      carBaseValue
    };
  }

  function saveScenario(name: string) {
    if (scenarios.length >= 3) return;
    const totalSuperPerPeriod = result.superAmount + result.voluntarySuper;
    const newScenario: SavedScenario = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      input: getCurrentInput(),
      summary: {
        clmNetPay: result.clmNetPay,
        annualNetPay: result.annualNetPay,
        totalSuperPerPeriod,
        annualSuper: totalSuperPerPeriod * result.effectivePeriods,
        paygTaxSaved: result.paygTaxSaved,
        totalBenefitGotBack: result.totalBenefitGotBack
      }
    };
    scenarios = [...scenarios, newScenario];
  }

  function loadScenario(sc: SavedScenario) {
    const inp = sc.input;
    payCycle = inp.payCycle;
    unitType = inp.unitType;
    unitsWorked = inp.unitsWorked;
    unitRate = inp.unitRate;
    superMode = inp.superMode;
    superRate = inp.superRate;
    superRateAuto = legacySuperRateFollowsYear(inp.superRate, inp.taxYear);
    voluntarySuper = inp.voluntarySuper ?? 0;
    workingWeeks = inp.workingWeeks ?? 52;
    leaveReserve = inp.leaveReserve;
    leavePayout = inp.leavePayout ?? 0;
    adminFeeMode = inp.adminFeeMode;
    adminFeeInput = inp.adminFeeInput;
    paygMode = inp.paygMode;
    customTaxMode = inp.customTaxMode;
    customPaygVal = inp.customPaygVal;
    taxYear = inp.taxYear;
    residency = inp.residency;
    hasHecs = inp.hasHecs;
    applyLito = inp.applyLito;
    applyMedicare = inp.applyMedicare;
    hasPrivateHealth = inp.hasPrivateHealth;
    const loadedItems = (inp.expenseItems || []).map((i) => ({ ...i }));
    expenseItems = loadedItems;
    nextExpenseId = nextExpenseIdFor(loadedItems);
    carLeaseEnabled = inp.carLeaseEnabled ?? false;
    carLeaseType = inp.carLeaseType ?? 'ev';
    carLeasePerPeriod = inp.carLeasePerPeriod ?? 0;
    carBaseValue = inp.carBaseValue ?? 0;
  }

  function deleteScenario(id: string) {
    scenarios = scenarios.filter((s) => s.id !== id);
  }

  function csvField(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    const lines: string[] = ['Pay Item,Weekly,Fortnightly,Monthly,Annual'];
    for (const row of multiPeriodRows) {
      if (row.isSection) {
        lines.push(`${csvField(row.name)},,,,`);
      } else {
        lines.push(
          `${csvField(row.name)},${row.w.toFixed(2)},${row.f.toFixed(2)},${row.m.toFixed(2)},${row.a.toFixed(2)}`
        );
      }
    }
    if (scenarios.length > 0) {
      lines.push('');
      lines.push('Saved Scenarios Comparison');
      lines.push('Name,Net Take-Home (Period),Net Take-Home (Annual),Super (Period),Annual Super,PAYG Tax Saved,Total Benefit');
      for (const sc of scenarios) {
        lines.push(
          `${csvField(sc.name)},${sc.summary.clmNetPay.toFixed(2)},${sc.summary.annualNetPay.toFixed(2)},${sc.summary.totalSuperPerPeriod.toFixed(2)},${sc.summary.annualSuper.toFixed(2)},${sc.summary.paygTaxSaved.toFixed(2)},${sc.summary.totalBenefitGotBack.toFixed(2)}`
        );
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paycalculator-${taxYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyShareLink() {
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify({ ...getCurrentInput(), superRateAuto })));
      const url = new URL(window.location.href);
      url.searchParams.set('s', encoded);
      await navigator.clipboard.writeText(url.toString());
      shareCopied = true;
      setTimeout(() => {
        shareCopied = false;
      }, 2000);
    } catch {
      // Ignore clipboard errors
    }
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
    superRateAuto: boolean;
    voluntarySuper: number;
    workingWeeks: number;
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
      superRateAuto,
      voluntarySuper,
      workingWeeks,
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
    superRate = getSuperGuaranteeRate('2026-27');
    superRateAuto = true;
    voluntarySuper = 0;
    workingWeeks = 52;
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
    superRateAuto = previousState.superRateAuto;
    voluntarySuper = previousState.voluntarySuper;
    workingWeeks = previousState.workingWeeks;
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

<Header
  bind:taxYear
  onReset={resetDefaults}
  onExportCsv={exportCsv}
  onCopyShareLink={copyShareLink}
  {shareCopied}
/>

<main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
  <ControlBar bind:payCycle bind:unitType bind:workingWeeks />

  <LedgerSummary {result} {cycleLabel} {activeBracketRate} />

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div class="lg:col-span-5 space-y-5">
      <EarningsPanel
        {unitType}
        bind:unitsWorked
        bind:unitRate
        bind:superMode
        bind:superRate
        bind:superRateAuto
        bind:voluntarySuper
        concessionalCap={getConcessionalCap(taxYear)}
        effectivePeriods={result.effectivePeriods}
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
        onAddPreset={addExpensePreset}
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

      <YtdRefundPanel
        {taxYear}
        {residency}
        {applyLito}
        {applyMedicare}
        {hasPrivateHealth}
      />

      <ScenariosPanel
        {scenarios}
        onSave={saveScenario}
        onLoad={loadScenario}
        onDelete={deleteScenario}
      />

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

  <footer class="pt-4 pb-2 text-center text-xs leading-relaxed text-zinc-500">
    <p>
      The calculations in this app are estimates for information only. They are not financial, tax, or legal advice. Tax rates and thresholds used in these calculations may be out of date. Verify all figures against official sources such as the <a
        href="https://www.ato.gov.au/"
        target="_blank"
        rel="noopener noreferrer"
        class="underline hover:text-zinc-700">Australian Taxation Office (ATO)</a> before making decisions.
    </p>
  </footer>
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
