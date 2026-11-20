<script lang="ts">
  import { formatAUD } from '../lib/taxEngine';

  export interface MultiPeriodRow {
    name: string;
    w: number;
    f: number;
    m: number;
    a: number;
    color: string;
    rowClass: string;
    isSection?: boolean;
  }

  interface Props {
    rows: MultiPeriodRow[];
  }

  let { rows }: Props = $props();
</script>

<div class="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
  <div class="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <div>
      <h2 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Multi-period pay breakdown</h2>
      <p class="text-xs text-zinc-500 dark:text-zinc-400">Comprehensive multi-period schedule</p>
    </div>
    <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-[#0F4C3A] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
      Packaged pay view
    </span>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-left text-xs tabular-nums">
      <thead class="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
        <tr>
          <th class="py-3 px-4">Pay item</th>
          <th class="py-3 px-3 text-right">Weekly</th>
          <th class="py-3 px-3 text-right">Fortnightly</th>
          <th class="py-3 px-3 text-right">Monthly</th>
          <th class="py-3 px-4 text-right bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-900 dark:text-zinc-100">Annual</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
        {#each rows as row}
          {#if row.isSection}
            <tr class="bg-zinc-50/80 dark:bg-zinc-800/50">
              <td colspan="5" class="py-1.5 px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {row.name}
              </td>
            </tr>
          {:else}
            <tr class={row.rowClass}>
              <td class="py-2.5 px-4 font-medium">{row.name}</td>
              <td class="py-2.5 px-3 text-right {row.color}">{formatAUD(row.w)}</td>
              <td class="py-2.5 px-3 text-right {row.color}">{formatAUD(row.f)}</td>
              <td class="py-2.5 px-3 text-right {row.color}">{formatAUD(row.m)}</td>
              <td class="py-2.5 px-4 text-right font-bold {row.color} bg-zinc-100/60 dark:bg-zinc-800/60">{formatAUD(row.a)}</td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</div>
