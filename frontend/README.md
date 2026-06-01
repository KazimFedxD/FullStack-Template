# Frontend Service

This is the React 19 frontend for the template. It provides the user-facing account lifecycle, route protection, notification handling, and the shared API/auth utilities that talk to the Django backend.

## What this app includes

- React 19 + Vite + Tailwind CSS 4 + Framer Motion
- React Router based public and authenticated routes
- Cookie-backed auth state synchronized with backend profile data
- Register, verify email, login, forgot password, change password, profile, and logout flows
- Global message/toast handling for success, error, info, and warning states
- Browser cache helpers and session-state preservation helpers
- Reusable verification code input and layout shell components

## Scripts

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production bundle |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

## Route Map

| Route | Page | What it does |
| --- | --- | --- |
| `/` | `HomePage` | Landing page that summarizes the template and current auth status |
| `/login` | `LoginPage` | Sign in with email and password |
| `/register` | `RegisterPage` | Create a new account and trigger email verification |
| `/verify` | `VerifyPage` | Enter and submit verification codes for email verification, password flows, and account deletion |
| `/forgot-password` | `ForgotPasswordPage` | Request a password reset code |
| `/change-password` | `ChangePasswordPage` | Confirm a reset or change code and set a new password |
| `/profile` | `ProfilePage` | Update the username, request password change/delete codes, or log out |
| `/logout` | Redirect | Immediate redirect back to `/login` |
| `*` | `NotFoundPage` | Shared 404 page |

## Feature Flow

### Registration

`RegisterPage` calls `registerUser` from `src/utils/auth.js`.

- Email, username, and password are collected
- Password confirmation is checked on the client
- The backend returns a verification-required response
- The page navigates to `/verify?email=...&reason=email_verification`

### Login

`LoginPage` calls `loginUser`.

- Success stores the user metadata in `localStorage`
- The auth context refreshes the profile from the backend
- If the backend says the account is not verified yet, the user is redirected back to verification

### Verification

`VerifyPage` is the shared entry point for multiple code-based actions.

- `reason=email_verification` submits the code to `/api/auth/verify/`
- `reason=password_reset` and `reason=password_change` move the user to the password form with the code prefilled
- `reason=account_delete` submits the delete confirmation through the delete endpoint and then logs the user out

### Password Recovery and Change

`ForgotPasswordPage` requests a reset code.
`ChangePasswordPage` handles both reset and signed-in change flows.

- Both routes reuse `VerificationCodeInput`
- The change flow can request a new code from the backend
- Successful password updates force a logout and session reset

### Profile and Account Controls

`ProfilePage` exposes the authenticated account controls.

- Update the username
- Request a password change code
- Request an account deletion code
- Log out

## Auth and Session Handling

`src/contexts/AuthContext.jsx` is the main session coordinator.

- On mount it checks session state with the backend
- It uses `getAccessToken` and `fetchUserProfile` to confirm the session and refresh profile data
- `login()` stores `user_id`, `user_email`, and `username` in `localStorage`
- `logout()` clears local state, calls the backend logout endpoint, and re-checks auth
- `ProtectedRoute` shows a loading state while auth is being confirmed and redirects unauthenticated users to `/login`

`src/utils/auth.js` contains the endpoint map and auth helpers:

- `registerUser`
- `loginUser`
- `resendVerificationEmail`
- `requestPasswordReset`
- `confirmPasswordReset`
- `requestPasswordChange`
- `confirmPasswordChange`
- `updateProfile`
- `requestAccountDelete`
- `confirmAccountDelete`
- `loadProfile`
- `fetchUserProfile`

## API Layer

`src/utils/api.js` is the primary fetch wrapper used by the app.

- Adds JSON headers and always sends cookies
- Applies timeout handling
- Retries recoverable failures with exponential backoff
- Treats 401s as refreshable when auth is required
- Converts backend responses into a normalized `{ ok, status, data | error }` shape

`src/utils/apiClient.js` is a parallel client wrapper kept in the repo as an alternate helper. The current route pages primarily use `api.js` and `auth.js`.

## Shared Helpers and UI Utilities

### Messaging

`src/contexts/MessageContext.jsx` is the active notification system.

- `MessageProvider` mounts the toast viewport
- `useMessages()` exposes `showSuccess`, `showError`, `showInfo`, `showWarning`, `showMessage`, `dismissMessage`, and `clearMessages`
- Messages are styled and animated with Framer Motion

### Hooks

- `src/hooks/useAlert.js` provides promise-based alert and confirm dialogs
- `src/hooks/useErrorHandler.js` stores and clears API/UI errors with retry support

### Browser Cache and State Preservation

- `src/utils/cache.js` exposes a TTL-backed localStorage cache instance and helpers like `getCache`, `setCache`, `removeCache`, `clearCache`, and `hasCache`
- `src/utils/statePreservation.js` exposes sessionStorage-backed helpers for form state, scroll position, and page state

### Form and Input Components

- `src/components/VerificationCodeInput.jsx` provides the six-digit OTP input used by verification and password flows
- `src/components/AuthPageShell.jsx` wraps the auth pages in the branded two-panel layout
- `src/components/ProtectedRoute.jsx` gates `/profile`

## Styling and Layout

- The app uses Tailwind CSS 4 utilities from `src/index.css`
- `src/index.css` sets the global dark theme, typography, smooth scrolling, and base body styling
- Framer Motion powers the page transitions and message animations

## Development Notes

- The Vite dev server proxies `/api` to the backend service in `vite.config.js`
- The current code does not read `VITE_*` environment variables, so the app behaves as a proxy-based frontend rather than an env-driven one
- The Dockerfile starts Vite with `npm run dev -- --host 0.0.0.0`
- Use `npm run build` before shipping changes to confirm the frontend still compiles cleanly

## What the User Can Do

- Register a new account
- Verify email with a 6-digit code
- Sign in and stay signed in through cookie-backed session refresh
- Request a password reset code
- Change the password while signed in
- Update the profile username
- Request account deletion and confirm it with a verification code
- Log out from the profile or home page

