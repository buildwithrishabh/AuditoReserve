# Frontend Analysis

## Scope

Static review of the React/Vite client in `frontend/src`, its route map, styling, and the API calls made by the UI. This review does not claim runtime, browser, accessibility-tool, or backend integration testing. Existing functionality is inventoried so future UI changes can preserve it.

## Product and UI summary

AuditoReserve is a responsive campus venue booking SPA. The current visual system uses an electric blue accent, dark and light themes, shared cards/forms/status indicators, loading and error states, and responsive layouts. The stylesheet includes mobile breakpoints, focus-visible styling, touch-target adjustments, reduced-motion handling, and print rules for receipts.

### Public and account flows

- Landing page: hero, venue highlights, booking steps, trust metrics, and calls to action.
- Venue directory: search, capacity presets, advanced filters, sorting, loading/error/empty states, and venue cards.
- Venue detail: images, facility information, availability calendar, and booking entry point.
- Account: login, registration, forgot/reset password, email verification, and resend verification.
- Shared navigation: role-aware dashboard links, notifications/unread count, responsive menu, theme switch, and logout.

### Student flows

- Student dashboard with booking summaries and actions.
- Booking form with date/time selection, purpose, venue summary, and price calculation.
- Booking history with search/status controls, cancellation, detail/receipt actions, and pagination support where provided.
- Payment flow for approved reservations, deadline display, Razorpay checkout, and payment verification.
- Confirmed payment receipt view with copyable references, PDF download, print, and return-to-bookings actions.
- Notifications inbox with unread/read state, mark-read/all-read, deletion, realtime updates, and unread badge.

### Administrator flows

- Admin dashboard with booking statistics and pending review actions.
- Booking review list with search/status filters and detail drawer; approve/reject actions.
- Auditorium management list with create/edit/delete actions.
- Auditorium form with venue details, price, capacity, facilities, and image upload/preview/removal.

## Architecture and implementation notes

- `App.jsx` contains the route tree and most page/component logic in one file (about 4,400 lines). Shared UI, data hooks, student pages, admin pages, forms, and payment flows are colocated, making changes harder to isolate and review.
- `api.js` centralizes Axios configuration, in-memory access-token injection, credentialed requests, refresh-token retry, and user-facing API error formatting.
- React Query owns server data and mutations. Socket.IO invalidates notification queries and displays a toast on incoming notifications.
- `styles.css` is a large accumulated stylesheet (about 7,200 lines) with multiple responsive and theme-specific sections. The design has broad coverage, but repeated overrides make it difficult to identify the authoritative rule for a component.
- The route tree includes public, student, and admin URLs. Authorization depends on page-level guards/redirects; keep checking role and session behavior whenever navigation or route layouts change.

## Review findings and priorities

### High priority

1. **Split UI code by responsibility without changing routes or behavior.** Extract shared primitives/hooks and page groups from `App.jsx` incrementally. Keep route paths, API payloads, mutation invalidation, permission checks, and payment behavior unchanged during extraction.
2. **Add a maintainable frontend verification baseline.** The frontend package currently defines development, build, and preview scripts but no UI test or lint script. Add route/flow coverage and accessibility checks before broad redesign work; do not treat backend tests as coverage of the UI.
3. **Audit async/error behavior in real flows.** Static code has retry and error panels, but payment checkout, token refresh, image upload, booking cancellation, and admin mutations need browser-level checks for expired sessions, rejected requests, duplicate clicks, and recovery paths.

### Medium priority

4. **Consolidate CSS carefully.** Group tokens, base styles, shared components, page-specific styles, and responsive rules. Remove a duplicate/obsolete rule only after confirming its selectors and theme variants are represented elsewhere.
5. **Check semantics and keyboard interaction across all dialogs/drawers.** The app has ARIA labels and visible focus rules in several places. Review focus entry/return, Escape behavior, focus trapping, keyboard operation of custom dropdowns, and announcements for toasts and changing availability. Do not infer full accessibility compliance from labels alone.
6. **Review image resilience.** Venue cards and detail views rely on configured or remote fallback images. Confirm broken-image handling and loading behavior on slow/offline connections; preserve image previews and upload actions in admin flows.
7. **Verify narrow-screen data layouts.** Tables, filters, calendars, drawers, payment details, and receipt controls have dedicated responsive styles, but should be checked at 320px and tablet widths in both themes.

### Lower priority

8. **Reduce duplication in status labels and formatting.** Booking status text, date/money formatting, and similar UI mappings can be centralized so student and admin views stay consistent.
9. **Review bundle and third-party loading.** The client loads Google Fonts and Razorpay Checkout externally; verify fallback typography and clear checkout failure feedback when either external resource is unavailable.
10. **Improve maintainability of theme rules.** The initial theme is set before React and then managed by `ThemeToggle`; keep first paint and persisted preference behavior aligned when changing theme initialization.

## Feature-preservation checklist for UI work

- Keep every route and both role-specific navigation paths.
- Keep catalog search, filters, capacity selection, sorting, and empty/error/loading states.
- Keep the availability calendar and booking validation/summary.
- Keep booking statuses, cancellation/review actions, and relevant pagination.
- Keep Razorpay order creation and verification, payment deadline messaging, and idempotency behavior.
- Keep receipt preview, PDF download, print, and copy-reference actions.
- Keep notification polling/realtime updates, read states, deletion, and unread counts.
- Keep auditorium create/edit/delete and image upload/preview/removal.
- Keep dark/light theme persistence, responsive navigation, and mobile layouts.
- Preserve API endpoints and request/response expectations unless a backend contract change is separately planned.

## Suggested implementation order

1. Capture current screens and record existing paths/actions as a regression checklist.
2. Add frontend lint/build and UI-flow verification appropriate to the project.
3. Make incremental visual and accessibility improvements within existing components.
4. Extract components and consolidate CSS in small, reviewable changes.
5. Recheck the full checklist in dark/light themes and desktop/mobile widths.

## Overall assessment

The frontend already implements a broad end-to-end booking product and has more UI coverage than a simple prototype. The largest risks are maintainability and unverified edge behavior, rather than missing major product areas. A redesign should be additive and incremental, using the feature-preservation checklist above as its acceptance criteria.
