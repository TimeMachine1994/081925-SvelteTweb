<script>
  let showModal = false;
</script>

<svelte:head>
  <title>Theme Showcase</title>
  <meta name="description" content="A showcase of all UI components for this application." />
</svelte:head>

<div class="p-8 bg-background text-foreground">
  <h1 class="text-4xl font-bold mb-8">Theme Showcase</h1>

  <!-- Sections will be added here -->
  <div class="space-y-12">
    <!-- Foundations Section -->
    <section>
      <h2 class="text-2xl font-semibold border-b border-border pb-2 mb-4">Foundations</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Color Palette -->
        <div>
          <h3 class="text-xl font-semibold mb-4">Color Palette</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="w-full h-20 bg-primary rounded-lg shadow-md"></div>
              <p class="mt-2 text-sm">Primary</p>
            </div>
            <div class="text-center">
              <div class="w-full h-20 bg-secondary rounded-lg shadow-md"></div>
              <p class="mt-2 text-sm">Secondary</p>
            </div>
            <div class="text-center">
              <div class="w-full h-20 bg-accent rounded-lg shadow-md"></div>
              <p class="mt-2 text-sm">Accent</p>
            </div>
            <div class="text-center">
              <div class="w-full h-20 bg-destructive rounded-lg shadow-md"></div>
              <p class="mt-2 text-sm">Destructive</p>
            </div>
            <div class="text-center">
              <div class="w-full h-20 bg-background rounded-lg shadow-md border border-border"></div>
              <p class="mt-2 text-sm">Background</p>
            </div>
            <div class="text-center">
              <div class="w-full h-20 bg-foreground rounded-lg shadow-md"></div>
              <p class="mt-2 text-sm">Foreground</p>
            </div>
            <div class="text-center">
              <div class="w-full h-20 bg-card rounded-lg shadow-md border border-border"></div>
              <p class="mt-2 text-sm">Card</p>
            </div>
            <div class="text-center">
              <div class="w-full h-20 bg-border rounded-lg shadow-md"></div>
              <p class="mt-2 text-sm">Border</p>
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
            <h4>h4: The quick brown fox jumps over the lazy dog</h4>
            <h5>h5: The quick brown fox jumps over the lazy dog</h5>
            <h6>h6: The quick brown fox jumps over the lazy dog</h6>
            <p>
              p: The quick brown fox jumps over the lazy dog. This is a paragraph of text to demonstrate the default body copy style. It also includes a <a href="javascript:void(0);" class="text-primary hover:underline">link</a> to show how hyperlinks are styled.
            </p>
            <blockquote>
              "This is a blockquote. It's used for pulling out important statements or quotes."
            </blockquote>
          </div>
        </div>
      </div>
    </section>

    <!-- Core Interactive Elements Section -->
    <section>
      <h2 class="text-2xl font-semibold border-b border-border pb-2 mb-4">Core Interactive Elements</h2>
      <div class="space-y-8">
        <!-- Buttons -->
        <div>
          <h3 class="text-xl font-semibold mb-4">Buttons</h3>
          <div class="flex flex-wrap items-center gap-4">
            <button class="bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-primary-hover transition-colors">Primary</button>
            <button class="bg-secondary text-white py-2 px-4 rounded-lg shadow-md hover:bg-secondary-hover transition-colors">Secondary</button>
            <button class="bg-accent text-white py-2 px-4 rounded-lg shadow-md hover:bg-accent-hover transition-colors">Accent</button>
            <button class="bg-destructive text-white py-2 px-4 rounded-lg shadow-md hover:bg-destructive-hover transition-colors">Destructive</button>
            <button class="bg-primary text-white py-2 px-4 rounded-lg shadow-md opacity-50 cursor-not-allowed" disabled>Disabled</button>
          </div>
        </div>

        <!-- Form Elements -->
        <div>
          <h3 class="text-xl font-semibold mb-4">Form Elements</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-4">
              <div>
                <label for="text-input" class="block text-sm font-medium text-gray-700">Text Input</label>
                <input type="text" id="text-input" placeholder="Enter your name" class="mt-1 block w-full px-3 py-2 bg-white border border-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
              </div>
              <div>
                <label for="select" class="block text-sm font-medium text-gray-700">Select Dropdown</label>
                <select id="select" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
              <div>
                <label for="textarea" class="block text-sm font-medium text-gray-700">Textarea</label>
                <textarea id="textarea" rows="4" placeholder="Your message..." class="mt-1 block w-full px-3 py-2 bg-white border border-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"></textarea>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <p class="text-sm font-medium text-gray-700">Checkboxes</p>
                <div class="mt-2 space-y-2">
                  <div class="flex items-center">
                    <input id="checkbox1" type="checkbox" class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded">
                    <label for="checkbox1" class="ml-2 block text-sm text-gray-900">Checkbox option 1</label>
                  </div>
                  <div class="flex items-center">
                    <input id="checkbox2" type="checkbox" checked class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded">
                    <label for="checkbox2" class="ml-2 block text-sm text-gray-900">Checked checkbox</label>
                  </div>
                </div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-700">Radio Buttons</p>
                <div class="mt-2 space-y-2">
                  <div class="flex items-center">
                    <input id="radio1" type="radio" name="radio-group" class="h-4 w-4 text-primary focus:ring-primary border-gray-300">
                    <label for="radio1" class="ml-2 block text-sm text-gray-900">Radio option 1</label>
                  </div>
                  <div class="flex items-center">
                    <input id="radio2" type="radio" name="radio-group" checked class="h-4 w-4 text-primary focus:ring-primary border-gray-300">
                    <label for="radio2" class="ml-2 block text-sm text-gray-900">Selected radio</label>
                  </div>
                </div>
              </div>
              <div>
                <label for="text-input-error" class="block text-sm font-medium text-gray-700">Input with Error</label>
                <input type="text" id="text-input-error" value="invalid.email@com" class="mt-1 block w-full px-3 py-2 bg-white border border-destructive rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-destructive focus:border-destructive sm:text-sm">
                <p class="mt-2 text-sm text-destructive">Please enter a valid email address.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Composite Components Section -->
    <section>
      <h2 class="text-2xl font-semibold border-b border-border pb-2 mb-4">Composite Components</h2>
      <div class="space-y-8">
        <!-- Cards -->
        <div>
          <h3 class="text-xl font-semibold mb-4">Cards</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div class="bg-card rounded-lg shadow-md overflow-hidden border border-border">
              <img src="https://via.placeholder.com/400x200" alt="Placeholder" class="w-full h-40 object-cover">
              <div class="p-6">
                <h4 class="text-lg font-bold">Card Title</h4>
                <p class="mt-2 text-sm text-gray-600">This is a sample card component. It's great for displaying content in a structured and visually appealing way.</p>
                <div class="mt-4">
                  <button class="bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-primary-hover transition-colors text-sm">Read More</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerts -->
        <div>
          <h3 class="text-xl font-semibold mb-4">Alerts</h3>
          <div class="space-y-4">
            <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
              <p class="font-bold">Informational</p>
              <p>This is an informational alert.</p>
            </div>
            <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
              <p class="font-bold">Success</p>
              <p>Your action was completed successfully.</p>
            </div>
            <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
              <p class="font-bold">Warning</p>
              <p>Please be aware of this important notice.</p>
            </div>
            <div class="bg-red-100 border-l-4 border-destructive text-red-700 p-4" role="alert">
              <p class="font-bold">Error</p>
              <p>Something went wrong. Please try again.</p>
            </div>
          </div>
        </div>

        <!-- Modals -->
        <div>
          <h3 class="text-xl font-semibold mb-4">Modals</h3>
          <button on:click={() => showModal = true} class="bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-primary-hover transition-colors">Open Modal</button>

          {#if showModal}
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div class="bg-card p-8 rounded-lg shadow-2xl max-w-sm w-full">
                <h4 class="text-lg font-bold mb-4">Modal Title</h4>
                <p class="text-sm text-gray-600 mb-6">This is the content of the modal. It can contain any information or actions you need.</p>
                <div class="flex justify-end space-x-4">
                  <button on:click={() => showModal = false} class="bg-secondary text-white py-2 px-4 rounded-lg shadow-md hover:bg-secondary-hover transition-colors">Close</button>
                  <button on:click={() => showModal = false} class="bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-primary-hover transition-colors">Confirm</button>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </section>
  </div>
</div>