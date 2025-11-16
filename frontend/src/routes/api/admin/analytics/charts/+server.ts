/**
 * CHARTS ANALYTICS API
 * 
 * Get time-series data for charts and visualizations
 */

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export async function GET({ url, locals }: any) {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const range = url.searchParams.get('range') || '30'; // days
	const days = parseInt(range);

	try {
		const now = new Date();
		const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

		// Get memorials created in the range
		const memorialsSnap = await adminDb
			.collection('memorials')
			.where('createdAt', '>=', startDate)
			.where('isDeleted', '==', false)
			.get();

		// Get users created in the range
		const usersSnap = await adminDb
			.collection('users')
			.where('createdAt', '>=', startDate)
			.where('role', '==', 'viewer')
			.get();

		// Initialize daily data structure
		const dailyData: Record<string, any> = {};
		for (let i = 0; i < days; i++) {
			const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
			const dateKey = date.toISOString().split('T')[0];
			dailyData[dateKey] = {
				date: dateKey,
				memorials: 0,
				paidMemorials: 0,
				users: 0,
				revenue: 0
			};
		}

		// Process memorials
		memorialsSnap.docs.forEach(doc => {
			const data = doc.data();
			const createdAt = data.createdAt?.toDate?.();
			if (createdAt) {
				const dateKey = createdAt.toISOString().split('T')[0];
				if (dailyData[dateKey]) {
					dailyData[dateKey].memorials++;
					if (data.isPaid) {
						dailyData[dateKey].paidMemorials++;
						dailyData[dateKey].revenue += data.calculatorConfig?.totalPrice || data.totalPrice || 299;
					}
				}
			}
		});

		// Process users
		usersSnap.docs.forEach(doc => {
			const data = doc.data();
			const createdAt = data.createdAt?.toDate?.();
			if (createdAt) {
				const dateKey = createdAt.toISOString().split('T')[0];
				if (dailyData[dateKey]) {
					dailyData[dateKey].users++;
				}
			}
		});

		// Convert to array and sort by date
		const chartData = Object.values(dailyData).sort((a: any, b: any) => 
			a.date.localeCompare(b.date)
		);

		// Get top memorial owners by revenue
		const ownersRevenue: Record<string, { name: string; email: string; revenue: number; count: number }> = {};
		
		memorialsSnap.docs.forEach(doc => {
			const data = doc.data();
			if (data.isPaid && data.createdBy) {
				if (!ownersRevenue[data.createdBy]) {
					ownersRevenue[data.createdBy] = {
						name: data.creatorName || 'Unknown',
						email: data.creatorEmail || '',
						revenue: 0,
						count: 0
					};
				}
				ownersRevenue[data.createdBy].revenue += data.calculatorConfig?.totalPrice || data.totalPrice || 299;
				ownersRevenue[data.createdBy].count++;
			}
		});

		const topOwners = Object.entries(ownersRevenue)
			.map(([id, data]) => ({ id, ...data }))
			.sort((a, b) => b.revenue - a.revenue)
			.slice(0, 10);

		return json({
			daily: chartData,
			topOwners,
			summary: {
				totalMemorials: memorialsSnap.size,
				totalUsers: usersSnap.size,
				totalRevenue: chartData.reduce((sum: number, day: any) => sum + day.revenue, 0),
				averageDaily: {
					memorials: memorialsSnap.size / days,
					users: usersSnap.size / days,
					revenue: chartData.reduce((sum: number, day: any) => sum + day.revenue, 0) / days
				}
			}
		});
	} catch (error: any) {
		console.error('Error fetching chart data:', error);
		return json({ error: 'Failed to fetch chart data' }, { status: 500 });
	}
}
