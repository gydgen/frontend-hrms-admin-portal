import { Routes } from '@angular/router';
import { rolesGuard } from '../../core/auth/guards/roles.guard';
import { canDeactivateFormFn } from '../../core/guards/form.guard';
import { PERMISSIONS } from '../../core/constants/permissions';
import { jobTitleResolver } from './resolvers/job-title.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./job-title-list/job-title-list.component').then((c) => c.JobTitleListComponent),
    canActivate: [rolesGuard],
    data: { roles: [PERMISSIONS.JOBTITLE_VIEW] },
  },
  {
    // Also matches '/add' — `:id` captures the literal value 'add', which jobTitleResolver
    // and JobTitleEditionComponent.isNew() both check for. Do not add a separate static
    // 'add' route: that would stop `:id`/`value` from binding via withComponentInputBinding()
    // and the edition screen would always render as "Edit".
    path: ':id',
    loadComponent: () =>
      import('./job-title-edition/job-title-edition.component').then(
        (c) => c.JobTitleEditionComponent,
      ),
    resolve: { value: jobTitleResolver },
    canActivate: [rolesGuard],
    canDeactivate: [canDeactivateFormFn],
    data: { roles: [PERMISSIONS.JOBTITLE_VIEW] },
  },
];
