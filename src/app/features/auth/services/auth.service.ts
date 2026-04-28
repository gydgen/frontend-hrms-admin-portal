import { HttpClient } from '@angular/common/http';
import {
	computed,
	effect,
	EffectRef,
	inject,
	Injectable,
	resource,
	ResourceRef,
	Signal,
	signal,
	WritableSignal
} from '@angular/core';
import { Router } from '@angular/router';
import dayjs from 'dayjs';
import { catchError, finalize, firstValueFrom, Observable, of, tap } from 'rxjs';
import { ChangePasswordData, ResetPasswordData } from '../interface/auth-service';
import { environment } from '../../../../environments/environment';
import {
	CHANGE_PASSWORD_ENDPOINT,
	LOGIN_ROUTE,
	PASSWORD_RESET_ENDPOINT,
	SEND_PASSWORD_RESET_ENDPOINT
} from '../../auth/interface/constants';
import { LoginResponse } from '../interface/login-response';
import { User } from '../interface/user';
import { isDefined } from '../../../shared/utils/object';
import { Store } from '@ngrx/store';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * HttpClient instance for making HTTP requests.
   */
  readonly #http = inject(HttpClient);

  /**
   * Router instance for navigation.
   */
  readonly #router = inject(Router);

  readonly #store = inject(Store);

  /**
   * Writable signal holding the current authentication token.
   */
  token: WritableSignal<string | null> = signal<string | null>(
    localStorage.getItem('token') || null,
  );
  tenantId: WritableSignal<string | null> = signal<string | null>(
    localStorage.getItem('tenantId') || null,
  );

  /**
   * Resource reference to the current authenticated user.
   */
  userResource: ResourceRef<User | null | undefined> = resource({
    params: () => ({ token: this.token() }),

    loader: async ({ params }) => {
      const { token } = params;

      if (!token) {
        return null;
      }

      return firstValueFrom(this.getUser());
    },
  });

  /**
   * Reference to the current authenticated user.
   */
  user: Signal<User | null | undefined> = computed(() => this.userResource.value());

  /**
   * Computed signal of the current user's roles.
   */
  roles: Signal<Array<string>> = computed(() => {
    if (!this.user()) {
      return [];
    }
    return this.user()?.roles ?? [];
  });

  // ------------------------
  // Session management methods
  // ------------------------

  /**
   * Sets the access token and its expiration time in the local storage and updates the token signal.
   *
   * @param loginResponse The login response containing access token and expiration info.
   */
  private async setSession(loginResponse: LoginResponse): Promise<void> {
	// Calculate and store token expiration time
    localStorage.setItem('token', loginResponse.data.accessToken);
    this.token.set(loginResponse.data.accessToken);

	// Store Tenant ID if available
    localStorage.setItem('tenantId', loginResponse.data.tenantId ?? '');
	this.tenantId.set(loginResponse.data.tenantId ?? null);

    // TODO: Manage refresh token
  }

  /**
   * Retrieves the token expiration time from local storage as a dayjs object.
   *
   * @returns The expiration time as a dayjs instance.
   */
  private getExpiration(): dayjs.Dayjs {
    const expirationAt: string | null = localStorage.getItem('expiresAt');
    const expiresAt: number = JSON.parse(expirationAt ?? '0');

    return dayjs(expiresAt);
  }

  /**
   * Clears token and expiration data from local storage and resets the token signal.
   * Also dispatches an action to clear the application state and navigates to the login page.
   * Handles any errors during logout by clearing auth data and dispatching state clear action, ensuring the user is redirected to login regardless of logout success.
   *
   */

  logout(): Observable<void> {
    return this.#http
      .post(`${environment.apiUrl}/auth/logout`, {
        refreshToken: localStorage.getItem('refreshToken'),
      })
      .pipe(
        tap(() => {
          this.clearAuthDataFromStorage();
          //   this.#store.dispatch(clearState());
          //   this.user.set(null);
        }),
        catchError((error) => {
          this.clearAuthDataFromStorage();
          //   this.#store.dispatch(clearState());

          return of(error);
        }),
        finalize(() => this.#router.navigate([LOGIN_ROUTE])),
      );
  }

  clearAuthDataFromStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('expiresAt');
    // tenantId is intentionally kept — the subdomain hasn't changed on logout
    // and the next login on the same subdomain still needs the same tenantId.
  }
  /**
   * Resets the token signal to null if it currently holds a token.
   */
  resetToken(): void {
    if (this.token()) {
      this.token.set(null);
    }
  }

  // ------------------------
  // Authentication methods
  // ------------------------

  /**
   * Attempts to log in a user with the provided email and password.
   * Resets token if user is currently logged out.
   *
   * @param email The email for login.
   * @param password The password for login.
   * @returns A promise resolving to the login response.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    if (this.isLoggedOut()) {
      this.resetToken();
    }

    const response = await firstValueFrom(
      this.#http.post<LoginResponse>(`${environment.apiUrl}${LOGIN_ROUTE}`, {
        email,
        password,
      }),
    );
	console.log('Login response:', response);

    await this.setSession(response);

    return response;
  }

  /**
   * Checks if the user is currently logged in based on token expiration.
   *
   * @returns True if logged in, false otherwise.
   */
  isLoggedIn(): boolean {
    return !!this.token();
  }

  /**
   * Checks if the user is currently logged out (token expired or missing).
   *
   * @returns True if logged out, false otherwise.
   */
  isLoggedOut(): boolean {
    return !this.isLoggedIn();
  }

  // ------------------------
  // User-related methods
  // ------------------------

  /**
   * Checks for the auth token, creates an effect to resolve a promise based on user data, and returns a boolean value.
   * Used to wait for user initialization on the App init.
   *
   * @returns a `Promise<boolean>`. The function first checks if the auth token is present, and if so, it creates an
   * effect that resolves the promise when a user value is defined. If no token is present, it destroys any existing
   * cleanup effect and resolves the promise with `false`.
   */
  async initializeUser(): Promise<boolean> {
    let cleanup!: EffectRef;

    if (this.token()) {
      return new Promise((resolve) => {
        cleanup = effect(() => {
          const value = this.user();

          if (isDefined(value)) {
            cleanup.destroy(); // Clean the effect
            resolve(true);
          }
        });
      });
    } else {
      if (cleanup) {
        cleanup.destroy();
      }

      return Promise.resolve(false);
    }
  }

  /**
   * Fetches the current user's information from the API.
   * Handles errors by logging out and redirecting to login page.
   *
   * @returns An observable of the current user or null if not available.
   */
  getUser(): Observable<User | null> {
    return this.#http.get<User>(`${environment.apiUrl}/users/me`).pipe(
      catchError((error) => {
        console.error('getUser error:', error);
        return of(null);
      }),
    );
  }

  /**
   * Reloads the user resource to refresh user data.
   */
  refreshUser(): void {
    this.userResource.reload();
  }

  // ------------------------
  // Permission and roles methods
  // ------------------------

  /**
   * Checks if a user has any roles matching the specified scope.
   *
   * @param user The user object to check roles for.
   * @param scope Array of role names to check against.
   * @returns True if user has at least one matching role, false otherwise.
   */
  hasSomeScope(user: User, scope: string[]): boolean {
    const lowerCaseScope = scope.map((role) => role.toLowerCase());
    const roles = user.roles;

    return roles?.some((role: string) => lowerCaseScope.includes(role.toLowerCase())) ?? false;
  }

  /**
   * Checks if the current user has all specified permissions.
   *
   * @param roleNames A role name or array of role names to check.
   * @returns True if user has every specified permission, false otherwise.
   */
  hasPermissions(roleNames: string | string[]): boolean {
    if (!this.user()) {
      return false;
    }

    const userRoles = this.roles().map((r) => r.toLowerCase());
    const roles = Array.isArray(roleNames) ? roleNames : [roleNames];

    return roles.every((role: string) => userRoles.includes(role.toLowerCase()));
  }

  /**
   * Checks if the current user has any of the specified permissions.
   *
   * @param roleNames A role name or array of role names to check.
   * @returns True if user has at least one of the specified permissions, false otherwise.
   */
  hasSomePermissions(roleNames: string | string[]): boolean {
    if (!this.user()) {
      return false;
    }

    const userRoles = this.roles().map((r) => r.toLowerCase());
    const roles = Array.isArray(roleNames) ? roleNames : [roleNames];

    return roles.some((role: string) => userRoles.includes(role.toLowerCase()));
  }

  /**
   * Checks if the user has all specified permissions or is an admin.
   *
   * @param roleNames A role name or array of role names to check.
   * @returns True if user is admin or has all specified permissions.
   */
  hasPermissionsOrAdmin(roleNames: string | string[]): boolean {
    if (!this.user()) {
      return false;
    }

    return this.isAdmin() || this.hasPermissions(roleNames);
  }

  /**
   * Checks if the user has any specified permissions or is an admin.
   *
   * @param roleNames A role name or array of role names to check.
   * @returns True if user is admin or has some of the specified permissions.
   */
  hasSomePermissionsOrAdmin(roleNames: string | string[]): boolean {
    return this.isAdmin() || this.hasSomePermissions(roleNames);
  }

  /**
   * Checks if the current user has the admin role.
   *
   * @returns True if user is admin, false otherwise.
   */
  isAdmin(): boolean {
    const userRoles = this.roles().map((role) => role.toLowerCase());
    const adminRole = environment.auth.adminRole.toLowerCase();

    return userRoles.includes(adminRole);
  }

  // /**
  //  * Checks if the current user has read permission based on environment configuration.
  //  *
  //  * @returns True if user has read permission, false otherwise.
  //  */
  // async hasReadPermission(): Promise<boolean> {
  // 	return this.hasPermissions([environment.auth.readRole]);
  // }

  // /**
  //  * Checks if the current user has write permission based on environment configuration.
  //  *
  //  * @returns True if user has write permission, false otherwise.
  //  */
  // async hasWritePermission(): Promise<boolean> {
  // 	return this.hasPermissions([environment.auth.writeRole]);
  // }

  // ------------------------
  // Password recovery and change methods
  // ------------------------

  /**
   * Sends a password reset email to the specified email address.
   *
   * @param email The email address to send the reset link to.
   * @returns A promise resolving when the request completes.
   */
  sendResetPassword(email: string): Promise<any> {
    return firstValueFrom(
      this.#http.post(`${environment.apiUrl}${SEND_PASSWORD_RESET_ENDPOINT}`, null, {
        params: { email },
      }),
    );
  }

  /**
   * Resets the user's password using the provided reset data.
   *
   * @param resetData Data required to reset the password.
   * @returns A promise resolving when the password reset completes.
   */
  resetPassword(resetData: ResetPasswordData): Promise<any> {
    return firstValueFrom(
      this.#http.post<any>(`${environment.apiUrl}${PASSWORD_RESET_ENDPOINT}`, resetData),
    );
  }

  /**
   * Changes the user's password given the old and new passwords.
   *
   * @param changePasswordData Data containing old, new, and confirmed passwords.
   * @throws Error if newPassword and confirmPassword do not match.
   * @returns A promise resolving when the password change completes.
   */
  changePassword(changePasswordData: ChangePasswordData): Promise<any> {
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      throw new Error('Password must match');
    }

    return firstValueFrom(
      this.#http.post<any>(`${environment.apiUrl}${CHANGE_PASSWORD_ENDPOINT}`, changePasswordData),
    );
  }
}
