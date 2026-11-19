<script lang="ts">
  import type { CustomTaxMode, PaygMode, ResidencyStatus } from '../lib/taxEngine';

  interface Props {
    paygMode: PaygMode;
    customTaxMode: CustomTaxMode;
    customPaygVal: number;
    residency: ResidencyStatus;
    hasHecs: boolean;
    applyLito: boolean;
    applyMedicare: boolean;
    hasPrivateHealth: boolean;
  }

  let {
    paygMode = $bindable(),
    customTaxMode = $bindable(),
    customPaygVal = $bindable(),
    residency = $bindable(),
    hasHecs = $bindable(),
    applyLito = $bindable(),
    applyMedicare = $bindable(),
    hasPrivateHealth = $bindable()
  }: Props = $props();
</script>

<div class="bg-white rounded-lg border border-zinc-200 p-5 space-y-4">
  <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
    <h2 class="text-sm font-bold text-zinc-900">2. ATO tax parameters &amp; PAYG mode</h2>
    <span class="text-xs text-zinc-500">Residency &amp; levy</span>
  </div>

  <div class="space-y-1.5 p-3 bg-emerald-50/50 rounded-md border border-emerald-200/70">
    <label for="select-payg-mode" class="block text-xs font-bold text-zinc-900">PAYG withholding mode</label>
    <select
      id="select-payg-mode"
      bind:value={paygMode}
      class="w-full text-xs font-medium bg-white border border-zinc-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
    >
      <option value="ato_post_deductions">ATO Schedule 1 (After Pre-Tax Expense Deductions)</option>
      <option value="ato_pre_expenses">ATO Schedule 1 (Before Expense Claims)</option>
      <option value="custom_override">Custom PAYG Withholding ($ or % Portal Override)</option>
    </select>

    {#if paygMode === 'custom_override'}
      <div class="pt-2 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-zinc-600 font-semibold">Custom withholding amount:</span>
          <div class="inline-flex p-0.5 bg-zinc-200 rounded text-[10px]">
            <button
              onclick={() => (customTaxMode = 'dollar')}
              class="px-1.5 py-0.5 rounded cursor-pointer {customTaxMode === 'dollar' ? 'bg-white text-zinc-900 font-bold' : 'text-zinc-600'}"
            >
              $ Fixed
            </button>
            <button
              onclick={() => (customTaxMode = 'percent')}
              class="px-1.5 py-0.5 rounded cursor-pointer {customTaxMode === 'percent' ? 'bg-white text-zinc-900 font-bold' : 'text-zinc-600'}"
            >
              % Rate
            </button>
          </div>
        </div>
        <input
          type="number"
          min="0"
          bind:value={customPaygVal}
          step="1"
          class="w-full px-3 py-1.5 border border-zinc-300 rounded-md text-xs font-bold text-zinc-900 tabular-nums"
        />
      </div>
    {/if}
  </div>

  <div>
    <label for="select-residency" class="block text-xs font-semibold text-zinc-700 mb-1">Residency status</label>
    <select
      id="select-residency"
      bind:value={residency}
      class="w-full text-xs bg-white border border-zinc-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
    >
      <option value="resident_tft">Australian Resident (Tax-Free Threshold Claimed)</option>
      <option value="resident_no_tft">Australian Resident (No Tax-Free Threshold)</option>
      <option value="foreign_resident">Foreign Resident</option>
      <option value="whm">Working Holiday Maker (WHM)</option>
    </select>
  </div>

  <div class="grid grid-cols-2 gap-3 pt-1">
    <label class="flex items-center gap-2 p-2 rounded-md border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
      <input type="checkbox" bind:checked={hasHecs} class="rounded text-[#0F4C3A] focus:ring-[#0F4C3A] w-4 h-4" />
      <span class="text-xs font-medium text-zinc-700">HELP / HECS debt</span>
    </label>

    <label class="flex items-center gap-2 p-2 rounded-md border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
      <input type="checkbox" bind:checked={applyLito} class="rounded text-[#0F4C3A] focus:ring-[#0F4C3A] w-4 h-4" />
      <span class="text-xs font-medium text-zinc-700">Apply LITO offset</span>
    </label>
  </div>

  <div class="space-y-2 pt-2 border-t border-zinc-100">
    <div class="flex items-center justify-between">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" bind:checked={applyMedicare} class="rounded text-[#0F4C3A] focus:ring-[#0F4C3A] w-4 h-4" />
        <span class="text-xs font-semibold text-zinc-700">2.0% Medicare levy</span>
      </label>
      <label class="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-600">
        <input type="checkbox" bind:checked={hasPrivateHealth} class="rounded text-[#0F4C3A] focus:ring-[#0F4C3A] w-3.5 h-3.5" />
        Has private health (no MLS)
      </label>
    </div>
  </div>
</div>
