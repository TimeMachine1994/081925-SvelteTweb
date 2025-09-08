<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { CheckCircle, Download, Mail, Calendar, MapPin, Phone, User, CreditCard } from 'lucide-svelte';

  let receiptData: any = null;
  let emailSent = false;
  let sendingEmail = false;

  // Load receipt data from URL params
  onMount(async () => {
    if (browser) {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedData = urlParams.get('data');
      
      if (encodedData) {
        try {
          receiptData = JSON.parse(decodeURIComponent(encodedData));
          console.log('🧾 Receipt data loaded:', receiptData);
          
          // Send confirmation email
          await sendConfirmationEmail();
          
          // Lock the schedule
          await lockSchedule();
          
        } catch (e) {
          console.error('Failed to parse receipt data:', e);
          goto('/my-portal');
        }
      } else {
        goto('/my-portal');
      }
    }
  });

  async function sendConfirmationEmail() {
    if (!receiptData) return;
    
    sendingEmail = true;
    try {
      const response = await fetch('/api/send-confirmation-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptData,
          customerEmail: receiptData.customerInfo.email
        }),
      });

      if (response.ok) {
        emailSent = true;
        console.log('✅ Confirmation email sent successfully');
      } else {
        console.error('Failed to send confirmation email');
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    } finally {
      sendingEmail = false;
    }
  }

  async function lockSchedule() {
    if (!receiptData) return;
    
    try {
      const response = await fetch('/api/lock-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: receiptData.paymentIntentId,
          bookingData: receiptData.bookingData,
          customerInfo: receiptData.customerInfo
        }),
      });

      if (response.ok) {
        console.log('🔒 Schedule locked successfully');
      } else {
        console.error('Failed to lock schedule');
      }
    } catch (error) {
      console.error('Error locking schedule:', error);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function downloadReceipt() {
    if (!receiptData) return;
    
    // Create a simple text receipt
    const receiptText = `
TRIBUTESTREAM PAYMENT RECEIPT
=============================

Payment Date: ${formatDate(receiptData.paymentDate)}
Payment ID: ${receiptData.paymentIntentId}

CUSTOMER INFORMATION
-------------------
Name: ${receiptData.customerInfo.firstName} ${receiptData.customerInfo.lastName}
Email: ${receiptData.customerInfo.email}
Phone: ${receiptData.customerInfo.phone || 'Not provided'}

BILLING ADDRESS
--------------
${receiptData.customerInfo.address.line1}
${receiptData.customerInfo.address.line2 ? receiptData.customerInfo.address.line2 + '\n' : ''}${receiptData.customerInfo.address.city}, ${receiptData.customerInfo.address.state} ${receiptData.customerInfo.address.postal_code}

ORDER DETAILS
------------
${receiptData.bookingData.items.map(item => 
  `${item.name}${item.quantity > 1 ? ` (${item.quantity}x $${item.price})` : ''}: ${formatCurrency(item.total)}`
).join('\n')}

TOTAL: ${formatCurrency(receiptData.bookingData.total)}

Thank you for choosing TributeStream!
`;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TributeStream-Receipt-${receiptData.paymentIntentId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>Payment Successful - TributeStream</title>
  <meta name="description" content="Your TributeStream payment has been processed successfully" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
  <div class="max-w-4xl mx-auto px-4">
    {#if receiptData}
      <!-- Success Header -->
      <div class="text-center mb-8">
        <div class="flex items-center justify-center mb-4">
          <CheckCircle class="w-16 h-16 text-green-500" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p class="text-lg text-gray-600">Your TributeStream service has been booked and confirmed</p>
        
        <!-- Email Status -->
        <div class="mt-4 flex items-center justify-center space-x-2">
          {#if sendingEmail}
            <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm text-blue-600">Sending confirmation email...</span>
          {:else if emailSent}
            <Mail class="w-4 h-4 text-green-500" />
            <span class="text-sm text-green-600">Confirmation email sent to {receiptData.customerInfo.email}</span>
          {:else}
            <Mail class="w-4 h-4 text-gray-400" />
            <span class="text-sm text-gray-500">Email confirmation pending</span>
          {/if}
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Receipt Details -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Receipt Details</h2>
            <button
              on:click={downloadReceipt}
              class="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <Download class="w-4 h-4 mr-2" />
              Download
            </button>
          </div>

          <!-- Payment Information -->
          <div class="space-y-4 mb-6">
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <span class="text-sm text-gray-600">Payment Date</span>
              <span class="font-medium">{formatDate(receiptData.paymentDate)}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <span class="text-sm text-gray-600">Payment ID</span>
              <span class="font-mono text-sm">{receiptData.paymentIntentId}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <span class="text-sm text-gray-600">Status</span>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle class="w-3 h-3 mr-1" />
                Paid
              </span>
            </div>
          </div>

          <!-- Customer Information -->
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User class="w-5 h-5 mr-2 text-blue-500" />
              Customer Information
            </h3>
            <div class="space-y-2 text-sm">
              <p><strong>Name:</strong> {receiptData.customerInfo.firstName} {receiptData.customerInfo.lastName}</p>
              <p class="flex items-center">
                <Mail class="w-4 h-4 mr-2 text-gray-400" />
                {receiptData.customerInfo.email}
              </p>
              {#if receiptData.customerInfo.phone}
                <p class="flex items-center">
                  <Phone class="w-4 h-4 mr-2 text-gray-400" />
                  {receiptData.customerInfo.phone}
                </p>
              {/if}
              <div class="flex items-start mt-3">
                <MapPin class="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                <div>
                  <p>{receiptData.customerInfo.address.line1}</p>
                  {#if receiptData.customerInfo.address.line2}
                    <p>{receiptData.customerInfo.address.line2}</p>
                  {/if}
                  <p>{receiptData.customerInfo.address.city}, {receiptData.customerInfo.address.state} {receiptData.customerInfo.address.postal_code}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
          
          <div class="space-y-3 mb-6">
            {#each receiptData.bookingData.items as item}
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
              <span class="text-gray-900">Total Paid</span>
              <span class="text-green-600">{formatCurrency(receiptData.bookingData.total)}</span>
            </div>
          </div>

          <!-- Next Steps -->
          <div class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 class="font-medium text-blue-900 mb-2 flex items-center">
              <Calendar class="w-5 h-5 mr-2" />
              What's Next?
            </h3>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>• Your schedule has been locked and confirmed</li>
              <li>• You'll receive a confirmation email with service details</li>
              <li>• Our team will contact you within 24 hours to coordinate</li>
              <li>• Access your booking details anytime in your portal</li>
            </ul>
          </div>

          <!-- Action Buttons -->
          <div class="mt-6 space-y-3">
            <a
              href="/my-portal"
              class="w-full inline-block text-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300"
            >
              Go to My Portal
            </a>
            <a
              href="/schedule"
              class="w-full inline-block text-center border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Schedule Another Service
            </a>
          </div>
        </div>
      </div>

      <!-- Support Information -->
      <div class="mt-8 bg-white rounded-lg shadow-lg p-6 text-center">
        <h3 class="text-lg font-medium text-gray-900 mb-2">Need Help?</h3>
        <p class="text-gray-600 mb-4">Our support team is here to assist you with any questions about your booking.</p>
        <div class="flex items-center justify-center space-x-6 text-sm">
          <a href="mailto:support@tributestream.com" class="flex items-center text-blue-600 hover:text-blue-700">
            <Mail class="w-4 h-4 mr-2" />
            support@tributestream.com
          </a>
          <a href="tel:+1-555-123-4567" class="flex items-center text-blue-600 hover:text-blue-700">
            <Phone class="w-4 h-4 mr-2" />
            (555) 123-4567
          </a>
        </div>
      </div>
    {:else}
      <div class="bg-white rounded-lg shadow-lg p-8 text-center">
        <p class="text-gray-600">Loading receipt information...</p>
      </div>
    {/if}
  </div>
</div>
