export type PayCycle = 'weekly' | 'fortnightly' | 'monthly' | 'annually';
export type UnitType = 'hourly' | 'daily';
export type SuperMode = 'inclusive' | 'exclusive';
export type AdminFeeMode = 'percent' | 'dollar';
export type PaygMode = 'ato_post_deductions' | 'ato_pre_expenses' | 'custom_override';
export type CustomTaxMode = 'dollar' | 'percent';
export type ResidencyStatus = 'resident_tft' | 'resident_no_tft' | 'foreign_resident' | 'whm';
export type TaxYear = '2026-27' | '2025-26';

export interface ExpenseItem {
  id: number;
  name: string;
  amount: number;
}

export interface PayrollInput {
  payCycle: PayCycle;
  unitType: UnitType;
  unitsWorked: number;
  unitRate: number;
  superMode: SuperMode;
  superRate: number;
  leaveReserve: number;
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
}

export interface PayrollResult {
  baseGross: number;
  superAmount: number;
  totalGrossTaxablePay: number;
  adminFee: number;
  stdTaxable: number;
  stdPAYGTax: number;
  stdNetPay: number;
  totalIncGstPaid: number;
  totalExGstClaimed: number;
  totalGstRefunded: number;
  clmTaxable: number;
  clmPAYGTax: number;
  clmNetPay: number;
  paygTaxSaved: number;
  totalBenefitGotBack: number;
  netOutofPocketCost: number;
  netPayDifference: number;
  annualNetPay: number;
  annualTaxable: number;
  effectiveTaxRate: number;
  savingsPct: number;
}

export const PERIODS_PER_YEAR: Record<PayCycle, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  annually: 1
};

export interface TaxBracket {
  name: string;
  max: number;
  rate: number;
}

export function getTaxBrackets(residency: ResidencyStatus): TaxBracket[] {
  if (residency === 'foreign_resident') {
    return [
      { name: '$0 – $135,000', max: 135000, rate: 30 },
      { name: '$135,001 – $190,000', max: 190000, rate: 37 },
      { name: '$190,001+', max: 300000, rate: 45 }
    ];
  }
  if (residency === 'whm') {
    return [
      { name: '$0 – $45,000', max: 45000, rate: 15 },
      { name: '$45,001 – $135,000', max: 135000, rate: 30 },
      { name: '$135,001 – $190,000', max: 190000, rate: 37 },
      { name: '$190,001+', max: 300000, rate: 45 }
    ];
  }
  if (residency === 'resident_no_tft') {
    return [
      { name: '$0 – $45,000', max: 45000, rate: 16 },
      { name: '$45,001 – $135,000', max: 135000, rate: 30 },
      { name: '$135,001 – $190,000', max: 190000, rate: 37 },
      { name: '$190,001+', max: 300000, rate: 45 }
    ];
  }
  return [
    { name: '$0 – $18,200', max: 18200, rate: 0 },
    { name: '$18,201 – $45,000', max: 45000, rate: 16 },
    { name: '$45,001 – $135,000', max: 135000, rate: 30 },
    { name: '$135,001 – $190,000', max: 190000, rate: 37 },
    { name: '$190,001+', max: 300000, rate: 45 }
  ];
}

export function getAnnualTax(
  taxableIncome: number,
  _taxYear: TaxYear,
  residency: ResidencyStatus,
  hasTft: boolean
): number {
  if (taxableIncome <= 0) return 0;

  if (residency === 'foreign_resident') {
    if (taxableIncome <= 135000) return taxableIncome * 0.30;
    if (taxableIncome <= 190000) return 40500 + (taxableIncome - 135000) * 0.37;
    return 60850 + (taxableIncome - 190000) * 0.45;
  }

  if (residency === 'whm') {
    if (taxableIncome <= 45000) return taxableIncome * 0.15;
    if (taxableIncome <= 135000) return 6750 + (taxableIncome - 45000) * 0.30;
    if (taxableIncome <= 190000) return 33750 + (taxableIncome - 135000) * 0.37;
    return 54100 + (taxableIncome - 190000) * 0.45;
  }

  if (!hasTft) {
    if (taxableIncome <= 45000) return taxableIncome * 0.16;
    if (taxableIncome <= 135000) return 7200 + (taxableIncome - 45000) * 0.30;
    if (taxableIncome <= 190000) return 34200 + (taxableIncome - 135000) * 0.37;
    return 54550 + (taxableIncome - 190000) * 0.45;
  }

  // Standard Australian Resident with Tax-Free Threshold (Stage 3)
  if (taxableIncome <= 18200) return 0;
  if (taxableIncome <= 45000) return (taxableIncome - 18200) * 0.16;
  if (taxableIncome <= 135000) return 4288 + (taxableIncome - 45000) * 0.30;
  if (taxableIncome <= 190000) return 31288 + (taxableIncome - 135000) * 0.37;
  return 51638 + (taxableIncome - 190000) * 0.45;
}

export function calculateLITO(taxableIncome: number): number {
  if (taxableIncome <= 37500) return 700;
  if (taxableIncome <= 45000) return Math.max(0, 700 - (taxableIncome - 37500) * 0.05);
  if (taxableIncome <= 66667) return Math.max(0, 325 - (taxableIncome - 45000) * 0.015);
  return 0;
}

export function calculateHECS(annualTaxable: number): number {
  if (annualTaxable < 54435) return 0;
  if (annualTaxable <= 62850) return annualTaxable * 0.01;
  if (annualTaxable <= 74000) return annualTaxable * 0.025;
  if (annualTaxable <= 88000) return annualTaxable * 0.04;
  if (annualTaxable <= 105000) return annualTaxable * 0.06;
  if (annualTaxable <= 140000) return annualTaxable * 0.08;
  return annualTaxable * 0.10;
}

export function calculatePeriodPAYG(
  periodTaxableIncome: number,
  input: Pick<
    PayrollInput,
    'payCycle' | 'residency' | 'taxYear' | 'applyLito' | 'applyMedicare' | 'hasHecs' | 'hasPrivateHealth'
  >
): number {
  if (periodTaxableIncome <= 0) return 0;
  const periods = PERIODS_PER_YEAR[input.payCycle] || 52;
  const annualTaxable = periodTaxableIncome * periods;

  const hasTft = input.residency === 'resident_tft';
  const applyLito = input.applyLito && hasTft;
  const applyMedicare = input.applyMedicare && input.residency.startsWith('resident');

  // ATO Schedule 1 Statement of Formulas (Scale 2: resident with TFT + Medicare levy, no MLS)
  if (hasTft && applyMedicare) {
    let weeklyEarnings = periodTaxableIncome;
    if (input.payCycle === 'fortnightly') {
      weeklyEarnings = periodTaxableIncome / 2;
    } else if (input.payCycle === 'monthly') {
      weeklyEarnings = (periodTaxableIncome * 3) / 13;
    } else if (input.payCycle === 'annually') {
      weeklyEarnings = periodTaxableIncome / 52;
    }

    const x = Math.floor(weeklyEarnings) + 0.99;
    let a = 0;
    let b = 0;

    if (x < 361) {
      a = 0;
      b = 0;
    } else if (x < 500) {
      a = 0.16;
      b = 57.8462;
    } else if (x < 625) {
      a = 0.26;
      b = 107.8462;
    } else if (x < 721) {
      a = 0.18;
      b = 57.8462;
    } else if (x < 865) {
      a = 0.189;
      b = 64.3365;
    } else if (x < 1282) {
      a = 0.3227;
      b = 180.0385;
    } else if (x < 2596) {
      a = 0.32;
      b = 176.5769;
    } else if (x < 3653) {
      a = 0.39;
      b = 358.3077;
    } else {
      a = 0.47;
      b = 650.6154;
    }

    const weeklyTax = Math.max(0, Math.round(a * x - b));
    let periodTax = weeklyTax;
    if (input.payCycle === 'fortnightly') {
      periodTax = weeklyTax * 2;
    } else if (input.payCycle === 'monthly') {
      periodTax = Math.round((weeklyTax * 13) / 3);
    } else if (input.payCycle === 'annually') {
      periodTax = weeklyTax * 52;
    }

    const hecsRepayment = input.hasHecs ? Math.round(calculateHECS(annualTaxable) / periods) : 0;
    return Math.max(0, periodTax + hecsRepayment);
  }

  let rawTax = getAnnualTax(annualTaxable, input.taxYear, input.residency, hasTft);
  if (applyLito) {
    rawTax = Math.max(0, rawTax - calculateLITO(annualTaxable));
  }

  const medicareLevy = applyMedicare ? annualTaxable * 0.02 : 0;
  const hecsRepayment = input.hasHecs ? calculateHECS(annualTaxable) : 0;

  const totalAnnualTax = rawTax + medicareLevy + hecsRepayment;
  return Math.round(totalAnnualTax / periods);
}

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const units = Math.max(0, input.unitsWorked || 0);
  const rate = Math.max(0, input.unitRate || 0);
  const superPct = Math.max(0, input.superRate || 0);
  const leaveReserve = input.leaveReserve || 0;
  const adminInput = Math.max(0, input.adminFeeInput || 0);

  const baseGross = units * rate;

  let superAmount = 0;
  let totalGrossTaxablePay = baseGross;
  if (input.superMode === 'inclusive') {
    const ote = baseGross / (1 + superPct / 100);
    superAmount = baseGross - ote;
    totalGrossTaxablePay = ote;
  } else {
    superAmount = baseGross * (superPct / 100);
  }

  const adminFee = input.adminFeeMode === 'percent' ? baseGross * (adminInput / 100) : adminInput;

  const stdTaxable = Math.max(0, totalGrossTaxablePay - leaveReserve - adminFee);
  const stdPAYGTax = calculatePeriodPAYG(stdTaxable, input);
  const stdNetPay = stdTaxable - stdPAYGTax;

  let totalIncGstPaid = 0;
  let totalExGstClaimed = 0;
  for (const item of input.expenseItems) {
    const amt = Math.max(0, item.amount || 0);
    totalIncGstPaid += amt;
    totalExGstClaimed += amt / 1.1;
  }
  const totalGstRefunded = totalIncGstPaid - totalExGstClaimed;

  const clmTaxable = Math.max(0, stdTaxable - totalExGstClaimed);

  let clmPAYGTax = 0;
  if (input.paygMode === 'ato_post_deductions') {
    clmPAYGTax = calculatePeriodPAYG(clmTaxable, input);
  } else if (input.paygMode === 'ato_pre_expenses') {
    clmPAYGTax = calculatePeriodPAYG(stdTaxable, input);
  } else {
    const customVal = Math.max(0, input.customPaygVal || 0);
    const rawCustomTax = input.customTaxMode === 'percent' ? clmTaxable * (customVal / 100) : customVal;
    clmPAYGTax = Math.min(clmTaxable, Math.max(0, rawCustomTax));
  }

  const clmNetPay = clmTaxable - clmPAYGTax + totalIncGstPaid;
  const paygTaxSaved = stdPAYGTax - clmPAYGTax;
  const totalBenefitGotBack = paygTaxSaved + totalGstRefunded;
  const netOutofPocketCost = Math.max(0, totalIncGstPaid - totalBenefitGotBack);
  const netPayDifference = clmNetPay - stdNetPay;

  const periods = PERIODS_PER_YEAR[input.payCycle] || 52;
  const annualNetPay = clmNetPay * periods;
  const annualTaxable = clmTaxable * periods;

  const effectiveTaxRate = annualTaxable > 0 ? ((clmPAYGTax * periods) / annualTaxable) * 100 : 0;
  const savingsPct = totalIncGstPaid > 0 ? (totalBenefitGotBack / totalIncGstPaid) * 100 : 0;

  return {
    baseGross,
    superAmount,
    totalGrossTaxablePay,
    adminFee,
    stdTaxable,
    stdPAYGTax,
    stdNetPay,
    totalIncGstPaid,
    totalExGstClaimed,
    totalGstRefunded,
    clmTaxable,
    clmPAYGTax,
    clmNetPay,
    paygTaxSaved,
    totalBenefitGotBack,
    netOutofPocketCost,
    netPayDifference,
    annualNetPay,
    annualTaxable,
    effectiveTaxRate,
    savingsPct
  };
}

export function formatAUD(val: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2
  }).format(val || 0);
}

export function formatSignedAUD(val: number): string {
  const v = val || 0;
  return (v < 0 ? '-' : '+') + formatAUD(Math.abs(v));
}
