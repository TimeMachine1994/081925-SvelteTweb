/**
 * ADMIN LOGGER
 *
 * Dev-gated structured logging helper for admin routes/components.
 * Replaces ad-hoc `console.log` calls scattered across the admin surface.
 *
 * In production builds (import.meta.env.PROD) debug/info logs are suppressed,
 * while warnings and errors always pass through.
 */

const isDev = import.meta.env.DEV;

type LogArgs = unknown[];

function format(scope: string, message: string): string {
	return `[ADMIN:${scope}] ${message}`;
}

export interface AdminLogger {
	debug: (message: string, ...args: LogArgs) => void;
	info: (message: string, ...args: LogArgs) => void;
	warn: (message: string, ...args: LogArgs) => void;
	error: (message: string, ...args: LogArgs) => void;
}

/**
 * Create a scoped logger, e.g. `const log = createLogger('Dashboard')`.
 */
export function createLogger(scope: string): AdminLogger {
	return {
		debug(message, ...args) {
			if (isDev) console.debug(format(scope, message), ...args);
		},
		info(message, ...args) {
			if (isDev) console.info(format(scope, message), ...args);
		},
		warn(message, ...args) {
			console.warn(format(scope, message), ...args);
		},
		error(message, ...args) {
			console.error(format(scope, message), ...args);
		}
	};
}
