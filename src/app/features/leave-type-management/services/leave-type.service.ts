import { Injectable } from '@angular/core';
import { GenericCollectionService } from '../../../shared/services/generic-collection.service';
import { LeaveType } from '../interfaces/leave-type';

@Injectable({ providedIn: 'root' })
export class LeaveTypeService extends GenericCollectionService<LeaveType> {
  protected override path = 'leave-types';
  protected override listKey = 'leaveTypes';
}
