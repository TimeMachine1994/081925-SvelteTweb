<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { CreditCard, Lock, MapPin, User, Mail, Phone, RefreshCw } from 'lucide-svelte';
  import { stripeConfig, validateStripeConfig } from '$lib/config/stripe';
  import { retryPayment, getPaymentErrorMessage, validatePaymentAmount } from '$lib/utils/paymentStatus';

  let { data } = $props();
  
  // Payment data from URL params or server data
  let bookingData = $state(data?.bookingData || null);
  let stripe: any = $state(null);
  let elements: any = $state(null);
  let cardElement: any = $state(null);
  
  // Form state using runes
  let isProcessing = $state(false);
  let paymentError = $state('');
  let paymentSuccess = $state(false);
  let retryCount = $state(0);
  let canRetry = $state(true);
  
  // Customer information using runes
  let customerInfo = $state({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  });

  // Load booking data from URL params if not provided via server data
  onMount(async () => {
    if (browser) {
      // If no booking data from server, try URL params (fallback)
      if (!bookingData) {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('data');
        
        if (encodedData) {
          try {
            bookingData = JSON.parse(decodeURIComponent(encodedData));
            console.log('📦 Booking data loaded from URL:', bookingData);
          } catch (e) {
            console.error('Failed to parse booking data:', e);
            goto('/schedule');
            return;
          }
        } else {
          goto('/schedule');
          return;
        }
      } else {
        console.log('📦 Booking data loaded from server:', bookingData);
      }

      // Initialize Stripe
      await initializeStripe();
    }
  });

  async function initializeStripe() {
    try {
      // Validate Stripe configuration
      const configValidation = validateStripeConfig();
      if (!configValidation.isValid) {
        paymentError = configValidation.error || 'Stripe configuration error';
        return;
      }

      // Load Stripe.js
      const stripeScript = document.createElement('script');
      stripeScript.src = 'https://js.stripe.com/v3/';
      document.head.appendChild(stripeScript);
      
      stripeScript.onload = () => {
        stripe = (window as any).Stripe(stripeConfig.publishableKey);
        
        elements = stripe.elements({
          appearance: stripeConfig.appearance
        });

        // Create card element
        cardElement = elements.create('card', stripeConfig.cardElementOptions);
        
        cardElement.mount('#card-element');
        
        cardElement.on('change', (event: any) => {
          if (event.error) {
            paymentError = event.error.message;
          } else {
            paymentError = '';
          }
        });
      };

      stripeScript.onerror = () => {
        paymentError = 'Failed to load Stripe. Please check your internet connection and try again.';
      };
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      paymentError = 'Failed to load payment system. Please try again.';
    }
  }

  async function handleSubmit() {
    if (!stripe || !cardElement || !bookingData) {
      paymentError = 'Payment system not ready. Please try again.';
      return;
    }

    // Validate form
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || 
        !customerInfo.address.line1 || !customerInfo.address.city || 
        !customerInfo.address.state || !customerInfo.address.postal_code) {
      paymentError = 'Please fill in all required fields.';
      return;
    }

    // Validate payment amount
    const amountValidation = validatePaymentAmount(bookingData.total);
    if (!amountValidation.isValid) {
      paymentError = amountValidation.error || 'Invalid payment amount';
      return;
    }

    await processPayment();
  }

  async function processPayment() {
    isProcessing = true;
    paymentError = '';

    try {
      await retryPayment(async () => {
        // Create payment intent on server
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(bookingData.total * 100), // Convert to cents
            currency: 'usd',
            bookingData,
            customerInfo
          }),
        });

        const { client_secret, error } = await response.json();

        if (error) {
          throw new Error(error);
        }

        // Confirm payment with Stripe
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${customerInfo.firstName} ${customerInfo.lastName}`,
              email: customerInfo.email,
              phone: customerInfo.phone,
              address: customerInfo.address,
            },
          },
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        if (paymentIntent.status === 'succeeded') {
          // Payment successful - redirect to receipt page
          const receiptData = {
            paymentIntentId: paymentIntent.id,
            bookingData,
            customerInfo,
            paymentDate: new Date().toISOString()
          };
          
          const encodedReceiptData = encodeURIComponent(JSON.stringify(receiptData));
          goto(`/payment/receipt?data=${encodedReceiptData}`);
        } else {
          throw new Error(`Payment status: ${paymentIntent.status}`);
        }
      }, 3); // Max 3 retries

    } catch (error: unknown) {
      console.error('Payment failed after retries:', error);
      paymentError = getPaymentErrorMessage(error);
      canRetry = true;
      retryCount++;
    } finally {
      isProcessing = false;
    }
  }

  async function handleRetry() {
    if (retryCount >= 3) {
      paymentError = 'Maximum retry attempts reached. Please try again later or contact support.';
      canRetry = false;
      return;
    }
    
    await processPayment();
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
</script>

<svelte:head>
  <title>Payment - TributeStream</title>
  <meta name="description" content="Complete your TributeStream booking payment" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
  <div class="max-w-4xl mx-auto px-4">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="flex items-center justify-center mb-4">
        <CreditCard class="w-8 h-8 text-amber-500 mr-3" />
        <h1 class="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
      </div>
      <p class="text-gray-600">Secure payment powered by Stripe</p>
    </div>

    {#if bookingData}
      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Payment Form -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <User class="w-5 h-5 mr-2 text-amber-500" />
            Customer Information
          </h2>

          <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            <!-- Name Fields -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  bind:value={customerInfo.firstName}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  type="text"
                  bind:value={customerInfo.lastName}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <!-- Contact Fields -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Mail class="w-4 h-4 mr-1" />
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                bind:value={customerInfo.email}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Phone class="w-4 h-4 mr-1" />
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                bind:value={customerInfo.phone}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <!-- Address Section -->
            <div class="pt-4 border-t border-gray-200">
              <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin class="w-5 h-5 mr-2 text-amber-500" />
                Billing Address
              </h3>

              <div class="space-y-4">
                <div>
                  <label for="address1" class="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    id="address1"
                    type="text"
                    bind:value={customerInfo.address.line1}
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label for="address2" class="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    id="address2"
                    type="text"
                    bind:value={customerInfo.address.line2}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      id="city"
                      type="text"
                      bind:value={customerInfo.address.city}
                      required
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label for="state" class="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      id="state"
                      type="text"
                      bind:value={customerInfo.address.state}
                      required
                      placeholder="CA"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label for="postalCode" class="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    bind:value={customerInfo.address.postal_code}
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <!-- Payment Method -->
            <div class="pt-4 border-t border-gray-200">
              <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Lock class="w-5 h-5 mr-2 text-amber-500" />
                Payment Method
              </h3>
              
              <div id="card-element" class="p-3 border border-gray-300 rounded-md bg-white">
                <!-- Stripe Elements will create form elements here -->
              </div>
            </div>

            <!-- Error Display -->
            {#if paymentError}
              <div class="bg-red-50 border border-red-200 rounded-md p-4">
                <p class="text-sm text-red-600 mb-2">{paymentError}</p>
                {#if canRetry && retryCount < 3}
                  <button
                    type="button"
                    on:click={handleRetry}
                    disabled={isProcessing}
                    class="inline-flex items-center px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw class="w-3 h-3 mr-1" />
                    Try Again ({3 - retryCount} attempts left)
                  </button>
                {/if}
                {#if retryCount > 0}
                  <p class="text-xs text-red-500 mt-1">Attempt {retryCount + 1} of 3</p>
                {/if}
              </div>
            {/if}

            <!-- Submit Button -->
            <button
              type="submit"
              disabled={isProcessing}
              class="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 disabled:cursor-not-allowed"
            >
              {#if isProcessing}
                <div class="flex items-center justify-center">
                  <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing Payment...
                </div>
              {:else}
                Complete Payment - {formatCurrency(bookingData.total)}
              {/if}
            </button>
          </form>
        </div>

        <!-- Order Summary -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
          
          <div class="space-y-3 mb-6">
            {#each bookingData.items as item}
              <div class="flex justify-between text-sm">
                <span class="flex-1 text-gray-700">
                  {item.name}
                  {#if item.quantity > 1}
                    <span class="text-gray-500">({item.quantity}x {formatCurrency(item.price)})</span>
                  {/if}
                </span>
                <span class="font-medium text-gray-900">{formatCurrency(item.total)}</span>
              </div>
            {/each}
          </div>
          
          <div class="border-t border-gray-200 pt-4">
            <div class="flex justify-between items-center text-xl font-bold">
              <span class="text-gray-900">Total</span>
              <span class="text-amber-600">{formatCurrency(bookingData.total)}</span>
            </div>
            <p class="text-sm text-gray-500 mt-2">One-time payment</p>
          </div>

          <!-- Security Notice -->
          <div class="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div class="flex items-center">
              <Lock class="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p class="text-sm font-medium text-green-800">Secure Payment</p>
                <p class="text-xs text-green-600">Your payment information is encrypted and secure</p>
              </div>
            </div>
          </div>

          <!-- Back to Schedule -->
          <div class="mt-6">
            <a
              href="/schedule"
              class="w-full inline-block text-center border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              ← Back to Schedule
            </a>
          </div>
        </div>
      </div>
    {:else}
      <div class="bg-white rounded-lg shadow-lg p-8 text-center">
        <p class="text-gray-600">Loading payment information...</p>
      </div>
    {/if}
  </div>
</div>
