import { Injectable } from '@angular/core';
import { GenericCollectionService } from '../../../shared/services/generic-collection.service';
import { Employee } from '../interfaces/employee';

@Injectable({ providedIn: 'root' })
export class EmployeeService extends GenericCollectionService<Employee> {
  protected override path = 'employees';
  protected override listKey = 'employees';
}
