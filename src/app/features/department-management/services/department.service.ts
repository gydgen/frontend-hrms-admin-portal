import { Injectable } from '@angular/core';
import { GenericCollectionService } from '../../../shared/services/generic-collection.service';
import { Department } from '../interfaces/department';

@Injectable({ providedIn: 'root' })
export class DepartmentService extends GenericCollectionService<Department> {
  protected override path = 'departments';
  protected override listKey = 'departments';
}
