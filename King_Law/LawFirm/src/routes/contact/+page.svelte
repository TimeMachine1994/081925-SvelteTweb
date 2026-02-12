<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="min-h-screen pt-20">
	<!-- Hero Section -->
	<section class="py-24 bg-king-blue">
		<div class="max-w-5xl mx-auto px-6 lg:px-8">
			<p class="text-gold uppercase tracking-[0.3em] text-sm mb-6">Get in Touch</p>
			<h1 class="font-title text-5xl md:text-6xl text-white leading-tight mb-6">
				Let's Start a<br/>Conversation
			</h1>
			<p class="text-xl text-white/70 max-w-2xl">
				Tell us what's on your plate. We'll outline how coordinated legal counsel can simplify your situation — confidentially, with no obligation.
			</p>
		</div>
	</section>

	<!-- Contact Content -->
	<section class="py-24 bg-white dark:bg-background">
		<div class="max-w-6xl mx-auto px-6 lg:px-8">
			<div class="grid lg:grid-cols-12 gap-8 lg:gap-16">
				<!-- Form Column -->
				<div class="lg:col-span-7">
					<p class="text-gold uppercase tracking-[0.3em] text-sm mb-4">Send a Message</p>
					<h2 class="font-title text-3xl text-king-blue dark:text-white mb-8">Tell Us About Your Situation</h2>
					
					{#if form?.success}
						<div class="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-800 dark:text-green-200 px-6 py-4 rounded-r-lg mb-6">
							Thank you for contacting us. We'll get back to you soon!
						</div>
					{/if}

					{#if form?.error}
						<div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 px-6 py-4 rounded-r-lg mb-6">
							{form.error}
						</div>
					{/if}

					<form method="POST" use:enhance class="space-y-6">
						<div class="grid md:grid-cols-2 gap-6">
							<div>
								<label for="name" class="block text-sm font-medium text-king-blue dark:text-white mb-2">Name *</label>
								<input
									type="text"
									id="name"
									name="name"
									required
									class="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-lg bg-gray-50 dark:bg-card dark:text-foreground focus:bg-white dark:focus:bg-card focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"
								/>
							</div>
							<div>
								<label for="phone" class="block text-sm font-medium text-king-blue dark:text-white mb-2">Phone</label>
								<input
									type="tel"
									id="phone"
									name="phone"
									class="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-lg bg-gray-50 dark:bg-card dark:text-foreground focus:bg-white dark:focus:bg-card focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"
								/>
							</div>
						</div>

						<div>
							<label for="email" class="block text-sm font-medium text-king-blue dark:text-white mb-2">Email *</label>
							<input
								type="email"
								id="email"
								name="email"
								required
								class="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-lg bg-gray-50 dark:bg-card dark:text-foreground focus:bg-white dark:focus:bg-card focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"
							/>
						</div>

						<div>
							<label for="subject" class="block text-sm font-medium text-king-blue dark:text-white mb-2">Subject *</label>
							<input
								type="text"
								id="subject"
								name="subject"
								required
								class="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-lg bg-gray-50 dark:bg-card dark:text-foreground focus:bg-white dark:focus:bg-card focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none"
							/>
						</div>

						<div>
							<label for="message" class="block text-sm font-medium text-king-blue dark:text-white mb-2">Message *</label>
							<textarea
								id="message"
								name="message"
								rows="6"
								required
								class="w-full px-4 py-3 border border-gray-200 dark:border-border rounded-lg bg-gray-50 dark:bg-card dark:text-foreground focus:bg-white dark:focus:bg-card focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none resize-none"
							></textarea>
						</div>

						<button
							type="submit"
							class="w-full bg-king-blue hover:bg-king-blue-light text-white font-semibold py-4 px-6 rounded-lg transition-all depth-gold"
						>
							Send Message
						</button>
					</form>
				</div>

				<!-- Info Column -->
				<div class="lg:col-span-5">
					<div class="bg-king-blue rounded-2xl p-6 md:p-8 text-white lg:sticky lg:top-28 depth-card-dark">
						<div class="mb-8 rounded-xl overflow-hidden">
							<img src="https://images1.loopnet.com/i2/Ey6wPQmSPw4GKc2vgW1TWFMUK_CgXKrLqSZeaXBD7RA/110/419-N-Magnolia-Ave-Orlando-FL-Primary-Photo-1-Large.jpg" alt="King Law Firm Office" class="w-full h-48 object-cover" />
						</div>

						<div class="space-y-8">
							<div>
								<p class="text-gold uppercase tracking-[0.2em] text-xs mb-3">Address</p>
								<div class="flex items-center gap-3 mb-1">
									<p class="text-white font-bold text-lg">King Law Firm</p>
									<img src="https://kinglawbucket.s3.us-east-2.amazonaws.com/public/King+Law+Official+Logo++No+BKG.png" alt="King Law" class="h-8 w-auto" />
								</div>
								<p class="text-white/80">
									419 N. Magnolia Ave<br />
									Orlando, FL 32801
								</p>
							</div>

							<div>
								<p class="text-gold uppercase tracking-[0.2em] text-xs mb-3">Phone</p>
								<a href="tel:6893536943" class="text-white hover:text-gold transition-colors text-xl font-semibold">
									(689) 353-6943
								</a>
							</div>

							<div>
								<p class="text-gold uppercase tracking-[0.2em] text-xs mb-3">Email</p>
								<a href="mailto:ben@givekingaring.com" class="text-white/80 hover:text-gold transition-colors">
									ben@givekingaring.com
								</a>
							</div>

							<div>
								<p class="text-gold uppercase tracking-[0.2em] text-xs mb-3">Office Hours</p>
								<p class="text-white/80">
									Monday - Friday: 9:00 AM - 5:00 PM<br />
									Saturday - Sunday: Closed
								</p>
							</div>

							<div class="pt-6 border-t border-white/10">
								<p class="text-gold uppercase tracking-[0.2em] text-xs mb-3">What to Expect</p>
								<ul class="text-white/70 text-sm space-y-2 mb-6">
									<li class="flex items-start gap-2"><span class="text-gold">&#10003;</span> Response within one business day</li>
									<li class="flex items-start gap-2"><span class="text-gold">&#10003;</span> All communications are confidential</li>
									<li class="flex items-start gap-2"><span class="text-gold">&#10003;</span> Clear fee discussion before any engagement</li>
									<li class="flex items-start gap-2"><span class="text-gold">&#10003;</span> Direct attorney access — no gatekeepers</li>
								</ul>
								<p class="text-white/60 text-sm mb-4">
									Already a client? Access your documents and communicate securely.
								</p>
								<a href="/login" class="inline-block bg-gold hover:bg-gold-light text-king-blue px-6 py-3 rounded-lg font-semibold transition-all depth-gold">
									Client Portal →
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</div>
