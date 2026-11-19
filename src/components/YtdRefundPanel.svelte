<script lang="ts">
  import {
    estimateYtdTaxRefund,
    formatAUD,
    type ResidencyStatus,
    type TaxYear
  } from '../lib/taxEngine';

  interface Props {
    taxYear: TaxYear;
    residency: ResidencyStatus;
    applyLito: boolean;
    applyMedicare: boolean;
    hasPrivateHealth: boolean;
  }

  let { taxYear, residency, applyLito, applyMedicare, hasPrivateHealth }: Props = $props();

  let isOpen = $state(false);
  let ytdGross = $state(0);
  let ytdTaxWithheld = $state(0);

  let estimate = $derived(
    estimateYtdTaxRefund({
      ytdGross,
      ytdTaxWithheld,
      taxYear,
      residency,
      applyLito,
      applyMedicare,
      hasPrivateHealth
    })
  );
</script>

<div class="bg-white rounded-lg border border-zinc-200 overflow-hidden">
  <button
    type="button"
    onclick={() => (isOpen = !isOpen)}
    aria-expanded={isOpen}
    class="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-zinc-50 transition cursor-pointer"
  >
    <div>
      <h2 class="text-sm font-bold text-zinc-900">YTD &amp; End-of-Year Tax Refund Estimator</h2>
      <p class="text-xs text-zinc-500">Estimate expected ATO tax refund or bill at 30 June ({taxYear})</p>
    </div>
    <svg
      class="w-4 h-4 text-zinc-500 transition-transform {isOpen ? 'rotate-180' : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  </button>

  {#if isOpen}
    <div class="px-5 pb-5 pt-2 border-t border-zinc-100 space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label for="input-ytd-gross" class="block text-xs font-semibold text-zinc-700 mb-1">
            YTD Taxable Gross Income
          </label>
          <div class="relative">
            <span class="absolute left-3 top-2 text-xs text-zinc-400 font-bold">$</span>
            <input
              id="input-ytd-gross"
              type="number"
              bind:value={ytdGross}
              min="0"
              step="100"
              class="w-full pl-7 pr-3 py-1.5 border border-zinc-300 rounded-md text-xs font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
            />
          </div>
        </div>

        <div>
          <label for="input-ytd-withheld" class="block text-xs font-semibold text-zinc-700 mb-1">
            YTD PAYG Tax Withheld
          </label>
          <div class="relative">
            <span class="absolute left-3 top-2 text-xs text-zinc-400 font-bold">$</span>
            <input
              id="input-ytd-withheld"
              type="number"
              bind:value={ytdTaxWithheld}
              min="0"
              step="50"
              class="w-full pl-7 pr-3 py-1.5 border border-zinc-300 rounded-md text-xs font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
            />
          </div>
        </div>
      </div>

      <div class="p-3 bg-zinc-50 rounded-md border border-zinc-200 space-y-1.5 text-xs">
        <div class="flex justify-between text-zinc-600">
          <span>Base Income Tax</span>
          <span class="font-semibold tabular-nums">{formatAUD(estimate.incomeTax)}</span>
        </div>
        <div class="flex justify-between text-zinc-600">
          <span>Medicare Levy (2%)</span>
          <span class="font-semibold tabular-nums">{formatAUD(estimate.medicareLevy)}</span>
        </div>
        {#if estimate.mls > 0}
          <div class="flex justify-between text-zinc-600">
            <span>Medicare Levy Surcharge (MLS)</span>
            <span class="font-semibold tabular-nums">{formatAUD(estimate.mls)}</span>
          </div>
        {/if}
        {#if estimate.lito > 0}
          <div class="flex justify-between text-[#0F4C3A]">
            <span>Low Income Tax Offset (LITO)</span>
            <span class="font-semibold tabular-nums">-{formatAUD(estimate.lito)}</span>
          </div>
        {/if}
        <div class="flex justify-between text-zinc-800 pt-1.5 border-t border-zinc-200 font-semibold">
          <span>Estimated Total Tax Liability</span>
          <span class="tabular-nums">{formatAUD(estimate.estimatedTotalTax)}</span>
        </div>
        <div class="flex justify-between items-center pt-1.5 border-t border-zinc-200">
          <span class="font-bold text-zinc-900">
            {estimate.refundOrBill >= 0 ? 'Estimated ATO Refund' : 'Estimated ATO Tax Bill'}
          </span>
          <span
            class="text-sm font-extrabold tabular-nums {estimate.refundOrBill >= 0
              ? 'text-[#0F4C3A]'
              : 'text-rose-600'}"
          >
            {estimate.refundOrBill >= 0 ? '+' : '-'}{formatAUD(Math.abs(estimate.refundOrBill))}
          </span>
        </div>
      </div>
    </div>
  {/if}
</div>
