type RetryOptions = {
	maxRetries?: number;
	retryDelay?: number;
	retryOn?: number[];
	onRetry?: (attempt: number, error: Error) => void;
};

const DEFAULT_OPTIONS: Required<RetryOptions> = {
	maxRetries: 3,
	retryDelay: 1000,
	retryOn: [408, 429, 500, 502, 503, 504],
	onRetry: () => {}
};

export async function fetchWithRetry(
	url: string,
	options: RequestInit = {},
	retryOptions: RetryOptions = {}
): Promise<Response> {
	const config = { ...DEFAULT_OPTIONS, ...retryOptions };
	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
		try {
			const response = await fetch(url, options);

			if (!response.ok && config.retryOn.includes(response.status) && attempt < config.maxRetries) {
				const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
				config.onRetry(attempt + 1, error);
				await sleep(config.retryDelay * Math.pow(2, attempt));
				continue;
			}

			return response;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt < config.maxRetries) {
				config.onRetry(attempt + 1, lastError);
				await sleep(config.retryDelay * Math.pow(2, attempt));
			}
		}
	}

	throw lastError || new Error('Request failed after retries');
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isNetworkError(error: unknown): boolean {
	if (error instanceof TypeError && error.message === 'Failed to fetch') {
		return true;
	}
	return false;
}

export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		if (isNetworkError(error)) {
			return 'Network error. Please check your connection and try again.';
		}
		return error.message;
	}
	return 'An unexpected error occurred';
}
