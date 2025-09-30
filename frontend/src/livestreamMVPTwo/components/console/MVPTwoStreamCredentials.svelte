<script lang="ts">
  export let credentials: {
    streamKey: string;
    streamUrl: string;
    playbackUrl: string;
  };

  let copied = '';

  async function copyToClipboard(text: string, type: string) {
    try {
      await navigator.clipboard.writeText(text);
      copied = type;
      setTimeout(() => copied = '', 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
</script>

<div class="space-y-4">
  <!-- Stream URL -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">RTMP Server URL</label>
    <div class="flex">
      <input
        type="text"
        value={credentials.streamUrl}
        readonly
        class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-mono"
      />
      <button
        onclick={() => copyToClipboard(credentials.streamUrl, 'url')}
        class="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 text-sm"
      >
        {copied === 'url' ? '✓' : 'Copy'}
      </button>
    </div>
  </div>

  <!-- Stream Key -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">Stream Key</label>
    <div class="flex">
      <input
        type="password"
        value={credentials.streamKey}
        readonly
        class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-mono"
      />
      <button
        onclick={() => copyToClipboard(credentials.streamKey, 'key')}
        class="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 text-sm"
      >
        {copied === 'key' ? '✓' : 'Copy'}
      </button>
    </div>
    <p class="text-xs text-gray-500 mt-1">Keep this private - it's your streaming password</p>
  </div>

  <!-- Connection Instructions -->
  <div class="bg-blue-50 rounded-lg p-4 mt-6">
    <h3 class="font-semibold text-blue-900 mb-2">📱 Mobile Streaming Apps</h3>
    <div class="space-y-2 text-sm text-blue-800">
      <p><strong>iOS:</strong> Larix Broadcaster, Prism Live Studio</p>
      <p><strong>Android:</strong> Larix Broadcaster, Streamlabs</p>
    </div>
  </div>

  <div class="bg-green-50 rounded-lg p-4">
    <h3 class="font-semibold text-green-900 mb-2">💻 Desktop Software</h3>
    <div class="space-y-2 text-sm text-green-800">
      <p><strong>Free:</strong> OBS Studio, Streamlabs Desktop</p>
      <p><strong>Professional:</strong> Wirecast, XSplit</p>
    </div>
  </div>

  <div class="bg-gray-50 rounded-lg p-4">
    <h3 class="font-semibold text-gray-900 mb-2">🔧 Quick Setup</h3>
    <ol class="list-decimal list-inside space-y-1 text-sm text-gray-700">
      <li>Open your streaming app (OBS, Larix, etc.)</li>
      <li>Choose "Custom RTMP" or "Custom Server"</li>
      <li>Paste the Server URL above</li>
      <li>Paste the Stream Key above</li>
      <li><strong>Start streaming in your app first</strong></li>
      <li>Then click "Start Broadcast" here</li>
    </ol>
  </div>

  <div class="bg-yellow-50 rounded-lg p-4 mt-4">
    <h3 class="font-semibold text-yellow-900 mb-2">⚠️ Important</h3>
    <p class="text-sm text-yellow-800">
      The camera preview above is for setup only. To broadcast live video, you must use streaming software like OBS Studio or a mobile app like Larix Broadcaster with the credentials above.
    </p>
  </div>
</div>
