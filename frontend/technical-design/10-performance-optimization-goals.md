# 10. Performance Optimization Goals

## 1. Purpose

This document establishes the performance targets and optimization strategies for the Tributestream application's migration to SvelteKit. The primary goal is to ensure a fast, responsive, and smooth user experience by defining key performance indicators (KPIs) and outlining a clear plan for achieving them. Adhering to these guidelines will be critical for user retention and satisfaction.

## 2. Content

### 2.1. Key Performance Indicators (KPIs)

To objectively measure and track performance, we will adhere to Google's Core Web Vitals as our primary KPIs. The target for each metric is to be in the "Good" threshold for at least 75% of user visits.

*   **Largest Contentful Paint (LCP):** Measures loading performance. To provide a good user experience, LCP should occur within **2.5 seconds** of when the page first starts loading.
*   **First Input Delay (FID):** Measures interactivity. For a good user experience, pages should have an FID of **100 milliseconds** or less.
*   **Cumulative Layout Shift (CLS):** Measures visual stability. To provide a good user experience, pages should maintain a CLS of **0.1.** or less.

### 2.2. Optimization Strategies

#### 2.2.1. SvelteKit Bundle Optimization

SvelteKit's compiler-based nature provides a strong foundation for small bundle sizes. We will leverage its features to the fullest:

*   **Code-Splitting:** SvelteKit automatically splits code by route. We will ensure our component architecture does not group unrelated, heavy components into a single chunk.
*   **Tree-Shaking:** We will favor modular libraries and ensure that our imports are structured to allow the bundler (Vite) to effectively eliminate unused code.
*   **Adapter-Specific Optimizations:** When deploying, we will use the appropriate SvelteKit adapter (e.g., `adapter-node` or a serverless-specific adapter) and configure it for the target platform (Google Cloud Run) to maximize performance.

#### 2.2.2. Image Loading

Images, especially on tribute pages, are a potential performance bottleneck. Our strategy includes:

*   **Modern Formats:** Serve images in next-gen formats like WebP or AVIF for better compression and quality.
*   **Responsive Images:** Use the `<picture>` element or `srcset` attribute to serve appropriately sized images based on the user's viewport.
*   **Lazy Loading:** Implement lazy loading for below-the-fold images to avoid blocking the initial render.
*   **Image CDN/Resizing:** Utilize Firebase Storage with image resizing extensions (e.g., Resize Images) to create different image sizes on-the-fly, reducing the need to store multiple versions and ensuring optimal delivery.

#### 2.2.3. Data Fetching

Efficient data fetching is crucial, especially with a backend like Firebase.

*   **SSR First:** Prioritize Server-Side Rendering (SSR) for initial page loads. For pages like tribute memorials and the initial view of the "My Portal" dashboard, data will be fetched on the server within SvelteKit's `load` functions. This sends fully-rendered HTML to the client, drastically improving LCP.
*   **Client-Side Fetching for Dynamic Data:** For subsequent, dynamic interactions (e.g., submitting a form, real-time updates), we will use client-side data fetching directly from Firebase services.
*   **Caching:** Implement caching strategies for frequently accessed, non-sensitive data. SvelteKit's `load` function provides mechanisms for setting cache-control headers, which we can use to cache data at the CDN level.

## 3. Key Question

**How can SvelteKit's SSR capabilities be best utilized with Firebase to enhance initial page load performance?**

SvelteKit's Server-Side Rendering (SSR) capabilities can be powerfully combined with Firebase to optimize initial page load performance by shifting data fetching from the client to the server. The optimal strategy is as follows:

1.  **Utilize Server `load` Functions:** For any page requiring data from Firestore to render its initial content (e.g., a specific tribute page), the data fetching logic will be placed within a `+page.server.js` file's `load` function.
2.  **Initialize Firebase Admin on the Server:** Inside the server-side `load` function, we will use the Firebase Admin SDK to communicate directly and securely with Firestore. This avoids exposing any sensitive credentials to the client and is typically faster as it runs within Google's network.
3.  **Pass Data as Props:** The data fetched from Firestore will be returned from the `load` function. SvelteKit then makes this data available as props to the corresponding page component.
4.  **Render HTML on the Server:** SvelteKit uses this data to render the complete HTML for the page on the server.
5.  **Deliver a Fully-Rendered Page:** The client's browser receives a fully-formed HTML document. This significantly improves the Perceived Performance and the Largest Contentful Paint (LCP) metric because the main content is visible immediately without waiting for client-side JavaScript to execute and fetch data.

This approach effectively eliminates client-side loading spinners for initial content, providing a much faster and more professional user experience.