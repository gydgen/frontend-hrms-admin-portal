import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
	CHANGE_PASSWORD_ENDPOINT,
	LOGIN_ROUTE,
	PASSWORD_RESET_ENDPOINT,
	SEND_PASSWORD_RESET_ENDPOINT,
	SIGNUP_ROUTE,
	TENANT_RESOLVE_ENDPOINT
} from '../interface/constants';
import { AuthService } from '../services/auth.service';

/**
 * Endpoint patterns that do not require JWT authentication or tenant context.
 * Requests whose URL contains any of these strings are forwarded as-is.
 */
const PUBLIC_ENDPOINTS: string[] = [
	'GetCapabilities',
	'GetFeatureInfo',
	LOGIN_ROUTE,
	SIGNUP_ROUTE,
	SEND_PASSWORD_RESET_ENDPOINT,
	PASSWORD_RESET_ENDPOINT,
	CHANGE_PASSWORD_ENDPOINT,
	TENANT_RESOLVE_ENDPOINT
];

/**
 * JWT interceptor (functional)
 *
 * - Skips all public endpoints (login, signup, password reset, tenant resolve).
 * - Attaches `X-Tenant-ID` to every non-public request.
 * - Attaches `Authorization: Bearer <token>` only when a token is present.
 * - On 401, calls logout (clears storage, navigates to login) then re-throws.
 */
export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
	const authSvc = inject(AuthService);

	if (PUBLIC_ENDPOINTS.some((endpoint) => request.url.includes(endpoint))) {
		return next(request);
	}

	const token = localStorage.getItem('token');
	const tenantId = localStorage.getItem('tenantId') ?? '';

	const headers: Record<string, string> = {
		'X-Tenant-ID': tenantId
	};

	if (token && !request.headers.has('Authorization')) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	request = request.clone({ setHeaders: headers });

	return next(request).pipe(
		catchError((error) => {
			if (error instanceof HttpErrorResponse && error.status === 401) {
				return authSvc.logout().pipe(
					switchMap(() =>
						throwError(() => new Error('Session expired. Please log in again.'))
					)
				);
			}

			return throwError(() => error);
		})
	);
};
