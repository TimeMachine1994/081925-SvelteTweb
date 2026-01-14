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
		{ name: 'Software Subs', price: 300 }
	]);

	// 3. VARIABLE COSTS (COGS per unit)
	let variableCosts = $state([
		{ name: 'Paper & Ink', price: 0.40 },
		{ name: 'Labor/Handling', price: 0.10 }
	]);

	// TARGETS & MARGINS (editable)
	let targets = $state([1000, 10000, 100000]);
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

	function getUnitsNeeded(margin, targetMRR) {
		const price = calcPrice(margin);
		return Math.ceil((targetMRR + totalFixed) / price);
	}

	function getMonthlyProfit(margin, targetMRR) {
		const units = getUnitsNeeded(margin, targetMRR);
		return targetMRR - (units * unitCogs) - totalFixed;
	}

	function getPayback(margin, targetMRR) {
		const profit = getMonthlyProfit(margin, targetMRR);
		if (profit <= 0) return '∞';
		return (totalStartup / profit).toFixed(1);
	}
	
	function getContribution(margin) {
		return (margin / 2 * 100).toFixed(0); // Half of margin target
	}

	function getPostContributionProfit(margin, targetMRR) {
		const profit = getMonthlyProfit(margin, targetMRR);
		const contributionRate = margin / 2;
		return profit * (1 - contributionRate);
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

	<!-- Editable MRR Targets -->
	<div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
		<h2 class="font-bold text-purple-700 mb-3 text-sm uppercase">MRR Targets (Editable)</h2>
		<div class="flex gap-4">
			{#each targets as t, i}
				<div class="flex items-center gap-1">
					<span class="text-slate-400 text-sm">$</span>
					<input type="number" class="w-24 text-sm border-b border-purple-200 text-right font-mono" bind:value={targets[i]} />
				</div>
			{/each}
			<button onclick={() => targets.push(50000)} class="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">+ Add</button>
		</div>
	</div>

	{#each margins as m}
		{@const p = calcPrice(m)}
		<div class="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden mb-6">
			<div class="bg-slate-900 text-white p-4 flex justify-between items-center">
				<h3 class="font-bold text-lg">{m * 100}% Margin Target</h3>
				<div class="text-right">
					<p class="text-2xl font-mono">${p.toFixed(2)} <span class="text-sm text-slate-400">per unit</span></p>
					<p class="text-xs text-slate-400">Contribution: {getContribution(m)}%</p>
				</div>
			</div>
			
			<!-- Per-MRR breakdown -->
			<div class="grid divide-x divide-slate-100" style="grid-template-columns: repeat({targets.length}, 1fr)">
				{#each targets as t}
					{@const profit = getMonthlyProfit(m, t)}
					{@const postProfit = getPostContributionProfit(m, t)}
					<div class="p-4">
						<div class="text-center mb-3 pb-3 border-b border-slate-100">
							<p class="text-xs font-bold text-purple-600 uppercase">${t.toLocaleString()} MRR</p>
						</div>
						
						<div class="space-y-3 text-center">
							<div>
								<p class="text-[10px] font-bold text-slate-400 uppercase">Units Needed</p>
								<p class="text-xl font-mono font-bold text-slate-900">{getUnitsNeeded(m, t).toLocaleString()}</p>
							</div>
							
							<div>
								<p class="text-[10px] font-bold text-slate-400 uppercase">Monthly Profit</p>
								<p class="text-lg font-mono font-bold {profit >= 0 ? 'text-green-600' : 'text-red-500'}">
									{profit >= 0 ? '' : '-'}${Math.abs(profit).toLocaleString(undefined, {maximumFractionDigits: 0})}
								</p>
							</div>
							
							<div>
								<p class="text-[10px] font-bold text-slate-400 uppercase">Payback</p>
								<p class="text-lg font-mono font-bold text-blue-600">{getPayback(m, t)} <span class="text-xs text-slate-400">mo</span></p>
							</div>
							
							<div class="pt-2 border-t border-slate-100">
								<p class="text-[10px] font-bold text-green-600 uppercase">Post-Contribution</p>
								<p class="text-lg font-mono font-bold {postProfit >= 0 ? 'text-green-700' : 'text-red-500'}">
									{postProfit >= 0 ? '' : '-'}${Math.abs(postProfit).toLocaleString(undefined, {maximumFractionDigits: 0})}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Bottom KPIs -->
			<div class="grid grid-cols-3 gap-4 p-4 bg-slate-50 border-t border-slate-200">
				<div class="text-center">
					<p class="text-xs font-bold text-slate-500 uppercase mb-1">Breakeven</p>
					<p class="text-xl font-black text-slate-900">{getBreakeven(m).toLocaleString()}</p>
					<p class="text-[10px] text-slate-400">units/mo</p>
				</div>

				<div class="text-center">
					<p class="text-xs font-bold text-slate-500 uppercase mb-1">Contribution Rate</p>
					<p class="text-xl font-black text-green-600">{getContribution(m)}%</p>
					<p class="text-[10px] text-slate-400">of margin target</p>
				</div>

				<div class="text-center">
					<p class="text-xs font-bold text-red-600 uppercase mb-1">Burn Rate</p>
					<p class="text-xl font-black text-red-500">${totalFixed.toLocaleString()}</p>
					<p class="text-[10px] text-slate-400">monthly fixed</p>
				</div>
			</div>
		</div>
	{/each}
</div>