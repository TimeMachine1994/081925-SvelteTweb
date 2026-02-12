type User = {
	id: string;
	email: string;
	role: 'client' | 'lawyer' | 'staff' | 'admin';
	firstName: string;
	lastName: string;
	phoneNumber: string | null;
	addressLine1: string | null;
	addressLine2: string | null;
	city: string | null;
	state: string | null;
	zipCode: string | null;
	dateOfBirth: string | null;
	preferredContact: 'email' | 'phone' | 'text' | null;
	emergencyContactName: string | null;
	emergencyContactPhone: string | null;
	squareCustomerId: string | null;
	squareCardId: string | null;
	cardLastFour: string | null;
	cardBrand: string | null;
};

class AuthStore {
	user = $state<User | null>(null);
	loading = $state(true);
	error = $state<string | null>(null);

	async fetchUser() {
		this.loading = true;
		this.error = null;
		try {
			const response = await fetch('/api/auth/user');
			if (response.ok) {
				const data = await response.json();
				this.user = data.user;
			} else if (response.status === 401) {
				this.user = null;
			} else {
				throw new Error('Failed to fetch user');
			}
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown error';
			this.user = null;
		} finally {
			this.loading = false;
		}
	}

	async login(email: string, password: string) {
		this.loading = true;
		this.error = null;
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Login failed');
			}

			const data = await response.json();
			this.user = data.user;
			return { success: true };
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Login failed';
			return { success: false, error: this.error };
		} finally {
			this.loading = false;
		}
	}

	async register(userData: {
		email: string;
		password: string;
		firstName: string;
		lastName: string;
		phoneNumber?: string;
		role?: string;
		accessCode?: string;
	}) {
		this.loading = true;
		this.error = null;
		console.log('📝 [AuthStore] Starting registration...');
		console.log('📝 [AuthStore] Registration data:', {
			email: userData.email,
			firstName: userData.firstName,
			lastName: userData.lastName,
			phoneNumber: userData.phoneNumber,
			role: userData.role,
			hasPassword: !!userData.password
		});
		try {
			console.log('📝 [AuthStore] Sending POST to /api/auth/register...');
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(userData)
			});

			console.log('📝 [AuthStore] Response status:', response.status);
			console.log('📝 [AuthStore] Response ok:', response.ok);

			if (!response.ok) {
				const text = await response.text();
				console.error('❌ [AuthStore] Error response body:', text);
				let data;
				try {
					data = JSON.parse(text);
				} catch {
					throw new Error(`Registration failed: ${text}`);
				}
				throw new Error(data.message || 'Registration failed');
			}

			const data = await response.json();
			console.log('✅ [AuthStore] Registration successful:', data);
			this.user = data.user;
			return { success: true };
		} catch (err) {
			console.error('❌ [AuthStore] Registration error:', err);
			this.error = err instanceof Error ? err.message : 'Registration failed';
			return { success: false, error: this.error };
		} finally {
			this.loading = false;
		}
	}

	get isAuthenticated() {
		return this.user !== null;
	}

	get dashboardRoute(): string {
		if (!this.user) return '/login';
		switch (this.user.role) {
			case 'client':
				return '/dashboard/client';
			case 'lawyer':
				return '/dashboard/lawyer';
			case 'staff':
				return '/dashboard/staff';
			case 'admin':
				return '/dashboard/admin';
			default:
				return '/dashboard/client';
		}
	}

	get isStaff(): boolean {
		return this.user?.role === 'staff' || this.user?.role === 'lawyer' || this.user?.role === 'admin';
	}

	get isAdmin(): boolean {
		return this.user?.role === 'admin';
	}

	get canEditCases(): boolean {
		return this.user?.role === 'lawyer' || this.user?.role === 'admin';
	}

	async updateProfile(profileData: Partial<Omit<User, 'id' | 'email' | 'role' | 'squareCustomerId' | 'squareCardId' | 'cardLastFour' | 'cardBrand'>>) {
		this.loading = true;
		this.error = null;
		try {
			const response = await fetch('/api/auth/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(profileData)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Profile update failed');
			}

			const data = await response.json();
			this.user = data.user;
			return { success: true };
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Profile update failed';
			return { success: false, error: this.error };
		} finally {
			this.loading = false;
		}
	}

	async logout(): Promise<void> {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			this.user = null;
			this.error = null;
		} catch (err: any) {
			console.error('Logout error:', err);
		}
	}
}

export const authStore = new AuthStore();
