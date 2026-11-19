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
  }

  interface Props {
    rows: MultiPeriodRow[];
  }

  let { rows }: Props = $props();
</script>

<div class="bg-white rounded-lg border border-zinc-200 overflow-hidden">
  <div class="px-5 py-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <div>
      <h2 class="text-sm font-bold text-zinc-900">Multi-period pay breakdown</h2>
      <p class="text-xs text-zinc-500">Comprehensive multi-period schedule</p>
    </div>
    <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-[#0F4C3A] border border-emerald-200">
      Packaged pay view
    </span>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-left text-xs tabular-nums">
      <thead class="bg-zinc-50 text-zinc-600 font-semibold border-b border-zinc-200">
        <tr>
          <th class="py-3 px-4">Pay item</th>
          <th class="py-3 px-3 text-right">Weekly</th>
          <th class="py-3 px-3 text-right">Fortnightly</th>
          <th class="py-3 px-3 text-right">Monthly</th>
          <th class="py-3 px-4 text-right bg-zinc-100 font-bold text-zinc-900">Annual</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-zinc-100 text-zinc-700">
        {#each rows as row}
          <tr class={row.rowClass}>
            <td class="py-2.5 px-4 font-medium">{row.name}</td>
            <td class="py-2.5 px-3 text-right {row.color}">{formatAUD(row.w)}</td>
            <td class="py-2.5 px-3 text-right {row.color}">{formatAUD(row.f)}</td>
            <td class="py-2.5 px-3 text-right {row.color}">{formatAUD(row.m)}</td>
            <td class="py-2.5 px-4 text-right font-bold {row.color} bg-zinc-100/60">{formatAUD(row.a)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
