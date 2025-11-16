# Calculator Page Documentation

## 1. Overview

This document provides a comprehensive breakdown of the Tributestream Calculator page. The calculator is a multi-step form designed to guide users through selecting a livestreaming package, customizing it with add-ons and additional services, and calculating the total cost. It serves as the primary tool for users to configure and book a Tributestream event.

The page is built as a single, dynamic view that transitions between a booking/configuration step and a secure payment step. It is designed to be user-friendly, providing clear options and a real-time summary of the selected services and their costs.

## 2. Page Layout & Components

The calculator page is constructed from three main React components, creating a two-column layout on larger screens.

### Component Breakdown:

-   **`CalculatorView.tsx`**: The parent component that orchestrates the entire page. It manages the overall state, handles data fetching for logged-in users, and controls the flow between the booking and payment steps.
-   **`TierSelector.tsx`**: A component displayed at the top of the page, allowing users to select one of three main service packages. This selection determines the base price and included features.
-   **`AdvancedBookingCalculator.tsx`**: The core of the calculator. This component contains the detailed booking form and the booking summary panel. It is a large component responsible for capturing all the event details.

### Visual Layout:

The page uses a responsive two-column layout on desktop screens:

-   **Left Column (2/3 width)**: Contains the main interactive elements. This area first displays the `TierSelector`. Once a tier is selected, it displays the detailed booking form fields from `AdvancedBookingCalculator`. When the user proceeds to payment, this area is replaced by the `StripePaymentComponent`.
-   **Right Column (1/3 width)**: Contains the **Booking Summary** panel. This panel is part of the `AdvancedBookingCalculator` component and provides a real-time, itemized list of selected services and the total cost. On taller screens, this summary becomes "sticky" and remains visible as the user scrolls through the form.

On mobile devices, the layout stacks vertically, with the `TierSelector` at the top, followed by the booking form, and finally the booking summary.

## 3. Tier/Package Selection

The user's journey begins by selecting a service tier. The `TierSelector` component presents three distinct packages, each with a different set of features and a base price.

| Tier Name | Base Price | Included Features |
| :--- | :--- | :--- |
| **Tributestream Record** | $699 | - 2 Hours of Broadcast Time<br>- Custom Link<br>- Complimentary Download<br>- One Year Hosting<br>- DIY Livestream Kit |
| **Tributestream Live** | $1299 | - 2 Hours of Broadcast Time<br>- Custom Link<br>- Complimentary Download<br>- One Year Hosting<br>- Professional Videographer<br>- Professional Livestream Tech |
| **Tributestream Legacy**| $1599 | - 2 Hours of Broadcast Time<br>- Custom Link<br>- Complimentary Download<br>- One Year Hosting<br>- Professional Videographer<br>- Professional Livestream Tech<br>- Video Editing<br>- Engraved USB Drive and Wooden Keepsake Box |

When a user selects a tier, the following actions occur:
1.  The application state is updated with the selected tier (e.g., 'Live').
2.  A corresponding "package" item is added to the booking summary, displaying the tier name and its base price.
3.  Any previously selected add-ons are cleared to ensure a fresh calculation for the new package.

## 4. Core Booking Form

Once a tier is selected, the main booking form becomes visible. This form, part of the `AdvancedBookingCalculator` component, collects the essential details for the event.

### Form Fields:

-   **Your Loved One's Name**: A standard text input for the name of the deceased.
-   **Date of Service**: A date picker input. It can be disabled by checking the "Unknown" button next to it.
-   **Time of Livestream**: A time picker input. It can also be disabled by the "Unknown" button.
-   **Unknown (Date/Time)**: A toggle button that disables both the date and time fields, for users who have not yet finalized the schedule.
-   **Number of Hours (Main Location)**: A range slider allowing the user to select between 1 and 8 hours of service. The default is 2 hours, which is included in the base package price.
-   **Location Name**: A text input for the name of the venue (e.g., "St. Mary's Church"). Can be disabled by the "Unknown" button.
-   **Location Address**: A text input for the full address of the venue. Can be disabled by the "Unknown" button.
-   **Unknown (Location)**: A toggle button that disables the location name and address fields.
-   **Funeral Director Name**: An optional text input for the name of the funeral director.
-   **Funeral Home**: An optional text input for the name of the funeral home.

## 5. Additional Services & Add-ons

The calculator allows users to add services beyond the base package. These are controlled via toggle buttons and conditional form sections.

### Additional Locations

-   **Functionality**: A Yes/No toggle reveals a sub-form to capture details for a second location on the same day (e.g., a church service followed by a graveside committal).
-   **Fields**:
    -   Additional Location Name
    -   Additional Location Address
    -   Start Time (Add. Location)
    -   Hours (Add. Location): A range slider from 1-8 hours.
-   **Pricing**:
    -   A flat fee of **$325** is added for the additional location.
    -   The first 2 hours of service at this location are included. Hours beyond 2 are charged an overage fee.

### Additional Days

-   **Functionality**: Similar to Additional Locations, a Yes/No toggle reveals a sub-form for a service on a different day (e.g., a viewing or vigil).
-   **Fields**:
    -   Additional Day Location Name
    -   Additional Day Location Address
    -   Start Time (Add. Day)
    -   Hours (Add. Day): A range slider from 1-8 hours.
-   **Pricing**:
    -   A flat fee of **$325** is added for the additional day.
    -   The first 2 hours of service on this day are included. Hours beyond 2 are charged an overage fee.

### Add-ons

A series of toggle buttons allow users to select optional add-on services. When an add-on is selected, a corresponding item is added to the booking summary with its price.

| Add-on | Price | Description |
| :--- | :--- | :--- |
| **Photography** | $400 | Provides 4 hours of professional photography service. |
| **Audio/Visual Support**| $200 | Technical support for in-venue A/V equipment. |
| **Live Musician** | $500 | A professional musician for the service. |
| **Wooden USB Drive** | $300 | An additional engraved USB drive with the service recording. The first one is included in the Legacy package. Subsequent drives are $100 each. |

## 6. Pricing Calculation Logic

The total cost is calculated in real-time and displayed in the Booking Summary panel. The calculation is the sum of several components:

1.  **Base Package Price**: The price of the selected tier (`Record`, `Live`, or `Legacy`).
2.  **Hourly Overage Charges**:
    -   Each package includes 2 hours of broadcast time at the main location.
    -   Each additional location or day also includes 2 hours of broadcast time.
    -   Any hour selected beyond these included 2 hours (for any location/day) is charged at a rate of **$125 per hour**.
    -   The calculation is `(selected_hours - 2) * 125` for each service segment.
3.  **Additional Location/Day Fees**:
    -   A flat fee of **$325** is added for each selected additional location and/or additional day.
4.  **Add-on Prices**:
    -   The fixed price of each selected add-on is added to the total.

**Formula:**

`Total = Base_Package_Price + Main_Overage + Addl_Location_Fee + Addl_Location_Overage + Addl_Day_Fee + Addl_Day_Overage + Sum_Of_Addons`

## 7. Booking Summary Panel

The summary panel provides users with a persistent, real-time view of their selections and the total cost.

### Key Features:

-   **Itemized List**: Displays each selected item, including the main package, add-ons, and fees for additional services.
-   **Real-time Updates**: The subtotal and total amounts update instantly as the user modifies the form.
-   **Sticky Behavior**: On desktop, the panel "sticks" to the top of the viewport when the user scrolls past a certain point. This is achieved using an `IntersectionObserver` that watches a sentinel element at the top of the form.
-   **Condensed State**: When the panel is in its sticky state, its content condenses to save space. It shows only the total price, the selected package name, and the service date, ensuring the most critical information is always visible without being obtrusive.
-   **Empty State**: If no items are selected, the panel displays a message prompting the user to choose a service.

## 8. Data Flow & State Management

The calculator's state is managed within the `CalculatorView` parent component and passed down to child components as props.

### State Management:

-   **`formData`**: A large state object that holds the values of all form inputs (e.g., `lovedOneName`, `serviceDate`, `addons`, etc.).
-   **`selectedTier`**: A state variable that stores the currently selected package ('Record', 'Live', or 'Legacy').
-   **`bookingItems`**: An array of `BookingItem` objects. Each object represents a line item in the summary (the package, add-ons, etc.) and contains its name, price, and quantity.
-   **`currentStep`**: A state variable that controls the view, switching between `"booking"` and `"payment"`.

### Data Flow:

1.  User actions in `TierSelector` or `AdvancedBookingCalculator` (e.g., selecting a tier, filling an input, toggling an add-on) trigger handler functions passed down from `CalculatorView`.
2.  These handler functions (`handleTierChange`, `handleFormDataChange`, `handleAddonChange`, etc.) update the state in `CalculatorView`.
3.  The updated state (e.g., the new `formData` or `bookingItems` array) is passed back down to the child components as props.
4.  The child components re-render to reflect the new state, ensuring the form inputs and the booking summary are always synchronized.

## 9. User Authentication & Data Persistence

The calculator integrates with Firebase Authentication to provide a personalized experience for logged-in users.

### Pre-filling Form Data:

-   On component mount, a `useEffect` hook checks if a user is logged in.
-   If authenticated, the application fetches data from two Firestore collections:
    1.  The `users` collection, to get contact information.
    2.  The `memorials` collection, to get the most recent memorial details created by that user.
-   This data is then used to pre-fill relevant fields in the form, such as the loved one's name, service date, and location, saving the user time and effort.

### Saving Configuration:

-   Users can save their booking configuration to their portal at any time by clicking the "Save and Pay Later" button.
-   This action triggers the `handleSaveForLater` function, which calls a Firebase Callable Function named `saveCalculatorConfiguration`.
-   This cloud function takes the entire `formData` object as its payload and saves it to a `bookings` collection in Firestore, associated with the user's ID.
-   Upon successful save, the user is redirected to their personal portal (`/my-portal`).

## 10. Payment Flow

The payment process is designed to be secure and seamless, transitioning the user from the booking form to a dedicated payment interface.

### Initiating Payment:

1.  The user clicks the "Continue to Payment" button.
2.  The `handleInitiatePaymentFlow` function is called.
3.  The current booking configuration is automatically saved via the `saveCalculatorConfiguration` cloud function (the same one used for "Save for Later"). This ensures that an invoice and booking record are created before payment is attempted.
4.  Upon a successful save, the function returns a unique `bookingId`.
5.  The total amount is converted to cents.
6.  The application state `currentStep` is set to `"payment"`.

### Processing Payment:

1.  When `currentStep` is `"payment"`, the main booking form is hidden, and the `StripePaymentComponent` is rendered in its place.
2.  This component is initialized with the `bookingId`, the `amountInCents`, and references to two Firebase Callable Functions: `processStripePayment` and `confirmStripePayment`.
3.  The `StripePaymentComponent` uses the Stripe Elements library to securely collect card information.
4.  When the user submits the payment form, the component first calls the `processStripePayment` function. This function creates a Stripe Payment Intent on the backend and returns a `clientSecret` to the frontend.
5.  The frontend uses this `clientSecret` to confirm the card payment with Stripe's API.
6.  Upon successful confirmation from Stripe, the component calls the `confirmStripePayment` cloud function, passing the `bookingId` and `paymentIntentId`. This function verifies the payment status on the backend, updates the booking record in Firestore to mark it as paid, and triggers confirmation emails.
7.  If the payment is successful, the `onPaymentSuccess` callback is triggered, which displays a success toast and redirects the user to their portal.
8.  If any step fails, the `onPaymentError` callback is triggered, and an appropriate error message is displayed to the user.