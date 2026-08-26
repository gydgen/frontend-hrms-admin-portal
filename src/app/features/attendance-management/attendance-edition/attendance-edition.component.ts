import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-attendance-edition',
  imports: [RouterLink],
  templateUrl: './attendance-edition.component.html',
  styleUrl: './attendance-edition.component.scss',
  host: {
    class: 'form-page form-page--container',
  },
})
export class AttendanceEditionComponent {
  private readonly route = inject(ActivatedRoute);

  readonly attendanceId = this.route.snapshot.paramMap.get('id');
  readonly isEditMode = !!this.attendanceId;
}
