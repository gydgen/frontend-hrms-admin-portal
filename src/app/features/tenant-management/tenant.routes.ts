import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./organization-settings/organization-settings.component').then(
        (c) => c.OrganizationSettingsComponent,
      ),
  },
];
