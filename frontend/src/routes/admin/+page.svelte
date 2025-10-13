<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth, db } from '$lib/firebase';
	import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
	import { createUserWithEmailAndPassword } from 'firebase/auth';
	import { generateSlug } from '$lib/utils/slug';
	import { sendRegistrationEmail } from '$lib/utils/email';
	import { logAdminAction } from '$lib/utils/audit';
	import type { Memorial } from '$lib/types/memorial';
	import Button from '$lib/ui/primitives/Button.svelte';
	let processingId = $state<string | null>(null);

	onMount(() => {
		console.log('🏛️ [ADMIN PAGE] Simplified admin dashboard mounted');
		console.log('📊 [ADMIN PAGE] Data loaded:', {
			recentMemorials: data.recentMemorials?.length || 0,
{{ ... }}
													{memorial.hasLivestream ? '🔴 Active' : '⚫ Inactive'}
												</p>
											</div>
										</div>
										<div class="ml-4">
											<Button
											variant="role"
											role="admin"
											size="sm"
											href="/{memorial.fullSlug}"
											target="_blank"
										>
											View Memorial
											</Button>
										</div>
									</div>
								</div>
							{/each}
						</div>
{{ ... }}
						<p class="mb-6 text-gray-600">
							Create a new memorial for a family. The system will automatically generate login
							credentials and send them via email.
						</p>

						<Button
						variant="role"
						role="admin"
						size="lg"
						fullWidth
						onclick={createMemorial}
						disabled={!!processingId}
						loading={!!processingId}
					>
						{processingId ? 'Processing...' : 'Create New Memorial'}
					</Button>

						<div class="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
							<h4 class="mb-2 font-medium text-yellow-900">
								What happens when you create a memorial:
							</h4>
{{ ... }}
								<li>• Creates Firebase Auth user account</li>
								<li>• Generates memorial with unique slug</li>
								<li>• Sends login credentials via email</li>
								<li>• Owner can immediately access their memorial</li>
								<li>• Follows same flow as public registration</li>
							</ul>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
