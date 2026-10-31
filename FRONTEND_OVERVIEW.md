# AuditoReserve — Frontend Architecture & UI Overview

> **Purpose:** This document is the definitive architectural and UI reference for the **AuditoReserve** frontend. It provides a complete overview of the codebase structure, design system, component hierarchy, page layouts, API integrations, real-time events, and UX workflows.

---

## 1. Project & Directory Structure

The frontend is a single-page application (SPA) built with React 19, Vite, React Router 7, TanStack Query 5, and Framer Motion. The UI is powered by a modular CSS design system (`src/styles/*`) using CSS custom properties with light-mode default and instant dark-mode switching.

```
frontend/
├── index.html                     # HTML entry point (Plus Jakarta Sans font, theme bootstrap script)
├── package.json                   # Dependencies and npm scripts
├── vite.config.js                 # Vite config with manual vendor chunk splitting
├── tailwind.config.js             # Tailwind configuration (dormant)
├── postcss.config.js              # PostCSS configuration
├── jsconfig.json                  # Compiler and bundler path aliases
├── netlify.toml                   # SPA redirect rules for Netlify deployment
├── .env.example                   # Template for frontend environment variables
├── .env                           # Local environment variables (git-ignored)
├── public/
│   ├── favicon.svg                # Application branding icon
│   └── icons.svg                  # Standalone SVG sprite asset
└── src/
    ├── main.jsx                   # Application entry point (StrictMode & QueryClientProvider)
    ├── App.jsx                    # Root routing, route guards, and context hierarchy
    ├── App.css                    # Master CSS entry point importing modular stylesheets
    ├── index.css                  # Minimal global resets
    ├── types.js                   # Empty file (leftover from TypeScript migration)
    ├── api/                       # API clients & backend communication (strict contract)
    │   ├── client.js              # Axios instance, token interceptor, 401 refresh mutex
    │   ├── auth.js                # Authentication endpoints (login, register, me, verify, reset)
    │   ├── auditoriums.js         # Auditorium CRUD and multipart FormData upload helpers
    │   ├── bookings.js            # Booking requests, approval, calendar slots endpoints
    │   ├── notifications.js       # In-app notifications CRUD & mark-all-read endpoints
    │   └── payments.js            # Razorpay order generation, HMAC verification, PDF receipt
    ├── assets/                    # Static image resources
    ├── components/
    │   ├── auditoriums/
    │   │   ├── AuditoriumCard.jsx # Venue card with specs, amenities, and ImageFrame fallback
    │   │   └── AuditoriumFilters.jsx # Multi-criteria filter toolbar (standalone)
    │   ├── auth/
    │   │   └── AuthCard.jsx       # Centered card container for all authentication flows
    │   ├── bookings/
    │   │   ├── BookingReceiptModal.jsx # Official printable electronic receipt modal
    │   │   ├── BookingRow.jsx     # Booking item card (student & admin actions + countdown)
    │   │   ├── CalendarView.jsx   # Monthly calendar grid with interactive day timeline drawer
    │   │   ├── StatusTabs.jsx     # Horizontal pill filter tabs for booking statuses
    │   │   └── receipt.css        # Styles for printable electronic receipt modal
    │   ├── common/
    │   │   ├── ConfirmDialog.jsx  # Reusable animated confirmation modal with backdrop lock
    │   │   ├── ErrorState.jsx     # Reusable ErrorState and EmptyState placeholder views
    │   │   ├── FormControls.jsx   # TextField (with ref), FormError, and FormSuccess banners
    │   │   ├── LoadingSkeleton.jsx # SkeletonGrid, SkeletonTable, SkeletonDetail, FullPageState
    │   │   ├── PageTransition.jsx # Framer Motion route entrance and exit transitions
    │   │   ├── Pagination.jsx     # Numbered pagination bar with ellipsis & record counters
    │   │   ├── Pagination.css     # Numbered pagination styling
    │   │   ├── RefreshButton.jsx  # Live refresh button with TanStack invalidation & live pulse
    │   │   ├── RefreshButton.css  # Refresh button styling
    │   │   ├── StatusBadge.jsx    # Semantic status badge (pending, approved, confirmed, cancelled)
    │   │   └── TimePicker.jsx     # 24-hr masked time input (HH:MM) with input validation
    │   └── layout/
    │       ├── AdminLayout.jsx    # Dedicated admin shell with sidebar, topbar & notifications
    │       ├── AppLayout.jsx      # Public & student shell with topbar, mobile menu & footer
    │       ├── Footer.jsx         # Institutional footer with branding, links, and copyright
    │       ├── NotificationCenter.jsx # Dropdown bell with live notification list & actions
    │       └── ProtectedRoute.jsx # ProtectedRoute and RoleRoute route guards
    ├── hooks/
    │   ├── toastContext.js        # React Context definition for toasts
    │   ├── ToastProvider.jsx      # Toast state manager & animated notification toasts
    │   ├── useToast.js            # Consumer hook for dispatching toasts
    │   ├── useAuth.jsx            # AuthProvider & useAuth hook (session state)
    │   ├── useNotifications.jsx   # NotificationProvider & Socket.IO real-time client hook
    │   └── useTheme.js            # Theme provider hook (light / dark mode with localStorage)
    ├── lib/
    │   ├── animations.js          # Shared Framer Motion animation variants
    │   └── razorpay.js            # Dynamic Razorpay checkout.js script loader
    ├── pages/
    │   ├── admin/
    │   │   ├── AdminAuditoriumsPage.jsx # Auditorium inventory table with image preview & actions
    │   │   ├── AdminBookingsPage.jsx    # Admin booking approval/rejection queue with modals
    │   │   ├── AdminDashboard.jsx       # Interactive metric cards & recent pending booking queue
    │   │   └── AuditoriumFormPage.jsx   # Multipart create/edit auditorium form
    │   ├── auth/
    │   │   ├── ForgotPasswordPage.jsx   # Password reset request email submission
    │   │   ├── LoginPage.jsx            # University email & password login with resend verify
    │   │   ├── RegisterPage.jsx         # Registration with university domain validation
    │   │   ├── ResetPasswordPage.jsx    # New password submission via URL token
    │   │   └── VerifyEmailPage.jsx      # Email verification token handler with duplicate guard
    │   ├── public/
    │   │   ├── AboutPage.jsx            # Informational page (route redirects to /#about)
    │   │   ├── AuditoriumDetailPage.jsx # Auditorium specifications, gallery, and booking CTA
    │   │   ├── CatalogPage.jsx          # Public auditorium gallery with client-side search
    │   │   └── HomePage.jsx             # Marketing landing page with hero, features, and steps
    │   └── student/
    │       ├── AccountPage.jsx          # User profile details and session termination
    │       ├── NewBookingPage.jsx       # Booking slot request form with compact calendar
    │       └── StudentBookingsPage.jsx  # Student booking history, payment, cancellation, receipt
    ├── styles/                        # Modular CSS Design System
    │   ├── tokens.css                 # Color palette, dark mode variables, spacing, typography
    │   ├── base.css                   # Resets, skip links, focus rings, tabular figures
    │   ├── primitives.css             # Buttons, inputs, badges, cards, dialogs, toasts, skeletons
    │   ├── layout.css                 # AppLayout, AdminLayout sidebar, topbars, and Footer
    │   ├── notifications.css          # NotificationCenter dropdown, item rows, unread dot
    │   ├── home.css                   # Landing page hero, grid cards, steps timeline, contact
    │   ├── catalog.css                # Catalog search toolbar, responsive card grid
    │   ├── auditorium-detail.css      # Venue specs, image gallery thumbnails, sticky action card
    │   ├── auth.css                   # Centered auth card, input fields, password toggle
    │   ├── bookings.css               # Booking request form, booking rows, mobile table cards
    │   ├── calendar.css               # Monthly calendar grid, booking dots, timeline drawer
    │   └── admin.css                  # Admin dashboard metric cards, inventory, table layouts
    └── utils/
        └── calendarSync.js            # Google Calendar URL and .ics file download generators
```

---

## 2. Tech Stack & Dependencies

| Category | Library | Version | Usage in AuditoReserve |
| :--- | :--- | :--- | :--- |
| **Framework** | React | `^19.2.6` | Functional components, Hooks, Suspense lazy loading, Context API. |
| **Build Tool** | Vite | `^8.0.12` | Development server, Rollup manual chunk vendor splitting. |
| **Routing** | React Router DOM | `^7.15.1` | Client-side routing, nested layouts (`<Outlet />`), route guards. |
| **Data Fetching** | TanStack Query | `^5.100.11` | Server state caching, asynchronous queries, optimistic mutations, refetching. |
| **HTTP Client** | Axios | `^1.16.1` | REST API communication, in-memory token injection, 401 refresh mutex. |
| **Real-time** | Socket.IO Client | `^4.8.3` | Real-time WebSocket notifications from server to user in `useNotifications`. |
| **Form Management** | React Hook Form | `^7.76.0` | Form state, validation errors, and submission handling across all forms. |
| **Schema Validation** | Zod + Resolvers | `^4.4.3` / `^5.2.2` | Runtime schema validation (`zodResolver`) for login, register, and booking forms. |
| **Animations** | Framer Motion | `^12.40.0` | Route transitions, modals, notification dropdown, landing page scroll reveals. |
| **Icons** | Lucide React | `^1.16.0` | Consistent iconography used across all components and pages. |
| **Date Handling** | date-fns | `^4.2.1` | Calendar grid intervals, date calculations, relative timestamps (`formatDistanceToNow`). |
| **Payments** | Razorpay Checkout | External CDN | Dynamically loaded via `loadRazorpayScript()` in `lib/razorpay.js`. |

---

## 3. UI/UX Design System ("Calm Institutional Modern")

AuditoReserve uses a **"Calm Institutional Modern"** design aesthetic suited for university facility administration. It delivers clarity, high contrast, and accessibility for students on mobile devices and administrators on desktop displays.

### 3.1 Theme Strategy & Zero-Flash Switching

The application provides dual-theme support (default Light mode with a rich Dark mode):
1. **Zero-Flash Execution:** An inline script in `index.html` inspects `localStorage.getItem("ar-theme")` or falls back to `window.matchMedia("(prefers-color-scheme: dark)")` before first paint, setting `document.documentElement.dataset.theme = "dark" | "light"`.
2. **Dynamic Switching:** The `useTheme()` hook provides `{ theme, toggleTheme, isDark }` and persists choices in `localStorage` under key `ar-theme`.
3. **Toggle Controls:** Accessible Sun/Moon toggle buttons with tooltips are located in:
   - `AppLayout` topbar (desktop & mobile dropdown).
   - `AdminLayout` topbar and sidebar.

### 3.2 Design Tokens (`src/styles/tokens.css`)

```css
:root {
  /* Neutral Palette (Light Mode Default) */
  --bg: #f6f7fb;
  --surface: #ffffff;
  --surface-2: #eef0f6;
  --surface-muted: #e6e9f2;
  --border: #e2e5ee;
  --border-strong: #c8cedf;
  
  /* Text */
  --text: #0f172a;
  --text-muted: #475569;
  --text-subtle: #64748b;

  /* Primary Brand (Deep Institutional Indigo) */
  --primary: #4338ca;
  --primary-hover: #3730a3;
  --primary-contrast: #ffffff;
  --primary-light: #e0e7ff;
  --ring: rgba(67, 56, 202, 0.25);

  /* Semantic Status Tokens (AA Contrast in Both Themes) */
  --status-pending-bg: #fef3c7;
  --status-pending-text: #92400e;
  --status-approved-bg: #e0e7ff;
  --status-approved-text: #3730a3;
  --status-confirmed-bg: #dcfce7;
  --status-confirmed-text: #166534;
  --status-cancelled-bg: #fee2e2;
  --status-cancelled-text: #991b1b;

  /* Typography & Elevation */
  --font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.08);
}

[data-theme="dark"] {
  --bg: #0b0d14;
  --surface: #12151f;
  --surface-2: #1a1e2b;
  --surface-muted: #24293a;
  --border: #262b3b;
  --border-strong: #373e54;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --text-subtle: #64748b;
  --primary: #818cf8;
  --primary-hover: #a5b4fc;
  --primary-contrast: #0b0d14;
  --primary-light: rgba(129, 140, 248, 0.15);
  --ring: rgba(129, 140, 248, 0.35);
  /* Dark mode semantic statuses */
  --status-pending-bg: rgba(245, 158, 11, 0.18);
  --status-pending-text: #fcd34d;
  --status-approved-bg: rgba(99, 102, 241, 0.2);
  --status-approved-text: #c7d2fe;
  --status-confirmed-bg: rgba(34, 197, 94, 0.2);
  --status-confirmed-text: #86efac;
  --status-cancelled-bg: rgba(239, 68, 68, 0.2);
  --status-cancelled-text: #fca5a5;
}
```

### 3.3 Typography & Responsive Scale
- **Font:** Google Fonts **Plus Jakarta Sans** (weights 300 to 800) loaded in `index.html`.
- **Fluid Heading Scale:** Utilizing `clamp()` for responsive titles (`clamp(2rem, 4vw + 1rem, 3.25rem)`).
- **Tabular Figures:** Applied globally via `.tabular-nums` (`font-variant-numeric: tabular-nums`) to all prices (`₹`), time slots, dates, capacities, and dashboard counters to eliminate number layout shifts.

### 3.4 Responsive Breakpoints
- **Desktop (`> 1024px`):** Full horizontal topbar, multi-column cards, permanent admin sidebar, desktop data tables.
- **Tablet (`769px - 1024px`):** Collapsed navigation items, 2-column card grids, flexible sidebar.
- **Mobile (`<= 768px`):**
  - Hamburger mobile navigation with animated slide-down menu.
  - Off-canvas slide drawer for admin sidebar.
  - Data tables automatically morph into vertically stacked cards using `data-label` pseudo-elements (no horizontal table blowout).
  - Split detail pages stack vertically.
- **Narrow Mobile (`<= 480px`):** Stacked action buttons, full-width inputs, compact calendar day cells.

---

## 4. Layout Architecture

### 4.1 Root Providers Hierarchy (`main.jsx` & `App.jsx`)

```
<StrictMode>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>                 ─── Manages user session, tokens & 401 refresh
      <ToastProvider>              ─── Manages animated popup toast messages
        <NotificationProvider>     ─── Manages Socket.IO connection & bell notifications
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                ...
              </Routes>
            </Suspense>
          </BrowserRouter>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  </QueryClientProvider>
</StrictMode>
```

### 4.2 Application Layout Shells

#### `AppLayout` (`src/components/layout/AppLayout.jsx`)
- Used for all public pages, authentication pages, and student portal pages.
- **Header Elements:**
  - Skip link (`#main-content`) for keyboard screen-reader accessibility.
  - Institutional Brand logo (`AR AuditoReserve`).
  - Navigation links: `Home`, `About`, `Features`, `Auditoriums`, `Contact`.
  - Role-based quick links: `My bookings` (for logged-in students) or `Admin Panel` (for administrators).
  - Utility Controls: Theme switcher button (`Sun` / `Moon`), `NotificationCenter` bell, user avatar, and `Sign in` / `Sign up` buttons.
  - Mobile hamburger toggle with animated slide-down navigation drawer.
- **Content:** `<Outlet />` rendered inside `<PageTransition>`.
- **Footer:** Standardized responsive footer with links, copyright, and campus address.

#### `AdminLayout` (`src/components/layout/AdminLayout.jsx`)
- Used exclusively for `/admin/*` management routes.
- **Header / Topbar:**
  - Mobile sidebar drawer toggle button.
  - Topbar action group: Direct "View public site" link, `NotificationCenter` bell (delivering real-time booking alerts directly in the admin dashboard), and theme switcher.
- **Sidebar (`<aside className="sidebar">`):**
  - Admin branding badge (`AR Admin Console`).
  - Navigation menu with active path styling:
    - `Dashboard` (`/admin`)
    - `Auditoriums` (`/admin/auditoriums`)
    - `Bookings` (`/admin/bookings`)
  - User details pill, role badge (`admin`), theme toggle, and logout button.

### 4.3 Route Guards (`src/components/layout/ProtectedRoute.jsx`)
- **`ProtectedRoute`**: Verifies user is authenticated. Displays `FullPageState` spinner while checking session; redirects unauthenticated visitors to `/login`.
- **`RoleRoute`**: Enforces strict role authorization:
  - If a student visits `/admin/*` $\rightarrow$ redirected to `/`.
  - If an admin visits `/bookings/*` $\rightarrow$ redirected to `/admin`.

---

## 5. All Pages & Routes Breakdown

| Route Path | Shell Layout | Access Guard | Page Component | Key UI Features & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `AppLayout` | Public | `pages/public/HomePage.jsx` | Marketing landing page: Hero section with CTA, platform features grid, 3-step booking timeline, contact cards with phone & email links. |
| `/about` | — | Public | — | Redirects immediately to `/#about` on the homepage. |
| `/auditoriums` | `AppLayout` | Public | `pages/public/CatalogPage.jsx` | Venue catalog: text search filter, venue count banner, responsive `AuditoriumCard` grid, empty search state. |
| `/auditoriums/:id` | `AppLayout` | Public | `pages/public/AuditoriumDetailPage.jsx` | Venue details: breadcrumb trail, multi-photo gallery with active thumbnail selector, specs (seats, price, amenities), and sticky booking CTA card. |
| `/login` | `AppLayout` | Public | `pages/auth/LoginPage.jsx` | Sign in form: email & password inputs, password reveal toggle, HTML5 autocomplete, unverified email resend banner. |
| `/register` | `AppLayout` | Public | `pages/auth/RegisterPage.jsx` | Registration form: university domain validation hint (`@${domain}`), password strength rule, login redirection. |
| `/forgot-password` | `AppLayout` | Public | `pages/auth/ForgotPasswordPage.jsx` | Password reset request form: email submission with confirmation card. |
| `/reset-password` | `AppLayout` | Public | `pages/auth/ResetPasswordPage.jsx` | Set new password form: reads token from query params, enforces 6+ characters. |
| `/verify-email` | `AppLayout` | Public | `pages/auth/VerifyEmailPage.jsx` | Email token verifier: duplicate request guard (module-level `Set`), success/error status cards. |
| `/bookings` | `AppLayout` | `RoleRoute` (`student`) | `pages/student/StudentBookingsPage.jsx` | Personal booking list: status filter tabs, payment countdown deadline alerts, Pay Now (Razorpay), receipt downloads, server-side pagination, email query handlers (`?pay=`, `?receipt=`). |
| `/bookings/new/:auditoriumId` | `AppLayout` | `RoleRoute` (`student`) | `pages/student/NewBookingPage.jsx` | Slot booking form: split layout with venue recap, interactive calendar, 24-hr `TimePicker`, future slot validation, and real-time total price estimation. |
| `/account` | `AppLayout` | `ProtectedRoute` | `pages/student/AccountPage.jsx` | User profile overview: account info card, role chip, email verification badge, password update form, and sign out button. |
| `/admin` | `AdminLayout` | `RoleRoute` (`admin`) | `pages/admin/AdminDashboard.jsx` | Operational dashboard: 4 interactive metric cards (Total Venues, Total Bookings, Pending, Confirmed) with navigation links, live refresh button, and pending queue preview table. |
| `/admin/auditoriums` | `AdminLayout` | `RoleRoute` (`admin`) | `pages/admin/AdminAuditoriumsPage.jsx` | Venue management: data table with image previews, seat capacity, hourly rate, edit button, and delete confirmation dialog. |
| `/admin/auditoriums/new` | `AdminLayout` | `RoleRoute` (`admin`) | `pages/admin/AuditoriumFormPage.jsx` (`mode="create"`) | Create venue: multi-image file dropzone with preview thumbnails, comma-separated amenities, and multipart `FormData` submission. |
| `/admin/auditoriums/:id/edit` | `AdminLayout` | `RoleRoute` (`admin`) | `pages/admin/AuditoriumFormPage.jsx` (`mode="edit"`) | Edit venue: pre-populated venue data, optional image replacement, and multipart update. |
| `/admin/bookings` | `AdminLayout` | `RoleRoute` (`admin`) | `pages/admin/AdminBookingsPage.jsx` | Bookings approval queue: status filter tabs, single-click Approve mutation, Reject mutation with mandatory cancellation reason modal, and server-side pagination. |
| `*` | Custom Shell | Public | `App.jsx` (`NotFoundPage`) | 404 Not Found error screen with return button. |

---

## 6. Components Inventory

### 6.1 Common UI Primitives (`src/components/common/`)

- **`FormControls.jsx`**:
  - `TextField`: `React.forwardRef` input field supporting labels, error messaging with `<AlertCircle>`, and right-hand action slots (used for show/hide password toggle).
  - `FormError` / `FormSuccess`: Accessible alert boxes for server response messages.
- **`TimePicker.jsx`**:
  - Masked time input formatting typed digits into `HH:MM` format. Validates hours (`00-23`) and minutes (`00-59`).
- **`ConfirmDialog.jsx`**:
  - Accessible modal dialog for destructive actions (deleting venues, rejecting bookings, cancelling requests). Includes backdrop blur and scroll locking.
- **`LoadingSkeleton.jsx`**:
  - `SkeletonGrid`: Placeholder card grid for catalog views.
  - `SkeletonTable`: Animated rows for data tables.
  - `SkeletonDetail`: Split skeleton cards for auditorium details.
  - `FullPageState`: Centered loading state with spinning `<Loader2>`.
- **`ErrorState.jsx`**:
  - `ErrorState`: Error banner with retry callback button.
  - `EmptyState`: Clean container for zero-result states.
- **`Pagination.jsx` & `Pagination.css`**:
  - Numbered pagination controls with dynamic windowing, ellipsis (`...`), entry counters (`Showing 1–10 of 25`), and Next/Previous navigation buttons.
- **`RefreshButton.jsx` & `RefreshButton.css`**:
  - Live refresh button that invalidates TanStack Query caches and refetches real-time notifications with a spinning indicator and green pulse dot.
- **`StatusBadge.jsx`**:
  - Semantic colored chips for `pending`, `approved`, `confirmed`, `cancelled` statuses and user roles.
- **`PageTransition.jsx`**:
  - Framer Motion wrapper providing smooth page transitions.

### 6.2 Layout Components (`src/components/layout/`)

- **`AppLayout.jsx`**: Global public/student header, mobile slide-down menu, content outlet, and footer.
- **`AdminLayout.jsx`**: Management shell with permanent desktop sidebar, mobile drawer, topbar notifications, and theme controls.
- **`NotificationCenter.jsx`**:
  - Real-time dropdown bell with unread indicator badge.
  - Displays top 10 notifications with tabs (`All` vs `Unread`).
  - Supports marking individual or all notifications as read, deleting records, and relative timestamp formatting via `formatDistanceToNow`.
- **`Footer.jsx`**: Clean responsive footer displaying institutional links, branding, and contact address.

### 6.3 Auditorium Components (`src/components/auditoriums/`)

- **`AuditoriumCard.jsx`**:
  - Display card featuring venue image (`ImageFrame` fallback to venue initials), seat capacity, hourly price, description, amenity chips, and action links.
- **`AuditoriumFilters.jsx`**:
  - Standalone multi-criteria filter toolbar (search query, minimum seats, maximum price).

### 6.4 Booking Components (`src/components/bookings/`)

- **`BookingRow.jsx`**:
  - Core booking item component supporting student and admin view modes.
  - Features countdown urgency banner when payment deadline approaches (`12-hour payment window`).
  - Mobile-responsive table cell rendering with `data-label` attributes.
  - Action buttons: Cancel (pending), Pay Now (approved), Download Receipt (confirmed), Approve/Reject (admin).
- **`CalendarView.jsx`**:
  - Interactive monthly calendar grid built with `date-fns`.
  - Blue indicator dots on booked dates.
  - Expanding day drawer displaying all booked slots and purposes for any clicked date.
  - `compact={true}` mode optimized for the booking creation form.
- **`StatusTabs.jsx`**:
  - Status filter pill buttons (`All`, `Pending`, `Approved`, `Confirmed`, `Cancelled`).
- **`BookingReceiptModal.jsx` & `receipt.css`**:
  - Official electronic receipt modal with print styling (`@media print`), copy buttons for payment/order IDs, itemized charge breakdown, and direct PDF download.

---

## 7. Modular CSS Architecture (`src/styles/`)

Styles are organized into discrete, modular files imported into [`src/App.css`](file:///d:/Backend/Backend%20Projects/Auditorium%20Booking%20System/frontend/src/App.css):

| Stylesheet | File Path | Scope & Key Classes |
| :--- | :--- | :--- |
| **Tokens** | `src/styles/tokens.css` | Light and dark color palettes, typography, spacing, semantic statuses, elevation shadows, backward-compatibility mappings. |
| **Base** | `src/styles/base.css` | CSS resets, `.skip-link`, focus rings (`:focus-visible`), `.tabular-nums`, accessibility fallbacks. |
| **Primitives** | `src/styles/primitives.css` | `.button` variants (`primary`, `ghost`, `danger`, `sm`, `lg`), `.input`, `.select`, `.textarea`, `.badge`, `.card`, `.dialog-backdrop`, `.dialog-box`, `.toast`, `.skeleton`. |
| **Layout** | `src/styles/layout.css` | `.topbar`, `.nav-link`, `.nav-dropdown`, `.sidebar`, `.admin-main`, `.site-footer`, `.footer-grid`. |
| **Notifications** | `src/styles/notifications.css` | `.notification-btn`, `.notification-dropdown`, `.notification-item`, `.notification-badge`, `.notification-dot`. |
| **Home** | `src/styles/home.css` | `.landing-page`, `.hero-section`, `.feature-card`, `.step-card`, `.contact-card`, responsive grids. |
| **Catalog** | `src/styles/catalog.css` | `.catalog-page`, `.catalog-toolbar`, `.catalog-grid`, `.auditorium-card`, `.card-media`. |
| **Auditorium Detail**| `src/styles/auditorium-detail.css`| `.detail-page`, `.gallery-main`, `.gallery-thumbs`, `.spec-grid`, `.sticky-booking-card`. |
| **Auth** | `src/styles/auth.css` | `.auth-page`, `.auth-card`, `.auth-brand`, `.password-toggle`, `.resend-box`. |
| **Bookings** | `src/styles/bookings.css` | `.bookings-page`, `.new-booking-page`, `.booking-row`, `.booking-deadline-badge`, mobile table cards. |
| **Calendar** | `src/styles/calendar.css` | `.calendar-view`, `.calendar-header`, `.calendar-grid`, `.calendar-day`, `.day-drawer`, `.timeline-slot`. |
| **Admin** | `src/styles/admin.css` | `.admin-dashboard`, `.metric-card`, `.admin-table`, `.modal-form`, `.image-preview-grid`. |

---

## 8. API Integration & Server Contracts

### 8.1 Axios Client Configuration (`src/api/client.js`)
- **Base URL:** `import.meta.env.VITE_API_URL` (default: `http://localhost:5000/api`).
- **Credentials:** `withCredentials: true` ensures HttpOnly session cookies (refresh tokens) are included with every cross-origin request.
- **In-Memory Access Token:** Access tokens are stored strictly in memory (`currentAccessToken`) and injected via `Authorization: Bearer <token>`.
- **Automatic 401 Refresh Mutex:**
  - When an API call returns `401 Unauthorized`, concurrent requests are buffered while calling `POST /auth/refresh`.
  - On refresh success: Updates access token, dispatches window event `auth:refreshed`, and retries the buffered requests.
  - On refresh failure: Clears token, dispatches `auth:expired` (triggering automatic logout), and rejects pending promises.

### 8.2 API Endpoint Inventory

| Module | HTTP Method | Endpoint | Function Name | Request / Response Structure |
| :--- | :---: | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/login` | `login(data)` | `{ email, password }` $\rightarrow$ `{ user, accessToken }`. |
| **Auth** | `POST` | `/auth/register` | `register(data)` | `{ name, email, password, phone }` $\rightarrow$ `{ message }`. |
| **Auth** | `GET` | `/auth/me` | `getMe()` | Reads session cookie $\rightarrow$ `{ user, accessToken }`. |
| **Auth** | `POST` | `/auth/logout` | `logout()` | Clears server session cookie $\rightarrow$ `{ message }`. |
| **Auth** | `GET` | `/auth/verify-email?token=` | `verifyEmail(token)` | Verifies email token $\rightarrow$ `{ message }`. |
| **Auth** | `POST` | `/auth/forget-password` | `forgotPassword(email)` | Sends password reset email $\rightarrow$ `{ message }`. |
| **Auth** | `POST` | `/auth/reset-password/:token` | `resetPassword(token, pwd)` | Sets new password $\rightarrow$ `{ message }`. |
| **Auth** | `POST` | `/auth/resend-verification` | `resendVerification(email)` | Resends verification email $\rightarrow$ `{ message }`. |
| **Auditoriums** | `GET` | `/auditoriums/viewAllAuditoriums` | `getAllAuditoriums()` | Returns array of all auditorium objects. |
| **Auditoriums** | `GET` | `/auditoriums/viewAuditorium/:id` | `getSingleAuditorium(id)` | Returns single auditorium details by ID. |
| **Auditoriums** | `POST` | `/auditoriums/createAuditorium` | `createAuditorium(formData)` | Multipart `FormData` (name, capacity, price, images). |
| **Auditoriums** | `PUT` | `/auditoriums/updateAuditorium/:id` | `updateAuditorium(id, formData)` | Multipart `FormData` update for auditorium specs. |
| **Auditoriums** | `DELETE`| `/auditoriums/deleteAuditorium/:id` | `deleteAuditorium(id)` | Deletes auditorium record. |
| **Bookings** | `POST` | `/bookings/createBooking` | `createBooking(payload)` | `{ auditoriumId, bookingDate, startTime, endTime, purpose }`. |
| **Bookings** | `GET` | `/bookings/my-bookings` | `getUserBookings(params)` | Paginated bookings (`page`, `limit`, `status`). |
| **Bookings** | `PUT` | `/bookings/cancel/:id` | `cancelBooking(id)` | Student cancels their own pending booking. |
| **Bookings** | `GET` | `/bookings/all` | `getAllBookings(params)` | Paginated admin bookings queue (`page`, `limit`, `status`). |
| **Bookings** | `PUT` | `/bookings/status/:id` | `updateBookingStatus(id, st)`| Admin updates status (`approved` or `cancelled`). |
| **Bookings** | `GET` | `/bookings/calendar` | `getCalendarBookings(audId, mo)`| Returns scheduled bookings for auditorium and month (`YYYY-MM`). |
| **Notifications**| `GET` | `/notifications` | `getNotifications(page, limit)`| Returns user notification list. |
| **Notifications**| `GET` | `/notifications/unread-count`| `getUnreadCount()` | Returns numeric count of unread notifications. |
| **Notifications**| `PATCH`| `/notifications/:id` | `markAsRead(id)` | Marks notification as read. |
| **Notifications**| `PATCH`| `/notifications/read-all` | `markAllAsRead()` | Marks all user notifications as read. |
| **Notifications**| `DELETE`| `/notifications/:id` | `deleteNotification(id)` | Deletes notification record. |
| **Payments** | `POST` | `/payments/create-order/:bookingId`| `createPaymentOrder(id, key)`| Generates Razorpay Order ID (`Idempotency-Key` header). |
| **Payments** | `POST` | `/payments/verify` | `verifyPayment(payload)` | Verifies HMAC signature with idempotency key. |
| **Payments** | `GET` | `/payments/:bookingId/receipt` | `getBookingReceipt(bookingId)`| Returns transaction data for receipt preview. |
| **Payments** | `GET` | `/payments/:bookingId/receipt/download`| `downloadBookingReceiptPdf(...)` | Downloads server-generated binary PDF receipt. |

---

## 9. State Management Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 Server State (TanStack Query)                   │
│  - ["auth", "me"]                                               │
│  - ["auditoriums"] & ["auditorium", id]                         │
│  - ["my-bookings", page, status]                                │
│  - ["admin-bookings", page, status]                             │
│  - ["admin-dashboard-bookings"]                                 │
│  - Automatic cache invalidation upon mutations                  │
└─────────────────────────────────────────────────────────────────┘
                                ▲
                                │ Syncs via custom events & mutations
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│               Session & Real-time Context State                 │
│  - AuthContext: user profile, role, in-memory token             │
│  - NotificationContext: Socket.IO events, live unread counter   │
│  - ToastContext: ephemeral animated notification alerts         │
│  - ThemeContext: active theme ('light'|'dark') & persistence    │
└─────────────────────────────────────────────────────────────────┘
                                ▲
                                │ Consumed by
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│               Component Local State (React Hooks)               │
│  - React Hook Form + Zod: form inputs & validation              │
│  - useState: dialogs, tabs, image previews, search filters      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Core User Workflows

```mermaid
flowchart TD
    subgraph Student Workflow
        S1[Browse Auditoriums] --> S2[View Details & Availability Calendar]
        S2 --> S3[Submit Slot Request]
        S3 --> S4[Booking Status: Pending]
        S4 -. Admin Review .- S5{Approved?}
        S5 -- Approved --> S6[Status: Approved - 12h Payment Window]
        S5 -- Rejected/Cancelled --> S7[Status: Cancelled]
        S6 --> S8[Pay via Razorpay Checkout]
        S8 --> S9[Status: Confirmed]
        S9 --> S10[Download PDF Receipt & Sync Calendar]
    end

    subgraph Admin Workflow
        A1[Admin Dashboard] --> A2[Inspect Metrics & Pending Queue]
        A2 --> A3[Review Booking: Approve or Reject with Reason]
        A1 --> A4[Auditorium Inventory: Create / Edit / Delete]
        A4 --> A5[Upload Multipart Venue Photos & Amenities]
    end
```

### 10.1 Booking & Payment Lifecycle Details
1. **Slot Discovery:** Student navigates `/auditoriums` and selects a venue to inspect specs, pricing, and amenities.
2. **Scheduling:** On `/bookings/new/:auditoriumId`, the student reviews existing bookings via `CalendarView`, enters 24-hr start and end times, and provides the event purpose. Real-time validation checks for future dates and non-overlapping times.
3. **Pending Review:** Booking is created with `"pending"` status and shows in the student's booking list and admin queue.
4. **Approval & Countdown:** When the administrator approves the request, a 12-hour payment countdown begins (`paymentDeadline`), and real-time Socket.IO and email alerts are sent.
5. **Checkout:** Student clicks "Pay Now", triggering Razorpay modal checkout via `createPaymentOrder`.
6. **Confirmation & Receipt:** Signature verification confirms the booking. The client automatically downloads the official PDF receipt and makes electronic receipts accessible at any time.

---

## 11. Static Assets & Environment Variables

### 11.1 Assets
- **Fonts:** Google Fonts CDN (`Plus Jakarta Sans`, weights 300 to 800) in `index.html`.
- **Icons:** Inline SVG React components via `lucide-react`.
- **Venues:** Dynamic images uploaded via multipart forms, stored in Cloudinary/S3, and served via CDN URLs with an initials fallback frame.

### 11.2 Environment Variables

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | `http://localhost:5000/api` | Base URL for Axios client and Socket.IO connection. |
| `VITE_UNIVERSITY_DOMAIN` | Optional | `tmu.ac.in` | Validates student email domain upon registration. |

---

## 12. Safety Checklist for Future Enhancements

1. **Preserve Query Keys:** Never alter query keys (`["auth", "me"]`, `["auditoriums"]`, `["auditorium", id]`, `["my-bookings", page, status]`, `["admin-bookings", page, status]`, `["admin-dashboard-bookings"]`) without updating the corresponding mutation invalidators.
2. **Preserve 401 Interceptor Events:** Maintain `auth:refreshed` and `auth:expired` window events in `client.js` and `useAuth.jsx`.
3. **Preserve Socket.IO Handlers:** Retain `"notification"` event listeners in `useNotifications.jsx` to power toast alerts and unread counters.
4. **Preserve Email Query Links:** Keep `?pay=<id>` and `?receipt=<id>` handling in `StudentBookingsPage.jsx` intact for links originating from transactional emails.
5. **Preserve Idempotency Keys:** Ensure payments pass `Idempotency-Key` headers on order creation and signature verification.
6. **Preserve Multipart Uploads:** Keep `FormData` submissions for auditorium creation and editing to support multi-photo uploads.
