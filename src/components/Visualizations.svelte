<script lang="ts">
  import { formatAUD } from '../lib/taxEngine';

  interface Bracket {
    name: string;
    max: number;
    rate: number;
  }

  interface Props {
    clmNetPay: number;
    clmPAYGTax: number;
    superAmount: number;
    feesAndLeave: number;
    totalIncGstPaid: number;
    totalExGstClaimed: number;
    annualTaxable: number;
    activeBracketRate: number;
    brackets: readonly Bracket[];
  }

  let {
    clmNetPay,
    clmPAYGTax,
    superAmount,
    feesAndLeave,
    totalIncGstPaid,
    totalExGstClaimed,
    annualTaxable,
    activeBracketRate,
    brackets
  }: Props = $props();

  let donutCanvas: HTMLCanvasElement | undefined = $state();

  $effect(() => {
    if (!donutCanvas) return;
    const ctx = donutCanvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    donutCanvas.width = 240 * dpr;
    donutCanvas.height = 180 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 240, 180);

    const netFromIncome = Math.max(0, clmNetPay - totalIncGstPaid);

    const data = [
      { label: 'Net Pay', val: netFromIncome, color: '#0F4C3A' },
      { label: 'PAYG Tax', val: Math.max(0, clmPAYGTax), color: '#E11D48' },
      { label: 'Super', val: Math.max(0, superAmount), color: '#111827' },
      { label: 'Fees/Leave', val: Math.max(0, feesAndLeave), color: '#D97706' },
      { label: 'Pre-Tax Exp', val: Math.max(0, totalExGstClaimed), color: '#2563EB' }
    ];

    const total = data.reduce((a, b) => a + b.val, 0);
    if (total === 0) return;

    const cx = 90;
    const cy = 90;
    const r = 65;
    const innerR = 40;
    let startAngle = -Math.PI / 2;

    for (const slice of data) {
      const sliceAngle = (slice.val / total) * (2 * Math.PI);
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      startAngle += sliceAngle;
    }

    ctx.fillStyle = '#111827';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Net Take-Home', cx, cy - 4);
    ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#0F4C3A';
    ctx.fillText(formatAUD(clmNetPay), cx, cy + 12);

    let ly = 35;
    for (const slice of data) {
      ctx.fillStyle = slice.color;
      ctx.fillRect(160, ly, 10, 10);
      ctx.fillStyle = '#52525B';
      ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(slice.label, 175, ly + 9);
      ly += 22;
    }
  });
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
  <div class="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
    <div class="flex items-center justify-between border-b border-zinc-100 pb-2">
      <h3 class="text-xs font-bold text-zinc-900">Package breakdown</h3>
      <span class="text-[11px] text-zinc-500">Share of gross</span>
    </div>
    <div class="relative flex justify-center items-center h-48">
      <canvas
        bind:this={donutCanvas}
        role="img"
        aria-label="Gross package breakdown donut chart"
        class="max-h-full max-w-full"
      ></canvas>
    </div>
  </div>

  <div class="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
    <div class="flex items-center justify-between border-b border-zinc-100 pb-2">
      <h3 class="text-xs font-bold text-zinc-900">Marginal tax bracket</h3>
      <span class="text-[11px] font-semibold text-[#0F4C3A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
        {activeBracketRate}% Marginal Rate
      </span>
    </div>
    <div class="space-y-2.5 text-xs pt-1">
      {#each brackets as b, idx}
        {@const prevMax = idx === 0 ? 0 : brackets[idx - 1].max}
        {@const isCurrent = annualTaxable > prevMax && (annualTaxable <= b.max || idx === brackets.length - 1)}
        {@const fillPct = Math.min(100, Math.max(0, ((annualTaxable - prevMax) / (b.max - prevMax)) * 100))}
        <div class="space-y-1">
          <div class="flex justify-between items-center text-[10px]">
            <span class={isCurrent ? 'font-extrabold text-[#0F4C3A]' : 'text-zinc-500'}>{b.name} ({b.rate}%)</span>
            <span class="font-mono {isCurrent ? 'font-bold text-[#0F4C3A]' : 'text-zinc-400'}">
              {isCurrent ? 'Active Bracket' : ''}
            </span>
          </div>
          <div class="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-300 {isCurrent
                ? 'bg-[#0F4C3A]'
                : annualTaxable > b.max
                  ? 'bg-zinc-400'
                  : 'bg-transparent'}"
              style="width: {annualTaxable > b.max ? '100%' : isCurrent ? fillPct + '%' : '0%'}"
            ></div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
