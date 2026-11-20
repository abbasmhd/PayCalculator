<script lang="ts">
  import { formatAUD, type PayrollInput, type PayrollResult } from '../lib/taxEngine';

  export interface SavedScenario {
    id: string;
    name: string;
    input: PayrollInput;
    summary: {
      clmNetPay: number;
      annualNetPay: number;
      totalSuperPerPeriod: number;
      annualSuper: number;
      paygTaxSaved: number;
      totalBenefitGotBack: number;
    };
  }

  interface Props {
    scenarios: SavedScenario[];
    onSave: (name: string) => void;
    onLoad: (scenario: SavedScenario) => void;
    onDelete: (id: string) => void;
  }

  let { scenarios, onSave, onLoad, onDelete }: Props = $props();
  let scenarioName = $state('');

  function handleSave() {
    const trimmed = scenarioName.trim() || `Scenario ${scenarios.length + 1}`;
    onSave(trimmed);
    scenarioName = '';
  }
</script>

<div class="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
    <div>
      <h2 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Saved Scenarios Comparison</h2>
      <p class="text-xs text-zinc-500 dark:text-zinc-400">Save up to 3 named scenarios to compare Net Take-Home, Super &amp; Tax Saved</p>
    </div>

    <div class="flex items-center gap-2">
      <input
        type="text"
        bind:value={scenarioName}
        placeholder="Scenario name..."
        aria-label="Scenario name"
        disabled={scenarios.length >= 3}
        class="px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-600 rounded-md text-xs w-40 focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 dark:focus:ring-emerald-400/30 focus:border-[#0F4C3A] dark:focus:border-emerald-500 disabled:bg-zinc-100 dark:disabled:bg-zinc-800"
      />
      <button
        type="button"
        onclick={handleSave}
        disabled={scenarios.length >= 3}
        class="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#0F4C3A] text-white hover:bg-[#0a3629] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save Scenario ({scenarios.length}/3)
      </button>
    </div>
  </div>

  {#if scenarios.length === 0}
    <div class="text-center py-6 text-xs text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-md">
      No saved scenarios yet. Enter a name above and click "Save Scenario" to compare side by side.
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs tabular-nums">
        <thead class="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th class="py-2.5 px-3">Metric</th>
            {#each scenarios as sc (sc.id)}
              <th class="py-2.5 px-3 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <span class="font-bold text-zinc-900 dark:text-zinc-100">{sc.name}</span>
                  <button
                    type="button"
                    onclick={() => onLoad(sc)}
                    class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                    title="Load this scenario"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onclick={() => onDelete(sc.id)}
                    class="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                    aria-label="Delete scenario {sc.name}"
                  >
                    ×
                  </button>
                </div>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
          <tr>
            <td class="py-2 px-3 font-medium">Net Take-Home (Period)</td>
            {#each scenarios as sc (sc.id)}
              <td class="py-2 px-3 text-right font-bold text-[#0F4C3A] dark:text-emerald-400">{formatAUD(sc.summary.clmNetPay)}</td>
            {/each}
          </tr>
          <tr>
            <td class="py-2 px-3 font-medium">Net Take-Home (Annual)</td>
            {#each scenarios as sc (sc.id)}
              <td class="py-2 px-3 text-right font-bold text-zinc-900 dark:text-zinc-100">{formatAUD(sc.summary.annualNetPay)}</td>
            {/each}
          </tr>
          <tr>
            <td class="py-2 px-3 font-medium">Super (SG + Voluntary / Period)</td>
            {#each scenarios as sc (sc.id)}
              <td class="py-2 px-3 text-right font-semibold text-zinc-800 dark:text-zinc-200">{formatAUD(sc.summary.totalSuperPerPeriod)}</td>
            {/each}
          </tr>
          <tr>
            <td class="py-2 px-3 font-medium">Annual Super</td>
            {#each scenarios as sc (sc.id)}
              <td class="py-2 px-3 text-right font-semibold text-zinc-800 dark:text-zinc-200">{formatAUD(sc.summary.annualSuper)}</td>
            {/each}
          </tr>
          <tr>
            <td class="py-2 px-3 font-medium">PAYG Tax Saved (Period)</td>
            {#each scenarios as sc (sc.id)}
              <td class="py-2 px-3 text-right font-semibold text-[#0F4C3A] dark:text-emerald-400">{formatAUD(sc.summary.paygTaxSaved)}</td>
            {/each}
          </tr>
          <tr>
            <td class="py-2 px-3 font-medium">Total Benefit (Tax + GST)</td>
            {#each scenarios as sc (sc.id)}
              <td class="py-2 px-3 text-right font-bold text-[#0F4C3A] dark:text-emerald-400">{formatAUD(sc.summary.totalBenefitGotBack)}</td>
            {/each}
          </tr>
        </tbody>
      </table>
    </div>
  {/if}
</div>
