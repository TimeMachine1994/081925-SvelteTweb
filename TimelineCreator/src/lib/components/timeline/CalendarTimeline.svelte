<script lang="ts">
	import type { TimelineEvent } from '$lib/utils/csv-parser';

	interface Props {
		events: TimelineEvent[];
		granularity?: 'year' | 'month' | 'week';
		colorMode?: 'binary' | 'intensity';
		eventColor?: string;
		showLegend?: boolean;
		onEventClick?: (event: TimelineEvent) => void;
		onDayClick?: (events: TimelineEvent[], date: Date) => void;
	}

	let {
		events,
		granularity = 'month',
		colorMode = 'binary',
		eventColor = '#3B82F6',
		showLegend = true,
		onEventClick,
		onDayClick
	}: Props = $props();

	// Tooltip state
	let tooltipVisible = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipEvents = $state<TimelineEvent[]>([]);
	let tooltipDate = $state<string>('');
	let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

	function showTooltip(e: MouseEvent, dayEvents: TimelineEvent[], dateStr: string) {
		if (dayEvents.length === 0) return;
		
		if (tooltipTimeout) clearTimeout(tooltipTimeout);
		
		tooltipTimeout = setTimeout(() => {
			const rect = (e.target as HTMLElement).getBoundingClientRect();
			tooltipX = rect.left + rect.width / 2;
			tooltipY = rect.top - 8;
			tooltipEvents = dayEvents;
			tooltipDate = dateStr;
			tooltipVisible = true;
		}, 150);
	}

	function hideTooltip() {
		if (tooltipTimeout) {
			clearTimeout(tooltipTimeout);
			tooltipTimeout = null;
		}
		tooltipVisible = false;
	}

	function handleCellClick(dayEvents: TimelineEvent[], date?: Date) {
		if (dayEvents.length === 0) return;
		
		if (onDayClick && date) {
			onDayClick(dayEvents, date);
		} else if (onEventClick && dayEvents.length > 0) {
			onEventClick(dayEvents[0]);
		}
	}

	const eventsByDate = $derived(() => {
		const map = new Map<string, TimelineEvent[]>();
		for (const event of events) {
			const date = new Date(event.parsedDate);
			const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(event);
		}
		return map;
	});

	const maxEventsPerDay = $derived(() => {
		let max = 0;
		for (const evts of eventsByDate().values()) {
			max = Math.max(max, evts.length);
		}
		return max || 1;
	});

	const dateRange = $derived(() => {
		if (events.length === 0) {
			const now = new Date();
			return { start: now, end: now };
		}
		const dates = events.map(e => new Date(e.parsedDate).getTime());
		return {
			start: new Date(Math.min(...dates)),
			end: new Date(Math.max(...dates))
		};
	});

	const calendarData = $derived(() => {
		const range = dateRange();
		const data: { year: number; months: MonthData[] }[] = [];

		if (granularity === 'year') {
			// Year view: show months as cells
			const startYear = range.start.getFullYear();
			const endYear = range.end.getFullYear();

			for (let year = startYear; year <= endYear; year++) {
				const months: MonthData[] = [];
				for (let month = 0; month < 12; month++) {
					const monthEvents = getEventsInMonth(year, month);
					months.push({
						month,
						year,
						days: [],
						totalEvents: monthEvents.length
					});
				}
				data.push({ year, months });
			}
		} else if (granularity === 'month') {
			// Month view: show days as cells
			const startMonth = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
			const endMonth = new Date(range.end.getFullYear(), range.end.getMonth() + 1, 0);

			let current = new Date(startMonth);
			while (current <= endMonth) {
				const year = current.getFullYear();
				const month = current.getMonth();
				
				let yearEntry = data.find(d => d.year === year);
				if (!yearEntry) {
					yearEntry = { year, months: [] };
					data.push(yearEntry);
				}

				const daysInMonth = new Date(year, month + 1, 0).getDate();
				const days: DayData[] = [];
				const firstDayOfWeek = new Date(year, month, 1).getDay();

				// Add empty cells for days before first of month
				for (let i = 0; i < firstDayOfWeek; i++) {
					days.push({ day: 0, events: [], isEmpty: true });
				}

				for (let day = 1; day <= daysInMonth; day++) {
					const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
					const dayEvents = eventsByDate().get(key) || [];
					days.push({ day, events: dayEvents, isEmpty: false });
				}

				yearEntry.months.push({
					month,
					year,
					days,
					totalEvents: days.reduce((sum, d) => sum + d.events.length, 0)
				});

				current.setMonth(current.getMonth() + 1);
			}
		} else {
			// Week view: similar to month but grouped by weeks
			const startWeek = getWeekStart(range.start);
			const endWeek = getWeekStart(range.end);

			let current = new Date(startWeek);
			let weekNum = 0;
			while (current <= endWeek) {
				const year = current.getFullYear();
				let yearEntry = data.find(d => d.year === year);
				if (!yearEntry) {
					yearEntry = { year, months: [] };
					data.push(yearEntry);
				}

				const days: DayData[] = [];
				for (let i = 0; i < 7; i++) {
					const day = new Date(current);
					day.setDate(day.getDate() + i);
					const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
					const dayEvents = eventsByDate().get(key) || [];
					days.push({ day: day.getDate(), events: dayEvents, isEmpty: false, fullDate: day });
				}

				yearEntry.months.push({
					month: weekNum++,
					year,
					days,
					totalEvents: days.reduce((sum, d) => sum + d.events.length, 0),
					isWeek: true,
					weekStart: new Date(current)
				});

				current.setDate(current.getDate() + 7);
			}
		}

		return data;
	});

	interface DayData {
		day: number;
		events: TimelineEvent[];
		isEmpty: boolean;
		fullDate?: Date;
	}

	interface MonthData {
		month: number;
		year: number;
		days: DayData[];
		totalEvents: number;
		isWeek?: boolean;
		weekStart?: Date;
	}

	function getEventsInMonth(year: number, month: number): TimelineEvent[] {
		return events.filter(e => {
			const d = new Date(e.parsedDate);
			return d.getFullYear() === year && d.getMonth() === month;
		});
	}

	function getWeekStart(date: Date): Date {
		const d = new Date(date);
		const day = d.getDay();
		d.setDate(d.getDate() - day);
		d.setHours(0, 0, 0, 0);
		return d;
	}

	function getCellColor(eventCount: number): string {
		if (eventCount === 0) return '#E5E7EB';
		if (colorMode === 'binary') return eventColor;
		// Intensity mode
		const intensity = Math.min(eventCount / maxEventsPerDay(), 1);
		return adjustColorOpacity(eventColor, 0.2 + intensity * 0.8);
	}

	function adjustColorOpacity(hex: string, opacity: number): string {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${opacity})`;
	}

	const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
</script>

<div class="calendar-timeline space-y-6 relative">
	<!-- Tooltip -->
	{#if tooltipVisible && tooltipEvents.length > 0}
		<div
			class="fixed z-50 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 max-w-sm pointer-events-none"
			style="left: {tooltipX}px; top: {tooltipY}px; transform: translate(-50%, -100%);"
		>
			<div class="font-medium text-gray-300 mb-1">{tooltipDate}</div>
			<div class="font-semibold mb-1">{tooltipEvents.length} event{tooltipEvents.length !== 1 ? 's' : ''}</div>
			<ul class="space-y-1">
				{#each tooltipEvents.slice(0, 4) as evt}
					{#if evt.tooltip}
						<!-- Use custom tooltip text if available -->
						<li class="text-gray-200">{evt.tooltip}</li>
					{:else}
						<!-- Fall back to title -->
						<li class="truncate">• {evt.title}</li>
					{/if}
				{/each}
				{#if tooltipEvents.length > 4}
					<li class="text-gray-400">...and {tooltipEvents.length - 4} more</li>
				{/if}
			</ul>
			{#if tooltipEvents[0]?.mediaUrl}
				<div class="mt-2 text-blue-300 text-xs">Click to view media</div>
			{/if}
			<div class="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
		</div>
	{/if}

	{#each calendarData() as yearData}
		<div class="year-section">
			<h3 class="text-lg font-semibold text-gray-800 mb-3">{yearData.year}</h3>
			
			{#if granularity === 'year'}
				<!-- Year view: 4x3 grid of months -->
				<div class="grid grid-cols-4 gap-2">
					{#each yearData.months as monthData}
						{@const count = monthData.totalEvents}
						{@const monthEvents = getEventsInMonth(monthData.year, monthData.month)}
						<button
							type="button"
							class="aspect-square rounded-md flex items-center justify-center text-xs font-medium cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 transition-all"
							style="background-color: {getCellColor(count)}; color: {count > 0 ? 'white' : '#6B7280'};"
							onmouseenter={(e) => showTooltip(e, monthEvents, `${monthNames[monthData.month]} ${monthData.year}`)}
							onmouseleave={hideTooltip}
							onclick={() => handleCellClick(monthEvents, new Date(monthData.year, monthData.month, 1))}
						>
							{monthNames[monthData.month]}
						</button>
					{/each}
				</div>
			{:else if granularity === 'month'}
				<!-- Month view: calendar grid -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each yearData.months as monthData}
						<div class="bg-white border border-gray-200 rounded-lg p-3">
							<h4 class="text-sm font-medium text-gray-700 mb-2">
								{monthNames[monthData.month]} {monthData.year}
								<span class="text-gray-400 font-normal">({monthData.totalEvents})</span>
							</h4>
							<div class="grid grid-cols-7 gap-1">
								{#each dayNames as dayName}
									<div class="text-xs text-gray-400 text-center">{dayName}</div>
								{/each}
								{#each monthData.days as dayData}
									{#if dayData.isEmpty}
										<div class="aspect-square"></div>
									{:else}
										{@const count = dayData.events.length}
										{@const dateStr = `${monthNames[monthData.month]} ${dayData.day}, ${monthData.year}`}
										<button
											type="button"
											class="aspect-square rounded text-xs flex items-center justify-center hover:ring-1 hover:ring-blue-400 transition-all {count > 0 ? 'cursor-pointer' : 'cursor-default'}"
											style="background-color: {getCellColor(count)}; color: {count > 0 ? 'white' : '#9CA3AF'};"
											onmouseenter={(e) => showTooltip(e, dayData.events, dateStr)}
											onmouseleave={hideTooltip}
											onclick={() => handleCellClick(dayData.events, new Date(monthData.year, monthData.month, dayData.day))}
										>
											{dayData.day}
										</button>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- Week view -->
				<div class="space-y-1">
					<div class="grid grid-cols-8 gap-1 text-xs text-gray-400">
						<div></div>
						{#each dayNames as dayName}
							<div class="text-center">{dayName}</div>
						{/each}
					</div>
					{#each yearData.months as weekData}
						<div class="grid grid-cols-8 gap-1">
							<div class="text-xs text-gray-500 flex items-center">
								{#if weekData.weekStart}
									{monthNames[weekData.weekStart.getMonth()]} {weekData.weekStart.getDate()}
								{/if}
							</div>
							{#each weekData.days as dayData}
								{@const count = dayData.events.length}
								{@const dateStr = dayData.fullDate ? `${monthNames[dayData.fullDate.getMonth()]} ${dayData.fullDate.getDate()}, ${dayData.fullDate.getFullYear()}` : ''}
								<button
									type="button"
									class="h-6 rounded text-xs flex items-center justify-center hover:ring-1 hover:ring-blue-400 transition-all {count > 0 ? 'cursor-pointer' : 'cursor-default'}"
									style="background-color: {getCellColor(count)};"
									onmouseenter={(e) => showTooltip(e, dayData.events, dateStr)}
									onmouseleave={hideTooltip}
									onclick={() => handleCellClick(dayData.events, dayData.fullDate)}
									aria-label="{dateStr}: {count} event{count !== 1 ? 's' : ''}"
								></button>
							{/each}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/each}

	{#if showLegend}
		<div class="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-200">
			<span>Less</span>
			<div class="flex gap-1">
				<div class="w-4 h-4 rounded" style="background-color: #E5E7EB;"></div>
				{#if colorMode === 'intensity'}
					<div class="w-4 h-4 rounded" style="background-color: {adjustColorOpacity(eventColor, 0.3)};"></div>
					<div class="w-4 h-4 rounded" style="background-color: {adjustColorOpacity(eventColor, 0.5)};"></div>
					<div class="w-4 h-4 rounded" style="background-color: {adjustColorOpacity(eventColor, 0.7)};"></div>
				{/if}
				<div class="w-4 h-4 rounded" style="background-color: {eventColor};"></div>
			</div>
			<span>More</span>
		</div>
	{/if}
</div>
