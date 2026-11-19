<script lang="ts">
  import type { TaxYear } from '../lib/taxEngine';

  interface Props {
    taxYear: TaxYear;
    onReset: () => void;
  }

  let { taxYear = $bindable(), onReset }: Props = $props();
</script>

<header class="bg-white border-b border-zinc-200 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 bg-[#0F4C3A] rounded-lg text-white flex items-center justify-center shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
      </div>
      <div>
        <h1 class="text-base font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          PayCalculator
          <span class="px-2 py-0.5 text-[11px] font-semibold rounded bg-zinc-100 text-zinc-700 border border-zinc-200">AU Contractor</span>
        </h1>
        <p class="text-xs text-zinc-500">ATO Schedule 1 PAYG, salary packaging, Medicare &amp; HECS</p>
      </div>
    </div>

    <div class="flex items-center gap-2.5">
      <div class="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-200">
        <label for="select-tax-year" class="text-xs text-zinc-500 font-medium">Tax year:</label>
        <select id="select-tax-year" bind:value={taxYear} class="bg-transparent text-zinc-900 text-xs font-semibold py-0.5 pr-1 border-0 focus:ring-0 cursor-pointer">
          <option value="2027-28">2027–28 (Stage 3 — 14%)</option>
          <option value="2026-27">2026–27 (Stage 3)</option>
          <option value="2025-26">2025–26 (Stage 3)</option>
          <option value="2024-25">2024–25 (Stage 3)</option>
          <option value="2023-24">2023–24 (Stage 2)</option>
          <option value="2022-23">2022–23 (Stage 2)</option>
          <option value="2021-22">2021–22 (Stage 2)</option>
          <option value="2020-21">2020–21 (Stage 2)</option>
        </select>
      </div>

      <button onclick={onReset} class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 transition flex items-center gap-1.5 cursor-pointer">
        <svg class="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Reset defaults
      </button>
    </div>
  </div>
</header>
