
// ─────────────────────────────────────────────────────────────
// 🔐 Authentication Endpoints
// ─────────────────────────────────────────────────────────────

/**
 * Endpoint to request a password reset email.
 */
export const SEND_PASSWORD_RESET_ENDPOINT = '/auth/forgot-password-email';

/**
 * Endpoint to validate and handle the password reset flow via email.
 */
export const PASSWORD_RESET_ENDPOINT = '/auth/reset-password-email';

/**
 * Endpoint to submit the new password once the reset token is validated.
 */
export const CHANGE_PASSWORD_ENDPOINT = '/auth/reset-password';

// ─────────────────────────────────────────────────────────────
// 📍 Authentication Routes
// ─────────────────────────────────────────────────────────────

/**
 * Route path to the login page.
 */
export const LOGIN_ROUTE = '/auth/login';

/**
 * Route path to the signup page.
 */
export const SIGNUP_ROUTE = '/auth/signup';

/**
 * Route path to the forgotten password page.
 */
export const FORGOTTEN_PASSWORD_ROUTE = '/auth/forgotten-password';

// ─────────────────────────────────────────────────────────────
// 🧪 Password Validation
// ─────────────────────────────────────────────────────────────

/**
 * Regular expression for validating password strength.
 *
 * Requirements:
 * - At least 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one special character
 */
export const PASSWORD_REGEX =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.{12,}).+$/;

// ─────────────────────────────────────────────────────────────
// 🏢 Tenant Endpoints
// ─────────────────────────────────────────────────────────────

/**
 * Public endpoint to resolve a subdomain to its numeric tenantId.
 * Called once at app bootstrap before any authenticated request fires.
 *
 * GET /tenants/domain?subdomain=micah → { tenantId: '108952' }
 */
export const TENANT_RESOLVE_ENDPOINT = '/tenants/domain';

// ─────────────────────────────────────────────────────────────
// ⚙️ APP generic constants
// ─────────────────────────────────────────────────────────────

/**
 * Default debounce time for the tables
 */
export const DEFAULT_DEBOUNCE_TIME = 1024;

