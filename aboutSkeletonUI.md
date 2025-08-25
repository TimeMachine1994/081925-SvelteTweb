Components
Skeleton also offers optional component packages for select frameworks, each component automatically adapt to Skeleton’s design system.

Framework	NPM Package	Description
Svelte	@skeletonlabs/skeleton-svelte	Contains all components and features for Svelte.
Powered by Zag.js
Skeleton’s components are built on Zag.js, which provides a collection of framework-agnostic UI component patterns to manage logic and state. Zag was founded and maintained by industry veterans, such Segun Adebayo - the creator and core maintainer for Chakra UI.

View Zag.js

Importing Component
Import the component you wish to use from your framework package of choice, then insert it into your page template.

import { Avatar } from '@skeletonlabs/skeleton-svelte';

<Avatar />

Component Props
Skeleton components properties (aka “props”) are loosely defined into the following categories:

Functional Props - directly affect the functionality of the component, such as an open or src.
Style Props - accept Tailwind utility classes to affect styling, such as background for background color.
Event Props - callback functions that trigger upon interaction, such as onclick, onkeypress, and more.
In the example below, we set functional props for src and alt, while also including a style prop for background.

<Avatar src={someUrl} alt="Jane" background="bg-red-500" />

Style Props
Skeleton components are styled by default out of the box. However, if you wish to customize the look and feel, then you may do so utilizing Style Props. These fall into a few sub-categories.

base - the default styles for each component template element, implemented by default.
{property} - take individual utility classes to customize styling, such as background, padding, or margin.
classes - allows you to pass any arbitrary utility classes and extend the class list. Note this is plural.
Imagine the Avatar component was created like so:

Example Props
{
  src = './some-placeholder.jpg',
  alt = '',
  // ...
  base = 'flex justify-center items-center overflow-hidden',
  background = 'bg-slate-500',
  rounded = 'rounded-full',
  // ...
  classes = '',
}

Example Template
<figure class="{base} {background} {size} {font} {border} {rounded} {shadow} {classes}">
  <img {src} alt={name} class="{imageBase} {imageClasses}" />
</figure>

We can use the background style prop to replace the default background color.

<Avatar background="bg-blue-500">Sk</Avatar>

Since the component doesn’t have a dedicated border prop, we can extend our class list using classes.

<Avatar classes="border-4 border-green-500">Sk</Avatar>

And we can optionally replace the default base styles like so. Just remember our other {property} styles will remain.

<Avatar base="flex justify-center items-center overflow-visible">Sk</Avatar>

Additionally, child elements within the template use these same conventions, but prefixed like imageBase and imageClasses.

<Avatar ... imageClasses="grayscale" />

Consult each component’s API reference for a complete list of available properties.

Cards
Provides container elements that wrap and separate content.

Source
Doc

Preview

Code
<div class="card w-full max-w-md preset-filled-surface-100-900 p-4 text-center">
  <p>Card</p>
</div>


Preview

Code
---
const imgSrc =
  'https://images.unsplash.com/photo-1463171515643-952cee54d42a?q=80&w=450&h=190&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
---

<a
  href="#"
  class="card preset-filled-surface-100-900 border-[1px] border-surface-200-800 card-hover divide-surface-200-800 block max-w-md divide-y overflow-hidden"
>
  {/* Header */}
  <header>
    <img src={imgSrc} class="aspect-[21/9] w-full grayscale hue-rotate-90" alt="banner" />
  </header>
  {/* Article */}
  <article class="space-y-4 p-4">
    <div>
      <h2 class="h6">Announcements</h2>
      <h3 class="h3">Skeleton is Awesome</h3>
    </div>
    <p class="opacity-60">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam aspernatur provident eveniet eligendi cumque consequatur tempore sint
      nisi sapiente. Iste beatae laboriosam iure molestias cum expedita architecto itaque quae rem.
    </p>
  </article>
  {/* Footer */}
  <footer class="flex items-center justify-between gap-4 p-4">
    <small class="opacity-60">By Alex</small>
    <small class="opacity-60">On {new Date().toLocaleDateString()}</small>
  </footer>
</a>

Presets
Provides full support of Presets.


Preview

Code
<div class="w-full grid grid-cols-3 gap-4">
  <div class="card p-4 preset-filled-primary-500">Card</div>
  <div class="card p-4 preset-tonal-primary">Card</div>
  <div class="card p-4 preset-outlined-primary-500">Card</div>
  {/* --- */}
  <div class="card p-4 preset-filled-secondary-500">Card</div>
  <div class="card p-4 preset-tonal-secondary">Card</div>
  <div class="card p-4 preset-outlined-secondary-500">Card</div>
  {/* --- */}
  <div class="card p-4 preset-filled-tertiary-500">Card</div>
  <div class="card p-4 preset-tonal-tertiary">Card</div>
  <div class="card p-4 preset-outlined-tertiary-500">Card</div>
  {/* --- */}
  <div class="card p-4 preset-filled-success-500">Card</div>
  <div class="card p-4 preset-tonal-success">Card</div>
  <div class="card p-4 preset-outlined-success-500">Card</div>
  {/* --- */}
  <div class="card p-4 preset-filled-warning-500">Card</div>
  <div class="card p-4 preset-tonal-warning">Card</div>
  <div class="card p-4 preset-outlined-warning-500">Card</div>
  {/* --- */}
  <div class="card p-4 preset-filled-error-500">Card</div>
  <div class="card p-4 preset-tonal-error">Card</div>
  <div class="card p-4 preset-outlined-error-500">Card</div>
  {/* --- */}
  <div class="card p-4 preset-filled-surface-500">Card</div>
  <div class="card p-4 preset-tonal-surface">Card</div>
  <div class="card p-4 preset-outlined-surface-500">Card</div>
</div>
Badges
Provides a robust set of non-interactive badge styles.

Source
Doc

Preview

Code
---
import { Heart as IconHeart } from 'lucide-react';
---

<div class="flex items-center gap-4">
  <!-- A simple icon badge -->
  <span class="badge-icon preset-filled">
    <IconHeart size={16} />
  </span>
  <!-- A standard badge -->
  <span class="badge preset-filled">Badge</span>
  <!-- A badge + icon -->
  <span class="badge preset-filled">
    <IconHeart size={16} />
    <span>Badge</span>
  </span>
</div>

Presets
Provides full support of Presets.


Preview

Code
<div class="space-y-4">
  <div class="flex gap-4">
    <span class="badge preset-filled-primary-500">Badge</span>
    <span class="badge preset-tonal-primary">Badge</span>
    <span class="badge preset-outlined-primary-500">Badge</span>
  </div>
  <div class="flex gap-4">
    <span class="badge preset-filled-secondary-500">Badge</span>
    <span class="badge preset-tonal-secondary">Badge</span>
    <span class="badge preset-outlined-secondary-500">Badge</span>
  </div>
  <div class="flex gap-4">
    <span class="badge preset-filled-tertiary-500">Badge</span>
    <span class="badge preset-tonal-tertiary">Badge</span>
    <span class="badge preset-outlined-tertiary-500">Badge</span>
  </div>
  <div class="flex gap-4">
    <span class="badge preset-filled-success-500">Badge</span>
    <span class="badge preset-tonal-success">Badge</span>
    <span class="badge preset-outlined-success-500">Badge</span>
  </div>
  <div class="flex gap-4">
    <span class="badge preset-filled-warning-500">Badge</span>
    <span class="badge preset-tonal-warning">Badge</span>
    <span class="badge preset-outlined-warning-500">Badge</span>
  </div>
  <div class="flex gap-4">
    <span class="badge preset-filled-error-500">Badge</span>
    <span class="badge preset-tonal-error">Badge</span>
    <span class="badge preset-outlined-error-500">Badge</span>
  </div>
  <div class="flex gap-4">
    <span class="badge preset-filled-surface-500">Badge</span>
    <span class="badge preset-tonal-surface">Badge</span>
    <span class="badge preset-outlined-surface-500">Badge</span>
  </div>
</div>

Overlap
Use badge-icon to create overlapping numeric or icon badges.


Preview

Code
---
const imgSrc =
  'https://images.unsplash.com/photo-1620122303020-87ec826cf70d?q=80&w=256&h=256&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
---

<div class="relative inline-block">
  <span class="badge-icon preset-filled-primary-500 absolute -right-0 -top-0 z-10">2</span>
  <img class="size-20 overflow-hidden rounded-full grayscale" src={imgSrc} alt="Avatar" />
</div>
Buttons
Provide a variety of button, including customizable sizes and types.

Source
Doc

Preview

Code
---
import { ArrowRight as IconArrowRight } from 'lucide-react';
---

<div class="flex items-center gap-4">
  <!-- A simple icon button -->
  <button type="button" class="btn-icon preset-filled" title="Go" aria-label="Go"><IconArrowRight size={18} /></button>
  <!-- A standard button -->
  <button type="button" class="btn preset-filled">Button</button>
  <!-- A button + icon -->
  <button type="button" class="btn preset-filled">
    <span>Button</span>
    <IconArrowRight size={18} />
  </button>
</div>

Presets
Provides full support of Presets.


Preview

Code
<div class="space-y-4">
  <div class="flex gap-4">
    <button type="button" class="btn preset-filled-primary-500">Button</button>
    <button type="button" class="btn preset-tonal-primary">Button</button>
    <button type="button" class="btn preset-outlined-primary-500">Button</button>
  </div>
  <div class="flex gap-4">
    <button type="button" class="btn preset-filled-secondary-500">Button</button>
    <button type="button" class="btn preset-tonal-secondary">Button</button>
    <button type="button" class="btn preset-outlined-secondary-500">Button</button>
  </div>
  <div class="flex gap-4">
    <button type="button" class="btn preset-filled-tertiary-500">Button</button>
    <button type="button" class="btn preset-tonal-tertiary">Button</button>
    <button type="button" class="btn preset-outlined-tertiary-500">Button</button>
  </div>
  <div class="flex gap-4">
    <button type="button" class="btn preset-filled-success-500">Button</button>
    <button type="button" class="btn preset-tonal-success">Button</button>
    <button type="button" class="btn preset-outlined-success-500">Button</button>
  </div>
  <div class="flex gap-4">
    <button type="button" class="btn preset-filled-warning-500">Button</button>
    <button type="button" class="btn preset-tonal-warning">Button</button>
    <button type="button" class="btn preset-outlined-warning-500">Button</button>
  </div>
  <div class="flex gap-4">
    <button type="button" class="btn preset-filled-error-500">Button</button>
    <button type="button" class="btn preset-tonal-error">Button</button>
    <button type="button" class="btn preset-outlined-error-500">Button</button>
  </div>
  <div class="flex gap-4">
    <button type="button" class="btn preset-filled-surface-500">Button</button>
    <button type="button" class="btn preset-tonal-surface">Button</button>
    <button type="button" class="btn preset-outlined-surface-500">Button</button>
  </div>
</div>

Sizes

Preview

Code
<div class="flex items-center gap-4">
  <button type="button" class="btn btn-sm preset-filled">Small</button>
  <button type="button" class="btn btn-base preset-filled">Base</button>
  <button type="button" class="btn btn-lg preset-filled">Large</button>
</div>

Disabled
When applied to a <button> element, you can use the disabled attribute.


Preview

Code
<button type="button" class="btn preset-filled-primary-500" disabled>Button</button>

Group

Preview

Code
<nav class="btn-group preset-outlined-surface-200-800 flex-col p-2 md:flex-row">
  <button type="button" class="btn preset-filled">January</button>
  <button type="button" class="btn hover:preset-tonal">February</button>
  <button type="button" class="btn hover:preset-tonal">March</button>
</nav>
Forms and Inputs
Various form and input styles.

Source
Doc

Preview

Code
<label class="label">
  <span class="label-text">Input</span>
  <input class="input" type="text" placeholder="Input" />
</label>

<label class="label">
  <span class="label-text">Select</span>
  <select class="select">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
    <option value="4">Option 4</option>
    <option value="5">Option 5</option>
  </select>
</label>

<label class="label">
  <span class="label-text">Textarea</span>
  <textarea class="textarea" rows="4" placeholder="Lorem ipsum dolor sit amet consectetur adipisicing elit."></textarea>
</label>

Prerequisites
Tailwind Forms
Skeleton relies on the official Tailwind Forms plugin to normalize form styling. This plugin is required if you wish to make use of any utility classes provided on this page.

Plugin Doc

Install the @tailwindcss/forms package.

Terminal window
npm install -D @tailwindcss/forms

Implement the plugin using the @plugin directive immediately following the tailwindcss import.

@import 'tailwindcss';
@plugin '@tailwindcss/forms';

/* ...Skeleton config here... */

Browser Support
The display of native and semantic HTML form elements can vary between both operating systems and browsers. Skeleton does it’s best to adhere to progressive enhancement best practices. However, we advise you validate support for each element per your target audience.

Inputs

Preview

Code
<form class="mx-auto w-full max-w-md space-y-4">
  <input type="text" class="input" placeholder="Enter name" />
  <!-- --- -->
  <label class="label">
    <span class="label-text">Number</span>
    <input type="number" class="input" placeholder="Enter Age" />
  </label>
  <!-- --- -->
  <label class="label">
    <span class="label-text">Password</span>
    <input type="password" class="input" placeholder="Enter Password" />
  </label>
  <!-- --- -->
  <label class="label">
    <span class="label-text">Phone Number</span>
    <input type="tel" class="input" placeholder="ex: 214-555-1234" />
  </label>
  <!-- --- -->
  <label class="label">
    <span class="label-text">Search</span>
    <input type="search" class="input" placeholder="Search..." />
  </label>
</form>

Select

Preview

Code
<form class="mx-auto w-full max-w-md space-y-4">
  <!-- Default -->
  <select class="select">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
    <option value="4">Option 4</option>
    <option value="5">Option 5</option>
  </select>

  <!--
    NOTE: the following Select element variants are included purely for legacy support. It is not longer advised you use these variants in production apps. Currently the styles are too limited and the style API vary greatly between browser vendors. Expect these styles to be removed in the next major version of Skeleton (v4.0). In the meantime, consider a replacement using a custom Listbox component if you need this type of interface in your application. We've provided some resources below to guide you in this process.

    ARIA APG Guidelines:
    https://www.w3.org/WAI/ARIA/apg/patterns/listbox/

    Zag.js Listbox component:
    (NOTE: this will come to Skeleton in the future)
    https://zagjs.com/components/react/listbox
    https://zagjs.com/components/svelte/listbox

    Similar components may also exist or third party libraries such as Bits, Melt, or Radix:
    https://www.skeleton.dev/docs/headless/bits-ui
    https://www.skeleton.dev/docs/headless/melt-ui
    https://www.skeleton.dev/docs/headless/radix-ui
  -->

  <!-- Size Variant -->
  <!-- <select class="select rounded-container" size="4" value="1">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
    <option value="4">Option 4</option>
    <option value="5">Option 5</option>
  </select> -->

  <!-- Multiple Variant -->
  <!-- <select class="select rounded-container" multiple value="['1', '2']">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
    <option value="4">Option 4</option>
    <option value="5">Option 5</option>
  </select> -->
</form>

Checkboxes

Preview

Code
<form class="space-y-2">
  <label class="flex items-center space-x-2">
    <input class="checkbox" type="checkbox" checked />
    <p>Option 1</p>
  </label>
  <label class="flex items-center space-x-2">
    <input class="checkbox" type="checkbox" />
    <p>Option 2</p>
  </label>
  <label class="flex items-center space-x-2">
    <input class="checkbox" type="checkbox" />
    <p>Option 3</p>
  </label>
</form>

Radio Groups

Preview

Code
<form class="space-y-2">
  <label class="flex items-center space-x-2">
    <input class="radio" type="radio" checked name="radio-direct" value="1" />
    <p>Option 1</p>
  </label>
  <label class="flex items-center space-x-2">
    <input class="radio" type="radio" name="radio-direct" value="2" />
    <p>Option 2</p>
  </label>
  <label class="flex items-center space-x-2">
    <input class="radio" type="radio" name="radio-direct" value="3" />
    <p>Option 3</p>
  </label>
</form>

Kitchen Sink
Display and functionality of these elements may vary greatly between devices and browsers.


Preview

Code
<form class="mx-auto w-full max-w-md space-y-4">
  <!-- Date Picker -->
  <label class="label">
    <span class="label-text">Date</span>
    <input class="input" type="date" />
  </label>
  <!-- File Input -->
  <label class="label">
    <span class="label-text">File Input</span>
    <input class="input" type="file" />
  </label>
  <!-- Range -->
  <label class="label">
    <span class="label-text">Range</span>
    <input class="input" type="range" value="75" max="100" />
  </label>
  <!-- Progress -->
  <label class="label">
    <span class="label-text">Progress</span>
    <progress class="progress" value="50" max="100"></progress>
  </label>
  <!-- Color -->
  <!-- TODO: convert to mini-component for reactive value -->
  <div class="grid grid-cols-[auto_1fr] gap-2">
    <input class="input" type="color" value="#bada55" />
    <input class="input" type="text" value="#bada55" readonly tabindex="-1" />
  </div>
</form>

Groups
Input groups support a subset of form elements and button styles. These pair well with Presets.


Preview

Code
---
import { CircleDollarSign, Check, Search } from 'lucide-react';
---

<form class="w-full space-y-8">
  <!-- Website -->
  <div class="input-group grid-cols-[auto_1fr_auto]">
    <div class="ig-cell preset-tonal">https://</div>
    <input class="ig-input" type="text" placeholder="www.example.com" />
  </div>
  <!-- Amount -->
  <div class="input-group grid-cols-[auto_1fr_auto]">
    <div class="ig-cell preset-tonal">
      <CircleDollarSign size={16} />
    </div>
    <input class="ig-input" type="text" placeholder="Amount" />
    <select class="ig-select">
      <option>USD</option>
      <option>CAD</option>
      <option>EUR</option>
    </select>
  </div>
  <!-- Username -->
  <div class="input-group grid-cols-[1fr_auto]">
    <input class="ig-input" type="text" placeholder="Enter Username..." />
    <button class="ig-btn preset-filled" title="Username already in use.">
      <Check size={16} />
    </button>
  </div>
  <!-- Search -->
  <div class="input-group grid-cols-[auto_1fr_auto]">
    <div class="ig-cell preset-tonal">
      <Search size={16} />
    </div>
    <input class="ig-input" type="search" placeholder="Search..." />
    <button class="ig-btn preset-filled">Submit</button>
  </div>
</form>

Class	Usage
input-group	Defines the parent input group set.
ig-cell	Defines a child cell for text or icons.
ig-input	Defines a child input of type="text".
ig-select	Defines a child select element.
ig-btn	Defines a child button.
Built by Skeleton Labs and the Skeleton community.

Tables
Provides a set of styles for native HTML table elements.

Source
Doc

Preview

Code
---
const tableData = [
  { position: '0', name: 'Iron', symbol: 'Fe', atomic_no: '26' },
  { position: '1', name: 'Rhodium', symbol: 'Rh', atomic_no: '45' },
  { position: '2', name: 'Iodine', symbol: 'I', atomic_no: '53' },
  { position: '3', name: 'Radon', symbol: 'Rn', atomic_no: '86' },
  { position: '4', name: 'Technetium', symbol: 'Tc', atomic_no: '43' }
];
---

<div class="table-wrap">
  <table class="table caption-bottom">
    <tbody class="[&>tr]:hover:preset-tonal-primary">
      {
        tableData.map((row) => (
          <tr>
            <td>{row.position}</td>
            <td>{row.symbol}</td>
            <td>{row.name}</td>
            <td class="text-right">{row.atomic_no}</td>
          </tr>
        ))
      }
    </tbody>
  </table>
</div>

Extras
Optionally add a header, footer, and caption.


Preview

Code
---
const tableData = [
  { position: '0', name: 'Iron', symbol: 'Fe', atomic_no: '26' },
  { position: '1', name: 'Rhodium', symbol: 'Rh', atomic_no: '45' },
  { position: '2', name: 'Iodine', symbol: 'I', atomic_no: '53' },
  { position: '3', name: 'Radon', symbol: 'Rn', atomic_no: '86' },
  { position: '4', name: 'Technetium', symbol: 'Tc', atomic_no: '43' }
];
---

<div class="table-wrap">
  <table class="table caption-bottom">
    <caption class="pt-4">A list of elements from the periodic table.</caption>
    <thead>
      <tr>
        <th>Position</th>
        <th>Symbol</th>
        <th>Name</th>
        <th class="!text-right">Weight</th>
      </tr>
    </thead>
    <tbody class="[&>tr]:hover:preset-tonal-primary">
      {
        tableData.map((row) => (
          <tr>
            <td>{row.position}</td>
            <td>{row.symbol}</td>
            <td>{row.name}</td>
            <td class="text-right">{row.atomic_no}</td>
          </tr>
        ))
      }
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3">Total</td>
        <td class="text-right">{tableData.length} Elements</td>
      </tr>
    </tfoot>
  </table>
</div>

Navigation
Native HTML tables do not support interaction. For accessibility, use anchors or buttons within the last cell.


Preview

Code
---
const tableData = [
  { first: 'Liam', last: 'Steele', email: 'liam@email.com' },
  { first: 'Athena', last: 'Marks', email: 'athena@email.com' },
  { first: 'Angela', last: 'Rivers', email: 'angela@email.com' }
];
---

<div class="table-wrap">
  <table class="table caption-bottom">
    <tbody>
      <thead>
        <tr>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Email</th>
          <th>&nbsp;</th>
        </tr>
      </thead>
      {
        tableData.map((row) => (
          <tr>
            <td>{row.first}</td>
            <td>{row.last}</td>
            <td>{row.email}</td>
            <td class="text-right">
              <a class="btn btn-sm preset-filled" href="#">
                View &rarr;
              </a>
            </td>
          </tr>
        ))
      }
    </tbody>
  </table>
</div>

Layout
See Tailwind’s utility classes for adjusting the table layout algorithm. Apply this to the Table element.

Hover Rows
Add a visual hover effect using the following Tailwind syntax.

<tbody class="[&>tr]:hover:preset-tonal-primary">
  ...
</tbody>

Pagination
Pair with the Skeleton Pagination component for large data sets.

Placeholders
Provides "skeleton" placeholders that can display while content loads.

Source
Doc

Preview

Code
<div class="w-full space-y-4">
  <div class="flex items-center justify-between">
    <div class="flex items-center justify-center space-x-4">
      <div class="placeholder-circle size-16 animate-pulse"></div>
      <div class="placeholder-circle size-14 animate-pulse"></div>
      <div class="placeholder-circle size-10 animate-pulse"></div>
    </div>
  </div>
  <div class="space-y-4">
    <div class="placeholder animate-pulse"></div>
    <div class="grid grid-cols-4 gap-4">
      <div class="placeholder animate-pulse"></div>
      <div class="placeholder animate-pulse"></div>
      <div class="placeholder animate-pulse"></div>
      <div class="placeholder animate-pulse"></div>
    </div>
    <div class="placeholder animate-pulse"></div>
    <div class="placeholder animate-pulse"></div>
  </div>
</div>

Animated
<div class="placeholder animate-pulse">...</div>