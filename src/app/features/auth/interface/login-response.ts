import { tap } from 'rxjs';
import { User } from "./user";

/**
 * Represents the response returned after a successful login attempt.
 *
 * @property user - The authenticated user's information.
 * @property access_token - The JWT access token for authentication.
 * @property expires_in - The number of seconds until the access token expires.
 * @property refresh_expires_in - The number of seconds until the refresh token expires.
 * @property refresh_token - The token used to obtain a new access token when the current one expires.
 */
export interface LoginResponse {
	success: boolean;
    statusCode: number;
    message: string;
	data: {
		user: User;
		accessToken: string;
		expires_in: number;
		refresh_expires_in: number;
		refresh_token: string;
		tenantId?: string | null;
	}
}


