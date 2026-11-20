<script lang="ts">
  import { formatAUD, type ExpenseItem } from '../lib/taxEngine';

  interface Props {
    expenseItems: ExpenseItem[];
    totalIncGstPaid: number;
    totalExGstClaimed: number;
    totalGstRefunded: number;
    onAdd: () => void;
    onAddPreset: (name: string, amount: number, recurring: boolean) => void;
    onRemove: (id: number) => void;
  }

  let {
    expenseItems = $bindable(),
    totalIncGstPaid,
    totalExGstClaimed,
    totalGstRefunded,
    onAdd,
    onAddPreset,
    onRemove
  }: Props = $props();

  const PRESETS = [
    { name: 'Laptop', amount: 2200, recurring: false },
    { name: 'Home Office', amount: 50, recurring: true },
    { name: 'Phone/Internet', amount: 100, recurring: true },
    { name: 'Insurance', amount: 800, recurring: false }
  ] as const;
</script>

<div class="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
  <div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
    <div>
      <h2 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">3. Salary packaging expenses</h2>
      <p class="text-xs text-zinc-500 dark:text-zinc-400">Claim GST-inclusive receipts pre-tax</p>
    </div>
    <button
      onclick={onAdd}
      class="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-[#0F4C3A] text-white hover:bg-[#0a3629] transition flex items-center gap-1 cursor-pointer"
    >
      + Add claim
    </button>
  </div>

  <div class="flex flex-wrap items-center gap-1.5">
    <span class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mr-1">Quick presets:</span>
    {#each PRESETS as preset}
      <button
        type="button"
        onclick={() => onAddPreset(preset.name, preset.amount, preset.recurring)}
        class="px-2 py-1 text-[11px] font-medium rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition cursor-pointer"
      >
        + {preset.name} (${preset.amount.toLocaleString()})
      </button>
    {/each}
  </div>

  <div class="space-y-2.5">
    {#if expenseItems.length === 0}
      <div class="text-center py-4 text-xs text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-md">
        No claims added. Click "+ Add claim"
      </div>
    {:else}
      {#each expenseItems as item (item.id)}
        {@const exGst = item.amount / 1.1}
        {@const gst = item.amount - exGst}
        <div class="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-md flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs">
          <input
            type="text"
            bind:value={item.name}
            aria-label="Expense name"
            class="w-full sm:w-auto sm:flex-grow font-medium px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded text-xs"
          />
          <div class="w-24 relative">
            <span class="absolute left-1.5 top-1 text-[10px] text-zinc-400">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              bind:value={item.amount}
              class="w-full pl-4 pr-1.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-bold text-zinc-900 dark:text-zinc-100 text-right tabular-nums"
            />
          </div>
          <div class="text-[11px] text-right w-20 tabular-nums">
            <span class="block font-semibold text-zinc-700 dark:text-zinc-300">{formatAUD(exGst)}</span>
            <span class="block text-[9px] text-[#0F4C3A] dark:text-emerald-400">+{formatAUD(gst)} GST</span>
          </div>
          <button
            type="button"
            onclick={() => (item.recurring = item.recurring === false ? true : false)}
            class="px-2 py-1 rounded text-[10px] font-semibold border transition cursor-pointer {item.recurring === false
              ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-950 text-[#0F4C3A] dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'}"
            title={item.recurring === false ? 'Applies to current period only' : 'Multiplied across annual working weeks'}
          >
            {item.recurring === false ? 'One-Off' : 'Recurring'}
          </button>
          <button onclick={() => onRemove(item.id)} class="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer" aria-label="Remove expense">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      {/each}
    {/if}
  </div>

  <div class="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs font-medium">
    <div class="flex justify-between text-zinc-700 dark:text-zinc-300">
      <span>Total claimed (inc-GST paid back)</span>
      <span class="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{formatAUD(totalIncGstPaid)}</span>
    </div>
    <div class="flex justify-between text-zinc-600 dark:text-zinc-400">
      <span>Pre-tax deduction (ex-GST cost)</span>
      <span class="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">{formatAUD(totalExGstClaimed)}</span>
    </div>
    <div class="flex justify-between text-[#0F4C3A] dark:text-emerald-400 pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
      <span class="font-bold">GST input credit refunded</span>
      <span class="font-extrabold tabular-nums">+{formatAUD(totalGstRefunded)}</span>
    </div>
  </div>
</div>
