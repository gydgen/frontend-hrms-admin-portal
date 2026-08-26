import { Injectable } from '@angular/core';
import { GenericCollectionService } from '../../../shared/services/generic-collection.service';
import { Role } from '../interfaces/role';

@Injectable({ providedIn: 'root' })
export class RoleService extends GenericCollectionService<Role> {
  // backend-hrms mounts roles at /api/v1/roles — the only module with a version prefix;
  // every other module is /api/{resource} (see backend-hrms's server.ts route mounting).
  // This looks like leftover versioning nobody normalized rather than an intentional
  // pattern; special-cased here rather than in the base class since nothing else needs it.
  protected override path = 'v1/roles';
  protected override listKey = 'roles';
}
