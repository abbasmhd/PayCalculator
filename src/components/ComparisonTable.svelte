<script lang="ts">
  import { formatAUD, formatSignedAUD, type PayrollResult, type SuperMode, type UnitType } from '../lib/taxEngine';

  interface Props {
    result: PayrollResult;
    cycleLabel: string;
    unitsWorked: number;
    unitType: UnitType;
    unitRate: number;
    leaveReserve: number;
    leavePayout?: number;
    superMode: SuperMode;
  }

  let { result, cycleLabel, unitsWorked, unitType, unitRate, leaveReserve, leavePayout = 0, superMode }: Props = $props();
</script>

<div class="bg-white rounded-lg border border-zinc-200 overflow-hidden">
  <div class="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
    <div>
      <h2 class="text-sm font-bold text-zinc-900">Side-by-side savings comparison</h2>
      <p class="text-xs text-zinc-500">Standard pay vs. expense packaged pay ({cycleLabel})</p>
    </div>
    <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
      Tax &amp; GST savings
    </span>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-left text-xs tabular-nums">
      <thead class="bg-zinc-50 text-zinc-600 font-semibold border-b border-zinc-200">
        <tr>
          <th class="py-3 px-4">Line activity</th>
          <th class="py-3 px-4 text-right">Standard pay</th>
          <th class="py-3 px-4 text-right bg-emerald-50/40 text-[#0F4C3A]">Packaged pay</th>
          <th class="py-3 px-4 text-right">Net impact</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-zinc-100 text-zinc-700">
        <tr class="bg-zinc-50/80">
          <td colspan="4" class="py-1.5 px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Gross &amp; Package
          </td>
        </tr>
        <tr>
          <td class="py-2.5 px-4 font-medium">
            Base Gross ({(unitsWorked || 0).toFixed(1)} {unitType === 'hourly' ? 'hrs' : 'days'} @ ${(unitRate || 0).toFixed(2)})
          </td>
          <td class="py-2.5 px-4 text-right">{formatAUD(result.baseGross)}</td>
          <td class="py-2.5 px-4 text-right bg-emerald-50/20">{formatAUD(result.baseGross)}</td>
          <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
        </tr>
        <tr>
          <td class="py-2.5 px-4 font-medium">
            {superMode === 'exclusive' ? 'Superannuation Guarantee (on top)' : 'Superannuation Guarantee'}
          </td>
          <td class="py-2.5 px-4 text-right {superMode === 'exclusive' ? 'text-zinc-600' : 'text-rose-600'}">
            {superMode === 'exclusive' ? '+' : '-'}{formatAUD(result.superAmount)}
          </td>
          <td class="py-2.5 px-4 text-right {superMode === 'exclusive' ? 'text-zinc-600' : 'text-rose-600'} bg-emerald-50/20">
            {superMode === 'exclusive' ? '+' : '-'}{formatAUD(result.superAmount)}
          </td>
          <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
        </tr>
        {#if leavePayout > 0}
          <tr>
            <td class="py-2.5 px-4 font-medium">Leave Payout (Taxable)</td>
            <td class="py-2.5 px-4 text-right text-[#0F4C3A]">+{formatAUD(leavePayout)}</td>
            <td class="py-2.5 px-4 text-right text-[#0F4C3A] bg-emerald-50/20">+{formatAUD(leavePayout)}</td>
            <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
          </tr>
        {/if}
        <tr class="bg-zinc-50/80">
          <td colspan="4" class="py-1.5 px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Pre-Tax Deductions
          </td>
        </tr>
        <tr>
          <td class="py-2.5 px-4 font-medium">Reserved Leave</td>
          <td class="py-2.5 px-4 text-right text-rose-600">-{formatAUD(leaveReserve)}</td>
          <td class="py-2.5 px-4 text-right text-rose-600 bg-emerald-50/20">-{formatAUD(leaveReserve)}</td>
          <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
        </tr>
        <tr>
          <td class="py-2.5 px-4 font-medium">Admin Fee</td>
          <td class="py-2.5 px-4 text-right text-rose-600">-{formatAUD(result.adminFee)}</td>
          <td class="py-2.5 px-4 text-right text-rose-600 bg-emerald-50/20">-{formatAUD(result.adminFee)}</td>
          <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
        </tr>
        <tr class="bg-amber-50/40">
          <td class="py-2.5 px-4 font-semibold text-amber-900">Pre-Tax Expense Claims (Ex-GST)</td>
          <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
          <td class="py-2.5 px-4 text-right font-bold text-amber-800 bg-amber-50/60">-{formatAUD(result.totalExGstClaimed)}</td>
          <td class="py-2.5 px-4 text-right text-amber-800 font-semibold">-{formatAUD(result.totalExGstClaimed)}</td>
        </tr>
        <tr class="bg-zinc-50/80">
          <td colspan="4" class="py-1.5 px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Tax &amp; Net
          </td>
        </tr>
        <tr class="font-bold bg-zinc-50 text-zinc-900">
          <td class="py-2.5 px-4">Taxable Period Income</td>
          <td class="py-2.5 px-4 text-right">{formatAUD(result.stdTaxable)}</td>
          <td class="py-2.5 px-4 text-right bg-emerald-50/30 text-[#0F4C3A]">{formatAUD(result.clmTaxable)}</td>
          <td class="py-2.5 px-4 text-right text-[#0F4C3A]">-{formatAUD(result.totalExGstClaimed)}</td>
        </tr>
        <tr>
          <td class="py-2.5 px-4 font-medium">PAYG Tax Withheld</td>
          <td class="py-2.5 px-4 text-right text-rose-600">-{formatAUD(result.stdPAYGTax)}</td>
          <td class="py-2.5 px-4 text-right text-rose-600 bg-emerald-50/20">-{formatAUD(result.clmPAYGTax)}</td>
          <td class="py-2.5 px-4 text-right text-[#0F4C3A] font-bold">+{formatAUD(result.paygTaxSaved)}</td>
        </tr>
        <tr class="bg-zinc-50/80">
          <td colspan="4" class="py-1.5 px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Tax-Free Reimbursements
          </td>
        </tr>
        <tr class="bg-emerald-50/40">
          <td class="py-2.5 px-4 font-semibold text-[#0F4C3A]">Expense Reimbursements (Inc-GST)</td>
          <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
          <td class="py-2.5 px-4 text-right font-bold text-[#0F4C3A] bg-emerald-50/60">+{formatAUD(result.totalIncGstPaid)}</td>
          <td class="py-2.5 px-4 text-right text-[#0F4C3A] font-bold">+{formatAUD(result.totalIncGstPaid)}</td>
        </tr>
        <tr class="font-extrabold text-sm bg-zinc-900 text-white">
          <td class="py-3 px-4">Net Take-Home Pay</td>
          <td class="py-3 px-4 text-right text-zinc-300">{formatAUD(result.stdNetPay)}</td>
          <td class="py-3 px-4 text-right text-emerald-300 bg-zinc-800">{formatAUD(result.clmNetPay)}</td>
          <td class="py-3 px-4 text-right text-emerald-300">{formatSignedAUD(result.netPayDifference)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
