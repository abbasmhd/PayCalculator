<script lang="ts">
  import { formatAUD, type AdminFeeMode, type SuperMode, type UnitType } from '../lib/taxEngine';

  interface Props {
    unitType: UnitType;
    unitsWorked: number;
    unitRate: number;
    superMode: SuperMode;
    superRate: number;
    superRateAuto: boolean;
    voluntarySuper: number;
    concessionalCap: number;
    effectivePeriods: number;
    leaveReserve: number;
    leavePayout: number;
    adminFeeMode: AdminFeeMode;
    adminFeeInput: number;
    baseGross: number;
    superAmount: number;
    adminFee: number;
  }

  let {
    unitType,
    unitsWorked = $bindable(),
    unitRate = $bindable(),
    superMode = $bindable(),
    superRate = $bindable(),
    superRateAuto = $bindable(),
    voluntarySuper = $bindable(),
    concessionalCap,
    effectivePeriods,
    leaveReserve = $bindable(),
    leavePayout = $bindable(),
    adminFeeMode = $bindable(),
    adminFeeInput = $bindable(),
    baseGross,
    superAmount,
    adminFee
  }: Props = $props();

  function setAdminMode(mode: AdminFeeMode) {
    adminFeeMode = mode;
    adminFeeInput = 0;
  }
</script>

<div class="bg-white rounded-lg border border-zinc-200 p-5 space-y-4">
  <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
    <h2 class="text-sm font-bold text-zinc-900">1. Contractor base earnings</h2>
    <span class="text-xs text-zinc-500">Rate &amp; work units</span>
  </div>

  <div class="grid grid-cols-2 gap-3">
    <div>
      <label for="input-units-worked" class="block text-xs font-semibold text-zinc-700 mb-1">
        {unitType === 'hourly' ? 'Hours / Pay Cycle' : 'Days / Pay Cycle'}
      </label>
      <input
        id="input-units-worked"
        type="number"
        bind:value={unitsWorked}
        step="0.25"
        min="0"
        class="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
      />
    </div>
    <div>
      <label for="input-unit-rate" class="block text-xs font-semibold text-zinc-700 mb-1">
        {unitType === 'hourly' ? 'Hourly Rate ($ AUD)' : 'Daily Rate ($ AUD)'}
      </label>
      <input
        id="input-unit-rate"
        type="number"
        bind:value={unitRate}
        step="0.01"
        min="0"
        class="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
      />
    </div>
  </div>

  <div class="p-2.5 bg-zinc-50 rounded-md border border-zinc-200 flex justify-between items-center text-xs">
    <span class="text-zinc-600 font-medium">Gross invoiced earnings</span>
    <span class="font-bold text-zinc-900 tabular-nums">{formatAUD(baseGross)}</span>
  </div>

  <!-- Superannuation -->
  <div class="pt-3 border-t border-zinc-100 space-y-2">
    <div class="flex items-center justify-between">
      <label for="input-super-rate" class="text-xs font-semibold text-zinc-700">Super guarantee</label>
      <div class="inline-flex p-0.5 bg-zinc-100 rounded-md text-[11px] border border-zinc-200">
        <button
          aria-pressed={superMode === 'inclusive'}
          onclick={() => (superMode = 'inclusive')}
          class="px-2 py-0.5 rounded cursor-pointer {superMode === 'inclusive' ? 'font-bold bg-white text-[#0F4C3A] shadow-xs' : 'text-zinc-600 hover:text-zinc-900'}"
        >
          Inclusive
        </button>
        <button
          aria-pressed={superMode === 'exclusive'}
          onclick={() => (superMode = 'exclusive')}
          class="px-2 py-0.5 rounded cursor-pointer {superMode === 'exclusive' ? 'font-bold bg-white text-[#0F4C3A] shadow-xs' : 'text-zinc-600 hover:text-zinc-900'}"
        >
          On Top
        </button>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <div class="relative flex-grow">
        <input
          id="input-super-rate"
          type="number"
          bind:value={superRate}
          oninput={() => (superRateAuto = false)}
          step="0.25"
          min="0"
          class="w-full pl-3 pr-7 py-1.5 border border-zinc-300 rounded-md text-xs font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
        />
        <span class="absolute right-2.5 top-2 text-xs text-zinc-400 font-bold">%</span>
      </div>
      <span class="text-xs font-bold text-rose-600 w-24 text-right tabular-nums">-{formatAUD(superAmount)}</span>
    </div>

    <!-- Voluntary / Salary-Sacrificed Super & $30k Cap Tracker -->
    <div class="pt-2 space-y-1.5">
      <div class="flex items-center justify-between">
        <label for="input-voluntary-super" class="text-xs font-semibold text-zinc-700">Voluntary / salary-sacrificed super</label>
        {#if voluntarySuper > 0}
          <button onclick={() => (voluntarySuper = 0)} class="text-[11px] font-semibold text-[#0F4C3A] hover:underline cursor-pointer">Set to $0</button>
        {/if}
      </div>
      <div class="relative">
        <span class="absolute left-3 top-2 text-xs text-zinc-400 font-bold">$</span>
        <input
          id="input-voluntary-super"
          type="number"
          bind:value={voluntarySuper}
          min="0"
          step="25"
          class="w-full pl-7 pr-3 py-1.5 border border-zinc-300 rounded-md text-xs font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
        />
      </div>
      {#if true}
        {@const annualConcessional = (superAmount + Math.max(0, voluntarySuper || 0)) * effectivePeriods}
        {@const capPct = Math.min(100, (annualConcessional / concessionalCap) * 100)}
        {@const overCap = annualConcessional > concessionalCap}
        {@const capFormatted = `$${concessionalCap.toLocaleString('en-AU')}`}
        <div class="bg-zinc-50 rounded-md p-2 border border-zinc-200/80 space-y-1">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-zinc-600 font-medium">Annual concessional cap ({capFormatted})</span>
            <span class="font-bold tabular-nums {overCap ? 'text-rose-600' : 'text-zinc-800'}">
              {formatAUD(annualConcessional)} / {capFormatted}
            </span>
          </div>
          <div class="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
            <div
              class="h-full transition-all {overCap ? 'bg-rose-500' : 'bg-[#0F4C3A]'}"
              style="width: {capPct}%"
            ></div>
          </div>
          {#if overCap}
            <p class="text-[10px] text-rose-600 font-medium">Exceeds {capFormatted} cap by {formatAUD(annualConcessional - concessionalCap)}</p>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <!-- Contractor Deductions -->
  <div class="pt-3 border-t border-zinc-100 space-y-3">
    <div class="space-y-1">
      <div class="flex items-center justify-between">
        <label for="input-leave" class="text-xs font-semibold text-zinc-700">Reserved leave</label>
        <button onclick={() => (leaveReserve = 0)} class="text-[11px] font-semibold text-[#0F4C3A] hover:underline cursor-pointer">Set to $0</button>
      </div>
      <p class="text-[11px] text-zinc-500">Set aside pre-tax into your leave pot</p>
      <div class="relative">
        <span class="absolute left-3 top-2 text-xs text-zinc-400 font-bold">$</span>
        <input
          id="input-leave"
          type="number"
          bind:value={leaveReserve}
          step="10"
          class="w-full pl-7 pr-3 py-1.5 border border-zinc-300 rounded-md text-xs font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
        />
      </div>
    </div>

    <div class="space-y-1">
      <div class="flex items-center justify-between">
        <label for="input-leave-payout" class="text-xs font-semibold text-zinc-700">Leave payout</label>
        {#if leavePayout > 0}
          <button onclick={() => (leavePayout = 0)} class="text-[11px] font-semibold text-[#0F4C3A] hover:underline cursor-pointer">Set to $0</button>
        {/if}
      </div>
      <p class="text-[11px] text-zinc-500">Taxable leave cashed out this cycle</p>
      <div class="relative">
        <span class="absolute left-3 top-2 text-xs text-zinc-400 font-bold">$</span>
        <input
          id="input-leave-payout"
          type="number"
          bind:value={leavePayout}
          min="0"
          step="10"
          class="w-full pl-7 pr-3 py-1.5 border border-zinc-300 rounded-md text-xs font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
        />
      </div>
    </div>

    <div class="space-y-1">
      <div class="flex items-center justify-between">
        <label for="input-admin-fee" class="text-xs font-semibold text-zinc-700">Admin fee</label>
        <div class="inline-flex p-0.5 bg-zinc-100 rounded text-[10px] border border-zinc-200">
          <button
            aria-pressed={adminFeeMode === 'percent'}
            onclick={() => setAdminMode('percent')}
            class="px-2 py-0.5 rounded cursor-pointer {adminFeeMode === 'percent' ? 'font-bold bg-white text-[#0F4C3A]' : 'text-zinc-600'}"
          >
            % of Base
          </button>
          <button
            aria-pressed={adminFeeMode === 'dollar'}
            onclick={() => setAdminMode('dollar')}
            class="px-2 py-0.5 rounded cursor-pointer {adminFeeMode === 'dollar' ? 'font-bold bg-white text-[#0F4C3A]' : 'text-zinc-600'}"
          >
            $ Amount
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="relative flex-grow">
          <input
            id="input-admin-fee"
            type="number"
            bind:value={adminFeeInput}
            step="0.05"
            min="0"
            class="w-full pl-3 pr-7 py-1.5 border border-zinc-300 rounded-md text-xs font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A]"
          />
          <span class="absolute right-2.5 top-2 text-xs text-zinc-400 font-bold">{adminFeeMode === 'percent' ? '%' : '$'}</span>
        </div>
        <span class="text-xs font-bold text-rose-600 w-24 text-right tabular-nums">-{formatAUD(adminFee)}</span>
      </div>
    </div>
  </div>
</div>
