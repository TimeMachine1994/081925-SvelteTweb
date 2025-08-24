<script>
  import './theme.css';
  let showModal = false;
  let isDarkMode = false;

  function toggleTheme() {
    isDarkMode = !isDarkMode;
  }
</script>

<svelte:head>
  <title>Theme Showcase 2</title>
  <meta name="description" content="A showcase of all UI components for this application." />
</svelte:head>

<div class:theme-aero-light={!isDarkMode} class:theme-aero-dark={isDarkMode} class="p-8">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-4xl font-bold">Theme Showcase 2</h1>
    <button on:click={toggleTheme} class="glossy-button py-2 px-4 rounded-lg" style="background-color: var(--theme-secondary); color: var(--theme-background);">
      Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
    </button>
  </div>

  <!-- Sections will be added here -->
  <div class="space-y-12">
    <!-- Foundations Section -->
        <section>
          <h2 class="text-2xl font-semibold pb-2 mb-4" style="border-bottom: 1px solid var(--theme-secondary);">Foundations</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Color Palette -->
            <div>
              <h3 class="text-xl font-semibold mb-4">Color Palette</h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div class="text-center">
                  <div class="w-full h-20 rounded-lg shadow-md" style="background-color: var(--theme-primary);"></div>
                  <p class="mt-2 text-sm">Primary</p>
                </div>
                <div class="text-center">
                  <div class="w-full h-20 rounded-lg shadow-md" style="background-color: var(--theme-secondary);"></div>
                  <p class="mt-2 text-sm">Secondary</p>
                </div>
              </div>
            </div>
    
            <!-- Typography -->
            <div>
              <h3 class="text-xl font-semibold mb-4">Typography</h3>
              <div class="space-y-4">
                <h1>h1: The quick brown fox jumps over the lazy dog</h1>
                <h2>h2: The quick brown fox jumps over the lazy dog</h2>
                <h3>h3: The quick brown fox jumps over the lazy dog</h3>
                <p>
                  p: The quick brown fox jumps over the lazy dog. It also includes a <a href="#" style="color: var(--theme-primary);">link</a>.
                </p>
                <blockquote>
                  "This is a blockquote."
                </blockquote>
              </div>
            </div>
          </div>
        </section>
    
        <!-- Core Interactive Elements Section -->
        <section>
          <h2 class="text-2xl font-semibold pb-2 mb-4" style="border-bottom: 1px solid var(--theme-secondary);">Core Interactive Elements</h2>
          <div class="space-y-8">
            <!-- Buttons -->
            <div>
              <h3 class="text-xl font-semibold mb-4">Buttons</h3>
              <div class="flex flex-wrap items-center gap-4">
                <button class="glossy-button py-2 px-4 rounded-lg" style="background-color: var(--theme-primary); color: var(--theme-background);">Primary</button>
                <button class="glossy-button py-2 px-4 rounded-lg" style="background-color: var(--theme-secondary); color: var(--theme-background);">Secondary</button>
              </div>
            </div>
    
            <!-- Form Elements -->
            <div>
              <h3 class="text-xl font-semibold mb-4">Form Elements</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-4">
                  <div>
                    <label for="text-input" class="block text-sm font-medium">Text Input</label>
                    <input type="text" id="text-input" placeholder="Enter your name" class="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none sm:text-sm glass-card">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
    
        <!-- Composite Components Section -->
        <section>
          <h2 class="text-2xl font-semibold pb-2 mb-4" style="border-bottom: 1px solid var(--theme-secondary);">Composite Components</h2>
          <div class="space-y-8">
            <!-- Cards -->
            <div>
              <h3 class="text-xl font-semibold mb-4">Cards</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div class="glass-card overflow-hidden">
                  <img src="https://via.placeholder.com/400x200" alt="Placeholder" class="w-full h-40 object-cover">
                  <div class="p-6">
                    <h4 class="text-lg font-bold">Card Title</h4>
                    <p class="mt-2 text-sm">This is a sample card component.</p>
                    <div class="mt-4">
                      <button class="glossy-button py-2 px-4 rounded-lg text-sm" style="background-color: var(--theme-primary); color: var(--theme-background);">Read More</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
    
            <!-- Modals -->
            <div>
              <h3 class="text-xl font-semibold mb-4">Modals</h3>
              <button on:click={() => showModal = true} class="glossy-button py-2 px-4 rounded-lg" style="background-color: var(--theme-primary); color: var(--theme-background);">Open Modal</button>
    
              {#if showModal}
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div class="glass-card p-8 rounded-lg max-w-sm w-full">
                    <h4 class="text-lg font-bold mb-4">Modal Title</h4>
                    <p class="text-sm mb-6">This is the content of the modal.</p>
                    <div class="flex justify-end space-x-4">
                      <button on:click={() => showModal = false} class="glossy-button py-2 px-4 rounded-lg" style="background-color: var(--theme-secondary); color: var(--theme-background);">Close</button>
                      <button on:click={() => showModal = false} class="glossy-button py-2 px-4 rounded-lg" style="background-color: var(--theme-primary); color: var(--theme-background);">Confirm</button>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </section>
  </div>
</div>