type ThemeMode = 'light' | 'dark' | 'system';

function createThemeStore() {
	let mode = $state<ThemeMode>('system');

	function getSystemPreference(): 'light' | 'dark' {
		if (typeof window === 'undefined') return 'light';
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	function applyTheme(m: ThemeMode) {
		if (typeof document === 'undefined') return;
		const resolved = m === 'system' ? getSystemPreference() : m;
		if (resolved === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	function init() {
		if (typeof window === 'undefined') return;

		const stored = localStorage.getItem('theme') as ThemeMode | null;
		if (stored && ['light', 'dark', 'system'].includes(stored)) {
			mode = stored;
		}
		applyTheme(mode);

		// Listen for system preference changes
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
			if (mode === 'system') {
				applyTheme('system');
			}
		});
	}

	function setMode(m: ThemeMode) {
		mode = m;
		if (typeof window !== 'undefined') {
			localStorage.setItem('theme', m);
		}
		applyTheme(m);
	}

	return {
		get mode() {
			return mode;
		},
		get isDark() {
			if (typeof window === 'undefined') return false;
			return mode === 'dark' || (mode === 'system' && getSystemPreference() === 'dark');
		},
		init,
		setMode
	};
}

export const themeStore = createThemeStore();
