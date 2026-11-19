<script lang="ts">
  import type { PayCycle, UnitType } from '../lib/taxEngine';

  interface Props {
    payCycle: PayCycle;
    unitType: UnitType;
  }

  let { payCycle = $bindable(), unitType = $bindable() }: Props = $props();
</script>

<div class="bg-white rounded-lg px-4 py-3 border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
  <div class="flex flex-wrap items-center gap-3">
    <span class="text-xs font-semibold text-zinc-600">Pay frequency</span>
    <div class="inline-flex p-0.5 bg-zinc-100 rounded-lg border border-zinc-200 text-xs gap-0.5">
      {#each (['weekly', 'fortnightly', 'monthly', 'annually'] as const) as cycle}
        <button
          onclick={() => (payCycle = cycle)}
          class="px-3 py-1.5 rounded-md transition capitalize cursor-pointer {payCycle === cycle
            ? 'bg-[#0F4C3A] text-white font-semibold'
            : 'text-zinc-600 font-medium hover:text-zinc-900 hover:bg-zinc-200/50'}"
        >
          {cycle === 'annually' ? 'Annual' : cycle}
        </button>
      {/each}
    </div>
  </div>

  <div class="flex items-center gap-2.5">
    <span class="text-xs text-zinc-600 font-semibold">Work unit</span>
    <div class="inline-flex p-0.5 bg-zinc-100 rounded-lg border border-zinc-200 text-xs gap-0.5">
      {#each (['hourly', 'daily'] as const) as unit}
        <button
          onclick={() => (unitType = unit)}
          class="px-2.5 py-1 rounded-md transition capitalize cursor-pointer {unitType === unit
            ? 'bg-[#0F4C3A] text-white font-semibold'
            : 'text-zinc-600 font-medium hover:text-zinc-900 hover:bg-zinc-200/50'}"
        >
          {unit}
        </button>
      {/each}
    </div>
  </div>
</div>
