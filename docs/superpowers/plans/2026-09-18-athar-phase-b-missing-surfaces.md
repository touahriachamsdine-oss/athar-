### Task 1: Auth depth - password reset GoTrue proxy + reset-password.html

**Files:**
- Modify: `api/action.js`, `src/js/neon.js`, `pages/auth.html`
- Create: `pages/reset-password.html`, `src/pages/reset-password.js`

**Interfaces:**
- Consumes: GoTrue recovery endpoints.
- Produces: password reset flow.

- [x] **Step 1: Update `api/action.js`** to handle `recover` (password reset request) and `update_password` (new password submission with access token).
- [x] **Step 2: Update `src/js/neon.js`** with `recoverPassword(email)` and `updatePassword(token, newPassword)`.
- [x] **Step 3: Create `pages/reset-password.html` and `src/pages/reset-password.js`** to handle the token fragment and update password.
- [x] **Step 4: Update `pages/auth.html`** to include a "Forgot password?" link triggering a recovery modal/form.
- [x] **Step 5: Verify & Commit**
