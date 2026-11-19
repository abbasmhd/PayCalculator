<script lang="ts">
  import { formatAUD, formatSignedAUD, type PayrollResult } from '../lib/taxEngine';

  interface Props {
    result: PayrollResult;
    cycleLabel: string;
    activeBracketRate: number;
  }

  let { result, cycleLabel, activeBracketRate }: Props = $props();
</script>

<div class="bg-white rounded-lg border border-zinc-200 overflow-hidden">
  <div class="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
    <div class="md:col-span-4 p-5 bg-[#0F4C3A] text-white flex flex-col justify-between">
      <div>
        <p class="text-xs font-medium text-emerald-100/90">Net take-home pay (per {cycleLabel})</p>
        <div class="mt-2">
          <span class="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">{formatAUD(result.clmNetPay)}</span>
        </div>
      </div>
      <p class="text-xs font-semibold text-emerald-200 mt-3 tabular-nums">{formatSignedAUD(result.netPayDifference)} vs. standard pay</p>
    </div>

    <div class="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
      <div class="p-5 flex flex-col justify-between">
        <p class="text-xs font-medium text-zinc-500">Annual net income</p>
        <span class="text-xl font-bold text-zinc-900 mt-1.5 tabular-nums">{formatAUD(result.annualNetPay)}</span>
        <p class="text-[11px] text-zinc-500 mt-2">Post-tax &amp; packaging</p>
      </div>

      <div class="p-5 flex flex-col justify-between">
        <p class="text-xs font-medium text-zinc-500">Total benefit got back</p>
        <span class="text-xl font-bold text-[#0F4C3A] mt-1.5 tabular-nums">{formatAUD(result.totalBenefitGotBack)}</span>
        <p class="text-[11px] text-zinc-600 font-medium mt-2 tabular-nums">
          Tax: {formatAUD(result.paygTaxSaved)} | GST: {formatAUD(result.totalGstRefunded)}
        </p>
      </div>

      <div class="p-5 flex flex-col justify-between">
        <p class="text-xs font-medium text-zinc-500">Effective tax rate</p>
        <span class="text-xl font-bold text-amber-700 mt-1.5 tabular-nums">{result.effectiveTaxRate.toFixed(1)}%</span>
        <p class="text-[11px] text-zinc-500 mt-2">Marginal: {activeBracketRate}%</p>
      </div>

      <div class="p-5 flex flex-col justify-between">
        <p class="text-xs font-medium text-zinc-500">Net expense cost</p>
        <span class="text-xl font-bold text-zinc-900 mt-1.5 tabular-nums">{formatAUD(result.netOutofPocketCost)}</span>
        {#if result.totalIncGstPaid === 0}
          <p class="text-[11px] text-zinc-500 font-medium mt-2">Add a claim to see savings</p>
        {:else}
          <p class="text-[11px] text-[#0F4C3A] font-semibold mt-2 tabular-nums">Save {result.savingsPct.toFixed(1)}% on claims</p>
        {/if}
      </div>
    </div>
  </div>
</div>
