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

<div class="bg-white rounded-lg border border-zinc-200 p-5 space-y-4">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
    <div>
      <h2 class="text-sm font-bold text-zinc-900">Saved Scenarios Comparison</h2>
      <p class="text-xs text-zinc-500">Save up to 3 named scenarios to compare Net Take-Home, Super &amp; Tax Saved</p>
    </div>

    <div class="flex items-center gap-2">
      <input
        type="text"
        bind:value={scenarioName}
        placeholder="Scenario name..."
        aria-label="Scenario name"
        disabled={scenarios.length >= 3}
        class="px-2.5 py-1.5 border border-zinc-300 rounded-md text-xs w-40 focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 focus:border-[#0F4C3A] disabled:bg-zinc-100"
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
    <div class="text-center py-6 text-xs text-zinc-400 border border-dashed border-zinc-300 rounded-md">
      No saved scenarios yet. Enter a name above and click "Save Scenario" to compare side by side.
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs tabular-nums">
        <thead class="bg-zinc-50 text-zinc-600 font-semibold border-b border-zinc-200">
          <tr>
            <th class="py-2.5 px-3">Metric</th>
            {#each scenarios as sc (sc.id)}
              <th class="py-2.5 px-3 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <span class="font-bold text-zinc-900">{sc.name}</span>
                  <button
                    type="button"
                    onclick={() => onLoad(sc)}
                    class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-zinc-200 hover:bg-zinc-300 text-zinc-700 cursor-pointer"
                    title="Load this scenario"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onclick={() => onDelete(sc.id)}
                    class="text-zinc-400 hover:text-rose-600 cursor-pointer"
                    aria-label="Delete scenario {sc.name}"
                  >
                    ×
                  </button>
                </div>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 text-zinc-700">
          <tr>
            <td class="py-2 px-3 font-medium">Net Take-Home (Period)</td>
            {#each scenarios as sc (sc.id)}
              <td class="py-2 px-3 text-right font-bold text-[#0F4C3A]">{formatAUD(sc.summary.clmNetPay)}</td>
            {/each}
          </tr>
          <tr>
            <td class="py-2 px-3 font-medium">Net Take-Home (Annual)</td>
            {#each scenarios as sc (sc.id)}
              <td class="py-2 px-3 text-right font-bold text-zinc-900">{formatAUD(sc.summary.annualNetPay)}</td>
            {/each}
          </tr>
          <tr>
            <td class="py-2 px-3 font-medium">Super (SG + Voluntary / Period)</td>
            {#each scenarios as sc (sc.id)}
              <td class="py-2 px-3 text-right font-semibold text-zinc-800">{formatAUD(sc.summary.totalSuperPerPeriod)}</td>
            {/each}
          </tr>
          <tr>
            <td class="py-2 px-3 font-medium">Annual Super</td>
            {#each scenarios as sc (sc.id)}
              <td class="py-2 px-3 text-right font-semibold text-zinc-800">{formatAUD(sc.summary.annualSuper)}</td>
            {/each}
          </tr>
          <tr>
            <td class="py-2 px-3 font-medium">PAYG Tax Saved (Period)</td>
            {#each scenarios as sc (sc.id)}
              <td class="py-2 px-3 text-right font-semibold text-[#0F4C3A]">{formatAUD(sc.summary.paygTaxSaved)}</td>
            {/each}
          </tr>
          <tr>
            <td class="py-2 px-3 font-medium">Total Benefit (Tax + GST)</td>
            {#each scenarios as sc (sc.id)}
              <td class="py-2 px-3 text-right font-bold text-[#0F4C3A]">{formatAUD(sc.summary.totalBenefitGotBack)}</td>
            {/each}
          </tr>
        </tbody>
      </table>
    </div>
  {/if}
</div>
