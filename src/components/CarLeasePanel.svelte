<script lang="ts">
  import { formatAUD } from '../lib/taxEngine';

  interface Props {
    carLeaseEnabled: boolean;
    carLeaseType: 'ev' | 'ice';
    carLeasePerPeriod: number;
    carBaseValue: number;
    carLeasePreTax: number;
    carLeasePostTax: number;
    carLeaseGstSaved: number;
  }

  let {
    carLeaseEnabled = $bindable(),
    carLeaseType = $bindable(),
    carLeasePerPeriod = $bindable(),
    carBaseValue = $bindable(),
    carLeasePreTax,
    carLeasePostTax,
    carLeaseGstSaved
  }: Props = $props();
</script>

<div class="bg-white rounded-lg border border-zinc-200 p-5 space-y-4">
  <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
    <div>
      <h2 class="text-sm font-bold text-zinc-900">4. Novated car lease</h2>
      <p class="text-xs text-zinc-500">EV FBT-exempt or Petrol / Hybrid ECM 20%</p>
    </div>
    <label class="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        bind:checked={carLeaseEnabled}
        class="h-4 w-4 rounded border-zinc-300 text-[#0F4C3A] focus:ring-[#0F4C3A] cursor-pointer"
        aria-label="Novated car lease"
      />
      <span class="text-xs font-semibold text-zinc-700">{carLeaseEnabled ? 'Hide' : 'Show'}</span>
    </label>
  </div>

  {#if carLeaseEnabled}
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 rounded-md" role="group" aria-label="Vehicle type">
        <button
          type="button"
          onclick={() => (carLeaseType = 'ev')}
          aria-pressed={carLeaseType === 'ev'}
          class="py-1.5 px-2.5 text-xs font-semibold rounded transition cursor-pointer {carLeaseType === 'ev'
            ? 'bg-white text-[#0F4C3A] shadow-sm'
            : 'text-zinc-600 hover:text-zinc-900'}"
        >
          EV (FBT-exempt)
        </button>
        <button
          type="button"
          onclick={() => (carLeaseType = 'ice')}
          aria-pressed={carLeaseType === 'ice'}
          class="py-1.5 px-2.5 text-xs font-semibold rounded transition cursor-pointer {carLeaseType === 'ice'
            ? 'bg-white text-[#0F4C3A] shadow-sm'
            : 'text-zinc-600 hover:text-zinc-900'}"
        >
          Petrol / Hybrid (ECM 20%)
        </button>
      </div>

      <div class="space-y-1">
        <label for="car-lease-per-period" class="block text-xs font-semibold text-zinc-700">
          Lease &amp; running costs / cycle ($ inc-GST)
        </label>
        <div class="relative">
          <span class="absolute left-2.5 top-2 text-xs text-zinc-400">$</span>
          <input
            id="car-lease-per-period"
            type="number"
            step="0.01"
            min="0"
            bind:value={carLeasePerPeriod}
            class="w-full pl-6 pr-3 py-1.5 bg-white border border-zinc-300 rounded-md text-xs font-bold text-zinc-900 text-right tabular-nums"
          />
        </div>
      </div>

      {#if carLeaseType === 'ice'}
        <div class="space-y-1">
          <label for="car-base-value" class="block text-xs font-semibold text-zinc-700">
            Vehicle base value ($)
          </label>
          <div class="relative">
            <span class="absolute left-2.5 top-2 text-xs text-zinc-400">$</span>
            <input
              id="car-base-value"
              type="number"
              step="100"
              min="0"
              bind:value={carBaseValue}
              class="w-full pl-6 pr-3 py-1.5 bg-white border border-zinc-300 rounded-md text-xs font-bold text-zinc-900 text-right tabular-nums"
            />
          </div>
        </div>
      {/if}

      <div class="p-3 bg-zinc-50 rounded-md border border-zinc-200 space-y-1.5 text-xs font-medium">
        <div class="flex justify-between text-zinc-600">
          <span>Pre-Tax Deduction</span>
          <span class="font-bold text-zinc-800 tabular-nums">{formatAUD(carLeasePreTax)}</span>
        </div>
        {#if carLeasePostTax > 0}
          <div class="flex justify-between text-zinc-600">
            <span>Post-Tax ECM</span>
            <span class="font-bold text-rose-600 tabular-nums">{formatAUD(carLeasePostTax)}</span>
          </div>
        {/if}
        <div class="flex justify-between text-[#0F4C3A] pt-1.5 border-t border-zinc-200">
          <span class="font-bold">GST Saved</span>
          <span class="font-extrabold tabular-nums">+{formatAUD(carLeaseGstSaved)}</span>
        </div>
      </div>
    </div>
  {/if}
</div>
