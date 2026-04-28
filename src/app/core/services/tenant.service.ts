import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TENANT_RESOLVE_ENDPOINT } from '../../features/auth/interface/constants';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { ToastrService } from '../../shared/toastr/toastr.service';

interface TenantResolveBody {
  domain: string | null;
}

interface TenantResolveResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    domain: string;
  };
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  readonly #http = inject(HttpClient);
  readonly #router = inject(Router);
  readonly #toastr = inject(ToastrService);

  /**
   * Extracts the subdomain from a hostname.
   * Returns null for localhost, bare IP addresses, root domains, and the www subdomain.
   *
   * @examples
   *   micah.gydgen.com → 'micah'
   *   gydgen.com       → null
   *   www.gydgen.com   → null
   *   localhost        → null
   *   127.0.0.1        → null
   */
  extractSubdomain(hostname: string): string | null {
    if (hostname.startsWith('localhost') || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
      return null;
    }

    const parts = hostname.split('.');
    console.log('Hostname parts:', parts[0]);

    if (parts[0] === 'www') {
      return null;
    }

    return parts[0];
  }

  /**
   * Calls the API to resolve a subdomain string to a numeric tenantId.
   * Throws if the API returns a non-2xx status or an unexpected response shape.
   */
  private resolveSubdomain(subdomain: string | null): Promise<string> {
    console.log(`Resolving subdomain '${subdomain}'...`);
    return firstValueFrom(
      this.#http.post<TenantResolveResponse>(`${environment.apiUrl}${TENANT_RESOLVE_ENDPOINT}`, {
        domain: subdomain,
      } satisfies TenantResolveBody),
    ).then(
      (res) => {
        console.log('Tenant resolve response:', res);
        this.#router.navigate(['/auth/login']);
        return res.data._id;
      },
      (error) => {
        console.error('Tenant resolve error:', error);
        if (error?.statusCode === 404) {
          this.#toastr.triggerToastr(
            'error',
            `Organisation not found for subdomain '${subdomain}'`,
          );
        }
        this.#toastr.triggerToastr(
          'error',
          error?.error?.message ?? `Failed to resolve tenant for subdomain '${subdomain}'`,
        );

        throw error;
      },
    );
  }

  /**
   * Resolves the current hostname to a tenantId and persists it in localStorage.
   * Called once via provideAppInitializer — blocks bootstrap until resolved.
   *
   * - No subdomain (localhost / dev): falls back to environment.tenantId.
   * - Subdomain found: calls GET /tenants/domain?subdomain=<value>.
   * - Error in production: redirects to the root domain.
   * - Error in development: falls back to environment.tenantId.
   */
  async init(): Promise<void> {
    const subdomain = this.extractSubdomain(window.location.hostname) ?? null;
    console.log('Initializing tenant context...', window.location.hostname);
    console.log('Extracted ...', this.extractSubdomain(window.location.hostname));

    try {
      const tenantId = await this.resolveSubdomain(subdomain);
      localStorage.setItem('tenantId', tenantId);
      console.log(`Resolved tenantId '${tenantId}' for subdomain '${subdomain}'`);
    } catch (error) {
      console.log('Error resolving tenant, falling back...');
      this.#toastr.triggerToastr('error', `Organisation not found for subdomain '${subdomain}'`);

      if (environment.production) {
        window.location.href = 'https://gydgen.com';
      }
    }
  }
}
