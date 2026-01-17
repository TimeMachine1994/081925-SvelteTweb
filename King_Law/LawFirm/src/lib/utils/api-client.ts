export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
		public data?: any
	) {
		super(message);
		this.name = 'ApiError';
	}
}

export async function apiRequest<T = any>(
	url: string,
	options: RequestInit = {}
): Promise<T> {
	try {
		const response = await fetch(url, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			}
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new ApiError(
				response.status,
				errorData.message || `HTTP ${response.status}: ${response.statusText}`,
				errorData
			);
		}

		return await response.json();
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError(0, error instanceof Error ? error.message : 'Network error');
	}
}

export const api = {
	get: <T = any>(url: string, options?: RequestInit) =>
		apiRequest<T>(url, { ...options, method: 'GET' }),

	post: <T = any>(url: string, data?: any, options?: RequestInit) =>
		apiRequest<T>(url, {
			...options,
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined
		}),

	patch: <T = any>(url: string, data?: any, options?: RequestInit) =>
		apiRequest<T>(url, {
			...options,
			method: 'PATCH',
			body: data ? JSON.stringify(data) : undefined
		}),

	delete: <T = any>(url: string, options?: RequestInit) =>
		apiRequest<T>(url, { ...options, method: 'DELETE' })
};
