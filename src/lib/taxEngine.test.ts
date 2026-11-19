import { describe, it, expect } from 'vitest';
import {
  getAnnualTax,
  getTaxBrackets,
  calculateLITO,
  calculateHECS,
  calculatePeriodPAYG,
  calculatePayroll,
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
  });

  it('calculates 16% bracket ($18,201 - $45,000)', () => {
    expect(getAnnualTax(45000, '2026-27', 'resident_tft', true)).toBeCloseTo(4288, 2);
  });

  it('calculates 30% bracket ($45,001 - $135,000)', () => {
    expect(getAnnualTax(100000, '2026-27', 'resident_tft', true)).toBeCloseTo(20788, 2);
  });

  it('calculates 37% and 45% brackets', () => {
    expect(getAnnualTax(190000, '2026-27', 'resident_tft', true)).toBeCloseTo(51638, 2);
    expect(getAnnualTax(200000, '2026-27', 'resident_tft', true)).toBeCloseTo(56138, 2);
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
    expect(getAnnualTax(45000, '2026-27', 'resident_no_tft', false)).toBeCloseTo(7200, 2);
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
    expect(getTaxBrackets('resident_no_tft')[0].rate).toBe(16);
    expect(getTaxBrackets('whm')[0].rate).toBe(15);
    expect(getTaxBrackets('foreign_resident')[0].rate).toBe(30);
  });
});

describe('ATO Schedule 1 Statement of Formulas (Scale 2)', () => {
  it('calculates weekly PAYG for $2,863.13/wk -> $759.00 PAYG', () => {
    const res = calculatePayroll({ ...defaultInput, expenseItems: [] });
    expect(res.stdTaxable).toBeCloseTo(2863.13, 2);
    expect(res.stdPAYGTax).toBe(759);
    expect(res.stdNetPay).toBeCloseTo(2104.13, 2);
  });

  it('calculates weekly PAYG with expenses: $1,455.36/wk -> $289.00 PAYG', () => {
    const res = calculatePayroll(defaultInput);
    expect(res.clmTaxable).toBeCloseTo(1455.36, 2);
    expect(res.clmPAYGTax).toBe(289);
    expect(res.clmNetPay).toBeCloseTo(2714.91, 2);
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
    expect(payg).toBe(4515);
    expect(10990.51 - payg).toBeCloseTo(6475.51, 2);
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
    expect(weekly).toBe(759);
    expect(calculatePeriodPAYG(2863.13 * 2, { ...baseOpts, payCycle: 'fortnightly' })).toBe(weekly * 2);
    expect(calculatePeriodPAYG((2863.13 * 13) / 3, { ...baseOpts, payCycle: 'monthly' })).toBe(
      Math.round((weekly * 13) / 3)
    );
    expect(calculatePeriodPAYG(2863.13 * 52, { ...baseOpts, payCycle: 'annually' })).toBe(weekly * 52);
  });
});
