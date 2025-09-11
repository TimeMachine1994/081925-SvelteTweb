<script lang="ts">
	import { CheckCircle, ArrowLeft, Mail } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Message Sent - TributeStream</title>
	<meta name="description" content="Your message has been sent successfully. We'll get back to you soon." />
</svelte:head>

<div class="bg-gradient-to-b from-yellow-50 to-white min-h-screen flex items-center justify-center px-4">
	<div class="max-w-md mx-auto text-center">
		<div class="bg-white p-8 rounded-2xl shadow-lg border border-yellow-200">
			<!-- Success Icon -->
			<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
				<CheckCircle class="w-8 h-8 text-green-600" />
			</div>
			
			<!-- Success Message -->
			<h1 class="text-2xl font-bold text-gray-900 mb-4">Message Sent Successfully!</h1>
			<p class="text-gray-600 mb-6">
				Thank you for contacting us. We've received your message and will get back to you within 24 hours.
			</p>
			
			<!-- Confirmation Details -->
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
				<div class="flex items-center justify-center mb-2">
					<Mail class="w-5 h-5 text-yellow-600 mr-2" />
					<span class="text-sm font-medium text-yellow-800">Confirmation Email Sent</span>
				</div>
				<p class="text-sm text-yellow-700">
					A confirmation email has been sent to your inbox with a copy of your message.
				</p>
			</div>
			
			<!-- Action Buttons -->
			<div class="space-y-3">
				<a
					href="/contact"
					class="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 text-white rounded-lg hover:from-yellow-700 hover:to-amber-700 transition-all duration-300 font-semibold"
				>
					Send Another Message
				</a>
				
				<a
					href="/"
					class="inline-flex items-center justify-center w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:border-yellow-500 hover:text-yellow-600 transition-all duration-300 font-medium"
				>
					<ArrowLeft class="w-4 h-4 mr-2" />
					Back to Home
				</a>
			</div>
		</div>
		
		<!-- Additional Info -->
		<div class="mt-8 text-center">
			<p class="text-sm text-gray-500">
				Need immediate assistance? Call us at <strong>1-800-TRIBUTE</strong>
			</p>
		</div>
	</div>
</div>
