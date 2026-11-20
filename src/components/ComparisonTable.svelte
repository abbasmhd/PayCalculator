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
    carLeaseEnabled?: boolean;
  }

  let { result, cycleLabel, unitsWorked, unitType, unitRate, leaveReserve, leavePayout = 0, superMode, carLeaseEnabled = false }: Props = $props();
</script>

<div class="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
  <div class="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
    <div>
      <h2 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Side-by-side savings comparison</h2>
      <p class="text-xs text-zinc-500 dark:text-zinc-400">Standard pay vs. expense packaged pay ({cycleLabel})</p>
    </div>
    <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
      Tax &amp; GST savings
    </span>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-left text-xs tabular-nums">
      <thead class="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
        <tr>
          <th class="py-3 px-4">Line activity</th>
          <th class="py-3 px-4 text-right">Standard pay</th>
          <th class="py-3 px-4 text-right bg-emerald-50/40 dark:bg-emerald-950/40 text-[#0F4C3A] dark:text-emerald-400">Packaged pay</th>
          <th class="py-3 px-4 text-right">Net impact</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
        <tr class="bg-zinc-50/80 dark:bg-zinc-800/50">
          <td colspan="4" class="py-1.5 px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Gross &amp; Package
          </td>
        </tr>
        <tr>
          <td class="py-2.5 px-4 font-medium">
            Base Gross ({(unitsWorked || 0).toFixed(1)} {unitType === 'hourly' ? 'hrs' : 'days'} @ ${(unitRate || 0).toFixed(2)})
          </td>
          <td class="py-2.5 px-4 text-right">{formatAUD(result.baseGross)}</td>
          <td class="py-2.5 px-4 text-right bg-emerald-50/20 dark:bg-emerald-950/20">{formatAUD(result.baseGross)}</td>
          <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
        </tr>
        <tr>
          <td class="py-2.5 px-4 font-medium">
            {superMode === 'exclusive' ? 'Superannuation Guarantee (on top)' : 'Superannuation Guarantee'}
          </td>
          <td class="py-2.5 px-4 text-right {superMode === 'exclusive' ? 'text-zinc-600 dark:text-zinc-400' : 'text-rose-600 dark:text-rose-400'}">
            {superMode === 'exclusive' ? '+' : '-'}{formatAUD(result.superAmount)}
          </td>
          <td class="py-2.5 px-4 text-right {superMode === 'exclusive' ? 'text-zinc-600 dark:text-zinc-400' : 'text-rose-600 dark:text-rose-400'} bg-emerald-50/20 dark:bg-emerald-950/20">
            {superMode === 'exclusive' ? '+' : '-'}{formatAUD(result.superAmount)}
          </td>
          <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
        </tr>
        {#if leavePayout > 0}
          <tr>
            <td class="py-2.5 px-4 font-medium">Leave Payout (Taxable)</td>
            <td class="py-2.5 px-4 text-right text-[#0F4C3A] dark:text-emerald-400">+{formatAUD(leavePayout)}</td>
            <td class="py-2.5 px-4 text-right text-[#0F4C3A] dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20">+{formatAUD(leavePayout)}</td>
            <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
          </tr>
        {/if}
        <tr class="bg-zinc-50/80 dark:bg-zinc-800/50">
          <td colspan="4" class="py-1.5 px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Pre-Tax Deductions
          </td>
        </tr>
        <tr>
          <td class="py-2.5 px-4 font-medium">Reserved Leave</td>
          <td class="py-2.5 px-4 text-right text-rose-600 dark:text-rose-400">-{formatAUD(leaveReserve)}</td>
          <td class="py-2.5 px-4 text-right text-rose-600 dark:text-rose-400 bg-emerald-50/20 dark:bg-emerald-950/20">-{formatAUD(leaveReserve)}</td>
          <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
        </tr>
        <tr>
          <td class="py-2.5 px-4 font-medium">Admin Fee</td>
          <td class="py-2.5 px-4 text-right text-rose-600 dark:text-rose-400">-{formatAUD(result.adminFee)}</td>
          <td class="py-2.5 px-4 text-right text-rose-600 dark:text-rose-400 bg-emerald-50/20 dark:bg-emerald-950/20">-{formatAUD(result.adminFee)}</td>
          <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
        </tr>
        <tr class="bg-amber-50/40 dark:bg-amber-950/40">
          <td class="py-2.5 px-4 font-semibold text-amber-900 dark:text-amber-200">Pre-Tax Expense Claims (Ex-GST)</td>
          <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
          <td class="py-2.5 px-4 text-right font-bold text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/60">-{formatAUD(result.totalExGstClaimed)}</td>
          <td class="py-2.5 px-4 text-right text-amber-800 dark:text-amber-300 font-semibold">-{formatAUD(result.totalExGstClaimed)}</td>
        </tr>
        {#if carLeaseEnabled || result.carLeasePreTax > 0}
          <tr class="bg-amber-50/40 dark:bg-amber-950/40">
            <td class="py-2.5 px-4 font-semibold text-amber-900 dark:text-amber-200">Novated Lease (Pre-Tax)</td>
            <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
            <td class="py-2.5 px-4 text-right font-bold text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/60">-{formatAUD(result.carLeasePreTax)}</td>
            <td class="py-2.5 px-4 text-right text-amber-800 dark:text-amber-300 font-semibold">-{formatAUD(result.carLeasePreTax)}</td>
          </tr>
        {/if}
        <tr class="bg-zinc-50/80 dark:bg-zinc-800/50">
          <td colspan="4" class="py-1.5 px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Tax &amp; Net
          </td>
        </tr>
        <tr class="font-bold bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100">
          <td class="py-2.5 px-4">Taxable Period Income</td>
          <td class="py-2.5 px-4 text-right">{formatAUD(result.stdTaxable)}</td>
          <td class="py-2.5 px-4 text-right bg-emerald-50/30 dark:bg-emerald-950/30 text-[#0F4C3A] dark:text-emerald-400">{formatAUD(result.clmTaxable)}</td>
          <td class="py-2.5 px-4 text-right text-[#0F4C3A] dark:text-emerald-400">-{formatAUD(result.totalExGstClaimed)}</td>
        </tr>
        <tr>
          <td class="py-2.5 px-4 font-medium">PAYG Tax Withheld</td>
          <td class="py-2.5 px-4 text-right text-rose-600 dark:text-rose-400">-{formatAUD(result.stdPAYGTax)}</td>
          <td class="py-2.5 px-4 text-right text-rose-600 dark:text-rose-400 bg-emerald-50/20 dark:bg-emerald-950/20">-{formatAUD(result.clmPAYGTax)}</td>
          <td class="py-2.5 px-4 text-right text-[#0F4C3A] dark:text-emerald-400 font-bold">+{formatAUD(result.paygTaxSaved)}</td>
        </tr>
        <tr class="bg-zinc-50/80 dark:bg-zinc-800/50">
          <td colspan="4" class="py-1.5 px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Tax-Free Reimbursements
          </td>
        </tr>
        <tr class="bg-emerald-50/40 dark:bg-emerald-950/40">
          <td class="py-2.5 px-4 font-semibold text-[#0F4C3A] dark:text-emerald-400">Expense Reimbursements (Inc-GST)</td>
          <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
          <td class="py-2.5 px-4 text-right font-bold text-[#0F4C3A] dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/60">+{formatAUD(result.totalIncGstPaid)}</td>
          <td class="py-2.5 px-4 text-right text-[#0F4C3A] dark:text-emerald-400 font-bold">+{formatAUD(result.totalIncGstPaid)}</td>
        </tr>
        {#if carLeaseEnabled || result.carLeasePostTax > 0}
          <tr>
            <td class="py-2.5 px-4 font-medium">Novated Lease (Post-Tax ECM)</td>
            <td class="py-2.5 px-4 text-right text-zinc-400">$0.00</td>
            <td class="py-2.5 px-4 text-right text-rose-600 dark:text-rose-400 bg-emerald-50/20 dark:bg-emerald-950/20">-{formatAUD(result.carLeasePostTax)}</td>
            <td class="py-2.5 px-4 text-right text-rose-600 dark:text-rose-400">-{formatAUD(result.carLeasePostTax)}</td>
          </tr>
        {/if}
        <tr class="font-extrabold text-sm bg-zinc-900 dark:bg-zinc-950 text-white">
          <td class="py-3 px-4">Net Take-Home Pay</td>
          <td class="py-3 px-4 text-right text-zinc-300">{formatAUD(result.stdNetPay)}</td>
          <td class="py-3 px-4 text-right text-emerald-300 bg-zinc-800">{formatAUD(result.clmNetPay)}</td>
          <td class="py-3 px-4 text-right text-emerald-300">{formatSignedAUD(result.netPayDifference)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
