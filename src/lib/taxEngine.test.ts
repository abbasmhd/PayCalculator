import { describe, it, expect } from 'vitest';
import {
  getAnnualTax,
  getTaxBrackets,
  calculateLITO,
  calculateHECS,
  calculatePeriodPAYG,
  calculatePayroll,
  getConcessionalCap,
  getEffectivePeriods,
  estimateYtdTaxRefund,
  type PayrollInput
} from './taxEngine';

const defaultInput: PayrollInput = {
  payCycle: 'weekly',
  unitType: 'hourly',
  unitsWorked: 40,
  unitRate: 124.61,
  superMode: 'inclusive',
  superRate: 12,
  leaveReserve: 1500,
  adminFeeMode: 'percent',
  adminFeeInput: 1.75,
  paygMode: 'ato_post_deductions',
  customTaxMode: 'dollar',
  customPaygVal: 284,
  taxYear: '2026-27',
  residency: 'resident_tft',
  hasHecs: false,
  applyLito: true,
  applyMedicare: true,
  hasPrivateHealth: false,
  expenseItems: [
    { id: 1, name: 'Portable Hardware', amount: 1372.0 },
    { id: 2, name: 'Business Expenses', amount: 176.55 }
  ]
};

describe('ATO Stage 3 Tax Brackets', () => {
  it('returns 0 below tax-free threshold ($18,200)', () => {
    expect(getAnnualTax(18200, '2026-27', 'resident_tft', true)).toBe(0);
    expect(getAnnualTax(18200, '2025-26', 'resident_tft', true)).toBe(0);
  });

  it('calculates 14% bracket for 2027-28, 15% for 2026-27, and 16% for 2025-26 ($18,201 - $45,000)', () => {
    expect(getAnnualTax(45000, '2027-28', 'resident_tft', true)).toBeCloseTo(3752, 2);
    expect(getAnnualTax(45000, '2027-28', 'resident_no_tft', false)).toBeCloseTo(6300, 2);
    expect(getAnnualTax(45000, '2026-27', 'resident_tft', true)).toBeCloseTo(4020, 2);
    expect(getAnnualTax(45000, '2025-26', 'resident_tft', true)).toBeCloseTo(4288, 2);
  });

  it('returns 14% bracket in getTaxBrackets for 2027-28', () => {
    const tftBrackets = getTaxBrackets('resident_tft', '2027-28');
    expect(tftBrackets[1]).toEqual({ name: '$18,201 – $45,000', max: 45000, rate: 14 });
    const noTftBrackets = getTaxBrackets('resident_no_tft', '2027-28');
    expect(noTftBrackets[0]).toEqual({ name: '$0 – $45,000', max: 45000, rate: 14 });
  });

  it('calculates 30% bracket ($45,001 - $135,000)', () => {
    expect(getAnnualTax(100000, '2026-27', 'resident_tft', true)).toBeCloseTo(20520, 2);
    expect(getAnnualTax(100000, '2025-26', 'resident_tft', true)).toBeCloseTo(20788, 2);
  });

  it('calculates 37% and 45% brackets', () => {
    expect(getAnnualTax(190000, '2026-27', 'resident_tft', true)).toBeCloseTo(51370, 2);
    expect(getAnnualTax(200000, '2026-27', 'resident_tft', true)).toBeCloseTo(55870, 2);
    expect(getAnnualTax(190000, '2025-26', 'resident_tft', true)).toBeCloseTo(51638, 2);
    expect(getAnnualTax(200000, '2025-26', 'resident_tft', true)).toBeCloseTo(56138, 2);
  });

  it('matches ATO Scale 2 PAYG withholding for 2025-26 and 2026-27', () => {
    const base = {
      payCycle: 'weekly' as const,
      residency: 'resident_tft' as const,
      applyLito: true,
      applyMedicare: true,
      hasHecs: false,
      hasPrivateHealth: false
    };

    expect(calculatePeriodPAYG(2863.13, { ...base, taxYear: '2025-26' })).toBe(759);
    expect(calculatePeriodPAYG(1455.36, { ...base, taxYear: '2025-26' })).toBe(289);
    expect(calculatePeriodPAYG(10990.51, { ...base, taxYear: '2025-26' })).toBe(4515);

    expect(calculatePeriodPAYG(2863.13, { ...base, taxYear: '2026-27' })).toBe(753);
    expect(calculatePeriodPAYG(1455.36, { ...base, taxYear: '2026-27' })).toBe(284);
    expect(calculatePeriodPAYG(10990.51, { ...base, taxYear: '2026-27' })).toBe(4510);

    expect(calculatePeriodPAYG(2863.13, { ...base, taxYear: '2027-28' })).toBe(748);
    expect(calculatePeriodPAYG(1455.36, { ...base, taxYear: '2027-28' })).toBe(279);
    expect(calculatePeriodPAYG(10990.51, { ...base, taxYear: '2027-28' })).toBe(4505);
  });
});

describe('LITO & HECS', () => {
  it('applies full LITO up to $37,500 and phases out by $66,667', () => {
    expect(calculateLITO(37500)).toBe(700);
    expect(calculateLITO(70000)).toBe(0);
  });

  it('returns 0 HECS below $54,435', () => {
    expect(calculateHECS(54000)).toBe(0);
    expect(calculateHECS(100000)).toBeCloseTo(6000, 2);
  });
});

describe('calculatePayroll', () => {
  it('computes inclusive super, GST refund, and PAYG tax savings', () => {
    const res = calculatePayroll(defaultInput);
    expect(res.baseGross).toBeCloseTo(4984.4, 2);
    expect(res.superAmount).toBeCloseTo(534.04, 2);
    expect(res.totalIncGstPaid).toBeCloseTo(1548.55, 2);
    expect(res.totalGstRefunded).toBeCloseTo(140.78, 2);
    expect(res.paygTaxSaved).toBeGreaterThan(0);
    expect(res.clmNetPay).toBeGreaterThan(res.stdNetPay);
  });

  it('handles superMode: exclusive (super on top of baseGross)', () => {
    const res = calculatePayroll({ ...defaultInput, superMode: 'exclusive' });
    expect(res.baseGross).toBeCloseTo(4984.4, 2);
    expect(res.superAmount).toBeCloseTo(4984.4 * 0.12, 2);
    expect(res.totalGrossTaxablePay).toBeCloseTo(res.baseGross, 2);
    expect(res.stdTaxable).toBeCloseTo(res.baseGross - defaultInput.leaveReserve - res.adminFee, 2);
  });

  it('handles adminFeeMode: dollar', () => {
    const res = calculatePayroll({ ...defaultInput, adminFeeMode: 'dollar', adminFeeInput: 50 });
    expect(res.adminFee).toBe(50);
  });

  it('handles ato_pre_expenses PAYG mode (PAYG matches standard taxable)', () => {
    const res = calculatePayroll({ ...defaultInput, paygMode: 'ato_pre_expenses' });
    expect(res.clmPAYGTax).toBeCloseTo(res.stdPAYGTax, 2);
    expect(res.paygTaxSaved).toBeCloseTo(0, 2);
  });

  it('handles custom_override in dollar and percent modes and clamps to [0, clmTaxable]', () => {
    const dollarRes = calculatePayroll({
      ...defaultInput,
      paygMode: 'custom_override',
      customTaxMode: 'dollar',
      customPaygVal: 250
    });
    expect(dollarRes.clmPAYGTax).toBe(250);

    const percentRes = calculatePayroll({
      ...defaultInput,
      paygMode: 'custom_override',
      customTaxMode: 'percent',
      customPaygVal: 20
    });
    expect(percentRes.clmPAYGTax).toBeCloseTo(percentRes.clmTaxable * 0.2, 2);

    const clampedRes = calculatePayroll({
      ...defaultInput,
      paygMode: 'custom_override',
      customTaxMode: 'dollar',
      customPaygVal: 999999
    });
    expect(clampedRes.clmPAYGTax).toBeCloseTo(clampedRes.clmTaxable, 2);
    expect(clampedRes.clmNetPay).toBeGreaterThanOrEqual(0);
  });
});

describe('Residency, HECS, MLS, and Brackets', () => {
  it('calculates foreign_resident, whm, and resident_no_tft annual tax', () => {
    expect(getAnnualTax(100000, '2026-27', 'foreign_resident', false)).toBeCloseTo(30000, 2);
    expect(getAnnualTax(45000, '2026-27', 'whm', false)).toBeCloseTo(6750, 2);
    expect(getAnnualTax(45000, '2026-27', 'resident_no_tft', false)).toBeCloseTo(6750, 2);
    expect(getAnnualTax(45000, '2025-26', 'resident_no_tft', false)).toBeCloseTo(7200, 2);
  });

  it('gates LITO and Medicare for foreign_resident and whm', () => {
    const resForeign = calculatePeriodPAYG(1000, {
      payCycle: 'weekly',
      residency: 'foreign_resident',
      taxYear: '2026-27',
      applyLito: true,
      applyMedicare: true,
      hasHecs: false,
      hasPrivateHealth: false
    });
    expect(resForeign).toBeCloseTo((52000 * 0.3) / 52, 2);

    const resWhm = calculatePeriodPAYG(500, {
      payCycle: 'weekly',
      residency: 'whm',
      taxYear: '2026-27',
      applyLito: true,
      applyMedicare: true,
      hasHecs: false,
      hasPrivateHealth: false
    });
    expect(resWhm).toBeCloseTo((26000 * 0.15) / 52, 2);
  });

  it('applies HECS and does not withhold MLS in weekly PAYG for residents without private health', () => {
    const baseOpts = {
      payCycle: 'weekly' as const,
      residency: 'resident_tft' as const,
      taxYear: '2026-27' as const,
      applyLito: true,
      applyMedicare: true,
      hasHecs: false,
      hasPrivateHealth: true
    };
    const withoutHecsOrMls = calculatePeriodPAYG(2000, baseOpts); // $104,000/yr
    const withHecs = calculatePeriodPAYG(2000, { ...baseOpts, hasHecs: true });
    const withMls = calculatePeriodPAYG(2000, { ...baseOpts, hasPrivateHealth: false });
    expect(withHecs).toBeGreaterThan(withoutHecsOrMls);
    expect(withMls).toBe(withoutHecsOrMls);
  });

  it('returns residency-specific tax brackets', () => {
    expect(getTaxBrackets('resident_tft')[0].rate).toBe(0);
    expect(getTaxBrackets('resident_no_tft', '2025-26')[0].rate).toBe(16);
    expect(getTaxBrackets('resident_no_tft', '2026-27')[0].rate).toBe(15);
    expect(getTaxBrackets('whm')[0].rate).toBe(15);
    expect(getTaxBrackets('foreign_resident')[0].rate).toBe(30);
  });
});

describe('ATO Schedule 1 Statement of Formulas (Scale 2)', () => {
  it('calculates weekly PAYG for $2,863.13/wk -> $759.00 PAYG', () => {
    const res = calculatePayroll({ ...defaultInput, expenseItems: [] });
    expect(res.stdTaxable).toBeCloseTo(2863.13, 2);
    expect(res.stdPAYGTax).toBe(753);
    expect(res.stdNetPay).toBeCloseTo(2110.13, 2);
  });

  it('calculates weekly PAYG with expenses: $1,455.36/wk -> $284.00 PAYG', () => {
    const res = calculatePayroll(defaultInput);
    expect(res.clmTaxable).toBeCloseTo(1455.36, 2);
    expect(res.clmPAYGTax).toBe(284);
    expect(res.clmNetPay).toBeCloseTo(2719.91, 2);
  });

  it('calculates weekly PAYG for $10,990.51/wk -> $4,515.00 PAYG', () => {
    const payg = calculatePeriodPAYG(10990.51, {
      payCycle: 'weekly',
      residency: 'resident_tft',
      taxYear: '2026-27',
      applyLito: true,
      applyMedicare: true,
      hasHecs: false,
      hasPrivateHealth: false
    });
    expect(payg).toBe(4510);
    expect(10990.51 - payg).toBeCloseTo(6480.51, 2);
  });

  it('scales properly for fortnightly, monthly, and annually', () => {
    const baseOpts = {
      residency: 'resident_tft' as const,
      taxYear: '2026-27' as const,
      applyLito: true,
      applyMedicare: true,
      hasHecs: false,
      hasPrivateHealth: false
    };
    const weekly = calculatePeriodPAYG(2863.13, { ...baseOpts, payCycle: 'weekly' });
    expect(weekly).toBe(753);
    expect(calculatePeriodPAYG(2863.13 * 2, { ...baseOpts, payCycle: 'fortnightly' })).toBe(weekly * 2);
    expect(calculatePeriodPAYG((2863.13 * 13) / 3, { ...baseOpts, payCycle: 'monthly' })).toBe(
      Math.round((weekly * 13) / 3)
    );
    expect(calculatePeriodPAYG(2863.13 * 52, { ...baseOpts, payCycle: 'annually' })).toBe(weekly * 52);
  });

  it('calculates Payslip 4 (W/E 11 OCT 26) with leavePayout (7500) and leaveReserve (0)', () => {
    const res = calculatePayroll({
      ...defaultInput,
      unitsWorked: 32,
      unitRate: 124.61,
      leaveReserve: 0,
      leavePayout: 7500,
      expenseItems: []
    });
    expect(res.clmTaxable).toBeCloseTo(10990.5, 1);
    expect(res.clmPAYGTax).toBe(4510);
  });
});

describe('Stage 2 (2020-21 to 2023-24) and 2024-25 Tax Scales', () => {
  it('uses the same Stage 3 rates for 2024-25 as 2025-26', () => {
    expect(getAnnualTax(45000, '2024-25', 'resident_tft', true)).toBeCloseTo(4288, 2);
    expect(getAnnualTax(100000, '2024-25', 'resident_tft', true)).toBeCloseTo(20788, 2);
    expect(getTaxBrackets('resident_tft', '2024-25')).toEqual(getTaxBrackets('resident_tft', '2025-26'));
    expect(
      calculatePeriodPAYG(2863.13, {
        payCycle: 'weekly',
        residency: 'resident_tft',
        taxYear: '2024-25',
        applyLito: true,
        applyMedicare: true,
        hasHecs: false,
        hasPrivateHealth: false
      })
    ).toBe(759);
  });

  it('calculates Stage 2 annual tax for resident_tft, resident_no_tft, and foreign_resident', () => {
    for (const year of ['2020-21', '2023-24'] as const) {
      expect(getAnnualTax(18200, year, 'resident_tft', true)).toBe(0);
      expect(getAnnualTax(45000, year, 'resident_tft', true)).toBeCloseTo(5092, 2);
      expect(getAnnualTax(120000, year, 'resident_tft', true)).toBeCloseTo(29467, 2);
      expect(getAnnualTax(180000, year, 'resident_tft', true)).toBeCloseTo(51667, 2);
      expect(getAnnualTax(200000, year, 'resident_tft', true)).toBeCloseTo(60667, 2);

      expect(getAnnualTax(45000, year, 'resident_no_tft', false)).toBeCloseTo(8550, 2);
      expect(getAnnualTax(120000, year, 'resident_no_tft', false)).toBeCloseTo(32925, 2);
      expect(getAnnualTax(180000, year, 'resident_no_tft', false)).toBeCloseTo(55125, 2);
      expect(getAnnualTax(200000, year, 'resident_no_tft', false)).toBeCloseTo(64125, 2);

      expect(getAnnualTax(120000, year, 'foreign_resident', false)).toBeCloseTo(39000, 2);
      expect(getAnnualTax(180000, year, 'foreign_resident', false)).toBeCloseTo(61200, 2);
      expect(getAnnualTax(200000, year, 'foreign_resident', false)).toBeCloseTo(70200, 2);
    }
  });

  it('returns Stage 2 tax brackets when taxYear is 2020-21..2023-24', () => {
    const brackets = getTaxBrackets('resident_tft', '2023-24');
    expect(brackets).toEqual([
      { name: '$0 – $18,200', max: 18200, rate: 0 },
      { name: '$18,201 – $45,000', max: 45000, rate: 19 },
      { name: '$45,001 – $120,000', max: 120000, rate: 32.5 },
      { name: '$120,001 – $180,000', max: 180000, rate: 37 },
      { name: '$180,001+', max: 300000, rate: 45 }
    ]);
  });

  it('calculates Stage 2 weekly PAYG from Stage 2 annual tax + 2% Medicare levy rounded to nearest dollar', () => {
    const weekly = 2000;
    const annual = weekly * 52; // 104,000
    const expectedAnnualTax = 5092 + (annual - 45000) * 0.325;
    const expectedMedicare = annual * 0.02;
    const expectedWeeklyPayg = Math.round((expectedAnnualTax + expectedMedicare) / 52);

    expect(
      calculatePeriodPAYG(weekly, {
        payCycle: 'weekly',
        residency: 'resident_tft',
        taxYear: '2021-22',
        applyLito: true,
        applyMedicare: true,
        hasHecs: false,
        hasPrivateHealth: false
      })
    ).toBe(expectedWeeklyPayg);
  });
});

describe('Novated Car Lease', () => {
  const baseInput = {
    payCycle: 'weekly' as const,
    unitType: 'hourly' as const,
    unitsWorked: 38,
    unitRate: 60,
    superMode: 'exclusive' as const,
    superRate: 12,
    leaveReserve: 0,
    adminFeeMode: 'dollar' as const,
    adminFeeInput: 0,
    paygMode: 'ato_post_deductions' as const,
    customTaxMode: 'dollar' as const,
    customPaygVal: 0,
    taxYear: '2026-27' as const,
    residency: 'resident_tft' as const,
    hasHecs: false,
    applyLito: true,
    applyMedicare: true,
    hasPrivateHealth: false,
    expenseItems: []
  };

  it('calculates EV (FBT-exempt) novated lease with 100% pre-tax ex-GST deduction and GST saved', () => {
    const result = calculatePayroll({
      ...baseInput,
      carLeaseEnabled: true,
      carLeaseType: 'ev',
      carLeasePerPeriod: 330
    });

    expect(result.carLeasePostTax).toBe(0);
    expect(result.carLeasePreTax).toBeCloseTo(300, 2);
    expect(result.carLeaseGstSaved).toBeCloseTo(30, 2);
    expect(result.clmTaxable).toBeCloseTo(result.stdTaxable - 300, 2);
    expect(result.clmNetPay).toBeCloseTo(result.clmTaxable - result.clmPAYGTax, 2);
    expect(result.totalBenefitGotBack).toBeCloseTo(result.paygTaxSaved + 30, 2);
  });

  it('calculates Petrol / Hybrid (ECM 20%) novated lease with post-tax ECM and pre-tax remainder', () => {
    const result = calculatePayroll({
      ...baseInput,
      carLeaseEnabled: true,
      carLeaseType: 'ice',
      carLeasePerPeriod: 440,
      carBaseValue: 52000 // 20% = 10,400/yr => 200/wk post-tax
    });

    const expectedPostTax = (52000 * 0.2) / 52; // 200
    const expectedPreTax = (440 - expectedPostTax) / 1.1; // 240 / 1.1
    const expectedGstSaved = 440 - expectedPostTax - expectedPreTax;

    expect(result.carLeasePostTax).toBeCloseTo(expectedPostTax, 2);
    expect(result.carLeasePreTax).toBeCloseTo(expectedPreTax, 2);
    expect(result.carLeaseGstSaved).toBeCloseTo(expectedGstSaved, 2);
    expect(result.clmTaxable).toBeCloseTo(result.stdTaxable - expectedPreTax, 2);
    expect(result.clmNetPay).toBeCloseTo(result.clmTaxable - result.clmPAYGTax - expectedPostTax, 2);
    expect(result.totalBenefitGotBack).toBeCloseTo(result.paygTaxSaved + expectedGstSaved, 2);
  });

  it('deducts voluntary / salary-sacrificed super from stdTaxable', () => {
    const withoutVol = calculatePayroll(baseInput);
    const withVol = calculatePayroll({ ...baseInput, voluntarySuper: 200 });
    expect(withVol.voluntarySuper).toBe(200);
    expect(withVol.stdTaxable).toBeCloseTo(withoutVol.stdTaxable - 200, 2);
    expect(withVol.stdPAYGTax).toBeLessThan(withoutVol.stdPAYGTax);
  });

  it('scales annual projections by workingWeeks (1-52)', () => {
    expect(getEffectivePeriods('weekly', 48)).toBe(48);
    expect(getEffectivePeriods('fortnightly', 26)).toBe(13);
    expect(getEffectivePeriods('annually', 40)).toBe(1);

    const fullYear = calculatePayroll({ ...baseInput, workingWeeks: 52 });
    const partYear = calculatePayroll({ ...baseInput, workingWeeks: 48 });
    expect(partYear.effectivePeriods).toBe(48);
    expect(partYear.annualNetPay).toBeCloseTo(partYear.clmNetPay * 48, 2);
    expect(partYear.annualNetPay).toBeLessThan(fullYear.annualNetPay);
  });

  it('does not multiply one-off expenses by 52 in annual projections', () => {
    const withOneOff = calculatePayroll({
      ...baseInput,
      expenseItems: [{ id: 1, name: 'Laptop', amount: 2200, recurring: false }]
    });
    const noExpenses = calculatePayroll(baseInput);
    // Annual net pay should be 51 periods of base + 1 period with the one-off claim, NOT 52 * clmNetPay
    expect(withOneOff.oneOffIncGstPaid).toBe(2200);
    expect(withOneOff.annualNetPay).toBeCloseTo(noExpenses.clmNetPay * 51 + withOneOff.clmNetPay, 2);
    expect(withOneOff.annualNetPay).toBeLessThan(withOneOff.clmNetPay * 52);
  });

  it('estimates a YTD refund when tax withheld exceeds estimated end-of-year tax', () => {
    const refundRes = estimateYtdTaxRefund({
      ytdGross: 100000,
      ytdTaxWithheld: 30000,
      taxYear: '2026-27',
      residency: 'resident_tft',
      applyLito: true,
      applyMedicare: true,
      hasPrivateHealth: true
    });
    expect(refundRes.incomeTax).toBeCloseTo(20520, 2);
    expect(refundRes.medicareLevy).toBeCloseTo(2000, 2);
    expect(refundRes.mls).toBe(0);
    expect(refundRes.estimatedTotalTax).toBeCloseTo(22520, 2);
    expect(refundRes.refundOrBill).toBeCloseTo(7480, 2);
  });

  it('estimates a YTD bill and applies MLS when there is no private health cover', () => {
    const billRes = estimateYtdTaxRefund({
      ytdGross: 120000,
      ytdTaxWithheld: 10000,
      taxYear: '2026-27',
      residency: 'resident_tft',
      applyLito: true,
      applyMedicare: true,
      hasPrivateHealth: false
    });
    expect(billRes.incomeTax).toBeCloseTo(26520, 2);
    expect(billRes.mls).toBeCloseTo(120000 * 0.0125, 2);
    expect(billRes.refundOrBill).toBeCloseTo(-20420, 2);
  });

  it('uses the correct getAnnualTax argument order so a low-income YTD case is a refund, not a bill', () => {
    const lowIncomeRes = estimateYtdTaxRefund({
      ytdGross: 15000,
      ytdTaxWithheld: 1000,
      taxYear: '2026-27',
      residency: 'resident_tft',
      applyLito: true,
      applyMedicare: true,
      hasPrivateHealth: true
    });
    expect(lowIncomeRes.incomeTax).toBe(0);
    expect(lowIncomeRes.lito).toBe(700);
    expect(lowIncomeRes.estimatedTotalTax).toBeCloseTo(300, 2);
    expect(lowIncomeRes.refundOrBill).toBeCloseTo(700, 2);
  });
});

describe('getConcessionalCap', () => {
  it('returns $25,000 for 2020-21', () => {
    expect(getConcessionalCap('2020-21')).toBe(25000);
  });

  it('returns $27,500 for 2021-22 through 2023-24', () => {
    expect(getConcessionalCap('2021-22')).toBe(27500);
    expect(getConcessionalCap('2022-23')).toBe(27500);
    expect(getConcessionalCap('2023-24')).toBe(27500);
  });

  it('returns $30,000 for 2024-25 through 2027-28', () => {
    expect(getConcessionalCap('2024-25')).toBe(30000);
    expect(getConcessionalCap('2025-26')).toBe(30000);
    expect(getConcessionalCap('2026-27')).toBe(32500);
    expect(getConcessionalCap('2027-28')).toBe(32500);
  });
});
