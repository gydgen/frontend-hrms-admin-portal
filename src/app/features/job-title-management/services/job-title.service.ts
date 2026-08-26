import { Injectable } from '@angular/core';
import { GenericCollectionService } from '../../../shared/services/generic-collection.service';
import { JobTitle } from '../interfaces/job-title';

@Injectable({ providedIn: 'root' })
export class JobTitleService extends GenericCollectionService<JobTitle> {
  protected override path = 'job-titles';
  protected override listKey = 'jobTitles';
}
