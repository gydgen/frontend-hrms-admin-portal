import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-leave-request-edition',
  imports: [RouterLink],
  templateUrl: './leave-request-edition.component.html',
  styleUrl: './leave-request-edition.component.scss',
  host: {
    class: 'form-page form-page--container',
  },
})
export class LeaveRequestEditionComponent {
  private readonly route = inject(ActivatedRoute);

  readonly leaveRequestId = this.route.snapshot.paramMap.get('id');
  readonly isEditMode = !!this.leaveRequestId;
}
