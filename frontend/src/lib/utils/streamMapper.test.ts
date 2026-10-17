import { describe, it, expect } from 'vitest';
import { mapScheduleToStreams, type ScheduleData } from './streamMapper';

function baseSchedule(overrides: Partial<ScheduleData> = {}): ScheduleData {
	return {
		services: {
			main: {
				location: { name: 'Funeral Home', address: '123 Main St', isUnknown: false },
				time: { date: '2026-05-01', time: '10:00', isUnknown: false },
				hours: 2
			},
			additional: [
				{
					type: 'day',
					location: { name: 'Cemetery', address: '', isUnknown: false },
					time: { date: '2026-05-02', time: '09:00', isUnknown: false },
					hours: 1
				}
			]
		},
		...overrides
	};
}

describe('mapScheduleToStreams', () => {
	it('titles the main stream "Celebration of Life for <name>" when a memorial name is provided', () => {
		const streams = mapScheduleToStreams(baseSchedule({ memorialName: 'Jane Doe' }));
		const main = streams.find((s) => s.calculatorServiceType === 'main');
		expect(main?.title).toBe('Celebration of Life for Jane Doe');
	});

	it('leaves additional location/day stream titles unchanged', () => {
		const streams = mapScheduleToStreams(baseSchedule({ memorialName: 'Jane Doe' }));
		const additional = streams.find((s) => s.calculatorServiceType === 'day');
		expect(additional?.title).toBe('Additional Day - Cemetery');
	});

	it('falls back to the location-based title when no memorial name is given', () => {
		const streams = mapScheduleToStreams(baseSchedule());
		const main = streams.find((s) => s.calculatorServiceType === 'main');
		expect(main?.title).toBe('Funeral Home Service');
	});
});
