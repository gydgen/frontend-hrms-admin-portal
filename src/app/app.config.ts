import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { isActive, IsActiveMatchOptions, provideRouter, Router, withViewTransitions } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { provideStore } from '@ngrx/store';

const BlueAura = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions({
        onViewTransitionCreated: ({ transition }) => {
            const router = inject(Router);
            const targetUrl = router.currentNavigation()!.finalUrl!;
            // Skip transition if only fragment or query params change
            const config: IsActiveMatchOptions = {
                paths: 'exact',
                matrixParams: 'exact',
                fragment: 'ignored',
                queryParams: 'ignored',
            };
            const isTargetRouteCurrent = isActive(targetUrl, router, config);
            if (isTargetRouteCurrent()) {
                transition.skipTransition();
            }
        },
    })),
    providePrimeNG({
        theme: {
            preset: BlueAura,
        },
    }),
    provideStore()
],
};
