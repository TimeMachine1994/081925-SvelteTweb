<script>
	// 1. STARTUP COSTS (One-time capital expenditures)
	let startupCosts = $state([
		{ name: 'Lion & Shield Signage/Branding', price: 1500 },
		{ name: 'Initial Printer Purchase/Deposit', price: 2500 },
		{ name: 'Legal Setup & Florida Incorporation', price: 800 },
		{ name: 'Furniture & Tech Setup', price: 2000 }
	]);

	// 2. FIXED COSTS (Monthly recurring)
	let fixedCosts = $state([
		{ name: 'Office Rent (Real Estate)', price: 1200 },
		{ name: 'Insurance & Utilities', price: 300 },
		{ name: 'Software Subs', price: 150 }
	]);

	// 3. VARIABLE COSTS (COGS per unit)
	let variableCosts = $state([
		{ name: 'Paper & Ink', price: 1.45 },
		{ name: 'Labor/Handling', price: 5.00 }
	]);

	// TARGETS & MARGINS
	const targets = [1000, 10000, 100000];
	const margins = [0.10, 0.20, 0.30];

	// REVENUE RUNES
	const totalStartup = $derived(startupCosts.reduce((acc, item) => acc + item.price, 0));
	const totalFixed = $derived(fixedCosts.reduce((acc, item) => acc + item.price, 0));
	const unitCogs = $derived(variableCosts.reduce((acc, item) => acc + item.price, 0));

	function calcPrice(margin) { return unitCogs / (1 - margin); }

	function addItem(list) { list.push({ name: 'New Item', price: 0 }); }

	// Helper functions for per-margin KPIs
	function getBreakeven(margin) {
		const price = calcPrice(margin);
		return Math.ceil(totalFixed / (price - unitCogs));
	}
	
	function getPayback(margin) {
		const price = calcPrice(margin);
		const unitsFor10k = Math.ceil((10000 + totalFixed) / price);
		const monthlyProfit = 10000 - (unitsFor10k * unitCogs) - totalFixed;
		return (totalStartup / (monthlyProfit || 1)).toFixed(1);
	}
	
	function getContribution(margin) {
		return (margin / 2 * 100).toFixed(0); // Half of margin target
	}
</script>

<div class="p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen font-sans">
	<header class="mb-10 flex justify-between items-end border-b-2 border-slate-200 pb-6">
		<div>
			<h1 class="text-4xl font-black text-slate-900 tracking-tight">KING & PARTNER</h1>
			<p class="text-slate-500 font-medium">Business Intelligence Ledger • Florida Edition</p>
		</div>
		<div class="text-right">
			<p class="text-xs font-bold text-slate-400 uppercase">Capital to Launch</p>
			<p class="text-3xl font-mono font-bold text-blue-600">${totalStartup.toLocaleString()}</p>
		</div>
	</header>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
		<div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
			<h2 class="font-bold text-blue-700 mb-4 flex justify-between">Startup Costs <button onclick={() => addItem(startupCosts)} class="text-xs bg-blue-50 px-2 py-1 rounded">+</button></h2>
			{#each startupCosts as item}
				<div class="flex gap-2 mb-2"><input class="flex-1 text-sm border-b" bind:value={item.name} /><input type="number" class="w-20 text-sm text-right" bind:value={item.price} /></div>
			{/each}
		</div>

		<div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
			<h2 class="font-bold text-slate-700 mb-4 flex justify-between">Monthly Fixed <button onclick={() => addItem(fixedCosts)} class="text-xs bg-slate-50 px-2 py-1 rounded">+</button></h2>
			{#each fixedCosts as item}
				<div class="flex gap-2 mb-2"><input class="flex-1 text-sm border-b" bind:value={item.name} /><input type="number" class="w-20 text-sm text-right" bind:value={item.price} /></div>
			{/each}
		</div>

		<div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
			<h2 class="font-bold text-green-700 mb-4 flex justify-between">Unit COGS <button onclick={() => addItem(variableCosts)} class="text-xs bg-green-50 px-2 py-1 rounded">+</button></h2>
			{#each variableCosts as item}
				<div class="flex gap-2 mb-2"><input class="flex-1 text-sm border-b" bind:value={item.name} /><input type="number" step="0.01" class="w-20 text-sm text-right" bind:value={item.price} /></div>
			{/each}
		</div>
	</div>

	{#each margins as m}
		{@const p = calcPrice(m)}
		<div class="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden mb-6">
			<div class="bg-slate-900 text-white p-4 flex justify-between items-center">
				<h3 class="font-bold text-lg">{m * 100}% Margin Target</h3>
				<p class="text-2xl font-mono">${p.toFixed(2)} <span class="text-sm text-slate-400">per unit</span></p>
			</div>
			
			<div class="p-4 border-b border-slate-100">
				<p class="text-xs font-bold text-slate-500 uppercase mb-2">Units Required for MRR Goals</p>
				<div class="grid grid-cols-3 gap-4">
					{#each targets as t}
						<div class="text-center">
							<p class="text-2xl font-mono font-bold text-slate-900">{Math.ceil((t + totalFixed) / p).toLocaleString()}</p>
							<p class="text-xs text-slate-400">${t.toLocaleString()} MRR</p>
						</div>
					{/each}
				</div>
			</div>

			<div class="grid grid-cols-4 gap-4 p-4">
				<div class="bg-slate-100 p-4 rounded-lg text-center">
					<p class="text-xs font-bold text-slate-500 uppercase mb-1">Breakeven</p>
					<p class="text-2xl font-black text-slate-900">{getBreakeven(m)}</p>
					<p class="text-[10px] text-slate-400">units/mo</p>
				</div>

				<div class="bg-slate-100 p-4 rounded-lg text-center">
					<p class="text-xs font-bold text-slate-500 uppercase mb-1">Payback</p>
					<p class="text-2xl font-black text-slate-900">{getPayback(m)}</p>
					<p class="text-[10px] text-slate-400">months</p>
				</div>

				<div class="bg-green-50 p-4 rounded-lg text-center">
					<p class="text-xs font-bold text-green-700 uppercase mb-1">Contribution</p>
					<p class="text-2xl font-black text-green-600">{getContribution(m)}%</p>
					<p class="text-[10px] text-slate-400">of margin</p>
				</div>

				<div class="bg-red-50 p-4 rounded-lg text-center">
					<p class="text-xs font-bold text-red-700 uppercase mb-1">Burn Rate</p>
					<p class="text-2xl font-black text-red-500">${totalFixed.toLocaleString()}</p>
					<p class="text-[10px] text-slate-400">monthly</p>
				</div>
			</div>
		</div>
	{/each}
</div>